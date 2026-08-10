import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { supabase } from "@/src/lib/supabase";
import { color } from "@/src/lib/theme";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [autenticado, setAutenticado] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAutenticado(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, sessao) => {
      setAutenticado(!!sessao);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (autenticado === null) return;
    const naTelaDeLogin = segments[0] === "login";
    if (!autenticado && !naTelaDeLogin) router.replace("/login");
    if (autenticado && naTelaDeLogin) router.replace("/(tabs)");
  }, [autenticado, segments, router]);

  // A sessão vem do armazenamento local: resolve rápido, mas não instantâneo.
  // Sem esta espera o app pisca a tela de login antes de decidir.
  if (autenticado === null) {
    return (
      <View style={{ flex: 1, backgroundColor: color.concreto, justifyContent: "center" }}>
        <ActivityIndicator color={color.verde} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="vistoria/[id]/index"
          options={{
            headerShown: true,
            title: "Vistoria",
            headerStyle: { backgroundColor: color.ardosia },
            headerTintColor: color.papel,
          }}
        />
        <Stack.Screen
          name="vistoria/[id]/captura"
          options={{
            headerShown: true,
            title: "Capturar evidência",
            presentation: "modal",
            headerStyle: { backgroundColor: color.ardosia },
            headerTintColor: color.papel,
          }}
        />
      </Stack>
    </>
  );
}
