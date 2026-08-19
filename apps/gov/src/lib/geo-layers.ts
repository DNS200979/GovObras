/**
 * Registro das camadas do mapa territorial — cada entrada aponta pra uma
 * fonte pública de verdade, testada por curl direto no GetCapabilities de
 * cada serviço antes de entrar aqui (ver plano da feature). Nada de
 * endpoint ou nome de layer inventado: o que não está confirmado fica de
 * fora, comentado, em vez de fingir que existe.
 *
 * `abrangencia`: "nacional" cobre qualquer município; uma lista de
 * `codigo_ibge` restringe a camada aos municípios que têm aquela fonte
 * confirmada (hoje só Florianópolis tem geoportal próprio verificado).
 */

export type CategoriaCamada = "limite" | "preservacao" | "hidrografia" | "cadastro";

export interface CamadaWms {
  id: string;
  titulo: string;
  categoria: CategoriaCamada;
  tipo: "wms";
  /** Base do serviço WMS de origem — o proxy monta a query GetMap/GetFeatureInfo em cima disso. */
  baseUrl: string;
  layerName: string;
  /** "nacional" ou os códigos IBGE dos municípios em que essa camada é conhecida por existir. */
  abrangencia: "nacional" | string[];
  atribuicao: string;
  /** Ligada por padrão quando o painel de camadas abre. */
  ativaPorPadrao?: boolean;
}

export const CAMADAS_WMS: CamadaWms[] = [
  {
    id: "sicar-imoveis-rurais",
    titulo: "Imóveis rurais (CAR)",
    categoria: "cadastro",
    tipo: "wms",
    baseUrl: "https://geoserver.car.gov.br/geoserver/sicar/wms",
    layerName: "sicar_imoveis_sc",
    abrangencia: "nacional",
    atribuicao: "SICAR/IBAMA — geoserver.car.gov.br",
  },
  {
    id: "hidrografia-nascentes",
    titulo: "Nascentes (SC)",
    categoria: "hidrografia",
    tipo: "wms",
    baseUrl: "http://sigsc.sc.gov.br/sigserver/SIGSC/wms",
    layerName: "nascente",
    abrangencia: "nacional", // serviço estadual, mas sem filtro por município no GeoServer — mostra o que cair no bbox
    atribuicao: "SIGSC/SDS-SC — sigsc.sc.gov.br",
  },
  {
    id: "hidrografia-cursos-dagua",
    titulo: "Cursos d'água (SC)",
    categoria: "hidrografia",
    tipo: "wms",
    baseUrl: "http://sigsc.sc.gov.br/sigserver/SIGSC/wms",
    layerName: "curso_dagua",
    abrangencia: "nacional",
    atribuicao: "SIGSC/SDS-SC — sigsc.sc.gov.br",
  },
  // ---------- só Florianópolis: geoportal próprio confirmado ----------
  {
    id: "floripa-app-cursos-dagua",
    titulo: "APP de curso d'água",
    categoria: "preservacao",
    tipo: "wms",
    baseUrl: "https://geofloripa.pmf.sc.gov.br/geoserver/Geoportal/ows",
    layerName: "gvw_app_cursos_dagua_cartografia",
    abrangencia: ["4205407"],
    atribuicao: "GeoPortal/PMF Florianópolis",
    ativaPorPadrao: true,
  },
  {
    id: "floripa-app-nascentes",
    titulo: "APP de nascente (manancial)",
    categoria: "preservacao",
    tipo: "wms",
    baseUrl: "https://geofloripa.pmf.sc.gov.br/geoserver/Geoportal/ows",
    layerName: "gvw_nascentes_app",
    abrangencia: ["4205407"],
    atribuicao: "GeoPortal/PMF Florianópolis",
    ativaPorPadrao: true,
  },
  {
    id: "floripa-unidades-conservacao",
    titulo: "Unidades de conservação",
    categoria: "preservacao",
    tipo: "wms",
    baseUrl: "https://geofloripa.pmf.sc.gov.br/geoserver/Geoportal/ows",
    layerName: "gvw_unidades_conservacao",
    abrangencia: ["4205407"],
    atribuicao: "GeoPortal/PMF Florianópolis",
  },
  {
    id: "floripa-lotes",
    titulo: "Lotes urbanos",
    categoria: "cadastro",
    tipo: "wms",
    baseUrl: "https://geofloripa.pmf.sc.gov.br/geoserver/Geoportal/ows",
    layerName: "lotes_pgv_2023",
    abrangencia: ["4205407"],
    atribuicao: "GeoPortal/PMF Florianópolis",
  },
  {
    id: "floripa-inscricao-imobiliaria",
    titulo: "Inscrição imobiliária",
    categoria: "cadastro",
    tipo: "wms",
    baseUrl: "https://geofloripa.pmf.sc.gov.br/geoserver/Geoportal/ows",
    layerName: "vw_territoriais_inscricao",
    abrangencia: ["4205407"],
    atribuicao: "GeoPortal/PMF Florianópolis",
  },
  {
    id: "floripa-zoneamento",
    titulo: "Zoneamento (Plano Diretor)",
    categoria: "cadastro",
    tipo: "wms",
    baseUrl: "https://geofloripa.pmf.sc.gov.br/geoserver/Geoportal/ows",
    layerName: "gvw_zonas",
    abrangencia: ["4205407"],
    atribuicao: "GeoPortal/PMF Florianópolis",
  },
];

/**
 * Palhoça (4211900) e São José (4216602) ainda não têm camada própria
 * confirmada — geo.palhoca.sc.gov.br existe mas não deu pra verificar se é
 * GeoServer (fora do ar por HTTPS na checagem), e não achei geoportal
 * público de São José. Quando alguém confirmar, é só seguir o padrão
 * acima: baseUrl + layerName reais, abrangencia com o codigo_ibge certo.
 */

export function camadasParaMunicipio(codigoIbge: string | null): CamadaWms[] {
  return CAMADAS_WMS.filter((c) => c.abrangencia === "nacional" || (codigoIbge && c.abrangencia.includes(codigoIbge)));
}

export function getCamada(id: string): CamadaWms | undefined {
  return CAMADAS_WMS.find((c) => c.id === id);
}
