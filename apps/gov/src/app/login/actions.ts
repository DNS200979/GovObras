"use server";

import { headers } from "next/headers";
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
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

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
