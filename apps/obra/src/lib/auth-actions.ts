"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@carbonfree/database/server";

export async function sair() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}
