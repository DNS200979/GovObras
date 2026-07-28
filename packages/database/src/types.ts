/**
 * Tipos gerados a partir do schema Supabase.
 *
 * O banco real já está provisionado e com o schema aplicado (ver
 * supabase/migrations/), mas gerar os tipos aqui requer Docker/Podman
 * (para `--db-url`) ou `supabase login` + `--linked` (para usar a API de
 * management) — nenhum dos dois disponível neste ambiente. Rode localmente:
 *
 *   npx supabase login
 *   npx supabase link --project-ref sidkrwbzbfkbjyqnurgp --workdir packages/database
 *   pnpm --filter @carbonfree/database gen:types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
