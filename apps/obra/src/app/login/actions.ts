"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@carbonfree/database/server";

export interface LoginState {
  error?: string;
}

export async function entrar(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const next = formData.get("next")?.toString() || "/";

  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "E-mail ou senha incorretos." };
  }

  redirect(next);
}
