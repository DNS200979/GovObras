// Popula requisitos_auditoria com o conteúdo real das seções 5.1 e 5.2 do
// plano de negócio (transcrito das tabelas do documento).
//
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node packages/database/scripts/seed-requisitos.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no ambiente.");
  process.exit(1);
}
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const passivo = [
  ["A1-A3", "Cimento e aglomerantes por tipo (CP II / III / IV / V)", "t · tCO₂e/t",
    "NF-e (XML), NCM 2523.x, DAP do fabricante quando houver",
    "Chave de 44 dígitos validada na SEFAZ; CNPJ emitente ativo; quantidade confrontada com o quantitativo do projeto estrutural (tolerância parametrizável)"],
  ["A1-A3", "Concreto usinado por classe de fck e teor de adição", "m³ · kgCO₂e/m³",
    "NF-e da concreteira + ficha técnica do traço",
    "Volume × área de fôrma do projeto; teor de adição declarado confrontado com DAP ou traço registrado"],
  ["A1-A3", "Aço CA-50/CA-60 por rota siderúrgica (BF-BOF ou EAF)", "t · tCO₂e/t",
    "NF-e, NCM 7213/7214, certificado de origem do fabricante",
    "Rota declarada verificada contra cadastro de usinas; sem comprovação, aplica-se o fator conservador da rota integrada"],
  ["A1-A3", "Alvenaria, argamassa, revestimento, esquadria, vidro, impermeabilizante", "t · m² · un",
    "NF-e agrupada por NCM",
    "Conversão automática NCM → categoria de material → fator; itens não mapeados entram em fila de curadoria"],
  ["A4", "Transporte de insumo do fornecedor ao canteiro", "t·km",
    "CT-e (XML); na ausência, distância rodoviária calculada entre CEP de origem e da obra",
    "Massa do CT-e conferida com a NF-e vinculada; modal e classe de veículo determinam o fator"],
  ["A5", "Combustível de máquinas, geradores e gruas", "L · kgCO₂e/L",
    "NF-e de combustível + diário de obra com horímetro por equipamento",
    "Consumo declarado × consumo específico do equipamento; desvio acima do limiar abre pendência"],
  ["A5", "Energia elétrica do canteiro", "MWh",
    "Fatura da distribuidora vinculada à UC do canteiro",
    "Fator médio mensal do SIN publicado pelo MCTI; UC confrontada com endereço da obra"],
  ["A5", "Resíduos da construção — geração e destinação por classe", "t · % desvio",
    "MTR / CTR e CDF do receptor licenciado",
    "Massa do MTR × distância ao receptor; licença ambiental do receptor válida na data; classe A destinada a aterro entra como passivo agravado"],
  ["A5", "Deslocamento de trabalhadores ao canteiro", "pass·km",
    "Pesquisa amostral de origem-destino ou vale-transporte",
    "Amostra mínima de 20% do efetivo; extrapolação por número médio de trabalhadores no período"],
  ["USO", "Supressão vegetal e movimentação de solo", "m² · un · tC",
    "Autorização de supressão, inventário florestal, laudo do responsável técnico com ART",
    "Área e indivíduos conferidos por ortofoto ou imagem de satélite anterior e posterior; ART ativa no CREA/CAU"],
  ["B1", "Gases fluorados em sistemas de climatização instalados", "kg × GWP",
    "Ficha técnica do equipamento, carga de refrigerante e ART de instalação",
    "GWP conforme AR6 do IPCC; taxa de vazamento anual padrão aplicada quando não houver medição"],
];

const ativo = [
  ["SUB", "Substituição de material por alternativa de menor intensidade", "tCO₂e evitado",
    "NF-e do material efetivamente usado + memorial de projeto com a especificação original",
    "Linha de base é a especificação aprovada no alvará. Troca não prevista em projeto exige aditivo com ART"],
  ["RCC", "Agregado reciclado e desvio de aterro", "t · % desvio",
    "MTR com destino a usina de reciclagem licenciada + CDF + NF-e de compra de agregado reciclado",
    "Licença de operação do receptor válida; balanço de massa fechado — entrada de agregado ≈ saída de resíduo classe A"],
  ["ENE", "Energia renovável no canteiro ou no empreendimento", "MWh",
    "Fatura com compensação (Lei 14.300), certificado I-REC ou contrato de mercado livre",
    "Certificado não pode ter sido usado por outro consumidor no mesmo período; verificação de serial"],
  ["ARB", "Compensação arbórea com sobrevivência monitorada", "un · tC estocado",
    "Termo de compensação, coordenadas de cada muda, espécie, foto georreferenciada",
    "Checkpoints em 12, 24 e 36 meses. Crédito é liberado em parcelas conforme sobrevivência; morte reverte o lançamento"],
  ["MAD", "Carbono biogênico estocado em madeira de origem controlada", "m³ · tC",
    "Certificado de cadeia de custódia FSC ou Cerflor + DOF/IBAMA",
    "Estoque contabilizado apenas em elemento permanente da edificação; fôrma e escoramento não contam"],
  ["CRV", "Créditos verificados adquiridos e aposentados", "tCO₂e",
    "Comprovante de aposentadoria em registro público com número de série, safra e projeto",
    "Serial consultado no registro; retirement em nome do CNPJ da obra; limite percentual de compensação definido pelo município"],
  ["EFI", "Desempenho energético projetado da edificação", "nível INI-C",
    "Etiqueta PBE Edifica emitida por OIA acreditado pelo INMETRO",
    "Bonificação de nota, não crédito de tCO₂e. Entra na régua do selo, não no balanço"],
  ["AGU", "Reuso de água pluvial e cinza", "m³",
    "Projeto hidrossanitário aprovado + hidrômetro do sistema de reuso",
    "Efeito indireto via energia de bombeamento e tratamento evitados; fator regional da concessionária"],
];

async function main() {
  const { count } = await db.from("requisitos_auditoria").select("*", { count: "exact", head: true });
  if (count && count > 0) {
    console.log(`requisitos_auditoria já tem ${count} linhas — nada a fazer.`);
    return;
  }

  const rows = [
    ...passivo.map(([codigo, requisito, unidade, evidencia_primaria, teste_verificacao], i) => ({
      natureza: "passivo",
      codigo,
      requisito,
      unidade,
      evidencia_primaria,
      teste_verificacao,
      ordem: i,
    })),
    ...ativo.map(([codigo, requisito, unidade, evidencia_primaria, teste_verificacao], i) => ({
      natureza: "ativo",
      codigo,
      requisito,
      unidade,
      evidencia_primaria,
      teste_verificacao,
      ordem: i,
    })),
  ];

  const { error } = await db.from("requisitos_auditoria").insert(rows);
  if (error) throw new Error(error.message);
  console.log(`Inseridas ${rows.length} linhas (${passivo.length} passivo + ${ativo.length} ativo).`);
}

main().catch((err) => {
  console.error("Falha:", err.message);
  process.exit(1);
});
