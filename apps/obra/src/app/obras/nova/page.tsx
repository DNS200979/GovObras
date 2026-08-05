import { ObraShell } from "@/components/obra-shell";
import { Card, CardEyebrow } from "@carbonfree/ui/card";
import { listMunicipios } from "@/lib/queries";
import { NovaObraForm } from "./nova-obra-form";

export const dynamic = "force-dynamic";

export default async function NovaObraPage() {
  const municipios = await listMunicipios();

  return (
    <ObraShell active="/obras">
      <CardEyebrow>Obras · novo cadastro</CardEyebrow>
      <h1 className="mt-1 mb-1 font-display text-3xl font-extrabold tracking-tight text-texto">
        Cadastrar obra
      </h1>
      <p className="mb-6 max-w-2xl text-[13.5px] text-texto-fraco">
        Depois de cadastrar, você anexa os documentos exigidos pela prefeitura (alvará, projeto
        aprovado, ART/RRT e o que mais for pedido) na página da obra.
      </p>

      <Card className="max-w-3xl">
        {municipios.length === 0 ? (
          <p className="text-[13.5px] text-texto-fraco">
            Nenhum município disponível no programa ainda.
          </p>
        ) : (
          <NovaObraForm municipios={municipios} />
        )}
      </Card>
    </ObraShell>
  );
}
