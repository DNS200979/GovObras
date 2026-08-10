import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { contarPendencias, type Pendencias } from "@/src/lib/db";
import { enviarPendencias } from "@/src/lib/sincronizacao";
import { supabase } from "@/src/lib/supabase";
import { color } from "@/src/lib/theme";

export default function SincronizacaoScreen() {
  const router = useRouter();
  const [pendencias, setPendencias] = useState<Pendencias | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [erros, setErros] = useState<string[]>([]);

  const carregar = useCallback(async () => {
    setPendencias(await contarPendencias());
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  async function enviar() {
    setEnviando(true);
    setResultado(null);
    setErros([]);
    try {
      const r = await enviarPendencias();
      setErros(r.erros);
      setResultado(
        r.enviadas === 0 && r.erros.length === 0
          ? "Nada pendente."
          : `${r.enviadas} vistoria(s) enviada(s).` +
              (r.erros.length ? ` ${r.erros.length} falhou/falharam.` : ""),
      );
      await carregar();
    } catch (e) {
      setResultado(`Falha: ${(e as Error).message}`);
    } finally {
      setEnviando(false);
    }
  }

  async function sair() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const total = pendencias?.total ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Fila local</Text>
        <Text style={styles.title}>Sincronização</Text>
        <Text style={styles.sub}>
          Tudo o que você registrou está gravado no aparelho. O envio só marca como sincronizado
          depois que o servidor confirma — se a conexão cair no meio, é só tentar de novo.
        </Text>

        <View style={styles.painel}>
          <Text style={styles.numero}>{total}</Text>
          <Text style={styles.numeroLabel}>
            {total === 1 ? "registro pendente" : "registros pendentes"}
          </Text>
          {pendencias && total > 0 ? (
            <Text style={styles.detalhe}>
              {pendencias.respostas} resposta(s) · {pendencias.evidencias} evidência(s) ·{" "}
              {pendencias.status} mudança(s) de status
            </Text>
          ) : null}
        </View>

        <Pressable
          style={[styles.botao, (enviando || total === 0) && styles.botaoDesabilitado]}
          onPress={enviar}
          disabled={enviando || total === 0}
          testID="enviar"
        >
          {enviando ? (
            <ActivityIndicator color={color.papel} />
          ) : (
            <Text style={styles.botaoTexto}>Enviar pendências</Text>
          )}
        </Pressable>

        {resultado ? <Text style={styles.resultado}>{resultado}</Text> : null}

        {erros.map((e) => (
          <Text key={e} style={styles.erro}>
            {e}
          </Text>
        ))}

        <Pressable style={styles.sair} onPress={sair} testID="sair">
          <Text style={styles.sairTexto}>Sair da conta</Text>
        </Pressable>
        {total > 0 ? (
          <Text style={styles.avisoSair}>
            Há registros não enviados. Sair não os apaga, mas eles só sobem com este mesmo login.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.concreto },
  content: { padding: 16, paddingBottom: 40 },
  eyebrow: { fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: color.textoFraco },
  title: { fontSize: 26, fontWeight: "800", color: color.ardosia, marginTop: 4 },
  sub: { fontSize: 13, color: color.textoFraco, marginTop: 8, lineHeight: 19 },
  painel: {
    backgroundColor: color.papel,
    borderWidth: 1,
    borderColor: color.linha,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginTop: 20,
  },
  numero: { fontSize: 44, fontWeight: "800", color: color.ardosia, fontVariant: ["tabular-nums"] },
  numeroLabel: { fontSize: 12.5, color: color.textoFraco, marginTop: 2 },
  detalhe: { fontSize: 11.5, color: color.textoFraco, marginTop: 10, textAlign: "center" },
  botao: {
    backgroundColor: color.verde,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 16,
  },
  botaoDesabilitado: { opacity: 0.45 },
  botaoTexto: { color: color.papel, fontWeight: "700", fontSize: 15 },
  resultado: { fontSize: 13, color: color.texto, marginTop: 14, lineHeight: 19 },
  erro: {
    fontSize: 12,
    color: color.ambar,
    backgroundColor: color.ambarClaro,
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    lineHeight: 17,
  },
  sair: { marginTop: 32, paddingVertical: 12, alignItems: "center" },
  sairTexto: { fontSize: 13.5, color: color.textoFraco, fontWeight: "600" },
  avisoSair: { fontSize: 11.5, color: color.ambar, textAlign: "center", lineHeight: 16 },
});
