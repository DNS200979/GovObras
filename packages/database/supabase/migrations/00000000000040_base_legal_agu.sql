-- Base legal do AGU (reuso de água pluvial e cinza).
--
-- Segundo dos quatro requisitos ativos que estavam sem norma escrita.
-- Levantado em fonte primária (CNRH, ABNT), não de memória.
--
-- UM ACHADO SOBRE O PRÓPRIO NOME DO REQUISITO
-- "Reuso de água pluvial e cinza" junta duas categorias que a norma separa. A
-- NBR 16783 lista as fontes alternativas de água não potável e estabelece que
-- só o uso de água cinza, negra ou esgoto configura REÚSO. Água de chuva é
-- fonte alternativa, não reúso — e as duas se comprovam por caminhos
-- diferentes: o pluvial pela NBR 15527, o reúso pela 16783 e pela Resolução
-- CNRH 54/2005.
--
-- Isso não é purismo de nomenclatura. Uma obra que capta chuva e declara
-- "reúso" apresenta o projeto errado na análise, e uma que faz as duas coisas
-- pode ser cobrada por um documento e não pelo outro. A citação registra a
-- distinção onde o analista vai lê-la.
--
-- Renomear o requisito seria o passo seguinte, mas é decisão de curadoria da
-- prefeitura — e agora ela tem policy de UPDATE para fazê-lo (migration 37).
--
-- NÃO HÁ LEI FEDERAL ESPECÍFICA DE REÚSO. O regramento vem de resolução do
-- CNRH e de norma técnica ABNT, sob a competência da Lei 9.433/1997. Existe um
-- marco legal em tramitação no Congresso, cujo estágio esta pesquisa não
-- confirmou — por isso não entra na citação: base legal de catálogo de
-- auditoria cita norma vigente, não projeto.

update requisitos_auditoria set base_legal = '[
  {
    "norma": "Lei nº 9.433/1997 — Política Nacional de Recursos Hídricos",
    "oQueExige": "Institui a PNRH e o Sistema Nacional de Gerenciamento de Recursos Hídricos, e é a lei que dá ao CNRH competência para disciplinar o reúso. É dela que decorre todo o arcabouço abaixo — não há, hoje, lei federal específica de reúso: o regramento vem de resolução do Conselho e de norma técnica."
  },
  {
    "norma": "Resolução CNRH nº 54/2005",
    "oQueExige": "Estabelece modalidades, diretrizes e critérios gerais para a prática de reúso direto não potável. Define reúso direto como o uso planejado de água de reúso conduzida ao local de utilização SEM lançamento ou diluição prévia em corpo hídrico superficial ou subterrâneo. A distinção é operacional: água que passa por corpo hídrico antes de ser captada deixa de ser reúso direto e muda de enquadramento, com outra exigência de outorga."
  },
  {
    "norma": "ABNT NBR 16783:2019 — Uso de fontes alternativas de água não potável em edificações",
    "oQueExige": "Fixa requisitos e procedimentos de caracterização, dimensionamento, uso, operação e manutenção. Lista as fontes alternativas — água de chuva, escoamento superficial, rebaixamento de lençol, água cinza clara ou escura, água negra e esgoto sanitário — e estabelece que só o uso de cinza, negra ou esgoto configura REÚSO. Água de chuva é fonte alternativa, não reúso; os dois seguem exigências distintas e não se comprovam com o mesmo documento."
  },
  {
    "norma": "ABNT NBR 15527 — Aproveitamento de água de chuva de coberturas em áreas urbanas",
    "oQueExige": "Norma específica do aproveitamento pluvial, para a qual a NBR 16783 remete; revisão publicada em abril de 2019. É a referência de dimensionamento de reservatório, qualidade e manutenção do sistema de captação em cobertura — projeto pluvial dimensionado fora dela não sustenta o item."
  },
  {
    "norma": "ABNT NBR 16782:2019 — Conservação de água em edificações",
    "oQueExige": "Trata da redução do consumo, e não da fonte. Complementa a 16783 e é a norma por trás dos itens de economia em metais e louças que os programas municipais costumam pontuar em separado do reúso — em Porto Alegre, por exemplo, a dimensão Água pontua economia em metais e louças, reúso de cinzas, reúso de negras e aproveitamento pluvial como critérios distintos."
  }
]'::jsonb
 where codigo = 'AGU' and base_legal = '[]'::jsonb;
