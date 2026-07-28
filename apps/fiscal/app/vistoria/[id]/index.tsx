import { useCallback, useState } from "react";
import * as Crypto from "expo-crypto";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { agendaHoje, checklistPorFase } from "@/src/data/mock";
import { getDb } from "@/src/lib/db";
import { color } from "@/src/lib/theme";

export default function VistoriaDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const vistoria = agendaHoje.find((v) => v.id === id);
  const checklist = vistoria ? checklistPorFase[vistoria.fase] : [];

  const [respostas, setRespostas] = useState<Record<string, boolean>>({});

  const carregarRespostasSalvas = useCallback(async () => {
    if (!vistoria) return;
    const db = await getDb();
    const rows = await db.getAllAsync<{ item_id: string; conforme: number }>(
      "SELECT item_id, conforme FROM checklist_respostas WHERE fiscalizacao_id = ?",
      vistoria.id,
    );
    setRespostas(Object.fromEntries(rows.map((r) => [r.item_id, !!r.conforme])));
  }, [vistoria]);

  useFocusEffect(
    useCallback(() => {
      carregarRespostasSalvas();
    }, [carregarRespostasSalvas]),
  );

  async function marcar(itemId: string, conforme: boolean) {
    if (!vistoria) return;
    setRespostas((r) => ({ ...r, [itemId]: conforme }));
    const db = await getDb();
    const respostaId = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${vistoria.id}:${itemId}`,
    );
    await db.runAsync(
      `INSERT INTO checklist_respostas (id, fiscalizacao_id, item_id, conforme, respondido_em, sincronizado)
       VALUES (?, ?, ?, ?, ?, 0)
       ON CONFLICT(id) DO UPDATE SET conforme = excluded.conforme, respondido_em = excluded.respondido_em, sincronizado = 0`,
      respostaId,
      vistoria.id,
      itemId,
      conforme ? 1 : 0,
      new Date().toISOString(),
    );
  }

  if (!vistoria) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.empty}>Vistoria não encontrada no pacote offline.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>{vistoria.construtora}</Text>
        <Text style={styles.title}>{vistoria.obra}</Text>
        <Text style={styles.sub}>{vistoria.endereco}</Text>

        <Pressable
          style={styles.captureButton}
          onPress={() => router.push(`/vistoria/${vistoria.id}/captura`)}
        >
          <Text style={styles.captureButtonText}>Capturar evidência</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>
          Checklist normativo · fase {vistoria.fase}
        </Text>

        {checklist.map((item) => (
          <View key={item.id} style={styles.item}>
            <Text style={styles.itemLabel}>{item.label}</Text>
            <Switch
              value={!!respostas[item.id]}
              onValueChange={(v) => marcar(item.id, v)}
              trackColor={{ false: color.linha, true: color.verdeClaro }}
              thumbColor={respostas[item.id] ? color.verde : color.papel}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.concreto },
  content: { padding: 16, paddingBottom: 40 },
  empty: { padding: 16, color: color.textoFraco },
  eyebrow: { fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: color.textoFraco },
  title: { fontSize: 24, fontWeight: "800", color: color.ardosia, marginTop: 4 },
  sub: { fontSize: 13, color: color.textoFraco, marginTop: 4, marginBottom: 16 },
  captureButton: {
    backgroundColor: color.ardosia,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  captureButtonText: { color: color.papel, fontWeight: "700", fontSize: 14 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: color.textoFraco,
    marginBottom: 10,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: color.papel,
    borderWidth: 1,
    borderColor: color.linha,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  itemLabel: { flex: 1, fontSize: 13.5, color: color.texto, lineHeight: 18 },
});
