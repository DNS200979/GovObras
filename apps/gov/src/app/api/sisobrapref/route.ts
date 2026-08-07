import { NextResponse } from "next/server";
import { getCompetenciaSisobra } from "@/lib/queries";
import { gerarDeclaracaoSemMovimento, gerarLoteAlvaras } from "@/lib/sisobrapref";

/**
 * Baixa o XML da competência no leiaute do SisobraPref.
 *
 * O arquivo sai SEM assinatura digital: a assinatura exige o certificado
 * e-CNPJ do município, que não vive na aplicação. O fluxo previsto é baixar,
 * assinar e transmitir com o certificado, e depois registrar o protocolo aqui.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const competenciaParam = searchParams.get("competencia");

  const competencia = competenciaParam ? new Date(competenciaParam + "T00:00:00Z") : undefined;
  if (competenciaParam && Number.isNaN(competencia!.getTime())) {
    return NextResponse.json({ error: "Competência inválida." }, { status: 400 });
  }

  const dados = await getCompetenciaSisobra(competencia);
  const prontos = dados.alvaras.filter((a) => a.pendencias.length === 0);

  let resultado;
  let nome;

  if (prontos.length === 0) {
    if (!dados.cnpjMunicipio) {
      return NextResponse.json(
        { error: "O município está sem CNPJ cadastrado — ele identifica o emissor no XML." },
        { status: 400 },
      );
    }
    resultado = gerarDeclaracaoSemMovimento(
      dados.cnpjMunicipio,
      new Date(dados.competencia + "T00:00:00Z"),
    );
    nome = `sisobrapref-sem-movimento-${dados.competencia.slice(0, 7)}.xml`;
  } else {
    resultado = gerarLoteAlvaras(prontos);
    nome = `sisobrapref-lote-${dados.competencia.slice(0, 7)}.xml`;
  }

  if (resultado.excedeuQuantidade || resultado.excedeuTamanho) {
    return NextResponse.json(
      {
        error: resultado.excedeuQuantidade
          ? "O lote passou de 50 alvarás — a Receita exige dividir em lotes menores."
          : "O lote passou de 500 KB — a Receita descarta mensagens maiores.",
      },
      { status: 400 },
    );
  }

  return new NextResponse(resultado.xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}"`,
    },
  });
}
