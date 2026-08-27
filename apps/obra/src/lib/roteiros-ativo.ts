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

const ARB: RoteiroAtivo = {
  codigo: "ARB",
  titulo: "Compensação arbórea com sobrevivência monitorada",
  resumo:
    "É o único ativo do catálogo que não fecha no ano da obra. O crédito é liberado em parcelas " +
    "conforme as mudas sobrevivem, e muda que morre reverte o lançamento já feito. Quem trata o " +
    "plantio como evento — planta, fotografa, esquece — perde o ativo no primeiro checkpoint.",
  baseLegal: [
    {
      norma: "Lei 12.651/2012 — Código Florestal",
      oQueExige:
        "Supressão de vegetação depende de autorização prévia do órgão competente, e a " +
        "compensação é condicionante dessa autorização, não liberalidade do empreendedor.",
    },
    {
      norma: "Autorização de supressão vegetal",
      oQueExige:
        "Emitida pelo município ou pelo órgão estadual conforme o caso. É ela que define quantas " +
        "mudas, de que espécies e em que prazo — e é contra ela que a compensação é conferida.",
    },
    {
      norma: "Termo de compensação",
      oQueExige:
        "Instrumento que vincula o empreendedor ao plantio e ao monitoramento. Sem termo assinado " +
        "não há obrigação formal a cumprir, e sem obrigação não há adicionalidade a demonstrar.",
    },
  ],
  passos: [
    {
      quando: "Antes de suprimir qualquer árvore",
      titulo: "Obtenha a autorização de supressão",
      oQueFazer:
        "A autorização precede o corte. Ela é a linha de base do ativo: define o que foi suprimido " +
        "e o que deve ser compensado.",
      documento: "Autorização de supressão vegetal, com quantidade e espécies",
      reprovaSe:
        "A obra cortou primeiro e compensou depois. Compensar supressão não autorizada regulariza " +
        "uma infração — não gera crédito de carbono.",
    },
    {
      quando: "Antes do plantio",
      titulo: "Assine o termo de compensação",
      oQueFazer:
        "Registre quantidade, espécies, local de plantio e prazo de monitoramento. É o documento " +
        "que a análise usa para saber o que deveria ter sido plantado.",
      documento: "Termo de compensação assinado",
      reprovaSe: "Plantio feito sem termo, ou em quantidade e espécie diferentes do acordado.",
    },
    {
      quando: "No plantio",
      titulo: "Registre cada muda individualmente",
      oQueFazer:
        "Espécie, coordenada e data de plantio, muda por muda. Não é lote: o monitoramento é " +
        "individual porque a liberação do crédito também é.",
      documento: "Relação de mudas com espécie, coordenada e data",
      reprovaSe:
        "Registro por lote, sem coordenada individual. Sem localizar a muda não há como verificar " +
        "se ela sobreviveu.",
    },
    {
      quando: "Na conclusão do plantio",
      titulo: "Faça o marco zero georreferenciado",
      oQueFazer:
        "Foto com coordenada de cada muda recém-plantada. É a referência contra a qual os " +
        "checkpoints seguintes serão comparados.",
      documento: "Foto georreferenciada por muda, na data do plantio",
      reprovaSe: "Foto sem coordenada, ou tirada semanas depois — não serve como marco inicial.",
    },
    {
      quando: "Aos 12, 24 e 36 meses",
      titulo: "Cumpra os três checkpoints",
      oQueFazer:
        "Nova foto georreferenciada de cada muda em cada checkpoint, registrando sobrevivência. " +
        "A parcela do crédito é liberada conforme o resultado — não de uma vez no plantio.",
      documento: "Foto georreferenciada por muda em cada checkpoint, com data",
      reprovaSe:
        "Checkpoint perdido. A janela é a data, não a conveniência: sem registro no período, a " +
        "parcela correspondente não é liberada.",
    },
    {
      quando: "Ao fim do monitoramento",
      titulo: "Feche o percentual de sobrevivência",
      oQueFazer:
        "Consolide quantas mudas chegaram vivas aos 36 meses. O crédito reconhecido é proporcional " +
        "à sobrevivência apurada, e a diferença em relação ao plantado precisa ser reposta ou " +
        "abatida do ativo.",
      documento: "Consolidação de sobrevivência por checkpoint",
      reprovaSe:
        "Morte não declarada. Descobrir na verificação que a muda não existe reverte o lançamento " +
        "já contabilizado, e não apenas a parcela pendente.",
    },
  ],
  comoEntraNoCalculo:
    "O carbono estocado é calculado por espécie e idade, e entra como ativo em parcelas: cada " +
    "checkpoint libera a fração correspondente à sobrevivência apurada. É o único requisito em " +
    "que o lançamento pode diminuir depois de feito — morte de muda reverte o que já havia sido " +
    "reconhecido.",
  beneficios: [
    {
      titulo: "Obrigação de licenciamento que passa a render",
      detalhe:
        "A compensação já é condicionante da autorização de supressão. Monitorar como o ativo " +
        "exige não acrescenta plantio nenhum — acrescenta registro sobre um plantio que já seria " +
        "obrigatório, e o transforma em crédito.",
      natureza: "imediato",
    },
    {
      titulo: "Prova pronta para a fiscalização ambiental",
      detalhe:
        "O mesmo conjunto de fotos georreferenciadas e checkpoints que sustenta o ativo é o que o " +
        "órgão ambiental cobra para dar quitação do termo de compensação. Um trabalho, dois usos.",
      natureza: "imediato",
    },
    {
      titulo: "Ativo de longo prazo que atravessa obras",
      detalhe:
        "O monitoramento dura 36 meses e continua depois da entrega. Para incorporadora com " +
        "carteira, é estoque de remoção que se acumula entre empreendimentos em vez de zerar a " +
        "cada obra concluída.",
      natureza: "imediato",
    },
    {
      titulo: "Menor intensidade, faixa melhor do selo",
      detalhe:
        "A remoção reconhecida entra no lado ativo do balanço e reduz a intensidade líquida — que " +
        "é o que a régua municipal lê para conceder desconto de IPTU e redução de outorga.",
      natureza: "municipal",
    },
  ],
};

const ENE: RoteiroAtivo = {
  codigo: "ENE",
  titulo: "Energia renovável no canteiro ou no empreendimento",
  resumo:
    "Há três rotas possíveis — geração própria, certificado de atributo renovável e mercado " +
    "livre — e cada uma prova de um jeito diferente. O erro que mais reprova não é técnico, é " +
    "de contagem: o mesmo megawatt-hora reivindicado por duas rotas, ou por dois consumidores.",
  baseLegal: [
    {
      norma: "Lei 14.300/2022",
      oQueExige:
        "Marco legal da geração distribuída e do sistema de compensação de energia elétrica. " +
        "A compensação precisa aparecer na fatura da unidade consumidora da obra.",
    },
    {
      norma: "Certificado de atributo renovável",
      oQueExige:
        "Cada certificado tem número de série e só pode ser resgatado uma vez. O atributo é " +
        "consumido no resgate — depois disso ninguém mais pode reivindicá-lo.",
    },
    {
      norma: "Fator de emissão da rede",
      oQueExige:
        "O que se evita é medido contra o fator da rede no período. Fator publicado varia mês a " +
        "mês, então o período do consumo importa tanto quanto a quantidade.",
    },
  ],
  passos: [
    {
      quando: "Antes de reivindicar qualquer MWh",
      titulo: "Escolha a rota e não misture",
      oQueFazer:
        "Defina se aquele consumo será provado por geração própria, por certificado ou por " +
        "contrato de mercado livre. Uma rota por megawatt-hora.",
      documento: "Declaração da rota adotada por unidade consumidora e período",
      reprovaSe:
        "O mesmo consumo aparece coberto por geração própria e por certificado. É dupla contagem, " +
        "e invalida as duas reivindicações, não só uma.",
    },
    {
      quando: "Geração própria — na entrada em operação",
      titulo: "Homologue o sistema junto à distribuidora",
      oQueFazer:
        "A unidade precisa estar homologada para que a compensação apareça na fatura. É a fatura, " +
        "e não o projeto do sistema, que comprova a energia efetivamente compensada.",
      documento: "Fatura com o campo de energia compensada, por mês",
      reprovaSe:
        "Reivindicação baseada na capacidade instalada do sistema em vez do que a fatura mostra " +
        "compensado. Potência instalada não é energia gerada.",
    },
    {
      quando: "Certificado — na aquisição",
      titulo: "Resgate o certificado em nome do CNPJ da obra",
      oQueFazer:
        "Compre com número de série identificado e faça o resgate em nome do CNPJ da obra, não da " +
        "holding nem da controladora. Guarde o comprovante com o serial visível.",
      documento: "Comprovante de resgate com número de série, safra e período",
      reprovaSe:
        "Certificado adquirido mas não resgatado, ou resgatado em nome de outra pessoa jurídica " +
        "do grupo — a obra não pode reivindicar o que não foi retirado em seu nome.",
    },
    {
      quando: "A cada período de apuração",
      titulo: "Amarre a energia ao período correto",
      oQueFazer:
        "O megawatt-hora vale para o período em que foi gerado ou certificado. Certificado de " +
        "safra anterior não cobre consumo do período atual.",
      documento: "Conciliação entre período de consumo e período de geração ou certificação",
      reprovaSe: "Safra do certificado não cobre o período do consumo reivindicado.",
    },
    {
      quando: "Ao fechar o inventário",
      titulo: "Confronte o reivindicado com o consumido",
      oQueFazer:
        "A energia renovável reivindicada não pode superar o consumo medido da obra no período. " +
        "Sobra indica erro de escopo — geralmente energia de outra unidade entrando na conta.",
      documento: "Demonstrativo de consumo total × energia renovável reivindicada",
      reprovaSe: "Reivindicação maior que o consumo medido no mesmo período.",
    },
  ],
  comoEntraNoCalculo:
    "O megawatt-hora renovável comprovado é multiplicado pelo fator de emissão da rede no " +
    "período, e o resultado entra como ativo — é a emissão que teria ocorrido se aquela energia " +
    "viesse da rede. Por isso o fator do período importa: rede mais limpa no mês reduz o ativo " +
    "reconhecido, mesmo com a mesma geração.",
  beneficios: [
    {
      titulo: "A conta de luz já cai",
      detalhe:
        "Geração própria reduz o custo de energia do canteiro desde o primeiro mês, " +
        "independentemente de qualquer inventário. O ativo de carbono é ganho adicional sobre um " +
        "investimento que já se justifica sozinho.",
      natureza: "imediato",
    },
    {
      titulo: "Ativo que continua depois da entrega",
      detalhe:
        "Sistema instalado no empreendimento, e não só no canteiro, segue gerando para o " +
        "condomínio — e vira argumento de venda da unidade, com conta menor para o comprador.",
      natureza: "imediato",
    },
    {
      titulo: "Menor intensidade, faixa melhor do selo",
      detalhe:
        "Entra no lado ativo do balanço e reduz a intensidade líquida em kgCO₂e/m², que é a " +
        "unidade que a régua municipal lê.",
      natureza: "municipal",
    },
    {
      titulo: "Converge com a etiqueta de eficiência",
      detalhe:
        "O mesmo investimento costuma melhorar o desempenho energético da edificação, que é " +
        "requisito próprio no catálogo e bonifica a nota do selo por outro caminho.",
      natureza: "municipal",
    },
  ],
};

const ROTEIROS: RoteiroAtivo[] = [RCC, SUB, ARB, ENE];

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
