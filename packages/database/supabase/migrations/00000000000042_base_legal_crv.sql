-- Base legal do CRV (créditos verificados adquiridos e aposentados).
--
-- Último dos quatro requisitos ativos que estavam sem norma escrita. Com ele,
-- os oito ativos do catálogo passam a declarar seu fundamento.
--
-- Levantado em fonte primária (Lei 15.042/2024; padrões Verra e Gold Standard),
-- não de memória.
--
-- TRÊS COISAS QUE A CITAÇÃO PRECISA DIZER
--
-- 1. CRVE NÃO É CRÉDITO VOLUNTÁRIO. O CRVE é o ativo regulado do SBCE, que só
--    existe por metodologia credenciada e registro no âmbito do sistema. VCU da
--    Verra e unidade Gold Standard são crédito voluntário — têm valor, mas não
--    são CRVE. Declarar uma como se fosse a outra desfaz a reivindicação.
--
-- 2. AQUISIÇÃO NÃO É APOSENTADORIA. Crédito comprado e mantido em conta segue
--    transferível, logo não foi consumido e não gera ativo. Só a aposentadoria
--    retira a unidade de circulação — e em nome do CNPJ da obra, não da
--    holding. É exatamente a regra que o roteiro do ENE já aplica ao
--    certificado de atributo renovável, e que falha pelo mesmo motivo.
--
-- 3. O SBCE DEPENDE DE REGULAMENTAÇÃO. A lei é de 11/12/2024 e prevê
--    implantação faseada. Esta pesquisa NÃO confirmou o estágio atual da
--    regulamentação, então a citação manda conferir antes de tratar o sistema
--    como operante — em vez de afirmar uma situação que pode ter mudado.
--
-- Com esta migration o catálogo fica: SUB 1, RCC 3, ENE 3, ARB 3, EFI 4,
-- AGU 5, MAD 5, CRV 4 — nenhum requisito ativo sem fundamento declarado.

update requisitos_auditoria set base_legal = '[
  {
    "norma": "Lei nº 15.042, de 11/12/2024 — SBCE",
    "oQueExige": "Institui o Sistema Brasileiro de Comércio de Emissões de Gases de Efeito Estufa. Alcança fontes e instalações acima de 10.000 tCO₂e por ano, que passam a monitorar e reportar; acima de 25.000 tCO₂e por ano, há também reconciliação periódica de obrigações. Cria dois ativos: a CBE (Cota Brasileira de Emissões), direito de emitir 1 tCO₂e concedido pelo órgão gestor, e o CRVE (Certificado de Redução ou Remoção Verificada de Emissões), que representa 1 tCO₂e efetivamente reduzido ou removido. A implantação é faseada e depende de regulamentação — o estágio dela deve ser conferido antes de tratar o SBCE como operante."
  },
  {
    "norma": "CRVE — o ativo regulado do SBCE",
    "oQueExige": "O CRVE só existe por metodologia credenciada e registro no âmbito do SBCE. É a distinção que mais confunde: crédito de mercado voluntário NÃO é CRVE. Uma VCU da Verra ou uma unidade Gold Standard é crédito voluntário, com valor próprio, mas não é o ativo regulado — e declarar uma como se fosse a outra desfaz a reivindicação inteira."
  },
  {
    "norma": "Padrões voluntários — Verra (VCS) e Gold Standard",
    "oQueExige": "Cada unidade é emitida em registro público com número de série único e só pode ser aposentada uma vez, e é isso que impede a dupla contagem. A evidência do ativo é o comprovante de aposentadoria com o serial visível, o projeto de origem e a safra (vintage) — não o extrato de conta nem a nota de compra."
  },
  {
    "norma": "Aposentadoria (retirement) em nome do CNPJ da obra",
    "oQueExige": "Aquisição não é aposentadoria. Crédito comprado e mantido em conta continua transferível, e portanto não foi consumido por ninguém — não gera ativo. Só a aposentadoria retira a unidade de circulação, e ela precisa ser feita em nome do CNPJ da obra, não da holding nem da controladora. É a mesma regra que o requisito ENE já aplica ao certificado de atributo renovável, e falha pelo mesmo motivo: a obra não pode reivindicar o que não foi retirado em seu nome."
  }
]'::jsonb
 where codigo = 'CRV' and base_legal = '[]'::jsonb;
