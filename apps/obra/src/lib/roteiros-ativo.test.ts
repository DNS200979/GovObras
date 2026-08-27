import { describe, expect, it } from "vitest";
import {
  CODIGOS_COM_ROTEIRO,
  roteiroDoRequisito,
  temRoteiro,
  type RoteiroAtivo,
} from "./roteiros-ativo";

const todos: RoteiroAtivo[] = CODIGOS_COM_ROTEIRO.map((c) => roteiroDoRequisito(c)!);

describe("resolução por código de requisito", () => {
  it("acha o roteiro do RCC, que é o ativo de resíduo", () => {
    const r = roteiroDoRequisito("RCC");
    expect(r?.titulo).toContain("Agregado reciclado");
  });

  it("devolve nulo para requisito sem roteiro escrito, em vez de estourar", () => {
    // ARB existe no catálogo de requisitos, mas ainda não tem passo a passo.
    expect(roteiroDoRequisito("ARB")).toBeNull();
    expect(temRoteiro("ARB")).toBe(false);
  });

  it("tolera código ausente — projeto ESG pode não ter requisito vinculado", () => {
    expect(roteiroDoRequisito(null)).toBeNull();
    expect(roteiroDoRequisito(undefined)).toBeNull();
    expect(roteiroDoRequisito("")).toBeNull();
  });

  it("não repete código entre roteiros", () => {
    expect(new Set(CODIGOS_COM_ROTEIRO).size).toBe(CODIGOS_COM_ROTEIRO.length);
  });
});

describe("integridade de cada roteiro", () => {
  it.each(todos.map((r) => [r.codigo, r] as const))("%s tem passos e benefícios", (_c, r) => {
    expect(r.passos.length).toBeGreaterThan(0);
    expect(r.beneficios.length).toBeGreaterThan(0);
    expect(r.baseLegal.length).toBeGreaterThan(0);
  });

  it.each(todos.map((r) => [r.codigo, r] as const))(
    "%s: todo passo diz quando acontece e que documento gera",
    (_c, r) => {
      for (const p of r.passos) {
        expect(p.quando.trim(), `passo "${p.titulo}" sem momento`).not.toBe("");
        expect(p.documento.trim(), `passo "${p.titulo}" sem documento`).not.toBe("");
      }
    },
  );

  it.each(todos.map((r) => [r.codigo, r] as const))(
    "%s tem ao menos um benefício que independe de programa municipal",
    (_c, r) => {
      // É o argumento que sustenta a venda onde a prefeitura ainda não
      // instituiu a régua — sem ele o ativo só interessa a quem já tem programa.
      expect(r.beneficios.some((b) => b.natureza === "imediato")).toBe(true);
    },
  );

  it.each(todos.map((r) => [r.codigo, r] as const))(
    "%s classifica todo benefício como imediato ou municipal",
    (_c, r) => {
      for (const b of r.beneficios) {
        expect(["imediato", "municipal"]).toContain(b.natureza);
      }
    },
  );
});

describe("roteiro do RCC — a ordem é o conteúdo", () => {
  const rcc = roteiroDoRequisito("RCC")!;

  it("cobre a cadeia documental que o catálogo exige: MTR, CDF e NF-e", () => {
    const docs = rcc.passos.map((p) => p.documento).join(" ");
    expect(docs).toContain("MTR");
    expect(docs).toContain("CDF");
    expect(docs).toContain("NF-e");
  });

  it("exige a licença do receptor antes da primeira remoção, não depois", () => {
    const iLicenca = rcc.passos.findIndex((p) => p.documento.includes("Licença de operação"));
    const iMtr = rcc.passos.findIndex((p) => p.documento.includes("MTR"));
    expect(iLicenca).toBeGreaterThanOrEqual(0);
    expect(iLicenca).toBeLessThan(iMtr);
  });

  it("pede o CDF depois do MTR — o certificado fecha o manifesto", () => {
    const iMtr = rcc.passos.findIndex((p) => p.documento.includes("MTR"));
    const iCdf = rcc.passos.findIndex((p) => p.documento.includes("CDF"));
    expect(iMtr).toBeLessThan(iCdf);
  });

  it("fecha com o balanço de massa, que é o teste de verificação do catálogo", () => {
    expect(rcc.passos.at(-1)?.titulo).toContain("balanço de massa");
  });

  it("cita CONAMA 307 e a PNRS como base", () => {
    const normas = rcc.baseLegal.map((l) => l.norma).join(" ");
    expect(normas).toContain("CONAMA 307");
    expect(normas).toContain("12.305");
  });

  it("todo passo do RCC declara o que reprova", () => {
    // No RCC o erro de ordem é o que mais reprova, então nenhum passo fica sem aviso.
    for (const p of rcc.passos) {
      expect(p.reprovaSe, `passo "${p.titulo}" sem "reprova se"`).toBeTruthy();
    }
  });
});
