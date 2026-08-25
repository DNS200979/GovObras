/**
 * Conversão da composição declarada pela concreteira em linhas de lançamento
 * de carbono.
 *
 * Vive separado da Server Action que a usa (`app/concreteiras/actions.ts`)
 * porque é o ponto onde um erro passa despercebido: o número sai plausível,
 * entra no inventário e ninguém confere. Isolado assim, é testável sem banco.
 */

export interface ComposicaoDeclarada {
  insumo: string;
  quantidade: number;
  unidade: string;
  fator_id: string | null;
  fatores_emissao: { valor: number; unidade: string } | null;
}

export interface LinhaLancamento {
  insumo: string;
  quantidade: number;
  unidade: string;
  fator_id: string;
  tco2e: number;
}

export interface ConversaoDaComposicao {
  /** O que vai virar lançamento. */
  linhas: LinhaLancamento[];
  /** O que ficou de fora, cada um com o motivo — nunca descartado em silêncio. */
  ignoradas: string[];
}

/**
 * Só entra no cálculo o insumo com fator vinculado E cuja unidade declarada
 * bate exatamente com a que o fator espera (ex.: fator em tCO2e/t exige
 * quantidade em "t") — sem isso o número sairia errado silenciosamente.
 *
 * O fator pode vir em tCO2e ou kgCO2e por unidade; o resultado é sempre
 * tCO2e, que é a unidade do ledger.
 */
export function converterComposicao(composicao: ComposicaoDeclarada[]): ConversaoDaComposicao {
  const linhas: LinhaLancamento[] = [];
  const ignoradas: string[] = [];

  for (const c of composicao ?? []) {
    if (!c.fator_id || !c.fatores_emissao) {
      ignoradas.push(`${c.insumo} (sem fator vinculado)`);
      continue;
    }

    const partes = c.fatores_emissao.unidade.split("/");
    if (partes.length !== 2) {
      ignoradas.push(`${c.insumo} (fator com unidade não reconhecida: ${c.fatores_emissao.unidade})`);
      continue;
    }

    const [saida, entrada] = partes;
    if (c.unidade !== entrada) {
      ignoradas.push(`${c.insumo} (unidade "${c.unidade}" não bate com a esperada "${entrada}")`);
      continue;
    }

    const bruto = Number(c.quantidade) * Number(c.fatores_emissao.valor);
    const tco2e = saida.startsWith("kgCO2e") ? bruto / 1000 : bruto;

    linhas.push({
      insumo: c.insumo,
      quantidade: Number(c.quantidade),
      unidade: c.unidade,
      fator_id: c.fator_id,
      tco2e,
    });
  }

  return { linhas, ignoradas };
}
