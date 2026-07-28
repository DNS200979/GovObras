import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { listarFilaPendente, sincronizarTudo, type FilaItem } from "@/src/lib/db";
import { color } from "@/src/lib/theme";

export default function SincronizacaoScreen() {
  const [fila, setFila] = useState<FilaItem[]>([]);
  const [sincronizando, setSincronizando] = useState(false);

  const carregar = useCallback(async () => {
    setFila(await listarFilaPendente());
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  async function handleSincronizar() {
    setSincronizando(true);
    try {
      // Em produção: enviar cada item ao servidor e só marcar sincronizado
      // após confirmação — resolução de conflito por timestamp do servidor.
      await sincronizarTudo();
      await carregar();
    } finally {
      setSincronizando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Fila local</Text>
        <Text style={styles.title}>Sincronização</Text>
        <Text style={styles.sub}>
          {fila.length === 0
            ? "Tudo sincronizado."
            : `${fila.length} ${fila.length === 1 ? "item pendente" : "itens pendentes"} de envio ao servidor.`}
        </Text>
      </View>

      <FlatList
        data={fila}
        keyExtractor={(item) => `${item.tabela}-${item.id}`}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum registro pendente. Capturas e checklists aparecem aqui até serem confirmados pelo servidor.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.resumo}</Text>
            <Text style={styles.cardMeta}>{new Date(item.capturadoEm).toLocaleString("pt-BR")}</Text>
          </View>
        )}
      />

      <Pressable
        style={[styles.button, (fila.length === 0 || sincronizando) && styles.buttonDisabled]}
        disabled={fila.length === 0 || sincronizando}
        onPress={handleSincronizar}
      >
        {sincronizando ? (
          <ActivityIndicator color={color.papel} />
        ) : (
          <Text style={styles.buttonText}>Sincronizar agora</Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.concreto, padding: 16 },
  header: { marginBottom: 16 },
  eyebrow: { fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: color.textoFraco },
  title: { fontSize: 26, fontWeight: "800", color: color.ardosia, marginTop: 4 },
  sub: { fontSize: 13, color: color.textoFraco, marginTop: 6 },
  list: { gap: 10, flexGrow: 1 },
  empty: { fontSize: 13, color: color.textoFraco, paddingVertical: 24, textAlign: "center" },
  card: {
    backgroundColor: color.papel,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: color.linha,
  },
  cardTitle: { fontSize: 14, fontWeight: "600", color: color.texto },
  cardMeta: { fontSize: 11.5, color: color.textoFraco, marginTop: 4 },
  button: {
    backgroundColor: color.verde,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: color.papel, fontWeight: "700", fontSize: 14 },
});
