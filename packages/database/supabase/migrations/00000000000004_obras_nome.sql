-- Nome de fachada da obra (ex. "Residencial Vista Verde") — faltava no
-- schema original, que só tinha identificadores burocráticos (alvará,
-- inscrição imobiliária, CNO). Necessário para qualquer tela de listagem.

alter table obras add column nome text not null default '';
