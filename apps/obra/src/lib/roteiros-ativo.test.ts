import { describe, expect, it } from "vitest";
import {
  CODIGOS_COM_ROTEIRO,
  roteiroDoRequisito,
  temRoteiro,
  type RoteiroAtivo,
  camadaEstadualDe,
  UFS_COM_CAMADA_ESTADUAL,
} from "./roteiros-ativo";

const todos: RoteiroAtivo[] = CODIGOS_COM_ROTEIRO.map((c) => roteiroDoRequisito(c)!);

describe("resolução por código de requisito", () => {
  it("acha o roteiro do RCC, que é o ativo de resíduo", () => {
    const r = roteiroDoRequisito("RCC");
    expect(r?.titulo).toContain("Agregado reciclado");
  });

  it("devolve nulo para requisito sem roteiro escrito, em vez de estourar", () => {
    // MAD e CRV existem no catálogo de requisitos, mas ainda não têm passo a
    // passo — o procedimento de cadeia de custódia e o de aposentadoria em
    // registro precisam ser pesquisados antes de virar afirmação.
    expect(roteiroDoRequisito("MAD")).toBeNull();
    expect(temRoteiro("MAD")).toBe(false);
    expect(roteiroDoRequisito("CRV")).toBeNull();
  });

  it("cobre os quatro ativos escritos até aqui", () => {
    expect(CODIGOS_COM_ROTEIRO.sort()).toEqual(["ARB", "ENE", "RCC", "SUB"]);
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

  it("todo passo do RCC declara o que reprova", () => {
    // No RCC o erro de ordem é o que mais reprova, então nenhum passo fica sem aviso.
    for (const p of rcc.passos) {
      expect(p.reprovaSe, `passo "${p.titulo}" sem "reprova se"`).toBeTruthy();
    }
  });
});

describe("roteiro do ARB — o ativo que não fecha no ano da obra", () => {
  const arb = roteiroDoRequisito("ARB")!;

  it("exige a autorização de supressão antes de qualquer plantio", () => {
    // Compensar corte não autorizado regulariza infração, não gera crédito.
    expect(arb.passos[0].documento).toContain("Autorização de supressão");
  });

  it("pede registro individual de muda, não por lote", () => {
    const plantio = arb.passos.find((p) => p.titulo.includes("cada muda"));
    expect(plantio?.documento).toContain("coordenada");
    expect(plantio?.reprovaSe).toContain("lote");
  });

  it("cobre os três checkpoints de 12, 24 e 36 meses", () => {
    const cp = arb.passos.find((p) => p.quando.includes("12"));
    expect(cp?.quando).toContain("24");
    expect(cp?.quando).toContain("36");
  });

  it("avisa que morte reverte lançamento já feito, não só a parcela pendente", () => {
    // É a característica que distingue o ARB de todo o resto do catálogo.
    expect(arb.comoEntraNoCalculo).toContain("reverte");
    expect(arb.passos.at(-1)?.reprovaSe).toContain("reverte");
  });
});

describe("roteiro do ENE — dupla contagem é o que reprova", () => {
  const ene = roteiroDoRequisito("ENE")!;

  it("manda escolher a rota antes de reivindicar qualquer MWh", () => {
    expect(ene.passos[0].titulo).toContain("rota");
    expect(ene.passos[0].reprovaSe).toContain("dupla contagem");
  });

  it("distingue potência instalada de energia efetivamente compensada", () => {
    const geracao = ene.passos.find((p) => p.documento.includes("Fatura"));
    expect(geracao?.reprovaSe).toContain("Potência instalada");
  });

  it("exige resgate do certificado em nome do CNPJ da obra", () => {
    const cert = ene.passos.find((p) => p.titulo.includes("Resgate"));
    expect(cert?.documento).toContain("número de série");
    expect(cert?.reprovaSe).toContain("outra pessoa jurídica");
  });

  it("amarra o ativo ao fator da rede no período, não a um fator fixo", () => {
    expect(ene.comoEntraNoCalculo).toContain("fator de emissão da rede");
    expect(ene.comoEntraNoCalculo).toContain("período");
  });
});

describe("camada estadual", () => {
  const rcc = roteiroDoRequisito("RCC")!;

  it("cobre RS e SC, os dois estados onde o produto opera", () => {
    expect([...UFS_COM_CAMADA_ESTADUAL].sort()).toEqual(["RS", "SC"]);
  });

  it("devolve a camada da UF da obra", () => {
    expect(camadaEstadualDe(rcc, "RS")?.orgao).toContain("FEPAM");
    expect(camadaEstadualDe(rcc, "SC")?.orgao).toContain("IMA");
  });

  it("nomeia o sistema de MTR de cada estado — é o dado que faltava no roteiro", () => {
    expect(camadaEstadualDe(rcc, "RS")?.sistemaMtr).toContain("MTR Online");
    expect(camadaEstadualDe(rcc, "SC")?.sistemaMtr).toContain("IMA");
  });

  it("distingue UF sem camada de requisito sem camada — as duas devolvem null", () => {
    // "não pesquisamos ainda" e "não se aplica" precisam ser o mesmo estado
    // vazio para a tela, que então diz explicitamente qual é o caso.
    expect(camadaEstadualDe(rcc, "SP")).toBeNull();
    expect(camadaEstadualDe(rcc, null)).toBeNull();
    expect(camadaEstadualDe(null, "RS")).toBeNull();
  });

  it("SUB, ARB e ENE ainda não têm camada estadual levantada", () => {
    for (const r of todos.filter((x) => x.codigo !== "RCC")) {
      expect(r.camadaEstadual, `${r.codigo} ganhou camada sem teste`).toBeUndefined();
    }
  });

  it("cada camada diz órgão, sistema, norma e o que invalida o documento", () => {
    for (const c of rcc.camadaEstadual ?? []) {
      expect(c.orgao.trim()).not.toBe("");
      expect(c.sistemaMtr.trim()).not.toBe("");
      expect(c.norma).toMatch(/\d{4}/);
      expect(c.competenciaLicenciamento.length).toBeGreaterThan(80);
      expect(c.atencao.length, `${c.uf} sem ponto de atenção`).toBeGreaterThan(0);
    }
  });

  it("SC avisa que CDF de intermediário é inválido — o erro mais comum lá", () => {
    const sc = camadaEstadualDe(rcc, "SC")!;
    const texto = sc.atencao.join(" ");
    expect(texto).toContain("intermediário");
    expect(texto).toContain("CDF");
  });
});
