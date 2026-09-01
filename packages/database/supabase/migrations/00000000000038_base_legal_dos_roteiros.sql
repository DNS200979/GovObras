-- Migra a base legal de `roteiros-ativo.ts` para o catálogo: o banco passa a
-- ser o dono da citação.
--
-- A migration 37 criou `requisitos_auditoria.base_legal` e a deixou vazia de
-- propósito. Semear ali sem mais nada criaria duas fontes de verdade para a
-- mesma norma, com código e banco livres para divergir em silêncio — e norma
-- desatualizada num catálogo de auditoria é pior que norma ausente.
--
-- A divisão que este commit fixa:
--
--   banco  -> QUAL norma fundamenta o requisito (citação, editável pelo gestor)
--   código -> COMO cumprir o requisito na prática (roteiro, passo a passo, o
--             que reprova, benefícios) — metodologia versionada
--
-- A citação vai para o banco porque a prefeitura pode cadastrar requisito
-- próprio (migration 13) e agora pode corrigi-lo (migration 37). O roteiro
-- fica em código porque muda por revisão de procedimento, não por operação do
-- usuário.
--
-- Os textos abaixo saíram do próprio `roteiros-ativo.ts`, extraídos do fonte e
-- não redigitados. No mesmo commit o campo `baseLegal` sai daquele módulo —
-- mantê-lo nos dois lugares era exatamente o que se queria evitar.
--
-- MAD, CRV, EFI e AGU seguem com base_legal vazia: são requisitos ativos sem
-- roteiro escrito e, portanto, sem norma levantada. Vazio é honesto; inventar
-- norma para preencher, não.
--
-- O `and base_legal = '[]'` faz cada UPDATE não sobrescrever curadoria que a
-- prefeitura já tenha feito pelo app. Em banco novo, sem catálogo semeado,
-- nenhum deles afeta linha alguma — o catálogo é dado operacional.

update requisitos_auditoria set base_legal = '[
  {
    "norma": "CONAMA 307/2002",
    "oQueExige": "Classificação do resíduo em A, B, C e D e destinação diferenciada por classe. O agregado reciclado sai da classe A (alvenaria, concreto, argamassa)."
  },
  {
    "norma": "Lei 12.305/2010 — PNRS",
    "oQueExige": "Responsabilidade do gerador até a destinação final adequada. A responsabilidade não termina no portão da obra: se o receptor destinar errado, a obra responde junto."
  },
  {
    "norma": "PGRCC no licenciamento",
    "oQueExige": "Plano de gerenciamento aprovado como condicionante do alvará, com estimativa de geração por classe. É o documento contra o qual o balanço de massa vai ser conferido."
  }
]'::jsonb
 where codigo = 'RCC' and base_legal = '[]'::jsonb;

update requisitos_auditoria set base_legal = '[
  {
    "norma": "Especificação do alvará",
    "oQueExige": "O memorial aprovado no licenciamento é a linha de base. Substituição não prevista em projeto exige aditivo registrado para ser aceita."
  }
]'::jsonb
 where codigo = 'SUB' and base_legal = '[]'::jsonb;

update requisitos_auditoria set base_legal = '[
  {
    "norma": "Lei 12.651/2012 — Código Florestal",
    "oQueExige": "Supressão de vegetação depende de autorização prévia do órgão competente, e a compensação é condicionante dessa autorização, não liberalidade do empreendedor."
  },
  {
    "norma": "Autorização de supressão vegetal",
    "oQueExige": "Emitida pelo município ou pelo órgão estadual conforme o caso. É ela que define quantas mudas, de que espécies e em que prazo — e é contra ela que a compensação é conferida."
  },
  {
    "norma": "Termo de compensação",
    "oQueExige": "Instrumento que vincula o empreendedor ao plantio e ao monitoramento. Sem termo assinado não há obrigação formal a cumprir, e sem obrigação não há adicionalidade a demonstrar."
  }
]'::jsonb
 where codigo = 'ARB' and base_legal = '[]'::jsonb;

update requisitos_auditoria set base_legal = '[
  {
    "norma": "Lei 14.300/2022",
    "oQueExige": "Marco legal da geração distribuída e do sistema de compensação de energia elétrica. A compensação precisa aparecer na fatura da unidade consumidora da obra."
  },
  {
    "norma": "Certificado de atributo renovável",
    "oQueExige": "Cada certificado tem número de série e só pode ser resgatado uma vez. O atributo é consumido no resgate — depois disso ninguém mais pode reivindicá-lo."
  },
  {
    "norma": "Fator de emissão da rede",
    "oQueExige": "O que se evita é medido contra o fator da rede no período. Fator publicado varia mês a mês, então o período do consumo importa tanto quanto a quantidade."
  }
]'::jsonb
 where codigo = 'ENE' and base_legal = '[]'::jsonb;
