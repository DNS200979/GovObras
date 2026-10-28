// Aplica o schema num Postgres (Neon): 00_compat.sql + supabase/migrations/*.sql.
//
//   DATABASE_URL="postgresql://..." node packages/database/neon/apply.mjs [--dry-run] [--sem-vector]
//
// Cada migração roda em transação e é registrada em public._migrations_neon,
// então pode ser reexecutada: só aplica o que falta.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const aqui = dirname(fileURLToPath(import.meta.url));
const dir = join(aqui, "..", "supabase", "migrations");
const dirNeon = join(aqui, "migrations");
const url = process.env.DATABASE_URL;
const dryRun = process.argv.includes("--dry-run");
// Só para teste local em imagem sem pgvector; no Neon não use.
const semVector = process.argv.includes("--sem-vector");

if (!url) {
  console.error("Defina DATABASE_URL (string de conexão do Neon).");
  process.exit(1);
}

/** Ajustes mínimos para Postgres sem as extensões exclusivas do Supabase. */
function adaptar(arquivo, sql) {
  // Neon não tem pg_cron; nenhuma migração agenda job (só cria a extensão).
  if (arquivo.endsWith("_extensoes.sql")) {
    sql = sql.replace(/^create extension if not exists pg_cron.*$/m, "-- pg_cron: indisponível no Neon");
    if (semVector) sql = sql.replace(/^create extension if not exists vector.*$/m, "-- vector: omitido (--sem-vector)");
    return sql;
  }
  return sql;
}

const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  await client.query(
    "create table if not exists public._migrations_neon (nome text primary key, aplicada_em timestamptz not null default now())",
  );
  const { rows } = await client.query("select nome from public._migrations_neon");
  const feitas = new Set(rows.map((r) => r.nome));

  const fila = [
    ["00_compat.sql", readFileSync(join(aqui, "00_compat.sql"), "utf8")],
    ...readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .map((f) => [f, adaptar(f, readFileSync(join(dir, f), "utf8"))]),
    // Específicas do Neon (dependem de neon_auth); rodam depois das originais.
    ...readdirSync(dirNeon)
      .filter((f) => f.endsWith(".sql"))
      .sort()
      .map((f) => [`neon/${f}`, readFileSync(join(dirNeon, f), "utf8")]),
  ];

  for (const [nome, sql] of fila) {
    if (feitas.has(nome)) continue;
    if (dryRun) {
      console.log(`[dry-run] aplicaria ${nome}`);
      continue;
    }
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into public._migrations_neon (nome) values ($1)", [nome]);
      await client.query("commit");
      console.log(`ok  ${nome}`);
    } catch (err) {
      await client.query("rollback");
      console.error(`ERRO em ${nome}: ${err.message}`);
      process.exitCode = 1;
      break;
    }
  }
} finally {
  await client.end();
}
