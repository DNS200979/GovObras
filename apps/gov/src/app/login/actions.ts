"use server";

import { createServerSupabase } from "@carbonfree/database/server";

export interface EnviarLinkState {
  error?: string;
  enviado?: boolean;
}

export async function enviarLink(
  _prev: EnviarLinkState,
  formData: FormData,
): Promise<EnviarLinkState> {
  const email = formData.get("email")?.toString().trim();
  const next = formData.get("next")?.toString() || "/";

  if (!email) {
    return { error: "Informe um e-mail." };
  }

  const supabase = await createServerSupabase();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { enviado: true };
}
