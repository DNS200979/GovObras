import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { color } from "@/src/lib/theme";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="vistoria/[id]/index"
          options={{ headerShown: true, title: "Vistoria", headerStyle: { backgroundColor: color.ardosia }, headerTintColor: color.papel }}
        />
        <Stack.Screen
          name="vistoria/[id]/captura"
          options={{ headerShown: true, title: "Capturar evidência", presentation: "modal", headerStyle: { backgroundColor: color.ardosia }, headerTintColor: color.papel }}
        />
      </Stack>
    </>
  );
}
