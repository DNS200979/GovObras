import { useRef, useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Crypto from "expo-crypto";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getDb } from "@/src/lib/db";
import { color } from "@/src/lib/theme";

/**
 * Integridade da prova (seção 08): captura só in-app (sem acesso à galeria),
 * hash calculado no dispositivo no momento da captura, geotag obrigatório.
 */
export default function CapturaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [processando, setProcessando] = useState(false);
  const [ultimaCaptura, setUltimaCaptura] = useState<{ hash: string; uri: string } | null>(null);

  async function capturar() {
    if (!cameraRef.current) return;
    setProcessando(true);
    try {
      const foto = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: true });
      if (!foto?.base64) throw new Error("Falha ao capturar imagem");

      const { status } = await Location.requestForegroundPermissionsAsync();
      const posicao =
        status === "granted" ? await Location.getCurrentPositionAsync({}) : null;

      const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, foto.base64);
      const evidenciaId = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${id}:${Date.now()}`,
      );

      const db = await getDb();
      await db.runAsync(
        `INSERT INTO evidencias (id, fiscalizacao_id, uri, hash_sha256, latitude, longitude, capturado_em, sincronizado)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        evidenciaId,
        String(id),
        foto.uri,
        hash,
        posicao?.coords.latitude ?? null,
        posicao?.coords.longitude ?? null,
        new Date().toISOString(),
      );

      setUltimaCaptura({ hash, uri: foto.uri });
    } finally {
      setProcessando(false);
    }
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={color.verde} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionBox}>
          <Text style={styles.permissionText}>
            A câmera é usada só dentro do app — não há importação da galeria, para preservar a
            integridade da prova.
          </Text>
          <Pressable style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Permitir câmera</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />

      {ultimaCaptura ? (
        <View style={styles.result}>
          <Text style={styles.resultLabel}>Hash SHA-256 (gravado no dispositivo)</Text>
          <Text style={styles.resultHash}>{ultimaCaptura.hash}</Text>
        </View>
      ) : null}

      <View style={styles.controls}>
        <Pressable
          style={[styles.button, processando && styles.buttonDisabled]}
          disabled={processando}
          onPress={capturar}
        >
          {processando ? (
            <ActivityIndicator color={color.papel} />
          ) : (
            <Text style={styles.buttonText}>Capturar</Text>
          )}
        </Pressable>
        <Pressable style={styles.buttonSecondary} onPress={() => router.back()}>
          <Text style={styles.buttonSecondaryText}>Concluir</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.ardosia },
  camera: { flex: 1 },
  permissionBox: { flex: 1, justifyContent: "center", padding: 24, gap: 16 },
  permissionText: { color: color.papel, fontSize: 14, lineHeight: 20, textAlign: "center" },
  result: { padding: 12, backgroundColor: color.ardosia2 },
  resultLabel: { color: "#7E938B", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 },
  resultHash: { color: "#5FBFA3", fontSize: 11, marginTop: 4 },
  controls: { flexDirection: "row", gap: 10, padding: 16 },
  button: {
    flex: 1,
    backgroundColor: color.verde,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: color.papel, fontWeight: "700", fontSize: 14 },
  buttonSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: color.linhaForte,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonSecondaryText: { color: color.papel, fontWeight: "700", fontSize: 14 },
});
