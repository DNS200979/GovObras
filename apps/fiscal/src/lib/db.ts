import * as SQLite from "expo-sqlite";

/**
 * Base local offline-first (seção 08 do plano): canteiro tem sinal ruim,
 * então toda escrita acontece aqui primeiro e entra na fila de
 * sincronização — nunca depende de rede para funcionar.
 */
export async function getDb() {
  const db = await SQLite.openDatabaseAsync("carbonfree_fiscal.db");
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS evidencias (
      id TEXT PRIMARY KEY NOT NULL,
      fiscalizacao_id TEXT NOT NULL,
      uri TEXT NOT NULL,
      hash_sha256 TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      capturado_em TEXT NOT NULL,
      sincronizado INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS checklist_respostas (
      id TEXT PRIMARY KEY NOT NULL,
      fiscalizacao_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      conforme INTEGER,
      observacao TEXT,
      respondido_em TEXT NOT NULL,
      sincronizado INTEGER NOT NULL DEFAULT 0
    );
  `);
  return db;
}

export interface FilaItem {
  tabela: "evidencias" | "checklist_respostas";
  id: string;
  resumo: string;
  capturadoEm: string;
}

/** Itens ainda não confirmados pelo servidor — o que a tela de sincronização mostra. */
export async function listarFilaPendente(): Promise<FilaItem[]> {
  const db = await getDb();
  const evidencias = await db.getAllAsync<{ id: string; capturado_em: string; hash_sha256: string }>(
    "SELECT id, capturado_em, hash_sha256 FROM evidencias WHERE sincronizado = 0 ORDER BY capturado_em DESC",
  );
  const respostas = await db.getAllAsync<{ id: string; item_id: string; respondido_em: string }>(
    "SELECT id, item_id, respondido_em FROM checklist_respostas WHERE sincronizado = 0 ORDER BY respondido_em DESC",
  );

  return [
    ...evidencias.map((e) => ({
      tabela: "evidencias" as const,
      id: e.id,
      resumo: `Evidência · hash ${e.hash_sha256.slice(0, 10)}…`,
      capturadoEm: e.capturado_em,
    })),
    ...respostas.map((r) => ({
      tabela: "checklist_respostas" as const,
      id: r.id,
      resumo: `Checklist · item ${r.item_id}`,
      capturadoEm: r.respondido_em,
    })),
  ];
}

/** Marca tudo como sincronizado — em produção isso roda após confirmação do servidor. */
export async function sincronizarTudo() {
  const db = await getDb();
  await db.execAsync(`
    UPDATE evidencias SET sincronizado = 1 WHERE sincronizado = 0;
    UPDATE checklist_respostas SET sincronizado = 1 WHERE sincronizado = 0;
  `);
}
