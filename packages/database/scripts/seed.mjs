// Seed do banco real com dados de demonstração relacionalmente íntegros
// (respeita todos os FKs/constraints do schema — nada de dado solto).
// Rodar com as env vars de apps/gov/.env.local (mesmo banco do Obra).
//
//   node packages/database/scripts/seed.mjs
//
// Idempotente: se "Florianópolis" já existir como município, não duplica.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no ambiente.");
  process.exit(1);
}
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

function daysFromNow(days, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function monthsAgo(months) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString();
}

async function insert(table, rows, opts = {}) {
  const { data, error } = await db.from(table).insert(rows).select(opts.select ?? "*");
  if (error) throw new Error(`${table}: ${error.message}`);
  return data;
}

async function main() {
  const { data: existente } = await db.from("municipios").select("id").eq("nome", "Florianópolis").maybeSingle();
  if (existente) {
    console.log("Já existe seed (município Florianópolis encontrado) — nada a fazer.");
    return;
  }

  console.log("Criando município...");
  const [municipio] = await insert("municipios", [
    {
      nome: "Florianópolis",
      uf: "SC",
      teto_compensacao_pct: 30,
      faixa_regua: [
        { faixa: "AAA", ate_kgco2e_m2: 150, beneficio: "IPTU -15 a -20% por 5 anos" },
        { faixa: "AA", ate_kgco2e_m2: 200, beneficio: "IPTU -10% por 5 anos" },
        { faixa: "A", ate_kgco2e_m2: 280, beneficio: "IPTU -5%" },
        { faixa: "B", ate_kgco2e_m2: 380, beneficio: "Conformidade" },
        { faixa: "C", ate_kgco2e_m2: 999999, beneficio: "Plano de adequação obrigatório" },
      ],
    },
  ]);

  console.log("Criando construtoras...");
  const construtoras = await insert("construtoras", [
    { razao_social: "Andrade Incorporações", cnpj_cpf: "11.111.111/0001-01", tipo: "pj" },
    { razao_social: "BF Engenharia", cnpj_cpf: "22.222.222/0001-02", tipo: "pj" },
    { razao_social: "Sul Construções", cnpj_cpf: "33.333.333/0001-03", tipo: "pj" },
    { razao_social: "3C Construtora", cnpj_cpf: "44.444.444/0001-04", tipo: "pj" },
  ]);
  const [andrade, bf, sul, c3] = construtoras;

  console.log("Criando usuários fiscais (auth)...");
  async function createFiscal(email, nome) {
    const { data, error } = await db.auth.admin.createUser({
      email,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { nome },
    });
    if (error) throw new Error(`auth.createUser ${email}: ${error.message}`);
    return data.user;
  }
  const marinaUser = await createFiscal("marina.costa@carbonfree.dev", "Marina Costa");
  const diegoUser = await createFiscal("diego.farias@carbonfree.dev", "Diego Farias");

  const perfis = await insert("perfis", [
    { id: marinaUser.id, nome: "Marina Costa", papel: "fiscal", municipio_id: municipio.id },
    { id: diegoUser.id, nome: "Diego Farias", papel: "fiscal", municipio_id: municipio.id },
  ]);
  const [marina, diego] = perfis;

  console.log("Criando fatores de emissão...");
  const fatores = await insert("fatores_emissao", [
    { categoria: "cimento_cp2", valor: 0.73, unidade: "tCO2e/t", fonte: "DAP Brasil", ano_base: 2024, vigencia_inicio: "2024-01-01" },
    { categoria: "aco_bfbof", valor: 2.3, unidade: "tCO2e/t", fonte: "DAP Brasil", ano_base: 2024, vigencia_inicio: "2024-01-01" },
  ]);
  const [fatorCimento, fatorAco] = fatores;

  console.log("Criando obras...");
  const obrasSeed = [
    { alvara_numero: "ALV-2025-1042", construtora_id: andrade.id, nome: "Residencial Vista Verde", tipologia: "Residencial vertical", area_construida_m2: 9400, fase: "estrutura" },
    { alvara_numero: "ALV-2025-0981", construtora_id: bf.id, nome: "Edifício Corporate Tower", tipologia: "Comercial", area_construida_m2: 12500, fase: "acabamento" },
    { alvara_numero: "ALV-2025-1103", construtora_id: andrade.id, nome: "Condomínio Bosque Real", tipologia: "Residencial vertical", area_construida_m2: 7200, fase: "fundacao" },
    { alvara_numero: "ALV-2025-0877", construtora_id: sul.id, nome: "Galpão Logístico Norte", tipologia: "Galpão logístico", area_construida_m2: 15000, fase: "estrutura" },
    { alvara_numero: "ALV-2025-1150", construtora_id: c3.id, nome: "Residencial Mirante", tipologia: "Residencial vertical", area_construida_m2: 6000, fase: "acabamento" },
  ];
  const obras = await insert(
    "obras",
    obrasSeed.map((o) => ({
      municipio_id: municipio.id,
      construtora_id: o.construtora_id,
      alvara_numero: o.alvara_numero,
      nome: o.nome,
      tipologia: o.tipologia,
      area_construida_m2: o.area_construida_m2,
      fase: o.fase,
    })),
  );
  const byAlvara = Object.fromEntries(obras.map((o) => [o.alvara_numero, o]));
  const nomeByAlvara = Object.fromEntries(obrasSeed.map((o) => [o.alvara_numero, o.nome]));

  console.log("Criando evidências, inventários e lançamentos...");
  // [alvará, [{versao, criadoEm, status, passivo, ativo}]]
  const plano = [
    [
      "ALV-2025-1042",
      [
        { versao: 1, criadoEm: monthsAgo(4), status: "homologado", passivo: 1050, ativo: 300 },
        { versao: 2, criadoEm: monthsAgo(0), status: "em_analise", passivo: 2755, ativo: 1141 },
      ],
    ],
    ["ALV-2025-0981", [{ versao: 1, criadoEm: monthsAgo(1), status: "em_analise", passivo: 5200, ativo: 400 }]],
    ["ALV-2025-1103", [{ versao: 1, criadoEm: monthsAgo(1), status: "em_analise", passivo: 1600, ativo: 700 }]],
    ["ALV-2025-0877", [{ versao: 1, criadoEm: monthsAgo(2), status: "em_analise", passivo: 6500, ativo: 300 }]],
    ["ALV-2025-1150", [{ versao: 1, criadoEm: monthsAgo(3), status: "protocolado", passivo: 1050, ativo: 450 }]],
  ];

  const inventarioAtualPorObra = {};
  const selosParaCriar = [];

  for (const [alvara, versoes] of plano) {
    const obra = byAlvara[alvara];
    for (const v of versoes) {
      const [evidenciaPassivo] = await insert("evidencias", [
        {
          obra_id: obra.id,
          tipo: "nfe",
          chave_acesso: `4225${obra.id.slice(0, 8)}${v.versao}${"0".repeat(20)}`.slice(0, 44),
          cnpj_emitente: "99.999.999/0001-99",
          hash_sha256: `seed-${obra.id}-${v.versao}-passivo`,
          storage_path: `seed/${obra.id}/v${v.versao}/passivo.xml`,
          status_validacao: "validado",
        },
      ]);
      const [evidenciaAtivo] = await insert("evidencias", [
        {
          obra_id: obra.id,
          tipo: "laudo",
          hash_sha256: `seed-${obra.id}-${v.versao}-ativo`,
          storage_path: `seed/${obra.id}/v${v.versao}/ativo.pdf`,
          status_validacao: "validado",
        },
      ]);

      const [inv] = await insert("inventarios", [
        {
          obra_id: obra.id,
          versao: v.versao,
          periodo_inicio: v.criadoEm.slice(0, 10),
          status: v.status,
          nivel_garantia: v.status === "homologado" ? 3 : 2,
          homologado_em: v.status === "homologado" ? v.criadoEm : null,
          created_at: v.criadoEm,
        },
      ]);

      await insert("lancamentos", [
        {
          inventario_id: inv.id,
          modulo_en15978: "A1-A3",
          natureza: "passivo",
          item: "Cimento e aço estruturais (agregado)",
          quantidade: v.passivo,
          unidade: "tCO2e",
          fator_id: fatorCimento.id,
          tco2e: v.passivo,
          evidencia_id: evidenciaPassivo.id,
          created_at: v.criadoEm,
        },
      ]);
      const [lancAtivo] = await insert("lancamentos", [
        {
          inventario_id: inv.id,
          modulo_en15978: "USO",
          natureza: "ativo",
          item: "Substituição de material + compensação (agregado)",
          quantidade: v.ativo,
          unidade: "tCO2e",
          tco2e: v.ativo,
          evidencia_id: evidenciaAtivo.id,
          created_at: v.criadoEm,
        },
      ]);
      await insert("acoes_remocao", [
        {
          lancamento_id: lancAtivo.id,
          tipo: "SUB",
          linha_base: "Especificação aprovada no alvará",
          adicionalidade: "Substituição não prevista originalmente, com aditivo de projeto",
          tco2e_reconhecido: v.ativo,
        },
      ]);

      inventarioAtualPorObra[alvara] = { ...inv, obra, passivo: v.passivo, ativo: v.ativo };
    }
  }

  console.log("Homologando selos...");
  const vistaVerde = inventarioAtualPorObra["ALV-2025-1042"];
  const mirante = inventarioAtualPorObra["ALV-2025-1150"];
  await insert("selos", [
    { obra_id: vistaVerde.obra.id, inventario_id: vistaVerde.id, nivel: "AA", faixa_atingida_kgco2e_m2: 172, validade: daysFromNow(365).slice(0, 10) },
    { obra_id: mirante.obra.id, inventario_id: mirante.id, nivel: "AAA", faixa_atingida_kgco2e_m2: 100, validade: daysFromNow(365).slice(0, 10) },
  ]);

  console.log("Criando fiscalizações...");
  await insert("fiscalizacoes", [
    { obra_id: byAlvara["ALV-2025-0877"].id, fiscal_id: marina.id, agendado_para: daysFromNow(0, 9, 30), status: "agendada" },
    { obra_id: byAlvara["ALV-2025-0981"].id, fiscal_id: marina.id, agendado_para: daysFromNow(0, 14, 0), status: "agendada" },
    { obra_id: byAlvara["ALV-2025-1042"].id, fiscal_id: diego.id, agendado_para: daysFromNow(1, 8, 0), status: "agendada" },
    { obra_id: byAlvara["ALV-2025-1103"].id, fiscal_id: diego.id, agendado_para: daysFromNow(-1, 8, 0), status: "concluida" },
  ]);

  console.log("Criando catálogo de alternativas de material...");
  await insert("alternativas_material", [
    { material: "Cimento CP III (alto-forno)", material_original: "Cimento CP II", unidade: "t", custo_adicional_por_unidade: 12, tco2e_evitado_por_unidade: 0.18 },
    { material: "Aço rota EAF (forno elétrico)", material_original: "Aço rota BF-BOF", unidade: "t", custo_adicional_por_unidade: 340, tco2e_evitado_por_unidade: 1.1 },
    { material: "Agregado reciclado de RCC", material_original: "Brita natural", unidade: "t", custo_adicional_por_unidade: -8, tco2e_evitado_por_unidade: 0.012 },
    { material: "Geração fotovoltaica no canteiro", material_original: "Energia da concessionária", unidade: "kWp instalado", custo_adicional_por_unidade: 4200, tco2e_evitado_por_unidade: 18 },
  ]);

  console.log("\nSeed concluído:");
  console.log(`  município: ${municipio.nome}`);
  console.log(`  construtoras: ${construtoras.length}`);
  console.log(`  obras: ${obras.length}`);
  console.log(`  obra em foco no app Obra: ${nomeByAlvara["ALV-2025-1042"]} (${byAlvara["ALV-2025-1042"].id})`);
}

main().catch((err) => {
  console.error("Falha no seed:", err.message);
  process.exit(1);
});
