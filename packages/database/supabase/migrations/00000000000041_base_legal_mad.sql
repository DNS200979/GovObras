-- Base legal do MAD (carbono biogênico estocado em madeira de origem controlada).
--
-- Terceiro dos quatro requisitos ativos sem norma escrita. Levantado em fonte
-- primária (IBAMA, Inmetro/CERFLOR), não de memória.
--
-- DUAS DISTINÇÕES QUE REPROVAM
--
-- 1. DOF NÃO É CERTIFICAÇÃO. O DOF é controle de origem legal, obrigatório
--    para produto florestal de origem nativa. Certificação (FSC ou CERFLOR) é
--    voluntária e atesta manejo sustentável mais rastreabilidade. Madeira pode
--    ter DOF e não ser certificada. Quando um programa municipal exige
--    percentual de "madeira certificada" — como a dimensão Materiais de Porto
--    Alegre, que pede 50% da temporária e permanente — está pedindo o segundo,
--    e nota com DOF não atende.
--
-- 2. CERTIFICADO DE MANEJO NÃO É CADEIA DE CUSTÓDIA. O certificado do produtor
--    não transfere sozinho para o material que chegou ao canteiro; é a CoC
--    (ABNT NBR 14790, no CERFLOR) que liga a floresta ao produto comprado. É o
--    elo que falta com mais frequência.
--
-- E uma ressalva de alcance na direção oposta: o DOF trata de origem nativa.
-- Madeira de plantio segue outro regime, e exigir DOF numa nota de eucalipto
-- ou pinus é erro de análise, não rigor.
--
-- O QUE ESTAS NORMAS NÃO COBREM
-- Nenhuma delas diz como QUANTIFICAR o carbono biogênico estocado. Elas
-- estabelecem origem, manejo e custódia — não contabilidade de carbono. O
-- método de cálculo é metodologia, e pelo critério da migration 38 seria lado
-- do código; hoje não está escrito em lugar nenhum, e fica registrado aqui
-- como lacuna.

update requisitos_auditoria set base_legal = '[
  {
    "norma": "Lei nº 12.651/2012 — Código Florestal, arts. 35 e 36",
    "oQueExige": "Estabelece o controle de origem dos produtos florestais e o SINAFLOR (Sistema Nacional de Controle da Origem dos Produtos Florestais), coordenado pelo IBAMA e integrado ao SICAR e à ADA. É a base do rastreio: sem origem controlada não há como afirmar que a madeira veio de onde diz que veio."
  },
  {
    "norma": "Portaria MMA nº 253, de 18/08/2006 — DOF",
    "oQueExige": "Institui o Documento de Origem Florestal, licença obrigatória para o transporte e o armazenamento de produtos florestais de origem NATIVA, nos termos do art. 36 da Lei 12.651/2012. Atenção ao alcance: o DOF trata de origem nativa, e madeira de plantio segue outro regime — a ausência de DOF numa nota de eucalipto ou pinus não é irregularidade, e exigi-lo aí é erro de análise."
  },
  {
    "norma": "Instrução Normativa IBAMA nº 21, de 23/12/2014",
    "oQueExige": "Fixa os critérios e procedimentos de uso do DOF e do SINAFLOR, válidos para as unidades da federação que os utilizam. É a norma operacional do rastreio, e a que diz o que precisa constar no documento que acompanha a carga."
  },
  {
    "norma": "CERFLOR — Programa Brasileiro de Certificação Florestal (Inmetro), com ABNT NBR 14790, 14789 e 15789",
    "oQueExige": "Programa nacional de certificação florestal do Inmetro, vinculado ao PEFC. A NBR 14790 é a norma de CADEIA DE CUSTÓDIA; a 14789 trata de plantios florestais e a 15789 de florestas nativas. A cadeia de custódia é o elo que falta com mais frequência: certificado de manejo do produtor não transfere sozinho para o material que chegou ao canteiro — é a CoC que liga a floresta ao produto comprado."
  },
  {
    "norma": "FSC — Forest Stewardship Council",
    "oQueExige": "O outro dos dois sistemas de certificação florestal em uso no Brasil, privado e internacional, com cadeia de custódia própria. Vale a distinção que mais confunde na análise: DOF é controle de origem LEGAL e obrigatório para nativa; certificação (FSC ou CERFLOR) é VOLUNTÁRIA e atesta manejo sustentável mais rastreabilidade. Madeira pode ter DOF e não ser certificada, e os programas municipais que exigem percentual de “madeira certificada” — como a dimensão Materiais de Porto Alegre, que pede 50% da madeira temporária e permanente — estão pedindo o segundo, não o primeiro."
  }
]'::jsonb
 where codigo = 'MAD' and base_legal = '[]'::jsonb;
