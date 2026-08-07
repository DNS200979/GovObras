/**
 * Geração do XML do SisobraPref (Receita Federal).
 *
 * Leiaute conforme o "Manual Web Service SisobraPref" — schemas v1.03:
 *  - LoteAlvaraHabitese.xsd  → recepcaoLote     (alvarás e habite-se do mês)
 *  - DeclaracaoSemMovimento  → recepcaoDSM      (mês sem emissões)
 *
 * Este módulo só monta o XML. A assinatura digital (XMLDSig com certificado
 * e-CNPJ do município) e o envio SOAP com autenticação mútua ficam fora daqui
 * de propósito: dependem de certificado e de adesão ao DTE, e isolá-los
 * mantém a geração testável sem segredo nenhum.
 */

/** Um lote comporta no máximo 50 alvarás (manual, seção 5.4.1). */
export const MAX_ALVARAS_POR_LOTE = 50;

/** A mensagem é descartada acima de 500 KB (manual, seção 5.0). */
export const TAMANHO_MAX_MENSAGEM_BYTES = 500 * 1024;

export interface AlvaraSisobra {
  numeroAlvara: string;
  nomeObra: string;
  dataAlvara: string | null;
  dataInicioObra: string | null;
  dataFinalObra: string | null;
  tipoAlvara: string | null;
  responsavelExecObra: string | null;
  cnpjCpfResponsavel: string | null;
  cep: string | null;
  tipoLogradouro: string | null;
  logradouro: string | null;
  numeroImovel: string | null;
  complemento: string | null;
  bairro: string | null;
  areaCategoria: string | null;
  areaDestinacao: string | null;
  areaTipoObra: string | null;
  areaM2: number;
  respTecnicoTipo: string | null;
  respTecnicoNome: string | null;
  respTecnicoRegistro: string | null;
  respTecnicoDocumento: string | null;
}

/** Campos que o leiaute marca como obrigatórios (ocorrência 1-1). */
const OBRIGATORIOS: { campo: keyof AlvaraSisobra; rotulo: string }[] = [
  { campo: "numeroAlvara", rotulo: "número do alvará" },
  { campo: "nomeObra", rotulo: "nome da obra" },
  { campo: "dataAlvara", rotulo: "data do alvará" },
  { campo: "dataInicioObra", rotulo: "data de início da obra" },
  { campo: "tipoAlvara", rotulo: "tipo do alvará" },
  { campo: "responsavelExecObra", rotulo: "responsável pela execução" },
  { campo: "cep", rotulo: "CEP" },
  { campo: "logradouro", rotulo: "logradouro" },
  { campo: "bairro", rotulo: "bairro" },
  { campo: "areaCategoria", rotulo: "categoria da área" },
  { campo: "areaDestinacao", rotulo: "destinação da área" },
  { campo: "areaTipoObra", rotulo: "tipo da obra" },
];

/** Lista o que ainda falta para um alvará poder ser transmitido. */
export function pendenciasDoAlvara(a: AlvaraSisobra): string[] {
  const faltando = OBRIGATORIOS.filter(({ campo }) => {
    const v = a[campo];
    return v === null || v === undefined || String(v).trim() === "";
  }).map(({ rotulo }) => rotulo);

  // O responsável técnico é opcional no schema (0-1), mas se declarado
  // precisa vir completo — meio preenchido é rejeitado.
  if (a.respTecnicoTipo || a.respTecnicoNome || a.respTecnicoRegistro || a.respTecnicoDocumento) {
    if (!a.respTecnicoTipo || !a.respTecnicoNome || !a.respTecnicoRegistro || !a.respTecnicoDocumento) {
      faltando.push("responsável técnico incompleto");
    }
  }

  return faltando;
}

function escapar(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function tag(nome: string, valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined || String(valor).trim() === "") return "";
  return `<${nome}>${escapar(String(valor))}</${nome}>`;
}

/** Só dígitos — a Receita recusa CNPJ/CPF e CEP com máscara. */
function digitos(valor: string | null): string | null {
  if (!valor) return null;
  const limpo = valor.replace(/\D/g, "");
  return limpo === "" ? null : limpo;
}

/** Bloco do responsável pela execução: a tag interna varia conforme a categoria. */
function blocoResponsavelExecucao(a: AlvaraSisobra): string {
  if (!a.responsavelExecObra) return "";
  const doc = digitos(a.cnpjCpfResponsavel);
  if (!doc) return `<responsavelExecObra><${a.responsavelExecObra}/></responsavelExecObra>`;

  // CPF tem 11 dígitos; acima disso é CNPJ.
  const tagDoc = doc.length === 11 ? tag("cpf", doc) : tag("cnpj", doc);
  return `<responsavelExecObra><${a.responsavelExecObra}>${tagDoc}</${a.responsavelExecObra}></responsavelExecObra>`;
}

/** Bloco do responsável técnico: conselho e documento dependem do tipo. */
function blocoResponsavelTecnico(a: AlvaraSisobra): string {
  if (!a.respTecnicoTipo || !a.respTecnicoNome) return "";

  const registro = a.respTecnicoTipo === "arquiteto" ? "cau" : "crea";
  const documento = a.respTecnicoTipo === "arquiteto" ? "rrt" : "art";

  return (
    "<responsavelTecnico>" +
    `<${a.respTecnicoTipo}>` +
    tag("nome", a.respTecnicoNome) +
    tag(registro, a.respTecnicoRegistro) +
    tag(documento, a.respTecnicoDocumento) +
    `</${a.respTecnicoTipo}>` +
    "</responsavelTecnico>"
  );
}

function blocoAlvara(a: AlvaraSisobra, sequencial: number): string {
  const id = `id${String(sequencial).padStart(7, "0")}`;

  const endereco =
    "<enderecoObra>" +
    tag("cep", digitos(a.cep)) +
    tag("tipoLogradouro", a.tipoLogradouro) +
    tag("logradouro", a.logradouro) +
    tag("numeroImovel", a.numeroImovel) +
    tag("complemento", a.complemento) +
    tag("bairro", a.bairro) +
    "</enderecoObra>";

  const area =
    "<area><areaPrincipal>" +
    tag("categoria", a.areaCategoria) +
    tag("destinacao", a.areaDestinacao) +
    tag("tipoObra", a.areaTipoObra) +
    tag("area", a.areaM2.toFixed(2)) +
    "</areaPrincipal></area>";

  return (
    `<Alvara><infAlvara Id="${id}">` +
    tag("numeroAlvara", a.numeroAlvara) +
    tag("nomeObra", a.nomeObra) +
    tag("dataAlvara", a.dataAlvara) +
    tag("dataInicioObra", a.dataInicioObra) +
    tag("dataFinalObra", a.dataFinalObra) +
    tag("tipoAlvara", a.tipoAlvara) +
    blocoResponsavelExecucao(a) +
    endereco +
    area +
    blocoResponsavelTecnico(a) +
    "</infAlvara></Alvara>"
  );
}

export interface ResultadoXml {
  xml: string;
  bytes: number;
  excedeuTamanho: boolean;
  excedeuQuantidade: boolean;
}

/** Monta o lote de alvarás (recepcaoLote). */
export function gerarLoteAlvaras(alvaras: AlvaraSisobra[], versao = "1.03"): ResultadoXml {
  const corpo = alvaras.map((a, i) => blocoAlvara(a, i + 1)).join("");
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<sisobraPref versao="${versao}">` +
    corpo +
    "</sisobraPref>";

  const bytes = Buffer.byteLength(xml, "utf8");
  return {
    xml,
    bytes,
    excedeuTamanho: bytes > TAMANHO_MAX_MENSAGEM_BYTES,
    excedeuQuantidade: alvaras.length > MAX_ALVARAS_POR_LOTE,
  };
}

/** Monta a declaração de sem movimento (recepcaoDSM) para uma competência. */
export function gerarDeclaracaoSemMovimento(
  cnpjMunicipio: string,
  competencia: Date,
  versao = "1.03",
): ResultadoXml {
  const ano = competencia.getUTCFullYear();
  const mes = String(competencia.getUTCMonth() + 1).padStart(2, "0");

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<sisobraPref versao="${versao}">` +
    '<DeclaracaoSemMovimento><infDSM Id="id0000001">' +
    tag("cnpj", digitos(cnpjMunicipio)) +
    tag("anoCompetencia", ano) +
    tag("mesCompetencia", mes) +
    "</infDSM></DeclaracaoSemMovimento>" +
    "</sisobraPref>";

  const bytes = Buffer.byteLength(xml, "utf8");
  return { xml, bytes, excedeuTamanho: false, excedeuQuantidade: false };
}

/** Competência que vence no dia 10 de `hoje` — sempre o mês anterior. */
export function competenciaDeReferencia(hoje = new Date()): Date {
  return new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - 1, 1));
}

/** Prazo legal: dia 10 do mês seguinte ao da competência. */
export function prazoDaCompetencia(competencia: Date): Date {
  return new Date(Date.UTC(competencia.getUTCFullYear(), competencia.getUTCMonth() + 1, 10));
}

export function rotuloCompetencia(competencia: Date): string {
  return competencia.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
