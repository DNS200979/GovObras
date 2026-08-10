import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Faltam EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY. Copie .env.example para .env.local.",
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    // O fiscal abre o app no canteiro e espera já estar dentro; a sessão fica
    // no dispositivo e é renovada sozinha quando há rede.
    persistSession: true,
    autoRefreshToken: true,
    // Sem deep link de callback: o login é e-mail e senha.
    detectSessionInUrl: false,
  },
});
