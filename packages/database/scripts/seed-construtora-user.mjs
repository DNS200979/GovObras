// Cria (ou atualiza a senha de) um usuário real de uma construtora.
//
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node packages/database/scripts/seed-construtora-user.mjs <email> <senha> "<nome>" "<razao_social>" [papel]
//
// papel: construtora_rt (padrão) ou construtora_lancador
// razao_social precisa bater com uma linha já existente em `construtoras`.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];
const password = process.argv[3];
const nome = process.argv[4] ?? email?.split("@")[0];
const razaoSocial = process.argv[5];
const papel = process.argv[6] ?? "construtora_rt";

if (!url || !serviceKey || !email || !password || !razaoSocial) {
  console.error(
    'Uso: node seed-construtora-user.mjs <email> <senha> "<nome>" "<razao_social>" [papel] (com env vars do Supabase)',
  );
  process.exit(1);
}
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  const { data: construtora, error: cErr } = await db
    .from("construtoras")
    .select("id")
    .eq("razao_social", razaoSocial)
    .single();
  if (cErr) throw new Error(`construtora: ${cErr.message}`);

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
    construtora_id: construtora.id,
  });
  if (perfilErr) throw new Error(`perfis: ${perfilErr.message}`);

  console.log(`Perfil criado: ${nome} · ${papel} · ${razaoSocial}`);
}

main().catch((err) => {
  console.error("Falha:", err.message);
  process.exit(1);
});
