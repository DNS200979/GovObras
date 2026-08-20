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
 * Palhoça tem GeoServer público de verdade — a checagem anterior via
 * WebFetch tinha dado falso-negativo porque a ferramenta força HTTPS e
 * geo.palhoca.sc.gov.br só responde em HTTP puro (WildFly/Undertow,
 * plataforma comercial "Geomais Geotecnologia"). Confirmado com `curl`
 * direto + GetMap real (bytes de conteúdo, não tile vazio) antes de
 * entrar aqui.
 */

export const CAMADAS_WMS_PALHOCA: CamadaWms[] = [
  {
    id: "palhoca-lotes",
    titulo: "Lotes urbanos",
    categoria: "cadastro",
    tipo: "wms",
    baseUrl: "http://geo.palhoca.sc.gov.br/geoserver/ows",
    layerName: "gm_palhoca:st_lote",
    abrangencia: ["4211900"],
    atribuicao: "Geoportal/Prefeitura de Palhoça (Geomais)",
  },
  {
    id: "palhoca-inscricao-imobiliaria",
    titulo: "Inscrição imobiliária",
    categoria: "cadastro",
    tipo: "wms",
    baseUrl: "http://geo.palhoca.sc.gov.br/geoserver/ows",
    layerName: "gm_palhoca:view_st_camada_inscricao",
    abrangencia: ["4211900"],
    atribuicao: "Geoportal/Prefeitura de Palhoça (Geomais)",
  },
  {
    id: "palhoca-zoneamento",
    titulo: "Zoneamento (Plano Diretor)",
    categoria: "cadastro",
    tipo: "wms",
    baseUrl: "http://geo.palhoca.sc.gov.br/geoserver/ows",
    layerName: "gm_palhoca:view_st_zoneamento",
    abrangencia: ["4211900"],
    atribuicao: "Geoportal/Prefeitura de Palhoça (Geomais)",
  },
  {
    id: "palhoca-vegetacao",
    titulo: "Vegetação",
    categoria: "preservacao",
    tipo: "wms",
    baseUrl: "http://geo.palhoca.sc.gov.br/geoserver/ows",
    layerName: "gm_palhoca:st_vegetacao",
    abrangencia: ["4211900"],
    atribuicao: "Geoportal/Prefeitura de Palhoça (Geomais)",
    ativaPorPadrao: true,
  },
  {
    id: "palhoca-hidrografia",
    titulo: "Hidrografia",
    categoria: "hidrografia",
    tipo: "wms",
    baseUrl: "http://geo.palhoca.sc.gov.br/geoserver/ows",
    layerName: "gm_palhoca:st_hidrografia",
    abrangencia: ["4211900"],
    atribuicao: "Geoportal/Prefeitura de Palhoça (Geomais)",
  },
];

/**
 * São José (4216602) também é cliente Geomais — confirmado por reportagem
 * no site oficial (equipe da Geomais fazendo o levantamento de campo do
 * cadastro) — mas não achei o hostname público do geoportal: nenhuma das
 * variantes óbvias (geo.saojose.sc.gov.br, sig.saojose.sc.gov.br,
 * *.geomais.com.br etc.) resolve, e a página do site sobre "mapas em
 * arquivo vetorial" não linka pra nenhum serviço externo. Provavelmente
 * existe mas com um nome não-óbvio, ou não está exposto publicamente
 * ainda. Quando alguém souber a URL certa, é só replicar o padrão de
 * Palhoça acima.
 *
 * Mapa do Registro de Imóveis (ONR/SIG-RI, mapa.onr.org.br) — pesquisado e
 * descartado por enquanto: não embute em iframe (`X-Frame-Options:
 * sameorigin`, confirmado), e o backend real por trás da página
 * (gis-mapas.onr.org.br, parece ArcGIS Server) responde 401 direto na
 * raiz — exige credencial institucional, não é serviço público. O único
 * "API" documentado é de um broker comercial terceiro (Infosimples),
 * pago. Pra integrar de verdade: ou conseguir acesso institucional
 * ONR/Intranet, ou contratar um broker desses — nenhum dos dois é algo
 * que dá pra simular aqui.
 */

const TODAS_CAMADAS: CamadaWms[] = [...CAMADAS_WMS, ...CAMADAS_WMS_PALHOCA];

export function camadasParaMunicipio(codigoIbge: string | null): CamadaWms[] {
  return TODAS_CAMADAS.filter((c) => c.abrangencia === "nacional" || (codigoIbge && c.abrangencia.includes(codigoIbge)));
}

export function getCamada(id: string): CamadaWms | undefined {
  return TODAS_CAMADAS.find((c) => c.id === id);
}
