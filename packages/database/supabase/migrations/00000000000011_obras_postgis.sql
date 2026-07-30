-- obras.coordenadas era `point` puro do Postgres (sem SRID, sem funções
-- geoespaciais). Migra pra geography(Point,4326) — PostGIS de verdade,
-- habilita distância/raio/proximidade — e expõe latitude/longitude como
-- colunas geradas, pra app ler/escrever sem parsing de WKB.

alter table obras
  alter column coordenadas type extensions.geography(Point, 4326)
  using case
    when coordenadas is not null
      then extensions.st_setsrid(extensions.st_makepoint(coordenadas[0], coordenadas[1]), 4326)::extensions.geography
    else null
  end;

create index obras_coordenadas_gix on obras using gist (coordenadas);

alter table obras
  add column latitude double precision
  generated always as (extensions.st_y(coordenadas::extensions.geometry)) stored;

alter table obras
  add column longitude double precision
  generated always as (extensions.st_x(coordenadas::extensions.geometry)) stored;

comment on column obras.coordenadas is
  'PostGIS geography(Point,4326). Grava via texto EWKT: SRID=4326;POINT(longitude latitude).';
