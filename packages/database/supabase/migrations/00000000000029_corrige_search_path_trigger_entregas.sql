-- `supabase db advisors` acusou search_path mutável na função de trigger
-- criada na migration 27 (mesmo problema pré-existente em
-- `fiscalizacao_imutavel_para_fiscal`, da migration 21, fora do escopo
-- deste ajuste — não é algo introduzido aqui). Sem `set search_path`, uma
-- role que consiga criar objetos num schema que precede `public` na busca
-- padrão poderia fazer a função resolver pra um objeto forjado.

create or replace function entrega_concreto_so_evidencia_pos_validacao()
returns trigger
language plpgsql
security invoker
set search_path = public
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
