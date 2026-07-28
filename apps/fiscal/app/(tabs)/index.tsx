import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { agendaHoje, type Vistoria } from "@/src/data/mock";
import { color } from "@/src/lib/theme";

const statusLabel: Record<Vistoria["status"], string> = {
  agendada: "Agendada",
  em_campo: "Em campo",
  concluida: "Concluída",
};

const statusColor: Record<Vistoria["status"], string> = {
  agendada: color.azul,
  em_campo: color.ambar,
  concluida: color.verde,
};

export default function AgendaScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <FlatList
        data={agendaHoje}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Pacote baixado para uso offline</Text>
            <Text style={styles.title}>Roteiro do dia</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/vistoria/${item.id}`)}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>{item.obra}</Text>
              <View style={[styles.badge, { backgroundColor: statusColor[item.status] + "22" }]}>
                <Text style={[styles.badgeText, { color: statusColor[item.status] }]}>
                  {statusLabel[item.status]}
                </Text>
              </View>
            </View>
            <Text style={styles.cardSub}>{item.construtora}</Text>
            <Text style={styles.cardMeta}>{item.endereco}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardMetaMono}>{item.horario}</Text>
              <Text style={styles.cardMetaMono}>Fase: {item.fase}</Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.concreto },
  list: { padding: 16, gap: 12 },
  header: { marginBottom: 8 },
  eyebrow: { fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: color.textoFraco },
  title: { fontSize: 26, fontWeight: "800", color: color.ardosia, marginTop: 4 },
  card: {
    backgroundColor: color.papel,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: color.linha,
    marginBottom: 12,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: color.texto, flexShrink: 1 },
  cardSub: { fontSize: 13, color: color.textoFraco, marginTop: 2 },
  cardMeta: { fontSize: 12.5, color: color.textoFraco, marginTop: 6 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  cardMetaMono: { fontSize: 11.5, color: color.textoFraco, fontVariant: ["tabular-nums"] },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10.5, fontWeight: "700" },
});
