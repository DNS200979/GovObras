-- A policy "perfis: vê o próprio" só deixa o usuário ler a si mesmo — mas
-- o módulo de agendamento precisa listar os fiscais do município para o
-- select de "atribuir vistoria". Sem isso, prefeitura_gestor/analista não
-- veem nenhum fiscal ao trocar do cliente admin para o cliente com sessão.

create policy "perfis: prefeitura vê fiscais do próprio município" on perfis
  for select
  using (
    papel = 'fiscal'
    and municipio_id = current_municipio_id()
    and current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
  );
