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
} from "@carbonfree/ui/shadcn/sheet";
import { Textarea } from "@carbonfree/ui/shadcn/textarea";
import { TEMAS } from "@/lib/financiamento";
import { criarProjetoCaptacao, type ProjetoState } from "./actions";

export function NovoProjetoSheet() {
  const [aberto, setAberto] = useState(false);
  const [state, formAction, pending] = useActionState<ProjetoState, FormData>(
    criarProjetoCaptacao,
    {},
  );

  return (
    <>
      <Button onClick={() => setAberto(true)}>
        <Plus /> Novo projeto
      </Button>

      <Sheet open={aberto} onOpenChange={setAberto}>
        <SheetContent className="overflow-y-auto">
          <form action={formAction}>
            <SheetHeader>
              <SheetTitle>Novo projeto de captação</SheetTitle>
              <SheetDescription>
                O diagnóstico já entra parcialmente respondido com o que a plataforma sabe.
              </SheetDescription>
            </SheetHeader>

            <div className="grid gap-4 px-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome do projeto</Label>
                <Input
                  id="nome"
                  name="nome"
                  required
                  placeholder="Ex.: Programa de drenagem urbana da bacia do Itacorubi"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tema">Tema</Label>
                <Select name="tema" required defaultValue="">
                  <SelectTrigger id="tema" className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMAS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="valorEstimado">Valor estimado (R$, opcional)</Label>
                <Input id="valorEstimado" name="valorEstimado" inputMode="decimal" placeholder="45000000" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  name="descricao"
                  required
                  rows={5}
                  placeholder="Problema, solução proposta, beneficiários e componentes principais."
                />
              </div>

              {state.error ? (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              ) : null}
            </div>

            <SheetFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Criando…" : "Criar e diagnosticar"}
              </Button>
              <SheetClose render={<Button variant="outline" type="button">Cancelar</Button>} />
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
