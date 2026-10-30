// Cria um usuário no Neon Auth e o perfil de acesso correspondente em `perfis`.
// Substitui os scripts/seed-*-user.mjs da época do Supabase.
//
//   DATABASE_URL=... NEON_AUTH_BASE_URL=... \
//     node packages/database/neon/criar-usuario.mjs <email> <senha> "<nome>" <papel> ["<alvo>"]
//
// papel / alvo:
//   prefeitura_gestor | prefeitura_analista | fiscal -> nome do município (padrão "Florianópolis")
//   construtora_rt | construtora_lancador           -> razão social da construtora
//   concreteira                                     -> razão social da concreteira
//   admin_plataforma                                -> sem alvo
//
// Se o e-mail já existir, a senha NÃO é alterada (o hash fica no Neon Auth);
// só o perfil é criado/atualizado. Para trocar a senha, use o console do Neon.

import pg from "pg";

const [email, password, nome, papel, alvo] = process.argv.slice(2);
const databaseUrl = process.env.DATABASE_URL;
const authUrl = process.env.NEON_AUTH_BASE_URL;

if (!email || !password || !nome || !papel || !databaseUrl || !authUrl) {
  console.error(
    'Uso: node criar-usuario.mjs <email> <senha> "<nome>" <papel> ["<alvo>"]  (com DATABASE_URL e NEON_AUTH_BASE_URL)',
  );
  process.exit(1);
}

const db = new pg.Client({ connectionString: databaseUrl });
await db.connect();

async function buscarUm(sql, params, descricao) {
  const { rows } = await db.query(sql, params);
  if (!rows[0]) throw new Error(`${descricao} não encontrado(a).`);
  return rows[0].id;
}

try {
  // Resolve o tenant antes de criar o usuário, para não deixar conta sem perfil.
  let colunas = {};
  if (papel.startsWith("prefeitura_") || papel === "fiscal") {
    const id = await buscarUm("select id from municipios where nome = $1", [alvo ?? "Florianópolis"], "Município");
    colunas = { municipio_id: id };
  } else if (papel.startsWith("construtora_")) {
    const id = await buscarUm("select id from construtoras where razao_social = $1", [alvo], "Construtora");
    colunas = { construtora_id: id };
  } else if (papel === "concreteira") {
    const id = await buscarUm("select id from concreteiras where razao_social = $1", [alvo], "Concreteira");
    colunas = { concreteira_id: id };
  } else if (papel !== "admin_plataforma") {
    throw new Error(`Papel desconhecido: ${papel}`);
  }

  let { rows } = await db.query('select id from neon_auth."user" where email = $1', [email]);
  if (rows[0]) {
    console.log(`Usuário já existia (${rows[0].id}) — senha mantida.`);
  } else {
    const origin = new URL(authUrl).origin;
    const res = await fetch(`${authUrl}/sign-up/email`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ email, password, name: nome }),
    });
    if (!res.ok) throw new Error(`sign-up falhou (${res.status}): ${await res.text()}`);
    ({ rows } = await db.query('select id from neon_auth."user" where email = $1', [email]));
    if (!rows[0]) throw new Error("Usuário não apareceu em neon_auth.user após o sign-up.");
    console.log(`Usuário criado: ${email} (${rows[0].id})`);
  }
  const userId = rows[0].id;

  const campos = { id: userId, nome, papel, ...colunas };
  const nomes = Object.keys(campos);
  await db.query(
    `insert into perfis (${nomes.join(", ")}) values (${nomes.map((_, i) => `$${i + 1}`).join(", ")})
     on conflict (id) do update set ${nomes.filter((n) => n !== "id").map((n) => `${n} = excluded.${n}`).join(", ")}`,
    nomes.map((n) => campos[n]),
  );
  console.log(`Perfil gravado: ${nome} · ${papel}${alvo ? ` · ${alvo}` : ""}`);
} catch (err) {
  console.error("Falha:", err.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
