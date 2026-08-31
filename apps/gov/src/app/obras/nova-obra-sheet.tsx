"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@carbonfree/ui/shadcn/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@carbonfree/ui/shadcn/sheet";
import { criarObra, type CriarObraState } from "./actions";
import { ObraCamposForm } from "./obra-campos-form";

interface Props {
  construtoras: { id: string; razao_social: string; cnpj_cpf: string }[];
}

export function NovaObraSheet({ construtoras }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<CriarObraState, FormData>(criarObra, {});

  if (state.ok && open) {
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm"><Plus />Nova obra</Button>} />
      <SheetContent className="overflow-y-auto">
        <form action={formAction}>
          <SheetHeader>
            <SheetTitle>Cadastrar obra</SheetTitle>
            <SheetDescription>
              Vínculo com alvará, tipologia e área — seção 06 do plano (Cadastro de obras).
            </SheetDescription>
          </SheetHeader>

          <ObraCamposForm construtoras={construtoras} permitirNovaConstrutora error={state.error} />

          <SheetFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Cadastrando…" : "Cadastrar obra"}
            </Button>
            <SheetClose render={<Button variant="outline" type="button">Cancelar</Button>} />
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
