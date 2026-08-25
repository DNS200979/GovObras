import { describe, expect, it } from "vitest";
import {
  PONTOS_POSSIVEIS,
  QUESTOES,
  calcularDiagnostico,
  classificacao,
  faixaDaProntidao,
  pontosDaResposta,
  type Resposta,
} from "./financiamento";

/** Responde todas as 20 questões com o mesmo valor. */
function todas(r: Resposta): Map<number, Resposta> {
  return new Map(QUESTOES.map((q) => [q.id, r]));
}

describe("matriz de questões", () => {
  it("tem as 20 questões da planilha, somando 99 pontos", () => {
    expect(QUESTOES).toHaveLength(20);
    expect(PONTOS_POSSIVEIS).toBe(99);
  });

  it("não repete id de questão", () => {
    expect(new Set(QUESTOES.map((q) => q.id)).size).toBe(QUESTOES.length);
  });
});

describe("pontosDaResposta", () => {
  it("vale o peso cheio em 'sim' e zero em 'nao'", () => {
    expect(pontosDaResposta(6, "sim")).toBe(6);
    expect(pontosDaResposta(6, "nao")).toBe(0);
  });

  it("vale metade do peso em 'parcial', conforme a planilha", () => {
    expect(pontosDaResposta(6, "parcial")).toBe(3);
    expect(pontosDaResposta(5, "parcial")).toBe(2.5);
  });
});

describe("calcularDiagnostico", () => {
  it("chega a 100% com todas em 'sim', sem lacuna", () => {
    const r = calcularDiagnostico(todas("sim"));

    expect(r.pontosObtidos).toBe(99);
    expect(r.prontidaoPct).toBe(100);
    expect(r.lacunas).toEqual([]);
    expect(r.classificacao).toBe("Pronto para negociar");
  });

  it("chega a 50% com todas em 'parcial', e todas contam como lacuna", () => {
    const r = calcularDiagnostico(todas("parcial"));

    expect(r.pontosObtidos).toBe(49.5);
    expect(r.prontidaoPct).toBe(50);
    expect(r.lacunas).toHaveLength(20);
  });

  it("questão não respondida pesa como lacuna, não infla a prontidão", () => {
    // Só a questão 1 (peso 5) respondida: 5/99, não 5/5.
    const r = calcularDiagnostico(new Map([[1, "sim"]]));

    expect(r.respondidas).toBe(1);
    expect(r.pontosObtidos).toBe(5);
    expect(r.prontidaoPct).toBe(5);
  });

  it("ordena as lacunas pelo maior peso — onde a pontuação mais cresce", () => {
    const r = calcularDiagnostico(todas("nao"));
    const pesos = r.lacunas.map((q) => q.peso);

    expect(pesos).toEqual([...pesos].sort((a, b) => b - a));
    expect(pesos[0]).toBe(7); // questão 2, o plano climático
  });

  it("zera sem respostas, sem dividir por zero", () => {
    const r = calcularDiagnostico(new Map());

    expect(r.prontidaoPct).toBe(0);
    expect(r.respondidas).toBe(0);
    expect(r.classificacao).toBe("Estágio inicial");
  });
});

describe("faixas de prontidão", () => {
  it("cobre 0 a 100 sem buraco entre as faixas", () => {
    for (let pct = 0; pct <= 100; pct++) {
      expect(faixaDaProntidao(pct), `sem faixa para ${pct}%`).toBeDefined();
    }
  });

  it.each([
    [0, "Preparar base institucional", "Estágio inicial"],
    [39, "Preparar base institucional", "Estágio inicial"],
    [40, "Pré-viabilidade e documentos", "Em estruturação"],
    [59, "Pré-viabilidade e documentos", "Em estruturação"],
    [60, "Estruturar proposta e parceiro", "Avançado"],
    [79, "Estruturar proposta e parceiro", "Avançado"],
    [80, "Negociar financiamento", "Pronto para negociar"],
    [100, "Negociar financiamento", "Pronto para negociar"],
  ])("em %i%% cai em %s", (pct, prioridade, classe) => {
    expect(faixaDaProntidao(pct).prioridade).toBe(prioridade);
    expect(classificacao(pct)).toBe(classe);
  });
});
