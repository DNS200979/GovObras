-- O que faltava para o fiscal operar em campo.
--
-- As políticas de fiscalização já existiam desde o início (o fiscal vê e
-- atualiza as próprias), mas ele não enxergava a OBRA da fiscalização — a
-- agenda do app sairia sem nome, endereço nem fase. E não havia onde guardar
-- a foto tirada no canteiro.

-- ---------- obras ----------
-- Escopo mínimo: só as obras em que o fiscal tem fiscalização designada. Não
-- damos a ele a carteira inteira do município — quem fiscaliza um canteiro
-- não precisa enxergar os outros.

create policy "obras: fiscal vê as que fiscaliza" on obras
  for select
  using (
    exists (
      select 1 from fiscalizacoes f
      where f.obra_id = obras.id
        and f.fiscal_id = auth.uid()
    )
  );

-- ---------- storage: mídias de vistoria ----------
-- Convenção de caminho: {fiscal_id}/{fiscalizacao_id}/{arquivo}
-- O fiscal é o primeiro segmento porque é o escopo que a política checa sem
-- consultar outra tabela por objeto.

insert into storage.buckets (id, name, public)
values ('vistorias', 'vistorias', false)
on conflict (id) do nothing;

create policy "vistorias: fiscal lê os próprios arquivos" on storage.objects
  for select
  using (
    bucket_id = 'vistorias'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "vistorias: fiscal envia nos próprios arquivos" on storage.objects
  for insert
  with check (
    bucket_id = 'vistorias'
    and (storage.foldername(name))[1] = auth.uid()::text
    and current_papel() = 'fiscal'
  );

-- Foto de campo é prova: uma vez enviada, o próprio fiscal não substitui nem
-- apaga. Sem update e sem delete de propósito — se a captura saiu ruim, o
-- caminho é capturar de novo, e as duas ficam registradas.

create policy "vistorias: prefeitura lê as de obras do município" on storage.objects
  for select
  using (
    bucket_id = 'vistorias'
    and exists (
      select 1
      from fiscalizacoes f
      join obras o on o.id = f.obra_id
      where f.id::text = (storage.foldername(name))[2]
        and o.municipio_id = current_municipio_id()
    )
  );

-- ---------- fiscalizações ----------
-- A política de update existente permite ao fiscal designado alterar a linha
-- inteira, inclusive reatribuí-la a outro fiscal ou trocar a obra. Fecha isso:
-- ele mexe no resultado do trabalho, não em quem o faz nem onde.

create or replace function fiscalizacao_imutavel_para_fiscal()
returns trigger
language plpgsql
security invoker
as $$
begin
  if current_papel() = 'fiscal' then
    if new.fiscal_id is distinct from old.fiscal_id
       or new.obra_id is distinct from old.obra_id
       or new.agendado_para is distinct from old.agendado_para then
      raise exception 'fiscal não altera designação, obra ou agendamento da fiscalização';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger fiscalizacoes_protege_designacao
  before update on fiscalizacoes
  for each row
  execute function fiscalizacao_imutavel_para_fiscal();
