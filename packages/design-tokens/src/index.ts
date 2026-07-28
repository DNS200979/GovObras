/**
 * Identidade visual do CarbonFree Obras.
 * Extraída do plano de negócio (carbonfree-obras-plano-de-negocio.html) para
 * manter Gov e Obra visualmente consistentes com o material institucional.
 */

export const color = {
  ardosia: "#16232A",
  ardosia2: "#1F323B",
  concreto: "#E3E7E2",
  papel: "#F8F9F6",
  linha: "#C4CBC3",
  linhaForte: "#9AA69C",
  verde: "#1F6F5C",
  verdeClaro: "#E4F0EB",
  ambar: "#B4661A",
  ambarClaro: "#F7EBDD",
  texto: "#22302F",
  textoFraco: "#5C6B66",
  azul: "#2C5670",
} as const;

/** Cores semânticas do razonete de carbono: passivo (emissão) vs ativo (remoção). */
export const balance = {
  passivo: { fg: color.ambar, bg: color.ambarClaro },
  ativo: { fg: color.verde, bg: color.verdeClaro },
} as const;

/** Faixas da régua de incentivo municipal (seção 12 do plano). */
export const tier = {
  AAA: { fg: color.verde, bg: color.verdeClaro, label: "AAA" },
  AA: { fg: color.verde, bg: color.verdeClaro, label: "AA" },
  A: { fg: color.azul, bg: "#E6EBEF", label: "A" },
  B: { fg: color.azul, bg: "#E6EBEF", label: "B" },
  C: { fg: color.ambar, bg: color.ambarClaro, label: "C" },
} as const;

/** Níveis de garantia do dado (seção 11 — camadas de garantia). */
export const assuranceLevel = {
  1: "Autodeclarado",
  2: "Analisado",
  3: "Verificado em campo",
  4: "Verificado por OVV",
} as const;

export const font = {
  display: "'Archivo', system-ui, sans-serif",
  body: "'Source Serif 4', Georgia, serif",
  mono: "'IBM Plex Mono', ui-monospace, monospace",
} as const;

export const radius = {
  sm: "3px",
  md: "5px",
  lg: "6px",
} as const;
