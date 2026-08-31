import { ObraShell } from "@/components/obra-shell";
import { Card, CardEyebrow, CardTitle } from "@carbonfree/ui/card";
import { getCertificacaoDaObra, listObras } from "@/lib/queries";
import { BASE_LEGAL, alertaDePrazo } from "@/lib/certificacao-poa";
import { EsgSubnav } from "../esg-subnav";
import { SimuladorCertificacao } from "./simulador-certificacao";

export const dynamic = "force-dynamic";

export default async function CertificacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ obra?: string }>;
}) {
  const { obra: obraParam } = await searchParams;
  const obras = await listObras();

  // A obra escolhida vive na URL, e não no estado do cliente, porque é ela que
  // determina qual certificação o servidor carrega.
  const obraId = obras.find((o) => o.id === obraParam)?.id ?? obras[0]?.id ?? "";
  const certificacao = obraId ? await getCertificacaoDaObra(obraId) : null;

  // Calculado no servidor: `new Date()` dentro do componente cliente daria
  // hidratação divergente entre o HTML do servidor e o primeiro render.
  const bruto = alertaDePrazo(new Date());
  const alerta = {
    exercicioSePedirHoje: bruto.exercicioSePedirHoje,
    prazo: bruto.prazoParaGanharUmAno?.toLocaleDateString("pt-BR") ?? null,
    mensagem: bruto.mensagem,
  };

  return (
    <ObraShell active="/esg">
      <EsgSubnav ativo="/esg/certificacao" />

      <div className="mb-6">
        <CardEyebrow>Porto Alegre · LC nº 872/2020 + Decreto nº 21.789/2022</CardEyebrow>
        <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-texto">
          Certificação em Sustentabilidade Ambiental
        </h1>
        <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-texto-fraco">
          Sete dimensões, cada uma com pontuação mínima própria. O selo sai da{" "}
          <strong className="text-texto">contagem de dimensões que bateram o mínimo</strong> — não
          de uma nota geral. Isso muda a estratégia: aprovar sobrando numa dimensão não compensa
          reprovar em outra, e Diamante sai com cinco dimensões, não com as sete.
        </p>
      </div>

      <Card className="mb-4 border-azul/30">
        <CardTitle>Como isto conversa com o balanço de carbono</CardTitle>
        <p className="text-[12.5px] leading-relaxed text-texto">
          São dois eixos diferentes, e vale não confundir. A régua de faixas do painel mede
          intensidade em kgCO₂e/m² e vale para o programa de carbono do município. A certificação
          de Porto Alegre pontua por dimensão: o inventário da obra alimenta a dimensão{" "}
          <strong>Energia e Emissão de GEE</strong>, e o RCC alimenta <strong>Resíduos</strong> —
          mas as outras cinco dependem de projeto, não de inventário. Intensidade excelente com
          projeto que não trata das demais dimensões não gera selo.
        </p>
      </Card>

      {obras.length === 0 ? (
        <Card>
          <p className="text-center text-[13.5px] text-texto-fraco">
            Cadastre uma obra para montar o quadro de pontuação.
          </p>
        </Card>
      ) : (
        <SimuladorCertificacao
          // Remonta ao trocar de obra: o estado do quadro é da certificação
          // carregada, não do componente.
          key={obraId}
          obras={obras}
          obraId={obraId}
          certificacao={certificacao}
          alerta={alerta}
        />
      )}

      <Card className="mt-4">
        <CardTitle>Base legal</CardTitle>
        <ul className="space-y-2">
          {BASE_LEGAL.map((b) => (
            <li key={b.norma}>
              <p className="font-mono text-[11px] font-semibold text-texto">{b.norma}</p>
              <p className="text-[12px] leading-relaxed text-texto-fraco">{b.oQueEstabelece}</p>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-linha/60 pt-3 text-[11.5px] leading-relaxed text-texto-fraco">
          O quadro é uma simulação de apoio à decisão, preenchida por você — não substitui a
          análise da SMAMUS, que pode exigir complementação. Critérios cuja pontuação o Anexo I
          define por faixa aparecem com campo aberto, para você informar o valor lido no Anexo em
          vez de o sistema arbitrar um número. O pedido é feito pelo Portal de Licenciamento.
        </p>
      </Card>
    </ObraShell>
  );
}
