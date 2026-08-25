-- Cadastra Porto Alegre, Canoas e Novo Hamburgo no módulo de prefeituras.
--
-- Os códigos IBGE foram confirmados na API de localidades do próprio IBGE
-- (servicodados.ibge.gov.br/api/v1/localidades/estados/RS/municipios), e a
-- API de malhas devolve o contorno dos três — então o mapa territorial já
-- desenha o limite municipal correto.
--
-- SOBRE A RÉGUA
-- `faixa_regua` entra com a mesma escala de referência de Florianópolis, e
-- isso é PROVISÓRIO de propósito. A régua é calibrada por município, sobre a
-- distribuição real das obras locais: calibrar acima da mediana esvazia o
-- programa, muito abaixo distribui benefício sem induzir mudança. Estes
-- valores servem para a tela funcionar e para simular; não são a régua de
-- Porto Alegre, de Canoas nem de Novo Hamburgo.
--
-- Deixar `faixa_regua` como '[]' seria mais honesto, mas quebra o dossiê, que
-- procura a faixa da obra na régua do município. A alternativa correta — um
-- estado explícito de "régua não calibrada" na interface — é mudança de
-- produto, não de dado, e fica registrada aqui como pendência.
--
-- CNPJ fica nulo: é o CNPJ da prefeitura, usado só na transmissão do
-- SisobraPref, e não convém inventar. Sem ele o módulo de obrigações mostra a
-- competência normalmente, mas não gera declaração transmissível.

insert into municipios (nome, uf, codigo_ibge, faixa_regua, teto_compensacao_pct)
values
  ('Porto Alegre', 'RS', '4314902',
   '[{"faixa":"AAA","ate_kgco2e_m2":150,"beneficio":"IPTU -15 a -20% por 5 anos"},
     {"faixa":"AA","ate_kgco2e_m2":200,"beneficio":"IPTU -10% por 5 anos"},
     {"faixa":"A","ate_kgco2e_m2":280,"beneficio":"IPTU -5%"},
     {"faixa":"B","ate_kgco2e_m2":380,"beneficio":"Conformidade"},
     {"faixa":"C","ate_kgco2e_m2":999999,"beneficio":"Plano de adequação obrigatório"}]'::jsonb,
   30.00),
  ('Canoas', 'RS', '4304606',
   '[{"faixa":"AAA","ate_kgco2e_m2":150,"beneficio":"IPTU -15 a -20% por 5 anos"},
     {"faixa":"AA","ate_kgco2e_m2":200,"beneficio":"IPTU -10% por 5 anos"},
     {"faixa":"A","ate_kgco2e_m2":280,"beneficio":"IPTU -5%"},
     {"faixa":"B","ate_kgco2e_m2":380,"beneficio":"Conformidade"},
     {"faixa":"C","ate_kgco2e_m2":999999,"beneficio":"Plano de adequação obrigatório"}]'::jsonb,
   30.00),
  ('Novo Hamburgo', 'RS', '4313409',
   '[{"faixa":"AAA","ate_kgco2e_m2":150,"beneficio":"IPTU -15 a -20% por 5 anos"},
     {"faixa":"AA","ate_kgco2e_m2":200,"beneficio":"IPTU -10% por 5 anos"},
     {"faixa":"A","ate_kgco2e_m2":280,"beneficio":"IPTU -5%"},
     {"faixa":"B","ate_kgco2e_m2":380,"beneficio":"Conformidade"},
     {"faixa":"C","ate_kgco2e_m2":999999,"beneficio":"Plano de adequação obrigatório"}]'::jsonb,
   30.00)
on conflict do nothing;
