"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Alert, AlertDescription } from "@carbonfree/ui/shadcn/alert";
import { Button } from "@carbonfree/ui/shadcn/button";
import { Input } from "@carbonfree/ui/shadcn/input";
import { Label } from "@carbonfree/ui/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@carbonfree/ui/shadcn/select";
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
import { criarConstrutora, type CriarConstrutoraState } from "./actions";

export function NovaConstrutoraSheet() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<CriarConstrutoraState, FormData>(
    criarConstrutora,
    {},
  );

  if (state.ok && open) {
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm"><Plus />Nova construtora</Button>} />
      <SheetContent>
        <form action={formAction}>
          <SheetHeader>
            <SheetTitle>Cadastrar construtora</SheetTitle>
            <SheetDescription>
              Construtora ou profissional independente — vira selecionável no cadastro de obras.
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 px-4">
            <div className="grid gap-2">
              <Label htmlFor="razaoSocial">Razão social / nome</Label>
              <Input id="razaoSocial" name="razaoSocial" required autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cnpjCpf">CNPJ/CPF</Label>
                <Input id="cnpjCpf" name="cnpjCpf" placeholder="00.000.000/0001-00" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select name="tipo" defaultValue="pj">
                  <SelectTrigger id="tipo" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pj">Empresa (PJ)</SelectItem>
                    <SelectItem value="profissional_independente">Profissional independente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {state.error ? (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
          </div>

          <SheetFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Cadastrando…" : "Cadastrar"}
            </Button>
            <SheetClose render={<Button variant="outline" type="button">Cancelar</Button>} />
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
