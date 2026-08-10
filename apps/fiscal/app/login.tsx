import { useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/src/lib/supabase";
import { color } from "@/src/lib/theme";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function entrar() {
    setErro(null);
    setEntrando(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });
      if (error) throw error;

      // O app é só do fiscal de campo. Um login de prefeitura ou construtora
      // até autentica no Supabase, mas não tem o que fazer aqui — melhor
      // barrar com uma frase clara do que mostrar uma agenda vazia.
      const { data: perfil } = await supabase
        .from("perfis")
        .select("papel, nome")
        .eq("id", data.user.id)
        .single();

      if (perfil?.papel !== "fiscal") {
        await supabase.auth.signOut();
        setErro("Este aplicativo é da fiscalização de campo. Use o portal web com este login.");
        return;
      }

      router.replace("/(tabs)");
    } catch (e) {
      const msg = (e as Error).message;
      setErro(
        /invalid login credentials/i.test(msg)
          ? "E-mail ou senha incorretos."
          : /network|fetch/i.test(msg)
            ? "Sem conexão. O primeiro acesso precisa de rede para baixar o pacote."
            : msg,
      );
    } finally {
      setEntrando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.eyebrow}>CarbonFree</Text>
          <Text style={styles.title}>Fiscalização de campo</Text>
          <Text style={styles.sub}>
            Entre uma vez com rede. Depois disso o app funciona no canteiro sem sinal.
          </Text>

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            inputMode="email"
            placeholder="nome@municipio.gov.br"
            placeholderTextColor={color.linhaForte}
            testID="email"
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={color.linhaForte}
            testID="senha"
            onSubmitEditing={entrar}
          />

          {erro ? <Text style={styles.erro}>{erro}</Text> : null}

          <Pressable
            style={[styles.botao, entrando && styles.botaoDesabilitado]}
            onPress={entrar}
            disabled={entrando}
            testID="entrar"
          >
            {entrando ? (
              <ActivityIndicator color={color.papel} />
            ) : (
              <Text style={styles.botaoTexto}>Entrar</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.concreto },
  flex: { flex: 1 },
  content: { flex: 1, justifyContent: "center", padding: 24 },
  eyebrow: { fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: color.textoFraco },
  title: { fontSize: 28, fontWeight: "800", color: color.ardosia, marginTop: 4 },
  sub: { fontSize: 13.5, color: color.textoFraco, marginTop: 8, marginBottom: 28, lineHeight: 19 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: color.textoFraco,
    marginBottom: 6,
  },
  input: {
    backgroundColor: color.papel,
    borderWidth: 1,
    borderColor: color.linha,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: color.texto,
    marginBottom: 16,
  },
  erro: {
    color: color.ambar,
    fontSize: 13,
    marginBottom: 12,
    backgroundColor: color.ambarClaro,
    padding: 10,
    borderRadius: 8,
    lineHeight: 18,
  },
  botao: {
    backgroundColor: color.ardosia,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  botaoDesabilitado: { opacity: 0.6 },
  botaoTexto: { color: color.papel, fontWeight: "700", fontSize: 15 },
});
