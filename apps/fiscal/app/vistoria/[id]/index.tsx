import { useCallback, useState } from "react";
import * as Crypto from "expo-crypto";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  definirStatus,
  getDb,
  listarRequisitos,
  obterFiscalizacao,
  type FiscalizacaoLocal,
  type RequisitoLocal,
} from "@/src/lib/db";
import { color } from "@/src/lib/theme";

type Resposta = { conforme: boolean | null; observacao: string | null };

export default function VistoriaDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [vistoria, setVistoria] = useState<FiscalizacaoLocal | null>(null);
  const [requisitos, setRequisitos] = useState<RequisitoLocal[]>([]);
  const [respostas, setRespostas] = useState<Record<string, Resposta>>({});
  const [evidencias, setEvidencias] = useState(0);

  const carregar = useCallback(async () => {
    if (!id) return;
    const [v, reqs] = await Promise.all([obterFiscalizacao(id), listarRequisitos()]);
    setVistoria(v);
    setRequisitos(reqs);

    const db = await getDb();
    const rows = await db.getAllAsync<{
      requisito_id: string;
      conforme: number | null;
      observacao: string | null;
    }>(
      "SELECT requisito_id, conforme, observacao FROM checklist_respostas WHERE fiscalizacao_id = ?",
      id,
    );
    setRespostas(
      Object.fromEntries(
        rows.map((r) => [
          r.requisito_id,
          { conforme: r.conforme === null ? null : r.conforme === 1, observacao: r.observacao },
        ]),
      ),
    );
    const n = await db.getFirstAsync<{ n: number }>(
      "SELECT COUNT(*) n FROM evidencias WHERE fiscalizacao_id = ?",
      id,
    );
    setEvidencias(n?.n ?? 0);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  async function gravar(requisitoId: string, patch: Partial<Resposta>) {
    if (!id) return;
    const atual = respostas[requisitoId] ?? { conforme: null, observacao: null };
    const novo = { ...atual, ...patch };
    setRespostas((r) => ({ ...r, [requisitoId]: novo }));

    // Chave derivada do par vistoria+requisito: responder de novo corrige a
    // mesma linha em vez de criar outra.
    const respostaId = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${id}:${requisitoId}`,
    );
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO checklist_respostas
         (id, fiscalizacao_id, requisito_id, conforme, observacao, respondido_em, sincronizado)
       VALUES (?, ?, ?, ?, ?, ?, 0)
       ON CONFLICT(fiscalizacao_id, requisito_id) DO UPDATE SET
         conforme = excluded.conforme,
         observacao = excluded.observacao,
         respondido_em = excluded.respondido_em,
         sincronizado = 0`,
      respostaId,
      id,
      requisitoId,
      novo.conforme === null ? null : novo.conforme ? 1 : 0,
      novo.observacao,
      new Date().toISOString(),
    );

    // Marcar o primeiro item já coloca a vistoria em campo — não faz sentido
    // exigir que o fiscal aperte "iniciar" antes de começar a trabalhar.
    if (vistoria?.status === "agendada") {
      await definirStatus(id, "em_campo");
      setVistoria({ ...vistoria, status: "em_campo" });
    }
  }

  async function concluir() {
    if (!id) return;
    await definirStatus(id, "concluida");
    setVistoria((v) => (v ? { ...v, status: "concluida" } : v));
    router.back();
  }

  if (!vistoria) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.empty}>Vistoria não encontrada no pacote do aparelho.</Text>
      </SafeAreaView>
    );
  }

  const respondidos = requisitos.filter((r) => respostas[r.id]?.conforme != null).length;
  const naoConformes = requisitos.filter((r) => respostas[r.id]?.conforme === false);
  const semObservacao = naoConformes.filter((r) => !respostas[r.id]?.observacao?.trim());
  const concluida = vistoria.status === "concluida";

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {vistoria.construtora ? <Text style={styles.eyebrow}>{vistoria.construtora}</Text> : null}
        <Text style={styles.title}>{vistoria.obra_nome}</Text>
        <Text style={styles.sub}>{vistoria.endereco ?? "Endereço não informado"}</Text>

        <View style={styles.resumo}>
          <Text style={styles.resumoTexto}>
            {respondidos} de {requisitos.length} requisitos conferidos · {evidencias} evidência(s)
          </Text>
          {naoConformes.length > 0 ? (
            <Text style={styles.resumoAlerta}>
              {naoConformes.length} não conforme(s) — cada um precisa de constatação escrita
            </Text>
          ) : null}
        </View>

        <Pressable
          style={styles.captureButton}
          onPress={() => router.push(`/vistoria/${id}/captura`)}
          testID="capturar"
        >
          <Text style={styles.captureButtonText}>Capturar evidência</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Requisitos auditáveis do município</Text>

        {requisitos.map((req) => {
          const r = respostas[req.id];
          return (
            <View key={req.id} style={styles.item}>
              <View style={styles.itemTop}>
                <Text style={styles.codigo}>{req.codigo}</Text>
                <Text style={styles.natureza}>{req.natureza}</Text>
              </View>
              <Text style={styles.itemLabel}>{req.requisito}</Text>
              {req.teste_verificacao ? (
                <Text style={styles.teste}>Como verificar: {req.teste_verificacao}</Text>
              ) : null}

              <View style={styles.botoes}>
                <Pressable
                  style={[styles.opcao, r?.conforme === true && styles.opcaoConforme]}
                  onPress={() => gravar(req.id, { conforme: true })}
                  disabled={concluida}
                  testID={`conforme-${req.codigo}`}
                >
                  <Text
                    style={[styles.opcaoTexto, r?.conforme === true && styles.opcaoTextoAtivo]}
                  >
                    Conforme
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.opcao, r?.conforme === false && styles.opcaoNaoConforme]}
                  onPress={() => gravar(req.id, { conforme: false })}
                  disabled={concluida}
                  testID={`naoconforme-${req.codigo}`}
                >
                  <Text
                    style={[styles.opcaoTexto, r?.conforme === false && styles.opcaoTextoAtivo]}
                  >
                    Não conforme
                  </Text>
                </Pressable>
              </View>

              {r?.conforme === false ? (
                <TextInput
                  style={styles.observacao}
                  value={r.observacao ?? ""}
                  onChangeText={(t) => gravar(req.id, { observacao: t })}
                  placeholder="Descreva a constatação — é o que vira auto na prefeitura"
                  placeholderTextColor={color.linhaForte}
                  multiline
                  editable={!concluida}
                  testID={`obs-${req.codigo}`}
                />
              ) : null}
            </View>
          );
        })}

        {concluida ? (
          <View style={styles.concluida}>
            <Text style={styles.concluidaTexto}>
              Vistoria concluída. Vá em Sincronização para enviar quando houver rede.
            </Text>
          </View>
        ) : (
          <>
            {semObservacao.length > 0 ? (
              <Text style={styles.bloqueio}>
                Falta a constatação de {semObservacao.length} item(ns) não conforme(s).
              </Text>
            ) : null}
            <Pressable
              style={[
                styles.concluirBotao,
                (respondidos === 0 || semObservacao.length > 0) && styles.botaoDesabilitado,
              ]}
              onPress={concluir}
              disabled={respondidos === 0 || semObservacao.length > 0}
              testID="concluir"
            >
              <Text style={styles.concluirTexto}>Concluir vistoria</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.concreto },
  content: { padding: 16, paddingBottom: 48 },
  empty: { padding: 16, color: color.textoFraco },
  eyebrow: { fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: color.textoFraco },
  title: { fontSize: 24, fontWeight: "800", color: color.ardosia, marginTop: 4 },
  sub: { fontSize: 13, color: color.textoFraco, marginTop: 4 },
  resumo: {
    marginTop: 14,
    padding: 12,
    backgroundColor: color.papel,
    borderWidth: 1,
    borderColor: color.linha,
    borderRadius: 10,
  },
  resumoTexto: { fontSize: 12.5, color: color.texto },
  resumoAlerta: { fontSize: 12.5, color: color.ambar, marginTop: 4 },
  captureButton: {
    backgroundColor: color.ardosia,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 14,
    marginBottom: 24,
  },
  captureButtonText: { color: color.papel, fontWeight: "700", fontSize: 14 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: color.textoFraco,
    marginBottom: 10,
  },
  item: {
    backgroundColor: color.papel,
    borderWidth: 1,
    borderColor: color.linha,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  itemTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  codigo: {
    fontSize: 10.5,
    fontWeight: "800",
    color: color.ardosia,
    backgroundColor: color.concreto,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  natureza: { fontSize: 10.5, color: color.textoFraco, textTransform: "uppercase" },
  itemLabel: { fontSize: 13.5, color: color.texto, lineHeight: 19 },
  teste: { fontSize: 11.5, color: color.textoFraco, marginTop: 6, lineHeight: 16 },
  botoes: { flexDirection: "row", gap: 8, marginTop: 12 },
  opcao: {
    flex: 1,
    borderWidth: 1,
    borderColor: color.linha,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  opcaoConforme: { backgroundColor: color.verde, borderColor: color.verde },
  opcaoNaoConforme: { backgroundColor: color.ambar, borderColor: color.ambar },
  opcaoTexto: { fontSize: 12.5, fontWeight: "700", color: color.textoFraco },
  opcaoTextoAtivo: { color: color.papel },
  observacao: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: color.linha,
    borderRadius: 8,
    padding: 10,
    minHeight: 68,
    fontSize: 13,
    color: color.texto,
    textAlignVertical: "top",
  },
  bloqueio: { fontSize: 12.5, color: color.ambar, marginTop: 8, marginBottom: 4 },
  concluirBotao: {
    backgroundColor: color.verde,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 12,
  },
  botaoDesabilitado: { opacity: 0.45 },
  concluirTexto: { color: color.papel, fontWeight: "700", fontSize: 15 },
  concluida: {
    marginTop: 12,
    padding: 14,
    backgroundColor: color.verdeClaro,
    borderRadius: 10,
  },
  concluidaTexto: { fontSize: 13, color: color.verde, lineHeight: 19 },
});
