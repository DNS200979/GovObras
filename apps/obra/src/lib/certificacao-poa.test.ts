import { describe, expect, it } from "vitest";
import {
  DIMENSOES,
  NIVEIS,
  alertaDePrazo,
  avaliarDimensoes,
  exercicioDoBeneficio,
  nivelPorDimensoesAprovadas,
  prazoParaExercicio,
  proximoNivel,
  simularCertificacao,
  validadeCertificado,
  type PontosPorDimensao,
} from "./certificacao-poa";

describe("catálogo das dimensões", () => {
  it("tem as sete dimensões do Decreto 21.789/2022", () => {
    expect(DIMENSOES).toHaveLength(7);
  });

  it("aplica o mínimo de 5 pontos só a Resíduos e Materiais", () => {
    const cincos = DIMENSOES.filter((d) => d.minimo === 5).map((d) => d.codigo);
    expect(cincos.sort()).toEqual(["MAT", "RES"]);
    expect(DIMENSOES.filter((d) => d.minimo === 10)).toHaveLength(5);
  });

  it("não repete código de critério entre dimensões", () => {
    const codigos = DIMENSOES.flatMap((d) => d.criterios.map((c) => c.codigo));
    expect(new Set(codigos).size).toBe(codigos.length);
  });

  it("declara ao menos um documento de comprovação por critério", () => {
    for (const d of DIMENSOES) {
      for (const c of d.criterios) {
        expect(c.documentos.length, `${c.codigo} sem documento`).toBeGreaterThan(0);
      }
    }
  });

  it("não declara pontuação fixa junto com faixas — seriam duas fontes para o mesmo número", () => {
    for (const d of DIMENSOES) {
      for (const c of d.criterios) {
        if (c.faixas) expect(c.pontos, `${c.codigo}`).toBeNull();
      }
    }
  });
});

describe("nível por contagem de dimensões aprovadas", () => {
  it("exige 2 dimensões para Bronze e nada abaixo disso", () => {
    expect(nivelPorDimensoesAprovadas(0)).toBeNull();
    expect(nivelPorDimensoesAprovadas(1)).toBeNull();
    expect(nivelPorDimensoesAprovadas(2)?.nivel).toBe("bronze");
  });

  it("sobe um degrau por dimensão até Diamante", () => {
    expect(nivelPorDimensoesAprovadas(3)?.nivel).toBe("prata");
    expect(nivelPorDimensoesAprovadas(4)?.nivel).toBe("ouro");
    expect(nivelPorDimensoesAprovadas(5)?.nivel).toBe("diamante");
  });

  it("Diamante sai com 5 dimensões — aprovar as 7 não muda o selo", () => {
    expect(nivelPorDimensoesAprovadas(6)?.nivel).toBe("diamante");
    expect(nivelPorDimensoesAprovadas(7)?.nivel).toBe("diamante");
  });

  it("liga a prioridade de licenciamento a partir de Prata", () => {
    const porNivel = Object.fromEntries(NIVEIS.map((n) => [n.nivel, n.beneficios]));
    expect(porNivel.bronze.licenciamentoPrioritario).toBe(false);
    expect(porNivel.prata.licenciamentoPrioritario).toBe(true);
    expect(porNivel.ouro.licenciamentoPrioritario).toBe(true);
    expect(porNivel.diamante.licenciamentoPrioritario).toBe(true);
  });

  it("não concede acréscimo de altura ao Bronze", () => {
    const bronze = NIVEIS.find((n) => n.nivel === "bronze")!;
    expect(bronze.beneficios.acrescimoAlturaPct).toBe(0);
  });

  it("aponta o próximo degrau e quantas dimensões faltam", () => {
    expect(proximoNivel(0)).toEqual({
      nivel: expect.objectContaining({ nivel: "bronze" }),
      faltamDimensoes: 2,
    });
    expect(proximoNivel(4)?.nivel.nivel).toBe("diamante");
    expect(proximoNivel(4)?.faltamDimensoes).toBe(1);
    expect(proximoNivel(5)).toBeNull();
  });
});

describe("avaliação das dimensões", () => {
  it("trata dimensão sem pontuação informada como zero, não como ausente", () => {
    const avaliacao = avaliarDimensoes({});
    expect(avaliacao).toHaveLength(7);
    expect(avaliacao.every((d) => d.pontos === 0 && !d.aprovada)).toBe(true);
  });

  it("aprova exatamente no mínimo", () => {
    const [res] = avaliarDimensoes({ RES: 5 }).filter((d) => d.codigo === "RES");
    expect(res.aprovada).toBe(true);
    expect(res.faltam).toBe(0);
  });

  it("reprova um ponto abaixo do mínimo e diz quanto falta", () => {
    const [agu] = avaliarDimensoes({ AGU: 9 }).filter((d) => d.codigo === "AGU");
    expect(agu.aprovada).toBe(false);
    expect(agu.faltam).toBe(1);
  });
});

describe("simulação completa", () => {
  /** O exemplo do próprio material da prefeitura: 5 dimensões aprovadas → Diamante. */
  const exemploDaPrefeitura: PontosPorDimensao = {
    BIO: 12,
    CLI: 8,
    AGU: 14,
    ENE: 17,
    RES: 6,
    MAT: 4,
    MOB: 11,
  };

  it("reproduz o exemplo do material da prefeitura", () => {
    const r = simularCertificacao(exemploDaPrefeitura);
    expect(r.aprovadas).toBe(5);
    expect(r.nivel?.nivel).toBe("diamante");
    const reprovadas = r.dimensoes.filter((d) => !d.aprovada).map((d) => d.codigo);
    expect(reprovadas.sort()).toEqual(["CLI", "MAT"]);
  });

  it("calcula o teto de economia de IPTU e o ciclo de 3 anos", () => {
    const r = simularCertificacao(exemploDaPrefeitura, { iptuAnual: 300_000 });
    expect(r.economiaIptuAnualMaxima).toBe(30_000);
    expect(r.economiaCicloMaxima).toBe(90_000);
  });

  it("calcula a altura potencial com o acréscimo do nível", () => {
    const r = simularCertificacao(exemploDaPrefeitura, { alturaBasicaM: 60 });
    expect(r.alturaPotencialM).toBeCloseTo(72);
  });

  it("não estima benefício quando não há selo", () => {
    const r = simularCertificacao({ BIO: 12 }, { iptuAnual: 300_000, alturaBasicaM: 60 });
    expect(r.nivel).toBeNull();
    expect(r.economiaIptuAnualMaxima).toBeNull();
    expect(r.economiaCicloMaxima).toBeNull();
    expect(r.alturaPotencialM).toBeNull();
  });

  it("ordena as dimensões reprovadas pela que está mais perto de aprovar", () => {
    const r = simularCertificacao({ AGU: 9, MAT: 1, BIO: 4 });
    // Faltam: AGU 1, MAT 4, RES 5, BIO 6 e, sem ponto nenhum, CLI/ENE/MOB 10 —
    // os empates ficam na ordem do catálogo porque o sort de Array é estável.
    expect(r.maisProximasDeAprovar.map((d) => d.codigo)).toEqual([
      "AGU",
      "MAT",
      "RES",
      "BIO",
      "CLI",
      "ENE",
      "MOB",
    ]);
  });
});

describe("prazo do IPTU — Decreto 23.226/2025", () => {
  it("pedido entre janeiro e agosto vale no exercício seguinte", () => {
    expect(exercicioDoBeneficio(new Date(2027, 0, 1))).toBe(2028);
    expect(exercicioDoBeneficio(new Date(2027, 7, 31))).toBe(2028);
  });

  it("pedido de setembro em diante escorrega para o segundo exercício seguinte", () => {
    expect(exercicioDoBeneficio(new Date(2027, 8, 1))).toBe(2029);
    expect(exercicioDoBeneficio(new Date(2027, 11, 31))).toBe(2029);
  });

  it("um dia de atraso custa um exercício inteiro", () => {
    const noPrazo = exercicioDoBeneficio(new Date(2027, 7, 31));
    const umDiaDepois = exercicioDoBeneficio(new Date(2027, 8, 1));
    expect(umDiaDepois - noPrazo).toBe(1);
  });

  it("devolve 31/08 do ano anterior como prazo do exercício", () => {
    const prazo = prazoParaExercicio(2028);
    expect(prazo.getFullYear()).toBe(2027);
    expect(prazo.getMonth()).toBe(7);
    expect(prazo.getDate()).toBe(31);
  });

  it("alerta oferece antecipar enquanto a janela está aberta", () => {
    const a = alertaDePrazo(new Date(2027, 5, 10));
    expect(a.exercicioSePedirHoje).toBe(2028);
    expect(a.prazoParaGanharUmAno).not.toBeNull();
    expect(a.mensagem).toContain("IPTU 2028");
  });

  it("alerta avisa que a janela fechou depois de 31/08", () => {
    const a = alertaDePrazo(new Date(2027, 9, 10));
    expect(a.exercicioSePedirHoje).toBe(2029);
    expect(a.prazoParaGanharUmAno).toBeNull();
    expect(a.mensagem).toContain("fechou");
  });
});

describe("validade do certificado", () => {
  it("vence 3 anos depois da emissão", () => {
    expect(validadeCertificado(new Date(2026, 2, 15)).getFullYear()).toBe(2029);
  });
});
