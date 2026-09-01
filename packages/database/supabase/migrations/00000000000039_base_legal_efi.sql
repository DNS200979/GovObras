-- Base legal do EFI (desempenho energético projetado da edificação).
--
-- O EFI era um dos quatro requisitos ativos sem norma escrita em lugar nenhum
-- do sistema — o analista via o que auditar e sob qual evidência, mas não sob
-- qual fundamento. Levantado em fonte primária (MME, Inmetro/PBE Edifica), não
-- de memória.
--
-- O ponto que mais muda o trabalho de quem preenche: desde 1º de novembro de
-- 2024 a ENCE de projeto só sai pelos métodos das INIs da Portaria Inmetro
-- 309/2022. Projeto avaliado pelos antigos RTQ-C ou RTQ-R não gera etiqueta
-- nova, e precisa ser reavaliado. Uma obra que guardou avaliação RTQ da época
-- do projeto chega na análise com documento que não vale mais.
--
-- E a distinção entre ENCE de projeto e ENCE de edificação construída fica
-- explícita na citação, porque é a confusão mais cara: o requisito é do
-- desempenho PROJETADO, e etiqueta de projeto não prova o que foi construído.
--
-- Segue a divisão fixada na migration 38: o banco guarda QUAL norma fundamenta
-- o requisito. O COMO cumprir, quando houver roteiro para o EFI, fica em
-- código.
--
-- MAD, CRV e AGU seguem sem base legal — serão levantados um a um, com a mesma
-- pesquisa de fonte primária.

update requisitos_auditoria set base_legal = '[
  {
    "norma": "Lei nº 10.295/2001 — Política Nacional de Conservação e Uso Racional de Energia",
    "oQueExige": "Autoriza o poder público a estabelecer níveis máximos de consumo específico de energia, ou mínimos de eficiência energética, para máquinas, aparelhos e edificações construídas no país. É a norma que torna a eficiência da edificação matéria regulada, e não liberalidade do empreendedor."
  },
  {
    "norma": "Decreto nº 4.059/2001",
    "oQueExige": "Regulamenta a Lei 10.295 e cria o CGIEE (Comitê Gestor de Indicadores e Níveis de Eficiência Energética) e o Grupo Técnico de Eficientização de Energia nas Edificações, a quem cabe elaborar os procedimentos de avaliação da eficiência energética das edificações brasileiras."
  },
  {
    "norma": "Portaria Inmetro nº 309, de 06/09/2022",
    "oQueExige": "Aprova a INI-C (edificações comerciais, de serviços e públicas) e a INI-R (residenciais), com os respectivos Requisitos de Avaliação da Conformidade. Desde 1º de novembro de 2024 toda ENCE de projeto nova só pode ser emitida por esses métodos — os antigos RTQ-C e RTQ-R não servem mais para etiqueta nova, e projeto avaliado por eles precisa ser reavaliado. A Nota Técnica nº 02, de 25/11/2024, traz esclarecimentos e correções ao texto da portaria."
  },
  {
    "norma": "ENCE de projeto — PBE Edifica (Inmetro e Eletrobras/Procel Edifica)",
    "oQueExige": "A Etiqueta Nacional de Conservação de Energia é a evidência do requisito: ela classifica o desempenho energético previsto, de A a E. Atenção à distinção que mais confunde: a ENCE de projeto atesta o que foi PROJETADO. O desempenho da obra entregue depende da ENCE de edificação construída, que é documento distinto — projeto etiquetado A e obra executada fora da especificação não sustentam o ativo."
  }
]'::jsonb
 where codigo = 'EFI' and base_legal = '[]'::jsonb;
