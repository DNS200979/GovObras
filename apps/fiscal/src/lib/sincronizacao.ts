import { File } from "expo-file-system";
import { getDb } from "./db";
import { supabase } from "./supabase";

/**
 * Os dois únicos momentos em que o app precisa de rede.
 *
 * Baixar: troca o cache local pelo que o servidor tem. Nunca toca no trabalho
 * do fiscal — respostas, evidências e status ficam onde estão.
 *
 * Enviar: sobe as mídias e grava o resultado consolidado na fiscalização. A
 * escrita é idempotente de propósito: reenviar o mesmo lote sobrescreve com o
 * mesmo conteúdo em vez de duplicar, porque num canteiro a conexão cai no meio
 * e o fiscal vai apertar "enviar" de novo.
 */

export async function baixarPacote(): Promise<{ fiscalizacoes: number; requisitos: number }> {
  const [{ data: fiscalizacoes, error: erroF }, { data: requisitos, error: erroR }] =
    await Promise.all([
      supabase
        .from("fiscalizacoes")
        .select(
          "id, status, agendado_para, obras(nome, fase, logradouro, numero_imovel, bairro, latitude, longitude, construtoras(razao_social))",
        )
        .in("status", ["agendada", "em_campo"])
        .order("agendado_para"),
      supabase
        .from("requisitos_auditoria")
        .select("id, natureza, codigo, requisito, unidade, evidencia_primaria, teste_verificacao, ordem"),
    ]);

  if (erroF) throw new Error(`Agenda: ${erroF.message}`);
  if (erroR) throw new Error(`Requisitos: ${erroR.message}`);

  const db = await getDb();
  const agora = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    await db.execAsync("DELETE FROM fiscalizacoes; DELETE FROM requisitos;");

    for (const f of (fiscalizacoes ?? []) as any[]) {
      const o = f.obras ?? {};
      const endereco = [o.logradouro, o.numero_imovel, o.bairro].filter(Boolean).join(", ") || null;
      await db.runAsync(
        `INSERT INTO fiscalizacoes
           (id, obra_nome, construtora, endereco, fase, agendado_para, status, latitude, longitude, baixado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        f.id,
        o.nome ?? "Obra sem nome",
        o.construtoras?.razao_social ?? null,
        endereco,
        o.fase ?? null,
        f.agendado_para,
        f.status,
        o.latitude ?? null,
        o.longitude ?? null,
        agora,
      );
    }

    for (const r of requisitos ?? []) {
      await db.runAsync(
        `INSERT INTO requisitos
           (id, natureza, codigo, requisito, unidade, evidencia_primaria, teste_verificacao, ordem)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        r.id,
        r.natureza,
        r.codigo,
        r.requisito,
        r.unidade,
        r.evidencia_primaria,
        r.teste_verificacao,
        r.ordem ?? 0,
      );
    }
  });

  return { fiscalizacoes: fiscalizacoes?.length ?? 0, requisitos: requisitos?.length ?? 0 };
}

interface LinhaEvidencia {
  id: string;
  fiscalizacao_id: string;
  requisito_id: string | null;
  uri: string;
  hash_sha256: string;
  latitude: number | null;
  longitude: number | null;
  capturado_em: string;
  storage_path: string | null;
  sincronizado: number;
}

export async function enviarPendencias(): Promise<{ enviadas: number; erros: string[] }> {
  const db = await getDb();
  const erros: string[] = [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Entre novamente para sincronizar.");

  // Toda fiscalização que tem qualquer coisa pendente.
  const alvos = await db.getAllAsync<{ fiscalizacao_id: string }>(`
    SELECT DISTINCT fiscalizacao_id FROM (
      SELECT fiscalizacao_id FROM checklist_respostas WHERE sincronizado = 0
      UNION SELECT fiscalizacao_id FROM evidencias WHERE sincronizado = 0
      UNION SELECT fiscalizacao_id FROM status_local WHERE sincronizado = 0
    )
  `);

  let enviadas = 0;

  for (const { fiscalizacao_id } of alvos) {
    try {
      const evidencias = await db.getAllAsync<LinhaEvidencia>(
        "SELECT * FROM evidencias WHERE fiscalizacao_id = ? ORDER BY capturado_em",
        fiscalizacao_id,
      );

      // 1. Sobe as mídias que ainda não subiram. O caminho é determinístico
      //    pelo id da evidência, então reenviar sobrescreve o mesmo objeto.
      for (const ev of evidencias.filter((e) => !e.storage_path)) {
        const caminho = `${user.id}/${fiscalizacao_id}/${ev.id}.jpg`;
        const bytes = await new File(ev.uri).bytes();
        const { error } = await supabase.storage
          .from("vistorias")
          .upload(caminho, bytes, { contentType: "image/jpeg", upsert: true });
        if (error) throw new Error(`mídia ${ev.id.slice(0, 8)}: ${error.message}`);
        await db.runAsync("UPDATE evidencias SET storage_path = ? WHERE id = ?", caminho, ev.id);
        ev.storage_path = caminho;
      }

      const respostas = await db.getAllAsync<{
        requisito_id: string;
        conforme: number | null;
        observacao: string | null;
        respondido_em: string;
      }>(
        "SELECT requisito_id, conforme, observacao, respondido_em FROM checklist_respostas WHERE fiscalizacao_id = ?",
        fiscalizacao_id,
      );

      const status = await db.getFirstAsync<{ status: string }>(
        "SELECT status FROM status_local WHERE fiscalizacao_id = ?",
        fiscalizacao_id,
      );

      // 2. Grava o resultado consolidado. A fiscalização guarda o checklist e
      //    as mídias como jsonb, então uma escrita por vistoria basta.
      const primeiraComCoord = evidencias.find((e) => e.latitude != null && e.longitude != null);

      const atualizacao: Record<string, unknown> = {
        checklist_aplicado: respostas.map((r) => ({
          requisito_id: r.requisito_id,
          conforme: r.conforme === null ? null : r.conforme === 1,
          respondido_em: r.respondido_em,
        })),
        // Constatação é o que o fiscal escreveu sobre um item não conforme —
        // é isso que vira auto lá na prefeitura.
        constatacoes: respostas
          .filter((r) => r.conforme === 0 && r.observacao)
          .map((r) => ({
            requisito_id: r.requisito_id,
            observacao: r.observacao,
            registrado_em: r.respondido_em,
          })),
        midias: evidencias
          .filter((e) => e.storage_path)
          .map((e) => ({
            storage_path: e.storage_path,
            hash_sha256: e.hash_sha256,
            geotag:
              e.latitude != null && e.longitude != null
                ? { latitude: e.latitude, longitude: e.longitude }
                : null,
            capturado_em: e.capturado_em,
            requisito_id: e.requisito_id,
          })),
      };
      if (status) atualizacao.status = status.status;
      if (primeiraComCoord) {
        atualizacao.coordenada_execucao = `(${primeiraComCoord.longitude},${primeiraComCoord.latitude})`;
      }

      const { error } = await supabase
        .from("fiscalizacoes")
        .update(atualizacao)
        .eq("id", fiscalizacao_id);
      if (error) throw new Error(error.message);

      // 3. Só marca como sincronizado depois da confirmação do servidor.
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          "UPDATE checklist_respostas SET sincronizado = 1 WHERE fiscalizacao_id = ?",
          fiscalizacao_id,
        );
        await db.runAsync(
          "UPDATE evidencias SET sincronizado = 1 WHERE fiscalizacao_id = ? AND storage_path IS NOT NULL",
          fiscalizacao_id,
        );
        await db.runAsync(
          "UPDATE status_local SET sincronizado = 1 WHERE fiscalizacao_id = ?",
          fiscalizacao_id,
        );
      });
      enviadas += 1;
    } catch (e) {
      // Uma vistoria que falha não impede as outras: o fiscal pode ter cinco
      // no dia e uma foto corrompida não pode travar o lote.
      erros.push(`${fiscalizacao_id.slice(0, 8)}: ${(e as Error).message}`);
    }
  }

  return { enviadas, erros };
}
