import * as SQLite from "expo-sqlite";

/**
 * Base local offline-first: canteiro tem sinal ruim, então toda leitura da
 * tela vem daqui e toda escrita acontece aqui primeiro. A rede só aparece em
 * dois momentos — baixar o pacote do dia e enviar o que ficou pendente.
 *
 * Duas famílias de tabela:
 *   - cache do que veio do servidor (fiscalizacoes, requisitos): descartável,
 *     regravado a cada pacote baixado;
 *   - trabalho do fiscal (respostas, evidências, status): a fonte da verdade
 *     até o servidor confirmar. Nada aqui é apagado por baixar pacote novo.
 */
export async function getDb() {
  const db = await SQLite.openDatabaseAsync("carbonfree_fiscal.db");
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS fiscalizacoes (
      id TEXT PRIMARY KEY NOT NULL,
      obra_nome TEXT NOT NULL,
      construtora TEXT,
      endereco TEXT,
      fase TEXT,
      agendado_para TEXT,
      status TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      baixado_em TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS requisitos (
      id TEXT PRIMARY KEY NOT NULL,
      natureza TEXT NOT NULL,
      codigo TEXT NOT NULL,
      requisito TEXT NOT NULL,
      unidade TEXT,
      evidencia_primaria TEXT,
      teste_verificacao TEXT,
      ordem INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS checklist_respostas (
      id TEXT PRIMARY KEY NOT NULL,
      fiscalizacao_id TEXT NOT NULL,
      requisito_id TEXT NOT NULL,
      conforme INTEGER,
      observacao TEXT,
      respondido_em TEXT NOT NULL,
      sincronizado INTEGER NOT NULL DEFAULT 0,
      UNIQUE (fiscalizacao_id, requisito_id)
    );

    CREATE TABLE IF NOT EXISTS evidencias (
      id TEXT PRIMARY KEY NOT NULL,
      fiscalizacao_id TEXT NOT NULL,
      requisito_id TEXT,
      uri TEXT NOT NULL,
      hash_sha256 TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      capturado_em TEXT NOT NULL,
      storage_path TEXT,
      sincronizado INTEGER NOT NULL DEFAULT 0
    );

    -- Status alterado em campo. Separado do cache porque sobrevive ao próximo
    -- pacote: se o fiscal concluiu offline, a conclusão vale mesmo que o
    -- servidor ainda diga "agendada".
    CREATE TABLE IF NOT EXISTS status_local (
      fiscalizacao_id TEXT PRIMARY KEY NOT NULL,
      status TEXT NOT NULL,
      alterado_em TEXT NOT NULL,
      sincronizado INTEGER NOT NULL DEFAULT 0
    );
  `);
  return db;
}

export interface FiscalizacaoLocal {
  id: string;
  obra_nome: string;
  construtora: string | null;
  endereco: string | null;
  fase: string | null;
  agendado_para: string | null;
  status: string;
  latitude: number | null;
  longitude: number | null;
}

export interface RequisitoLocal {
  id: string;
  natureza: string;
  codigo: string;
  requisito: string;
  unidade: string | null;
  evidencia_primaria: string | null;
  teste_verificacao: string | null;
  ordem: number;
}

/**
 * Agenda como o fiscal deve vê-la: o status local vence o do servidor, porque
 * ele reflete o que já foi feito em campo e ainda não subiu.
 */
export async function listarAgenda(): Promise<FiscalizacaoLocal[]> {
  const db = await getDb();
  return db.getAllAsync<FiscalizacaoLocal>(`
    SELECT f.id, f.obra_nome, f.construtora, f.endereco, f.fase, f.agendado_para,
           COALESCE(s.status, f.status) AS status, f.latitude, f.longitude
    FROM fiscalizacoes f
    LEFT JOIN status_local s ON s.fiscalizacao_id = f.id
    ORDER BY f.agendado_para
  `);
}

export async function obterFiscalizacao(id: string): Promise<FiscalizacaoLocal | null> {
  const db = await getDb();
  return db.getFirstAsync<FiscalizacaoLocal>(
    `SELECT f.id, f.obra_nome, f.construtora, f.endereco, f.fase, f.agendado_para,
            COALESCE(s.status, f.status) AS status, f.latitude, f.longitude
     FROM fiscalizacoes f
     LEFT JOIN status_local s ON s.fiscalizacao_id = f.id
     WHERE f.id = ?`,
    id,
  );
}

export async function listarRequisitos(): Promise<RequisitoLocal[]> {
  const db = await getDb();
  return db.getAllAsync<RequisitoLocal>(
    "SELECT * FROM requisitos ORDER BY natureza DESC, ordem, codigo",
  );
}

export async function definirStatus(fiscalizacaoId: string, status: string) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO status_local (fiscalizacao_id, status, alterado_em, sincronizado)
     VALUES (?, ?, ?, 0)
     ON CONFLICT(fiscalizacao_id) DO UPDATE
       SET status = excluded.status, alterado_em = excluded.alterado_em, sincronizado = 0`,
    fiscalizacaoId,
    status,
    new Date().toISOString(),
  );
}

export interface Pendencias {
  respostas: number;
  evidencias: number;
  status: number;
  total: number;
}

export async function contarPendencias(): Promise<Pendencias> {
  const db = await getDb();
  const um = async (sql: string) =>
    (await db.getFirstAsync<{ n: number }>(sql))?.n ?? 0;
  const respostas = await um("SELECT COUNT(*) n FROM checklist_respostas WHERE sincronizado = 0");
  const evidencias = await um("SELECT COUNT(*) n FROM evidencias WHERE sincronizado = 0");
  const status = await um("SELECT COUNT(*) n FROM status_local WHERE sincronizado = 0");
  return { respostas, evidencias, status, total: respostas + evidencias + status };
}
