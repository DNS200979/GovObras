"use client";

import { useActionState, useState } from "react";
import { Alert, AlertDescription } from "@carbonfree/ui/shadcn/alert";
import { Button } from "@carbonfree/ui/shadcn/button";
import { Input } from "@carbonfree/ui/shadcn/input";
import { Label } from "@carbonfree/ui/shadcn/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@carbonfree/ui/shadcn/sheet";
import { registrarEnvio, type RegistrarEnvioState } from "./actions";

export function RegistrarProtocolo({
  competencia,
  tipo,
  totalAlvaras,
  rotulo,
}: {
  competencia: string;
  tipo: "lote" | "sem_movimento";
  totalAlvaras: number;
  rotulo: string;
}) {
  const [aberto, setAberto] = useState(false);
  const acao = registrarEnvio.bind(null, competencia, tipo, totalAlvaras);
  const [state, formAction, pending] = useActionState<RegistrarEnvioState, FormData>(acao, {});

  if (state.ok && aberto) setAberto(false);

  return (
    <>
      <Button variant="outline" onClick={() => setAberto(true)}>
        Registrar protocolo
      </Button>

      <Sheet open={aberto} onOpenChange={setAberto}>
        <SheetContent>
          <form action={formAction}>
            <SheetHeader>
              <SheetTitle>Registrar transmissão</SheetTitle>
              <SheetDescription>
                Competência {rotulo} ·{" "}
                {tipo === "sem_movimento"
                  ? "declaração de sem movimento"
                  : `${totalAlvaras} alvará${totalAlvaras === 1 ? "" : "s"}`}
              </SheetDescription>
            </SheetHeader>

            <div className="grid gap-2 px-4">
              <Label htmlFor="protocolo">Protocolo devolvido pela Receita</Label>
              <Input id="protocolo" name="protocolo" required autoFocus />
              <p className="text-[12px] text-muted-foreground">
                A Receita devolve um número de protocolo por documento transmitido. Guardá-lo aqui
                é o que comprova o cumprimento da competência.
              </p>
              {state.error ? (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              ) : null}
            </div>

            <SheetFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando…" : "Salvar"}
              </Button>
              <SheetClose render={<Button variant="outline" type="button">Cancelar</Button>} />
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
