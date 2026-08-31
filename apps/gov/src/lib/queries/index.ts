/**
 * Ponto único de importação das consultas do Gov.
 *
 * O arquivo era um `queries.ts` de 938 linhas cobrindo os 10 módulos; virou um
 * arquivo por domínio. O barrel existe para que as 20 páginas que já importam
 * de `@/lib/queries` continuem funcionando sem alteração.
 */
export * from "./_compartilhado";
export * from "./painel";
export * from "./obras";
export * from "./agendamento";
export * from "./construtoras";
export * from "./requisitos";
export * from "./esg";
export * from "./obrigacoes";
export * from "./captacao";
export * from "./mapa";
export * from "./concreteiras";
