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

/**
 * Alcance de uma camada.
 *
 * `{ uf }` casa pelos dois primeiros dígitos do código IBGE, que são o código
 * da unidade federativa. Serviço estadual é estadual — marcar como "nacional"
 * faz a camada aparecer vazia fora do estado, e (pior) faz a verificação
 * territorial devolver "nenhuma área protegida encontrada" quando o correto
 * seria "não há fonte para este estado".
 */
export type Abrangencia =
  | "nacional"
  | { uf: string }
  | string[];

export interface CamadaWms {
  id: string;
  titulo: string;
  categoria: CategoriaCamada;
  tipo: "wms";
  /** Base do serviço WMS de origem — o proxy monta a query GetMap/GetFeatureInfo em cima disso. */
  baseUrl: string;
  layerName: string;
  abrangencia: Abrangencia;
  atribuicao: string;
  /** Ligada por padrão quando o painel de camadas abre. */
  ativaPorPadrao?: boolean;
}

export const CAMADAS_WMS: CamadaWms[] = [
  {
    id: "hidrografia-nascentes",
    titulo: "Nascentes (SC)",
    categoria: "hidrografia",
    tipo: "wms",
    baseUrl: "http://sigsc.sc.gov.br/sigserver/SIGSC/wms",
    layerName: "nascente",
    abrangencia: { uf: "42" }, // SIGSC é serviço estadual de SC: fora do estado devolve vazio
    atribuicao: "SIGSC/SDS-SC — sigsc.sc.gov.br",
  },
  {
    id: "hidrografia-cursos-dagua",
    titulo: "Cursos d'água (SC)",
    categoria: "hidrografia",
    tipo: "wms",
    baseUrl: "http://sigsc.sc.gov.br/sigserver/SIGSC/wms",
    layerName: "curso_dagua",
    abrangencia: { uf: "42" },
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
 * Rio Grande do Sul (Porto Alegre 4314902, Canoas 4304606, Novo Hamburgo
 * 4313409) — municípios cadastrados, mas SEM camada municipal ou estadual
 * confirmada. O que foi testado e o resultado:
 *
 *   - geo.poa.br, sig.procempa.com.br, geoportal.canoas.rs.gov.br,
 *     geo.novohamburgo.rs.gov.br — nenhum resolve (DNS).
 *   - iede.rs.gov.br (infraestrutura estadual de dados espaciais) e
 *     ww2.fepam.rs.gov.br respondem 200 na raiz, mas /geoserver/wms e
 *     /geoserver/ows dão 404 — o serviço existe em outro caminho, que a
 *     página não expõe (é SPA, sem HTML útil para descobrir).
 *   - A página de mapas da SMAMUS (Porto Alegre) publica arquivo para
 *     download — shapefile, KMZ, PDF, DWG — e não serviço OGC.
 *
 * Ou seja: nas três cidades gaúchas o mapa tem hoje o contorno do IBGE e o
 * CAR do RS, e nada de zoneamento, lote ou APP. Quem descobrir a URL certa
 * do IEDE ou de um geoportal municipal replica o padrão de Palhoça acima.
 * Enquanto isso, a ausência aparece como ausência na tela, e não como
 * "nada encontrado".
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

/**
 * Prefixo do código IBGE → sigla da UF. Os dois primeiros dígitos do código de
 * município são o código da unidade federativa.
 */
const UF_POR_PREFIXO: Record<string, string> = {
  "11": "ro", "12": "ac", "13": "am", "14": "rr", "15": "pa", "16": "ap", "17": "to",
  "21": "ma", "22": "pi", "23": "ce", "24": "rn", "25": "pb", "26": "pe", "27": "al",
  "28": "se", "29": "ba", "31": "mg", "32": "es", "33": "rj", "35": "sp", "41": "pr",
  "42": "sc", "43": "rs", "50": "ms", "51": "mt", "52": "go", "53": "df",
};

/**
 * O SICAR publica uma camada por UF (`sicar_imoveis_<uf>`) — as 27 foram
 * confirmadas no GetCapabilities de geoserver.car.gov.br. Antes havia uma
 * entrada única marcada "nacional" apontando para `sicar_imoveis_sc`, o que
 * mostrava imóveis de Santa Catarina — ou nada — em qualquer outro estado.
 *
 * Derivando do código IBGE, todo município novo já entra com o CAR do seu
 * estado, sem precisar cadastrar camada nenhuma.
 */
const CAMADAS_SICAR: CamadaWms[] = Object.entries(UF_POR_PREFIXO).map(([prefixo, uf]) => ({
  id: `sicar-imoveis-${uf}`,
  titulo: "Imóveis rurais (CAR)",
  categoria: "cadastro",
  tipo: "wms",
  baseUrl: "https://geoserver.car.gov.br/geoserver/sicar/wms",
  layerName: `sicar_imoveis_${uf}`,
  abrangencia: { uf: prefixo },
  atribuicao: "SICAR/IBAMA — geoserver.car.gov.br",
}));

const TODAS_CAMADAS: CamadaWms[] = [...CAMADAS_SICAR, ...CAMADAS_WMS, ...CAMADAS_WMS_PALHOCA];

function cobre(abrangencia: Abrangencia, codigoIbge: string | null): boolean {
  if (abrangencia === "nacional") return true;
  if (!codigoIbge) return false;
  if (Array.isArray(abrangencia)) return abrangencia.includes(codigoIbge);
  return codigoIbge.startsWith(abrangencia.uf);
}

export function camadasParaMunicipio(codigoIbge: string | null): CamadaWms[] {
  return TODAS_CAMADAS.filter((c) => cobre(c.abrangencia, codigoIbge));
}

export function getCamada(id: string): CamadaWms | undefined {
  return TODAS_CAMADAS.find((c) => c.id === id);
}
