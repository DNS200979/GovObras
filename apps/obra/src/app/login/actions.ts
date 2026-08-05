"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@carbonfree/database/server";

export interface LoginState {
  error?: string;
}

/** Espelha PAPEIS_PERMITIDOS do proxy.ts — aqui só para dar a mensagem certa na hora do login. */
const PAPEIS_PERMITIDOS = ["construtora_lancador", "construtora_rt", "admin_plataforma"];

export async function entrar(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const next = formData.get("next")?.toString() || "/";

  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "E-mail ou senha incorretos." };
  }

  const { data: perfil } = await supabase.from("perfis").select("papel").eq("id", data.user.id).single();

  if (!perfil || !PAPEIS_PERMITIDOS.includes(perfil.papel)) {
    await supabase.auth.signOut();
    return {
      error: "Esta conta não é de construtora. Contas da prefeitura acessam o CarbonFree Gov.",
    };
  }

  redirect(next);
}
