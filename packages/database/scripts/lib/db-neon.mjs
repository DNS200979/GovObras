// Adaptador mínimo "estilo supabase-js" sobre o Postgres do Neon, só para os
// scripts de seed. Conecta como dono do banco (ignora RLS, como o service_role
// fazia) e entende apenas o que os seeds usam:
//
//   db.from(t).select(cols, {count, head}).eq(c, v).limit(n).single()/.maybeSingle()
//   db.from(t).insert(linhaOuLinhas).select(cols).single()
//   db.from(t).delete().eq(c, v)
//   db.auth.admin.createUser / listUsers
//
// Colunas são identificadores simples (sem embeds). Variáveis de ambiente:
//   DATABASE_URL         conexão direta (sem -pooler) do Neon
//   NEON_AUTH_BASE_URL   URL do Neon Auth do branch (só para criar usuários)

import pg from "pg";

const IDENT = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const COLS = /^(\*|[a-zA-Z_][a-zA-Z0-9_]*(\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)*)$/;

function ident(nome) {
  if (!IDENT.test(nome)) throw new Error(`Identificador inválido: ${nome}`);
  return `"${nome}"`;
}

/** Arrays de objetos e objetos viram JSON (jsonb); o resto vai como está. */
function valor(v) {
  if (v === undefined) return null;
  if (v !== null && typeof v === "object" && !(v instanceof Date)) {
    const jsonb = !Array.isArray(v) || v.some((x) => x !== null && typeof x === "object");
    if (jsonb) return JSON.stringify(v);
  }
  return v;
}

class Consulta {
  constructor(cliente, tabela) {
    this.c = cliente;
    this.tabela = tabela;
    this.op = "select";
    this.cols = "*";
    this.filtros = [];
    this.linhas = [];
    this.retorna = null;
    this.limite = null;
    this.modo = "lista"; // lista | single | maybe
    this.contar = false;
    this.semCorpo = false;
  }
  select(cols = "*", opts = {}) {
    if (!COLS.test(cols.trim())) throw new Error(`select() não suportado no adaptador: ${cols}`);
    if (this.op === "insert") this.retorna = cols.trim();
    else {
      this.cols = cols.trim();
      this.contar = opts.count === "exact";
      this.semCorpo = !!opts.head;
    }
    return this;
  }
  insert(linhas) {
    this.op = "insert";
    this.linhas = Array.isArray(linhas) ? linhas : [linhas];
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }
  eq(col, v) {
    this.filtros.push([col, v]);
    return this;
  }
  limit(n) {
    this.limite = n;
    return this;
  }
  single() {
    this.modo = "single";
    return this;
  }
  maybeSingle() {
    this.modo = "maybe";
    return this;
  }

  async executar() {
    const t = ident(this.tabela);
    const params = [];
    const where = this.filtros.length
      ? " where " + this.filtros.map(([c, v]) => (params.push(valor(v)), `${ident(c)} = $${params.length}`)).join(" and ")
      : "";
    let sql;
    if (this.op === "insert") {
      if (!this.linhas.length) return { data: [], error: null };
      const cols = Object.keys(this.linhas[0]);
      const marcas = this.linhas.map(
        (l) => "(" + cols.map((c) => (params.push(valor(l[c])), `$${params.length}`)).join(", ") + ")",
      );
      const ret = this.retorna ? ` returning ${this.retorna === "*" ? "*" : this.retorna.split(",").map((c) => ident(c.trim())).join(", ")}` : "";
      sql = `insert into ${t} (${cols.map(ident).join(", ")}) values ${marcas.join(", ")}${ret}`;
    } else if (this.op === "delete") {
      sql = `delete from ${t}${where}`;
    } else {
      const lista = this.cols === "*" ? "*" : this.cols.split(",").map((c) => ident(c.trim())).join(", ");
      sql = `select ${lista} from ${t}${where}${this.limite ? ` limit ${Number(this.limite)}` : ""}`;
    }
    try {
      const r = await this.c.query(sql, params);
      const rows = r.rows;
      if (this.op === "select" && this.semCorpo) return { data: null, count: rows.length, error: null };
      if (this.modo === "single") {
        if (rows.length !== 1) return { data: null, error: { message: `esperava 1 linha, veio ${rows.length}` } };
        return { data: rows[0], error: null };
      }
      if (this.modo === "maybe") return { data: rows[0] ?? null, error: null };
      return { data: this.op === "select" || this.retorna ? rows : null, count: this.contar ? rows.length : undefined, error: null };
    } catch (e) {
      return { data: null, error: { message: e.message, code: e.code } };
    }
  }
  then(ok, falha) {
    return this.executar().then(ok, falha);
  }
}

export async function criarDb() {
  const url = process.env.DATABASE_URL;
  const authUrl = process.env.NEON_AUTH_BASE_URL;
  if (!url) throw new Error("Defina DATABASE_URL (conexão direta do Neon).");
  const cliente = new pg.Client({ connectionString: url });
  await cliente.connect();

  const usuarios = async () => (await cliente.query('select id, email from neon_auth."user"')).rows;

  return {
    from: (tabela) => new Consulta(cliente, tabela),
    fim: () => cliente.end(),
    auth: {
      admin: {
        async listUsers() {
          return { data: { users: await usuarios() }, error: null };
        },
        async createUser({ email, password, user_metadata }) {
          if (!authUrl) return { data: null, error: { message: "Defina NEON_AUTH_BASE_URL." } };
          const res = await fetch(`${authUrl}/sign-up/email`, {
            method: "POST",
            headers: { "content-type": "application/json", origin: new URL(authUrl).origin },
            body: JSON.stringify({ email, password, name: user_metadata?.nome ?? email }),
          });
          if (!res.ok) return { data: null, error: { message: `sign-up ${res.status}: ${await res.text()}` } };
          const user = (await usuarios()).find((u) => u.email === email);
          return user ? { data: { user }, error: null } : { data: null, error: { message: "usuário não apareceu em neon_auth.user" } };
        },
        async updateUserById() {
          return { error: { message: "Trocar senha não é suportado aqui: apague o usuário no console do Neon Auth e rode de novo." } };
        },
      },
    },
  };
}
