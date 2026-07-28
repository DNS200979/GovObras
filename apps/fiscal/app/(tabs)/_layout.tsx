import { Tabs } from "expo-router";
import { color } from "@/src/lib/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: color.ardosia },
        headerTintColor: color.papel,
        headerTitleStyle: { fontWeight: "800" },
        tabBarActiveTintColor: color.verde,
        tabBarInactiveTintColor: color.textoFraco,
        tabBarStyle: { backgroundColor: color.papel, borderTopColor: color.linha },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Agenda" }} />
      <Tabs.Screen name="sincronizacao" options={{ title: "Sincronização" }} />
    </Tabs>
  );
}
