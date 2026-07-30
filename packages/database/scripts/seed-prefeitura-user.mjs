// Cria (ou atualiza a senha de) um usuário real da prefeitura.
//
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node packages/database/scripts/seed-prefeitura-user.mjs <email> <senha> "<nome>" [papel]
//
// papel: prefeitura_gestor (padrão) ou prefeitura_analista

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];
const password = process.argv[3];
const nome = process.argv[4] ?? email?.split("@")[0];
const papel = process.argv[5] ?? "prefeitura_gestor";

if (!url || !serviceKey || !email || !password) {
  console.error(
    'Uso: node seed-prefeitura-user.mjs <email> <senha> "<nome>" [papel] (com env vars do Supabase)',
  );
  process.exit(1);
}
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  const { data: municipio, error: mErr } = await db
    .from("municipios")
    .select("id")
    .eq("nome", "Florianópolis")
    .single();
  if (mErr) throw new Error(`município: ${mErr.message}`);

  const { data: existing } = await db.auth.admin.listUsers();
  let user = existing.users.find((u) => u.email === email);

  if (!user) {
    const { data, error } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome },
    });
    if (error) throw new Error(`auth.createUser: ${error.message}`);
    user = data.user;
    console.log(`Usuário criado: ${email} (${user.id})`);
  } else {
    const { error } = await db.auth.admin.updateUserById(user.id, { password });
    if (error) throw new Error(`updateUserById: ${error.message}`);
    console.log(`Usuário já existia — senha atualizada: ${email} (${user.id})`);
  }

  const { data: perfilExistente } = await db.from("perfis").select("id").eq("id", user.id).maybeSingle();
  if (perfilExistente) {
    console.log("Perfil já existe — nada a fazer.");
    return;
  }

  const { error: perfilErr } = await db.from("perfis").insert({
    id: user.id,
    nome,
    papel,
    municipio_id: municipio.id,
  });
  if (perfilErr) throw new Error(`perfis: ${perfilErr.message}`);

  console.log(`Perfil criado: ${nome} · ${papel} · Florianópolis`);
}

main().catch((err) => {
  console.error("Falha:", err.message);
  process.exit(1);
});
