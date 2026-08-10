import { useRef, useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Crypto from "expo-crypto";
import { File } from "expo-file-system";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getDb } from "@/src/lib/db";
import { color } from "@/src/lib/theme";

/**
 * Integridade da prova: captura só pela câmera do app (sem galeria, para a
 * foto não vir de outro lugar), hash calculado no aparelho no momento da
 * captura e geotag junto.
 *
 * O hash é dos BYTES do arquivo — os mesmos que sobem para o storage. Hashear
 * a representação base64 daria um valor que não confere com o objeto
 * armazenado, e um hash que ninguém consegue reproduzir não prova nada.
 */
export default function CapturaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);

  const [permissao, pedirPermissao] = useCameraPermissions();
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ultima, setUltima] = useState<{ hash: string; comGeotag: boolean } | null>(null);

  async function capturar() {
    if (!cameraRef.current || !id) return;
    setProcessando(true);
    setErro(null);
    try {
      const foto = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!foto?.uri) throw new Error("A câmera não devolveu a imagem.");

      const bytes = await new File(foto.uri).bytes();
      const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes);
      const hash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // O geotag é desejável, não bloqueante: dentro de subsolo ou galpão o
      // GPS falha, e perder a foto por isso seria pior. A ausência fica
      // registrada como ausência.
      let coords: Location.LocationObjectCoords | null = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          coords = (await Location.getCurrentPositionAsync({})).coords;
        }
      } catch {
        coords = null;
      }

      const evidenciaId = Crypto.randomUUID();
      const db = await getDb();
      await db.runAsync(
        `INSERT INTO evidencias
           (id, fiscalizacao_id, requisito_id, uri, hash_sha256, latitude, longitude, capturado_em, storage_path, sincronizado)
         VALUES (?, ?, NULL, ?, ?, ?, ?, ?, NULL, 0)`,
        evidenciaId,
        String(id),
        foto.uri,
        hash,
        coords?.latitude ?? null,
        coords?.longitude ?? null,
        new Date().toISOString(),
      );

      setUltima({ hash, comGeotag: !!coords });
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setProcessando(false);
    }
  }

  if (!permissao) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={color.verde} />
      </SafeAreaView>
    );
  }

  if (!permissao.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.aviso}>
          <Text style={styles.avisoTitulo}>Câmera bloqueada</Text>
          <Text style={styles.avisoTexto}>
            A evidência precisa ser tirada aqui dentro para valer como prova — não é possível
            anexar da galeria.
          </Text>
          <Pressable style={styles.botao} onPress={pedirPermissao}>
            <Text style={styles.botaoTexto}>Permitir câmera</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />

      <View style={styles.painel}>
        {ultima ? (
          <View style={styles.registro}>
            <Text style={styles.registroTitulo}>Evidência registrada no aparelho</Text>
            <Text style={styles.hash}>sha256 {ultima.hash.slice(0, 24)}…</Text>
            <Text style={ultima.comGeotag ? styles.geo : styles.semGeo}>
              {ultima.comGeotag ? "com geotag" : "sem geotag — GPS indisponível no local"}
            </Text>
          </View>
        ) : (
          <Text style={styles.instrucao}>
            Enquadre o ponto a documentar. A foto é gravada com hash e localização.
          </Text>
        )}

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <Pressable
          style={[styles.disparo, processando && styles.botaoDesabilitado]}
          onPress={capturar}
          disabled={processando}
          testID="disparar"
        >
          {processando ? (
            <ActivityIndicator color={color.papel} />
          ) : (
            <Text style={styles.botaoTexto}>Capturar</Text>
          )}
        </Pressable>

        <Pressable style={styles.voltar} onPress={() => router.back()}>
          <Text style={styles.voltarTexto}>Concluir captura</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.ardosia, justifyContent: "center" },
  camera: { flex: 1 },
  painel: { padding: 16, backgroundColor: color.ardosia, gap: 10 },
  instrucao: { color: color.linha, fontSize: 12.5, textAlign: "center", lineHeight: 18 },
  registro: { alignItems: "center", gap: 2 },
  registroTitulo: { color: color.papel, fontSize: 13, fontWeight: "700" },
  hash: { color: color.linha, fontSize: 11, fontVariant: ["tabular-nums"] },
  geo: { color: color.verde, fontSize: 11 },
  semGeo: { color: color.ambar, fontSize: 11 },
  erro: { color: color.ambar, fontSize: 12, textAlign: "center" },
  disparo: {
    backgroundColor: color.verde,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  botaoDesabilitado: { opacity: 0.5 },
  botao: {
    backgroundColor: color.verde,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 16,
  },
  botaoTexto: { color: color.papel, fontWeight: "700", fontSize: 14.5 },
  voltar: { paddingVertical: 10, alignItems: "center" },
  voltarTexto: { color: color.linha, fontSize: 13, fontWeight: "600" },
  aviso: { padding: 24, alignItems: "center" },
  avisoTitulo: { color: color.papel, fontSize: 17, fontWeight: "700", marginBottom: 8 },
  avisoTexto: { color: color.linha, fontSize: 13, textAlign: "center", lineHeight: 19 },
});
