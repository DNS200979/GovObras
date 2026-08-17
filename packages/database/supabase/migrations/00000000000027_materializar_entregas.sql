-- Prepara `entregas_concreto` pra virar lançamento de carbono de verdade:
--
-- 1) rastro de quando/quem materializou — sem isso não dá pra saber se uma
--    entrega já virou lançamento nem impedir materializar duas vezes;
-- 2) bucket pra evidência (NF-e/CT-e) da entrega. `lancamentos` exige
--    evidencia_id (constraint `lancamento_tem_evidencia`), e evidência
--    exige documento — sem arquivo anexado não tem o que materializar.
--
-- A linha em `evidencias` continua sendo gravada via client admin no
-- Server Action (essa tabela não tem NENHUMA policy de escrita — só
-- leitura — e isso é deliberado: o ledger de carbono não é gravável direto
-- pela sessão do usuário, só por processo de confiança, igual o script de
-- seed já fazia). O arquivo em si, porém, pode ir direto pela sessão da
-- concreteira, com policy própria, como qualquer outro documento no
-- sistema.

alter table entregas_concreto
  add column materializado_em timestamptz,
  add column materializado_por uuid references perfis (id);

-- ---------- concreteira anexa evidência mesmo depois da validação ----------
-- A entrega pode ser declarada sem arquivo (upload é opcional na hora) e só
-- validada pela construtora depois — nesse ponto a política existente
-- ("corrige enquanto declarada") já bloqueia a concreteira de tocar na
-- linha. Sem uma via pra anexar depois, a entrega fica permanentemente
-- impossível de materializar. Abre uma segunda política bem estreita: só
-- pra preencher evidencia_id uma vez, nunca pra sobrescrever nem mexer em
-- mais nada — quem garante "nunca mais nada" é o trigger abaixo, porque
-- RLS sozinho não distingue coluna por coluna.

create policy "entregas_concreto: concreteira anexa evidência após validação" on entregas_concreto
  for update
  using (concreteira_id = current_concreteira_id() and status in ('validada', 'contestada') and evidencia_id is null)
  with check (concreteira_id = current_concreteira_id() and status in ('validada', 'contestada'));

create or replace function entrega_concreto_so_evidencia_pos_validacao()
returns trigger
language plpgsql
security invoker
as $$
begin
  if current_papel() = 'concreteira' and old.status <> 'declarada' then
    if old.evidencia_id is not null then
      raise exception 'evidência já anexada — não pode ser trocada depois da validação';
    end if;
    if new.obra_concreteira_id is distinct from old.obra_concreteira_id
       or new.obra_id is distinct from old.obra_id
       or new.concreteira_id is distinct from old.concreteira_id
       or new.volume_m3 is distinct from old.volume_m3
       or new.traco is distinct from old.traco
       or new.data_entrega is distinct from old.data_entrega
       or new.status is distinct from old.status
       or new.criado_por is distinct from old.criado_por
       or new.materializado_em is distinct from old.materializado_em
       or new.materializado_por is distinct from old.materializado_por
    then
      raise exception 'concreteira só pode anexar evidência depois da validação — nenhum outro campo muda';
    end if;
  end if;
  return new;
end;
$$;

create trigger entregas_concreto_protege_pos_validacao
  before update on entregas_concreto
  for each row
  execute function entrega_concreto_so_evidencia_pos_validacao();

insert into storage.buckets (id, name, public)
values ('entregas-concreto-docs', 'entregas-concreto-docs', false)
on conflict (id) do nothing;

-- Convenção de caminho: {concreteira_id}/{entrega_id}/{arquivo}

create policy "entregas-concreto-docs: concreteira lê os próprios arquivos" on storage.objects
  for select
  using (
    bucket_id = 'entregas-concreto-docs'
    and (storage.foldername(name))[1] = current_concreteira_id()::text
  );

create policy "entregas-concreto-docs: concreteira envia nos próprios arquivos" on storage.objects
  for insert
  with check (
    bucket_id = 'entregas-concreto-docs'
    and (storage.foldername(name))[1] = current_concreteira_id()::text
    and current_papel() = 'concreteira'
  );

create policy "entregas-concreto-docs: construtora lê arquivos das próprias obras" on storage.objects
  for select
  using (
    bucket_id = 'entregas-concreto-docs'
    and exists (
      select 1 from entregas_concreto e
      join obras o on o.id = e.obra_id
      where e.concreteira_id::text = (storage.foldername(name))[1]
        and e.id::text = (storage.foldername(name))[2]
        and o.construtora_id = current_construtora_id()
    )
  );
