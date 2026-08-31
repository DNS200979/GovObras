/**
 * Ponto único de importação das consultas do app da construtora.
 *
 * Era um `queries.ts` de 772 linhas; virou um arquivo por domínio. O barrel
 * mantém funcionando as páginas que importam de `@/lib/queries`.
 */
export * from "./_compartilhado";
export * from "./obras";
export * from "./dossie";
export * from "./esg";
export * from "./concreteiras";
export * from "./certificacao";
