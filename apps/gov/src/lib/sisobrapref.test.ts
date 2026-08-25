import { describe, expect, it } from "vitest";
import {
  MAX_ALVARAS_POR_LOTE,
  TAMANHO_MAX_MENSAGEM_BYTES,
  competenciaDeReferencia,
  diasAteOPrazo,
  gerarDeclaracaoSemMovimento,
  gerarLoteAlvaras,
  pendenciasDoAlvara,
  prazoDaCompetencia,
  type AlvaraSisobra,
} from "./sisobrapref";

/** Alvará completo — cada teste retira ou altera só o que está sob prova. */
function alvara(over: Partial<AlvaraSisobra> = {}): AlvaraSisobra {
  return {
    numeroAlvara: "2026/000123",
    nomeObra: "Residencial Aroeira",
    dataAlvara: "2026-07-15",
    dataInicioObra: "2026-08-01",
    dataFinalObra: null,
    tipoAlvara: "construcao",
    responsavelExecObra: "empresa",
    cnpjCpfResponsavel: "12.345.678/0001-90",
    cep: "88.130-000",
    tipoLogradouro: "Rua",
    logradouro: "das Palmeiras",
    numeroImovel: "220",
    complemento: null,
    bairro: "Centro",
    areaCategoria: "residencial",
    areaDestinacao: "multifamiliar",
    areaTipoObra: "nova",
    areaM2: 1450.5,
    respTecnicoTipo: null,
    respTecnicoNome: null,
    respTecnicoRegistro: null,
    respTecnicoDocumento: null,
    ...over,
  };
}

describe("pendenciasDoAlvara", () => {
  it("não acusa pendência num alvará completo", () => {
    expect(pendenciasDoAlvara(alvara())).toEqual([]);
  });

  it("acusa campo obrigatório ausente pelo rótulo em português", () => {
    expect(pendenciasDoAlvara(alvara({ cep: null }))).toEqual(["CEP"]);
  });

  it("trata string vazia e só-espaços como ausente", () => {
    expect(pendenciasDoAlvara(alvara({ bairro: "" }))).toEqual(["bairro"]);
    expect(pendenciasDoAlvara(alvara({ bairro: "   " }))).toEqual(["bairro"]);
  });

  it("lista todas as pendências de uma vez, não só a primeira", () => {
    const p = pendenciasDoAlvara(alvara({ cep: null, bairro: null, logradouro: null }));
    expect(p).toHaveLength(3);
  });

  it("aceita responsável técnico ausente — é opcional no schema", () => {
    expect(pendenciasDoAlvara(alvara())).toEqual([]);
  });

  it("recusa responsável técnico preenchido pela metade", () => {
    const p = pendenciasDoAlvara(
      alvara({ respTecnicoTipo: "engenheiro", respTecnicoNome: "Ana Souza" }),
    );
    expect(p).toContain("responsável técnico incompleto");
  });

  it("aceita responsável técnico completo", () => {
    const p = pendenciasDoAlvara(
      alvara({
        respTecnicoTipo: "engenheiro",
        respTecnicoNome: "Ana Souza",
        respTecnicoRegistro: "CREA-SC 123456",
        respTecnicoDocumento: "ART-987",
      }),
    );
    expect(p).toEqual([]);
  });
});

describe("gerarLoteAlvaras", () => {
  it("monta o envelope na versão do leiaute", () => {
    const { xml } = gerarLoteAlvaras([alvara()]);

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<sisobraPref versao="1.03">');
    expect(xml).toContain("</sisobraPref>");
  });

  it("numera os alvarás sequencialmente com Id de 7 dígitos", () => {
    const { xml } = gerarLoteAlvaras([alvara(), alvara({ numeroAlvara: "2026/000124" })]);

    expect(xml).toContain('Id="id0000001"');
    expect(xml).toContain('Id="id0000002"');
  });

  it("remove máscara de CEP e CNPJ — a Receita recusa com pontuação", () => {
    const { xml } = gerarLoteAlvaras([alvara()]);

    expect(xml).toContain("<cep>88130000</cep>");
    expect(xml).toContain("<cnpj>12345678000190</cnpj>");
    expect(xml).not.toContain("88.130-000");
  });

  it("usa a tag cpf quando o documento tem 11 dígitos", () => {
    const { xml } = gerarLoteAlvaras([
      alvara({ responsavelExecObra: "pessoaFisica", cnpjCpfResponsavel: "123.456.789-09" }),
    ]);

    expect(xml).toContain("<cpf>12345678909</cpf>");
    expect(xml).not.toContain("<cnpj>");
  });

  it("omite tag de campo nulo em vez de emitir tag vazia", () => {
    const { xml } = gerarLoteAlvaras([alvara({ dataFinalObra: null, complemento: null })]);

    expect(xml).not.toContain("<dataFinalObra>");
    expect(xml).not.toContain("<complemento>");
  });

  it("escapa caractere especial de XML no nome da obra", () => {
    const { xml } = gerarLoteAlvaras([alvara({ nomeObra: 'Obra "A" & <B>' })]);

    expect(xml).toContain("<nomeObra>Obra &quot;A&quot; &amp; &lt;B&gt;</nomeObra>");
    expect(xml).not.toContain("Obra \"A\" & <B>");
  });

  it("emite área com duas casas decimais", () => {
    const { xml } = gerarLoteAlvaras([alvara({ areaM2: 1450.5 })]);
    expect(xml).toContain("<area>1450.50</area>");
  });

  it("usa cau/rrt para arquiteto e crea/art para engenheiro", () => {
    const rt = {
      respTecnicoNome: "Ana Souza",
      respTecnicoRegistro: "R-1",
      respTecnicoDocumento: "D-1",
    };

    expect(gerarLoteAlvaras([alvara({ respTecnicoTipo: "arquiteto", ...rt })]).xml).toContain(
      "<cau>R-1</cau>",
    );
    expect(gerarLoteAlvaras([alvara({ respTecnicoTipo: "engenheiro", ...rt })]).xml).toContain(
      "<crea>R-1</crea>",
    );
  });

  it("sinaliza quando o lote passa de 50 alvarás", () => {
    const dentro = gerarLoteAlvaras(Array.from({ length: MAX_ALVARAS_POR_LOTE }, () => alvara()));
    const fora = gerarLoteAlvaras(Array.from({ length: MAX_ALVARAS_POR_LOTE + 1 }, () => alvara()));

    expect(dentro.excedeuQuantidade).toBe(false);
    expect(fora.excedeuQuantidade).toBe(true);
  });

  it("sinaliza quando a mensagem passa de 500 KB", () => {
    const pequeno = gerarLoteAlvaras([alvara()]);
    expect(pequeno.bytes).toBeLessThan(TAMANHO_MAX_MENSAGEM_BYTES);
    expect(pequeno.excedeuTamanho).toBe(false);

    // Nome longo o bastante para estourar o teto sozinho.
    const gigante = gerarLoteAlvaras([alvara({ nomeObra: "x".repeat(TAMANHO_MAX_MENSAGEM_BYTES) })]);
    expect(gigante.excedeuTamanho).toBe(true);
  });

  it("mede o tamanho em bytes UTF-8, não em caracteres", () => {
    const { xml, bytes } = gerarLoteAlvaras([alvara({ nomeObra: "Residência Ipê" })]);

    expect(bytes).toBe(Buffer.byteLength(xml, "utf8"));
    expect(bytes).toBeGreaterThan(xml.length); // acentos ocupam 2 bytes
  });
});

describe("gerarDeclaracaoSemMovimento", () => {
  it("declara ano e mês da competência, com mês em dois dígitos", () => {
    const { xml } = gerarDeclaracaoSemMovimento("12.345.678/0001-90", new Date(Date.UTC(2026, 6, 1)));

    expect(xml).toContain("<anoCompetencia>2026</anoCompetencia>");
    expect(xml).toContain("<mesCompetencia>07</mesCompetencia>");
    expect(xml).toContain("<cnpj>12345678000190</cnpj>");
  });

  it("nunca excede os limites — é sempre uma mensagem única e pequena", () => {
    const r = gerarDeclaracaoSemMovimento("12345678000190", new Date(Date.UTC(2026, 0, 1)));

    expect(r.excedeuTamanho).toBe(false);
    expect(r.excedeuQuantidade).toBe(false);
  });
});

describe("competência e prazo", () => {
  it("a competência de referência é sempre o mês anterior", () => {
    const c = competenciaDeReferencia(new Date(Date.UTC(2026, 7, 24)));

    expect(c.getUTCFullYear()).toBe(2026);
    expect(c.getUTCMonth()).toBe(6); // julho
    expect(c.getUTCDate()).toBe(1);
  });

  it("vira o ano corretamente em janeiro", () => {
    const c = competenciaDeReferencia(new Date(Date.UTC(2026, 0, 5)));

    expect(c.getUTCFullYear()).toBe(2025);
    expect(c.getUTCMonth()).toBe(11); // dezembro
  });

  it("o prazo é o dia 10 do mês seguinte ao da competência", () => {
    const prazo = prazoDaCompetencia(new Date(Date.UTC(2026, 6, 1)));

    expect(prazo.getUTCMonth()).toBe(7); // agosto
    expect(prazo.getUTCDate()).toBe(10);
  });

  it("o prazo da competência de dezembro cai em 10 de janeiro do ano seguinte", () => {
    const prazo = prazoDaCompetencia(new Date(Date.UTC(2025, 11, 1)));

    expect(prazo.getUTCFullYear()).toBe(2026);
    expect(prazo.getUTCMonth()).toBe(0);
    expect(prazo.getUTCDate()).toBe(10);
  });
});

describe("diasAteOPrazo", () => {
  const prazo = new Date(Date.UTC(2026, 7, 10)); // 10/08/2026

  it("conta os dias que faltam", () => {
    expect(diasAteOPrazo(prazo, new Date(Date.UTC(2026, 7, 1)))).toBe(9);
  });

  it("é zero no próprio dia do prazo", () => {
    expect(diasAteOPrazo(prazo, new Date(Date.UTC(2026, 7, 10)))).toBe(0);
  });

  it("fica negativo depois de vencido", () => {
    expect(diasAteOPrazo(prazo, new Date(Date.UTC(2026, 7, 13)))).toBe(-3);
  });

  it("arredonda pra cima: sobrando algumas horas, ainda conta como um dia", () => {
    // 09/08 às 18h — faltam 6 horas, e isso é "1 dia", não "0".
    expect(diasAteOPrazo(prazo, new Date(Date.UTC(2026, 7, 9, 18)))).toBe(1);
  });
});
