// Semeia inventários de demonstração para uma obra, com lançamentos abertos
// por módulo EN 15978 (o seed original só tinha duas linhas agregadas por
// versão, o que não sustenta gráfico de composição).
//
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node packages/database/scripts/seed-inventario-demo.mjs "<nome da obra>"

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const nomeObra = process.argv[2];

if (!url || !serviceKey || !nomeObra) {
  console.error('Uso: node seed-inventario-demo.mjs "<nome da obra>" (com env vars do Supabase)');
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

/**
 * Três versões contando uma história coerente: a intensidade cai porque o
 * passivo real diminui (troca de material, menos transporte), e a compensação
 * fica sempre abaixo do teto municipal de 30% do passivo — passar do teto
 * invalidaria o abatimento, então o dado de demo não pode violá-lo.
 *
 * v1 1500/300 = 20% → 231 kg/m² (faixa A)
 * v2 1300/340 = 26% → 185 kg/m² (faixa AA)
 * v3 1100/320 = 29% → 150 kg/m² (faixa AAA)
 */
const VERSOES = [
  {
    versao: 1,
    status: "homologado",
    mesesAtras: 5,
    nivelGarantia: 2,
    passivo: [
      { modulo: "A1-A3", item: "Cimento e concreto usinado", tco2e: 740 },
      { modulo: "A1-A3", item: "Aço CA-50 / CA-60", tco2e: 400 },
      { modulo: "A1-A3", item: "Alvenaria e revestimentos", tco2e: 200 },
      { modulo: "A4", item: "Transporte de insumos ao canteiro", tco2e: 105 },
      { modulo: "A5", item: "Combustível e energia do canteiro", tco2e: 55 },
    ],
    ativo: [
      { modulo: "SUB", item: "Substituição por CP III", tco2e: 130 },
      { modulo: "RCC", item: "Agregado reciclado de RCC", tco2e: 60 },
      { modulo: "ENE", item: "Geração fotovoltaica no canteiro", tco2e: 70 },
      { modulo: "ARB", item: "Compensação arbórea", tco2e: 40 },
    ],
  },
  {
    versao: 2,
    status: "homologado",
    mesesAtras: 3,
    nivelGarantia: 3,
    passivo: [
      { modulo: "A1-A3", item: "Cimento e concreto usinado", tco2e: 620 },
      { modulo: "A1-A3", item: "Aço CA-50 / CA-60", tco2e: 350 },
      { modulo: "A1-A3", item: "Alvenaria e revestimentos", tco2e: 185 },
      { modulo: "A4", item: "Transporte de insumos ao canteiro", tco2e: 95 },
      { modulo: "A5", item: "Combustível e energia do canteiro", tco2e: 50 },
    ],
    ativo: [
      { modulo: "SUB", item: "Substituição por CP III", tco2e: 150 },
      { modulo: "RCC", item: "Agregado reciclado de RCC", tco2e: 65 },
      { modulo: "ENE", item: "Geração fotovoltaica no canteiro", tco2e: 80 },
      { modulo: "ARB", item: "Compensação arbórea", tco2e: 45 },
    ],
  },
  {
    versao: 3,
    status: "em_analise",
    mesesAtras: 1,
    nivelGarantia: 3,
    passivo: [
      { modulo: "A1-A3", item: "Cimento e concreto usinado", tco2e: 505 },
      { modulo: "A1-A3", item: "Aço CA-50 / CA-60", tco2e: 300 },
      { modulo: "A1-A3", item: "Alvenaria e revestimentos", tco2e: 165 },
      { modulo: "A4", item: "Transporte de insumos ao canteiro", tco2e: 85 },
      { modulo: "A5", item: "Combustível e energia do canteiro", tco2e: 45 },
    ],
    ativo: [
      { modulo: "SUB", item: "Substituição por CP III", tco2e: 140 },
      { modulo: "RCC", item: "Agregado reciclado de RCC", tco2e: 60 },
      { modulo: "ENE", item: "Geração fotovoltaica no canteiro", tco2e: 75 },
      { modulo: "ARB", item: "Compensação arbórea", tco2e: 45 },
    ],
  },
];

function dataMesesAtras(meses) {
  const d = new Date();
  d.setMonth(d.getMonth() - meses);
  return d;
}

async function main() {
  const { data: obra, error: obraErr } = await db
    .from("obras")
    .select("id, nome, area_construida_m2")
    .eq("nome", nomeObra)
    .single();
  if (obraErr) throw new Error(`obra: ${obraErr.message}`);

  const { data: existentes } = await db.from("inventarios").select("id").eq("obra_id", obra.id);
  if (existentes && existentes.length > 0) {
    console.log(`"${obra.nome}" já tem ${existentes.length} inventário(s) — nada a fazer.`);
    return;
  }

  for (const v of VERSOES) {
    const quando = dataMesesAtras(v.mesesAtras);

    const { data: inv, error: invErr } = await db
      .from("inventarios")
      .insert({
        obra_id: obra.id,
        versao: v.versao,
        periodo_inicio: quando.toISOString().slice(0, 10),
        status: v.status,
        nivel_garantia: v.nivelGarantia,
        created_at: quando.toISOString(),
        homologado_em: v.status === "homologado" ? quando.toISOString() : null,
      })
      .select("id")
      .single();
    if (invErr) throw new Error(`inventario v${v.versao}: ${invErr.message}`);

    // Uma evidência por natureza, como no seed original.
    const { data: evidencias, error: evErr } = await db
      .from("evidencias")
      .insert([
        {
          obra_id: obra.id,
          tipo: "nfe",
          hash_sha256: `seed-${obra.id}-${v.versao}-passivo`,
          storage_path: `seed/${obra.id}/v${v.versao}/passivo.xml`,
          status_validacao: "validado",
        },
        {
          obra_id: obra.id,
          tipo: "laudo",
          hash_sha256: `seed-${obra.id}-${v.versao}-ativo`,
          storage_path: `seed/${obra.id}/v${v.versao}/ativo.pdf`,
          status_validacao: "validado",
        },
      ])
      .select("id, tipo");
    if (evErr) throw new Error(`evidencias v${v.versao}: ${evErr.message}`);

    const evPassivo = evidencias.find((e) => e.tipo === "nfe").id;
    const evAtivo = evidencias.find((e) => e.tipo === "laudo").id;

    const linhas = [
      ...v.passivo.map((l) => ({
        inventario_id: inv.id,
        modulo_en15978: l.modulo,
        natureza: "passivo",
        item: l.item,
        quantidade: 1,
        unidade: "tCO2e",
        tco2e: l.tco2e,
        evidencia_id: evPassivo,
      })),
      ...v.ativo.map((l) => ({
        inventario_id: inv.id,
        modulo_en15978: l.modulo,
        natureza: "ativo",
        item: l.item,
        quantidade: 1,
        unidade: "tCO2e",
        tco2e: l.tco2e,
        evidencia_id: evAtivo,
      })),
    ];

    const { error: lancErr } = await db.from("lancamentos").insert(linhas);
    if (lancErr) throw new Error(`lancamentos v${v.versao}: ${lancErr.message}`);

    const passivo = v.passivo.reduce((s, l) => s + l.tco2e, 0);
    const ativo = v.ativo.reduce((s, l) => s + l.tco2e, 0);
    const intensidade = Math.round(((passivo - ativo) * 1000) / obra.area_construida_m2);
    console.log(
      `v${v.versao} (${v.status}): passivo ${passivo} · ativo ${ativo} · ${intensidade} kgCO₂e/m²`,
    );
  }

  console.log(`Inventários de demonstração criados para "${obra.nome}".`);
}

main().catch((err) => {
  console.error("Falha:", err.message);
  process.exit(1);
});
