/**
 * Roteiro de aceitação por requisito ativo.
 *
 * O catálogo em `requisitos_auditoria` diz O QUE a prefeitura audita, qual a
 * evidência primária e qual o teste de verificação. O que faltava era a ordem:
 * em que momento da obra cada documento precisa ser gerado, e o que reprova.
 * Um MTR emitido depois da remoção do resíduo não vale, e descobrir isso na
 * análise custa a obra inteira.
 *
 * Fica em código, e não no banco, pelo mesmo motivo da matriz de financiamento:
 * é metodologia versionada — muda por revisão do procedimento, não por operação
 * do usuário. A régua de incentivo, essa sim, vem do banco: é calibrada por
 * município.
 */

export interface PassoRoteiro {
  /** Momento da obra em que o passo precisa acontecer. */
  quando: string;
  titulo: string;
  oQueFazer: string;
  /** O documento que este passo produz — é ele que vira evidência anexável. */
  documento: string;
  /** O erro que mais reprova este passo na análise. */
  reprovaSe?: string;
}

export interface BaseLegal {
  norma: string;
  oQueExige: string;
}

export interface BeneficioAtivo {
  titulo: string;
  detalhe: string;
  /**
   * `municipal` depende de o município ter instituído a régua de incentivo por
   * lei. `imediato` vale em qualquer lugar, desde o primeiro mês.
   */
  natureza: "imediato" | "municipal";
}

export interface RoteiroAtivo {
  /** Código do requisito em `requisitos_auditoria`. */
  codigo: string;
  titulo: string;
  resumo: string;
  baseLegal: BaseLegal[];
  passos: PassoRoteiro[];
  /** Como a quantidade declarada vira tCO₂e no balanço da obra. */
  comoEntraNoCalculo: string;
  beneficios: BeneficioAtivo[];
}

const RCC: RoteiroAtivo = {
  codigo: "RCC",
  titulo: "Agregado reciclado e desvio de aterro",
  resumo:
    "É o ativo com o melhor ponto de partida: a segregação e a destinação rastreada de resíduo " +
    "já são obrigação legal de qualquer obra licenciada. Você provavelmente já faz quase tudo. " +
    "O que falta é gerar a prova na ordem certa e fechar o balanço de massa — sem isso, o que " +
    "já foi feito não vira ativo de carbono.",
  baseLegal: [
    {
      norma: "CONAMA 307/2002",
      oQueExige:
        "Classificação do resíduo em A, B, C e D e destinação diferenciada por classe. " +
        "O agregado reciclado sai da classe A (alvenaria, concreto, argamassa).",
    },
    {
      norma: "Lei 12.305/2010 — PNRS",
      oQueExige:
        "Responsabilidade do gerador até a destinação final adequada. A responsabilidade não " +
        "termina no portão da obra: se o receptor destinar errado, a obra responde junto.",
    },
    {
      norma: "PGRCC no licenciamento",
      oQueExige:
        "Plano de gerenciamento aprovado como condicionante do alvará, com estimativa de geração " +
        "por classe. É o documento contra o qual o balanço de massa vai ser conferido.",
    },
  ],
  passos: [
    {
      quando: "Antes de iniciar a obra",
      titulo: "Confirme o que o PGRCC aprovado projetou",
      oQueFazer:
        "Recupere a estimativa de geração por classe que foi aprovada no licenciamento. Ela é a " +
        "linha de base da análise: o volume declarado no fim precisa conversar com o que foi " +
        "projetado no início.",
      documento: "PGRCC aprovado, com o número do protocolo de licenciamento",
      reprovaSe:
        "A obra declara desvio de resíduo que o PGRCC nunca previu gerar, sem justificativa de " +
        "alteração de projeto.",
    },
    {
      quando: "Antes da primeira remoção",
      titulo: "Verifique a licença de operação do receptor",
      oQueFazer:
        "A usina de reciclagem precisa estar com licença de operação vigente na data de cada " +
        "remoção — não na data em que você contratou. Guarde a cópia com a data de validade " +
        "visível e reconfira quando vencer.",
      documento: "Licença de operação do receptor, vigente",
      reprovaSe:
        "A licença venceu no meio da obra. As remoções feitas depois do vencimento não contam, " +
        "mesmo com MTR emitido.",
    },
    {
      quando: "Durante a obra, em cada remoção",
      titulo: "Emita o MTR antes de o caminhão sair",
      oQueFazer:
        "O Manifesto de Transporte de Resíduos acompanha a carga. Emitir depois, para regularizar, " +
        "descaracteriza a rastreabilidade — que é justamente o que a análise verifica.",
      documento: "MTR por remoção, com classe, quantidade e receptor identificados",
      reprovaSe:
        "MTR emitido em lote no fim do mês, com data posterior à do transporte.",
    },
    {
      quando: "Após cada destinação",
      titulo: "Cobre o CDF do receptor",
      oQueFazer:
        "O Certificado de Destinação Final é o que fecha o ciclo do MTR e comprova que o resíduo " +
        "chegou onde disse que ia. Cobrar no fim da obra costuma ser tarde: receptor troca de " +
        "sistema, some documento, muda de responsável.",
      documento: "CDF correspondente a cada MTR",
      reprovaSe: "Existe MTR sem CDF correspondente — a carga saiu mas não se comprova onde chegou.",
    },
    {
      quando: "Na compra do agregado",
      titulo: "Compre o reciclado com nota que o identifique como tal",
      oQueFazer:
        "A NF-e precisa deixar claro que o material é agregado reciclado, não brita natural. " +
        "Descrição genérica obriga a análise a assumir o material convencional, e o ativo se perde.",
      documento: "NF-e de compra com descrição que identifique o agregado reciclado",
      reprovaSe: "A nota diz apenas “agregado” ou “brita”, sem distinguir a origem reciclada.",
    },
    {
      quando: "Ao fechar o inventário",
      titulo: "Feche o balanço de massa",
      oQueFazer:
        "Some o que saiu como resíduo classe A e o que entrou como agregado reciclado. É o teste " +
        "de verificação que o catálogo já declara: entrada de agregado deve conversar com saída " +
        "de resíduo. Explique a diferença quando houver — obra que só envia e não compra também " +
        "é caso válido, desde que declarado.",
      documento: "Planilha de balanço: total removido por classe × total de agregado adquirido",
      reprovaSe:
        "O balanço não fecha e não vem explicação. Diferença sem justificativa é lida como " +
        "dupla contagem.",
    },
  ],
  comoEntraNoCalculo:
    "A tonelada de agregado reciclado substitui tonelada de brita natural, e a diferença entre " +
    "os dois fatores de emissão entra como ativo no balanço da obra. O desvio de aterro entra " +
    "pelo percentual desviado sobre o total gerado. Ambos usam fator versionado — quando o " +
    "fornecedor apresenta DAP própria, ela substitui o fator genérico e o ativo cresce.",
  beneficios: [
    {
      titulo: "O agregado reciclado custa menos que a brita",
      detalhe:
        "No catálogo de alternativas do sistema, a troca aparece com custo adicional negativo: " +
        "economiza por tonelada em vez de custar. É o único ativo da lista que se paga antes de " +
        "qualquer benefício fiscal.",
      natureza: "imediato",
    },
    {
      titulo: "Menos custo de destinação",
      detalhe:
        "Cada tonelada desviada de aterro é uma tonelada que não paga taxa de disposição nem " +
        "frete até o aterro, que costuma ser mais distante que a usina de reciclagem.",
      natureza: "imediato",
    },
    {
      titulo: "Conformidade que você já deve, agora comprovada",
      detalhe:
        "A destinação rastreada já é exigida pela CONAMA 307 e pela PNRS. Documentar na ordem " +
        "certa não acrescenta obrigação — transforma uma que já existe em ativo contabilizável, " +
        "e de quebra deixa a obra pronta para fiscalização de resíduo.",
      natureza: "imediato",
    },
    {
      titulo: "Menor intensidade, faixa melhor do selo",
      detalhe:
        "O ativo reduz a intensidade líquida em kgCO₂e/m², que é a unidade da régua de incentivo " +
        "municipal. Descer de faixa é o que aciona desconto de IPTU, redução de outorga onerosa e " +
        "análise prioritária de projeto — nos municípios que instituíram o programa por lei.",
      natureza: "municipal",
    },
  ],
};

const SUB: RoteiroAtivo = {
  codigo: "SUB",
  titulo: "Substituição de material por alternativa de menor intensidade",
  resumo:
    "A linha de base é a especificação aprovada no alvará. Trocar para melhor é ativo; trocar " +
    "sem registrar a especificação original é troca sem prova, e a análise não tem contra o que " +
    "comparar.",
  baseLegal: [
    {
      norma: "Especificação do alvará",
      oQueExige:
        "O memorial aprovado no licenciamento é a linha de base. Substituição não prevista em " +
        "projeto exige aditivo registrado para ser aceita.",
    },
  ],
  passos: [
    {
      quando: "Antes da compra",
      titulo: "Registre a especificação original",
      oQueFazer:
        "Guarde o trecho do memorial de projeto que especifica o material que seria usado. Sem a " +
        "linha de base documentada, não há como medir o que foi evitado.",
      documento: "Memorial de projeto com a especificação original",
      reprovaSe: "A obra alega substituição mas não mostra o que estava previsto antes.",
    },
    {
      quando: "Se a troca não estava em projeto",
      titulo: "Formalize o aditivo",
      oQueFazer:
        "Troca não prevista precisa de aditivo registrado antes de ser reivindicada como ativo.",
      documento: "Aditivo de projeto registrado",
      reprovaSe: "Substituição reivindicada retroativamente, sem aditivo.",
    },
    {
      quando: "Na compra",
      titulo: "Compre com nota que identifique o material efetivo",
      oQueFazer:
        "A NF-e precisa identificar o material que foi de fato usado, com a especificação técnica " +
        "que o distingue do convencional.",
      documento: "NF-e do material efetivamente usado",
      reprovaSe: "Nota genérica que não distingue a alternativa do material de base.",
    },
  ],
  comoEntraNoCalculo:
    "Quantidade adquirida × diferença entre o fator do material original e o do substituto. " +
    "O simulador de decisão de material ordena as alternativas por custo em real por tonelada " +
    "de CO₂e evitada, para escolher onde investir primeiro.",
  beneficios: [
    {
      titulo: "Menor intensidade, faixa melhor do selo",
      detalhe:
        "É o ativo com maior alavanca por tonelada trocada, especialmente em aço e cimento, que " +
        "dominam o passivo A1–A3 de uma obra convencional.",
      natureza: "municipal",
    },
    {
      titulo: "Escopo 3 pronto para quem compra de você",
      detalhe:
        "Cliente corporativo e banco pedem o dado. Substituição documentada é o que sustenta a " +
        "resposta com número em vez de declaração.",
      natureza: "imediato",
    },
  ],
};

const ROTEIROS: RoteiroAtivo[] = [RCC, SUB];

/** Roteiro do requisito, quando existe. Nem todo requisito ativo tem um escrito ainda. */
export function roteiroDoRequisito(codigo: string | null | undefined): RoteiroAtivo | null {
  if (!codigo) return null;
  return ROTEIROS.find((r) => r.codigo === codigo) ?? null;
}

export function temRoteiro(codigo: string | null | undefined): boolean {
  return roteiroDoRequisito(codigo) !== null;
}

/** Códigos com roteiro escrito — usado para sinalizar no catálogo o que já tem passo a passo. */
export const CODIGOS_COM_ROTEIRO: string[] = ROTEIROS.map((r) => r.codigo);
