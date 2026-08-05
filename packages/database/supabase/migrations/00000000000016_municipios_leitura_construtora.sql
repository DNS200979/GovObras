-- A construtora precisa enxergar a régua de faixas e o teto de compensação
-- do município onde constrói — é a regra que define o selo e o benefício
-- fiscal da obra dela. A policy existente só atendia a prefeitura
-- (current_municipio_id()), que é nulo para perfis de construtora.

create policy "municipios: construtora vê o município das próprias obras" on municipios
  for select
  using (
    exists (
      select 1 from obras
      where obras.municipio_id = municipios.id
        and obras.construtora_id = current_construtora_id()
    )
  );
