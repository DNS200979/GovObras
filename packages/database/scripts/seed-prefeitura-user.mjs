// Cria o primeiro usuário real da prefeitura (papel prefeitura_gestor) para
// testar o login por magic link. Sem senha — login é só por e-mail.
//
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node packages/database/scripts/seed-prefeitura-user.mjs <email> "<nome>"

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];
const nome = process.argv[3] ?? email?.split("@")[0];

if (!url || !serviceKey || !email) {
  console.error("Uso: node seed-prefeitura-user.mjs <email> \"<nome>\" (com env vars do Supabase)");
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
      email_confirm: true,
      user_metadata: { nome },
    });
    if (error) throw new Error(`auth.createUser: ${error.message}`);
    user = data.user;
    console.log(`Usuário criado: ${email} (${user.id})`);
  } else {
    console.log(`Usuário já existia: ${email} (${user.id})`);
  }

  const { data: perfilExistente } = await db.from("perfis").select("id").eq("id", user.id).maybeSingle();
  if (perfilExistente) {
    console.log("Perfil já existe — nada a fazer.");
    return;
  }

  const { error: perfilErr } = await db.from("perfis").insert({
    id: user.id,
    nome,
    papel: "prefeitura_gestor",
    municipio_id: municipio.id,
  });
  if (perfilErr) throw new Error(`perfis: ${perfilErr.message}`);

  console.log(`Perfil criado: ${nome} · prefeitura_gestor · Florianópolis`);
}

main().catch((err) => {
  console.error("Falha:", err.message);
  process.exit(1);
});
