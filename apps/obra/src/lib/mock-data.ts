/** Dados de exemplo — Obra "Residencial Vista Verde", 9.400 m², ciclo A1-A5. */

export const obraAtual = {
  nome: "Residencial Vista Verde",
  areaM2: 9_400,
  fase: "Estrutura",
  faixaAlvo: "≤ 200 kgCO₂e/m² (faixa B)",
};

export const balanco = { passivo: 2_755, ativo: 1_141 };

export const projecaoFechamento = [
  { fase: "Fundação", intensidade: 268 },
  { fase: "Estrutura", intensidade: 231 },
  { fase: "Acabamento (proj.)", intensidade: 195 },
  { fase: "Entrega (proj.)", intensidade: 172 },
];

export interface Alternativa {
  id: string;
  material: string;
  original: string;
  custoAdicionalPorUnidade: number;
  tco2eEvitadoPorUnidade: number;
  unidade: string;
}

export const alternativas: Alternativa[] = [
  {
    id: "cp3",
    material: "Cimento CP III (alto-forno)",
    original: "Cimento CP II",
    custoAdicionalPorUnidade: 12,
    tco2eEvitadoPorUnidade: 0.18,
    unidade: "t",
  },
  {
    id: "aco-eaf",
    material: "Aço rota EAF (forno elétrico)",
    original: "Aço rota BF-BOF",
    custoAdicionalPorUnidade: 340,
    tco2eEvitadoPorUnidade: 1.1,
    unidade: "t",
  },
  {
    id: "agregado-rcc",
    material: "Agregado reciclado de RCC",
    original: "Brita natural",
    custoAdicionalPorUnidade: -8,
    tco2eEvitadoPorUnidade: 0.012,
    unidade: "t",
  },
  {
    id: "fotovoltaico",
    material: "Geração fotovoltaica no canteiro",
    original: "Energia da concessionária",
    custoAdicionalPorUnidade: 4200,
    tco2eEvitadoPorUnidade: 18,
    unidade: "kWp instalado",
  },
];
