import { describe, expect, it } from "vitest";
import { converterComposicao, type ComposicaoDeclarada } from "./materializacao";

/** Base válida — cada teste muda só o que está sob prova. */
function insumo(over: Partial<ComposicaoDeclarada> = {}): ComposicaoDeclarada {
  return {
    insumo: "cimento CP II",
    quantidade: 10,
    unidade: "t",
    fator_id: "fat-1",
    fatores_emissao: { valor: 0.6, unidade: "tCO2e/t" },
    ...over,
  };
}

describe("converterComposicao", () => {
  it("multiplica quantidade pelo fator quando a unidade bate", () => {
    const { linhas, ignoradas } = converterComposicao([insumo()]);

    expect(ignoradas).toEqual([]);
    expect(linhas).toHaveLength(1);
    expect(linhas[0].tco2e).toBeCloseTo(6, 10);
    expect(linhas[0].fator_id).toBe("fat-1");
  });

  it("converte fator em kgCO2e para tCO2e, que é a unidade do ledger", () => {
    const { linhas } = converterComposicao([
      insumo({ fatores_emissao: { valor: 600, unidade: "kgCO2e/t" } }),
    ]);

    // 10 t × 600 kgCO2e/t = 6.000 kg = 6 t
    expect(linhas[0].tco2e).toBeCloseTo(6, 10);
  });

  it("ignora insumo sem fator vinculado, dizendo o motivo", () => {
    const { linhas, ignoradas } = converterComposicao([
      insumo({ insumo: "areia", fator_id: null, fatores_emissao: null }),
    ]);

    expect(linhas).toEqual([]);
    expect(ignoradas).toEqual(["areia (sem fator vinculado)"]);
  });

  it("recusa quando a unidade declarada não bate com a esperada pelo fator", () => {
    const { linhas, ignoradas } = converterComposicao([
      insumo({ insumo: "brita", unidade: "kg", fatores_emissao: { valor: 0.006, unidade: "tCO2e/t" } }),
    ]);

    // É a trava central: sem ela, 10 kg viraria 10 t no inventário.
    expect(linhas).toEqual([]);
    expect(ignoradas).toEqual(['brita (unidade "kg" não bate com a esperada "t")']);
  });

  it("recusa fator cuja unidade não é uma razão saída/entrada", () => {
    const { linhas, ignoradas } = converterComposicao([
      insumo({ insumo: "aditivo", fatores_emissao: { valor: 1, unidade: "tCO2e" } }),
    ]);

    expect(linhas).toEqual([]);
    expect(ignoradas).toEqual(["aditivo (fator com unidade não reconhecida: tCO2e)"]);
  });

  it("processa os válidos e reporta os inválidos na mesma entrega", () => {
    const { linhas, ignoradas } = converterComposicao([
      insumo({ insumo: "cimento", quantidade: 5 }),
      insumo({ insumo: "areia", fator_id: null, fatores_emissao: null }),
      insumo({ insumo: "brita", quantidade: 2, fatores_emissao: { valor: 0.006, unidade: "tCO2e/t" } }),
    ]);

    expect(linhas.map((l) => l.insumo)).toEqual(["cimento", "brita"]);
    expect(ignoradas).toHaveLength(1);
  });

  it("devolve vazio para composição vazia, sem estourar", () => {
    expect(converterComposicao([])).toEqual({ linhas: [], ignoradas: [] });
  });

  it("aceita quantidade que vem como string do banco (numeric do Postgres)", () => {
    const { linhas } = converterComposicao([
      insumo({ quantidade: "10" as unknown as number }),
    ]);

    expect(linhas[0].quantidade).toBe(10);
    expect(linhas[0].tco2e).toBeCloseTo(6, 10);
  });
});
