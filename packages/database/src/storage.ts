import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Armazenamento de arquivos no Neon Object Storage (API S3). Mantém o formato de
// resposta do storage do supabase-js ({ data, error }) para as chamadas existentes.
// Roda só no servidor: as credenciais S3 valem para todos os buckets, então quem
// chama deve ter conferido a permissão (as linhas de metadados passam pelo RLS).

let s3: S3Client | null = null;

function cliente(): S3Client {
  if (s3) return s3;
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Configure AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY.");
  }
  s3 = new S3Client({
    endpoint,
    region: process.env.AWS_REGION ?? "us-east-1",
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
  return s3;
}

type Resultado<T> = { data: T; error: null } | { data: null; error: { message: string } };

function falha(e: unknown): { data: null; error: { message: string } } {
  return { data: null, error: { message: e instanceof Error ? e.message : String(e) } };
}

export const storage = {
  from(bucket: string) {
    return {
      async upload(
        caminho: string,
        arquivo: File | Blob | Buffer | Uint8Array,
        opcoes?: { contentType?: string; upsert?: boolean },
      ): Promise<Resultado<{ path: string }>> {
        try {
          const corpo =
            arquivo instanceof Uint8Array ? arquivo : new Uint8Array(await (arquivo as Blob).arrayBuffer());
          await cliente().send(
            new PutObjectCommand({ Bucket: bucket, Key: caminho, Body: corpo, ContentType: opcoes?.contentType }),
          );
          return { data: { path: caminho }, error: null };
        } catch (e) {
          return falha(e);
        }
      },

      async remove(caminhos: string[]): Promise<Resultado<string[]>> {
        try {
          if (caminhos.length === 0) return { data: [], error: null };
          await cliente().send(
            new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: caminhos.map((Key) => ({ Key })) } }),
          );
          return { data: caminhos, error: null };
        } catch (e) {
          return falha(e);
        }
      },

      async createSignedUrl(caminho: string, segundos: number): Promise<Resultado<{ signedUrl: string }>> {
        try {
          const signedUrl = await getSignedUrl(cliente(), new GetObjectCommand({ Bucket: bucket, Key: caminho }), {
            expiresIn: segundos,
          });
          return { data: { signedUrl }, error: null };
        } catch (e) {
          return falha(e);
        }
      },
    };
  },
};
