"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/** Cliente Supabase para uso em componentes client-side (apps/gov, apps/obra). */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export type { Database } from "./types";
