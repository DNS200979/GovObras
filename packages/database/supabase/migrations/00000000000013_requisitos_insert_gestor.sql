-- requisitos_auditoria só permitia INSERT por admin_plataforma. Curadoria
-- do catálogo (seção 05 do plano) é uma decisão de política municipal —
-- abre pra prefeitura_gestor, mantém analista só leitura.

create policy "requisitos_auditoria: gestor cadastra" on requisitos_auditoria
  for insert
  with check (current_papel() = 'prefeitura_gestor');
