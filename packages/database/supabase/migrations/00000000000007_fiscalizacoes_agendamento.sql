-- Faltava a prefeitura poder AGENDAR vistoria: só existiam policies de
-- SELECT e de UPDATE do próprio fiscal (constatação em campo). Programação
-- de vistorias é ação de prefeitura_analista/prefeitura_gestor (seção 06).

create policy "fiscalizacoes: prefeitura agenda no próprio município" on fiscalizacoes
  for insert
  with check (
    current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
    and exists (
      select 1 from obras
      where obras.id = fiscalizacoes.obra_id
        and obras.municipio_id = current_municipio_id()
    )
  );

create policy "fiscalizacoes: prefeitura cancela/reprograma no próprio município" on fiscalizacoes
  for update
  using (
    current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
    and exists (
      select 1 from obras
      where obras.id = fiscalizacoes.obra_id
        and obras.municipio_id = current_municipio_id()
    )
  )
  with check (
    current_papel() in ('prefeitura_analista', 'prefeitura_gestor')
    and exists (
      select 1 from obras
      where obras.id = fiscalizacoes.obra_id
        and obras.municipio_id = current_municipio_id()
    )
  );
