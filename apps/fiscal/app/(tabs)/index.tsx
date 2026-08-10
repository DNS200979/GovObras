import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { listarAgenda, type FiscalizacaoLocal } from "@/src/lib/db";
import { baixarPacote } from "@/src/lib/sincronizacao";
import { color } from "@/src/lib/theme";

const statusLabel: Record<string, string> = {
  agendada: "Agendada",
  em_campo: "Em campo",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const statusColor: Record<string, string> = {
  agendada: color.azul,
  em_campo: color.ambar,
  concluida: color.verde,
  cancelada: color.linhaForte,
};

function formatarHorario(iso: string | null) {
  if (!iso) return "sem horário";
  const d = new Date(iso);
  const hoje = new Date();
  const mesmoDia = d.toDateString() === hoje.toDateString();
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return mesmoDia ? hora : `${d.toLocaleDateString("pt-BR")} · ${hora}`;
}

export default function AgendaScreen() {
  const router = useRouter();
  const [agenda, setAgenda] = useState<FiscalizacaoLocal[]>([]);
  const [baixando, setBaixando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setAgenda(await listarAgenda());
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  async function atualizar() {
    setBaixando(true);
    setAviso(null);
    try {
      const r = await baixarPacote();
      await carregar();
      setAviso(`Pacote atualizado: ${r.fiscalizacoes} vistoria(s), ${r.requisitos} requisitos.`);
    } catch (e) {
      // Sem rede a agenda continua servindo o que já está no aparelho — é o
      // ponto do app. O aviso explica, não bloqueia.
      setAviso(`Sem atualizar: ${(e as Error).message}. A agenda no aparelho segue valendo.`);
    } finally {
      setBaixando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <FlatList
        data={agenda}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={baixando} onRefresh={atualizar} tintColor={color.verde} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Pacote no aparelho · funciona sem sinal</Text>
            <Text style={styles.title}>Roteiro</Text>
            {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.vazio}>
            <Text style={styles.vazioTitulo}>Nenhuma vistoria no aparelho</Text>
            <Text style={styles.vazioTexto}>
              Puxe a lista para baixar o pacote do dia. É preciso rede só neste momento.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/vistoria/${item.id}`)}
            testID={`vistoria-${item.id}`}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>{item.obra_nome}</Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: (statusColor[item.status] ?? color.linhaForte) + "22" },
                ]}
              >
                <Text
                  style={[styles.badgeText, { color: statusColor[item.status] ?? color.textoFraco }]}
                >
                  {statusLabel[item.status] ?? item.status}
                </Text>
              </View>
            </View>
            {item.construtora ? <Text style={styles.cardSub}>{item.construtora}</Text> : null}
            <Text style={styles.cardMeta}>{item.endereco ?? "Endereço não informado"}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardMetaMono}>{formatarHorario(item.agendado_para)}</Text>
              {item.fase ? <Text style={styles.cardMetaMono}>Fase: {item.fase}</Text> : null}
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.concreto },
  list: { padding: 16, gap: 12, flexGrow: 1 },
  header: { marginBottom: 8 },
  eyebrow: { fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: color.textoFraco },
  title: { fontSize: 26, fontWeight: "800", color: color.ardosia, marginTop: 4 },
  aviso: {
    marginTop: 10,
    fontSize: 12.5,
    color: color.texto,
    backgroundColor: color.papel,
    borderWidth: 1,
    borderColor: color.linha,
    borderRadius: 8,
    padding: 10,
    lineHeight: 17,
  },
  vazio: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  vazioTitulo: { fontSize: 15, fontWeight: "700", color: color.texto, marginBottom: 6 },
  vazioTexto: { fontSize: 13, color: color.textoFraco, textAlign: "center", lineHeight: 19 },
  card: {
    backgroundColor: color.papel,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: color.linha,
    marginBottom: 12,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: color.texto, flexShrink: 1 },
  cardSub: { fontSize: 13, color: color.textoFraco, marginTop: 2 },
  cardMeta: { fontSize: 12.5, color: color.textoFraco, marginTop: 6 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  cardMetaMono: { fontSize: 11.5, color: color.textoFraco, fontVariant: ["tabular-nums"] },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10.5, fontWeight: "700" },
});
