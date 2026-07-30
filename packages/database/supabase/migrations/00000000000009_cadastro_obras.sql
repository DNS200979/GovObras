-- Cadastro de obras (seção 06 do plano — módulo "Cadastro de obras" do
-- CarbonFree Gov): "Vínculo com alvará, matrícula do imóvel, CNO/CEI,
-- inscrição imobiliária, coordenadas, tipologia, área construída". Só
-- existia policy de INSERT em obras para a construtora; faltava a
-- prefeitura poder registrar a obra no ato da emissão do alvará.

create policy "obras: prefeitura cadastra no próprio município" on obras
  for insert
  with check (
    current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
    and municipio_id = current_municipio_id()
  );

-- construtoras não é dado sensível por tenant (é basicamente um diretório
-- de CNPJ) — abre leitura geral pra qualquer autenticado poder buscar/
-- selecionar ao cadastrar uma obra, e permite a prefeitura cadastrar uma
-- construtora nova que ainda não tenha nenhuma obra no município.
create policy "construtoras: leitura autenticada" on construtoras
  for select to authenticated using (true);

create policy "construtoras: prefeitura cadastra" on construtoras
  for insert
  with check (current_papel() in ('prefeitura_analista', 'prefeitura_gestor'));
