"use client";

import { useActionState, useState } from "react";
import { Flame, Leaf, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { criarRequisito, type CriarRequisitoState } from "./actions";

export function NovoRequisitoSheet() {
  const [open, setOpen] = useState(false);
  const [natureza, setNatureza] = useState<"passivo" | "ativo">("passivo");
  const [state, formAction, pending] = useActionState<CriarRequisitoState, FormData>(
    criarRequisito,
    {},
  );

  if (state.ok && open) {
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm"><Plus />Novo requisito</Button>} />
      <SheetContent className="overflow-y-auto">
        <form action={formAction}>
          <SheetHeader>
            <SheetTitle>Cadastrar requisito auditável</SheetTitle>
            <SheetDescription>
              O que exatamente o fiscal pode checar e contestar — seção 05 do plano.
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 px-4">
            <div className="grid gap-2">
              <Label htmlFor="natureza">Natureza</Label>
              <Select name="natureza" value={natureza} onValueChange={(v) => setNatureza(v as "passivo" | "ativo")}>
                <SelectTrigger id="natureza" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passivo">
                    <Flame className="text-[var(--color-ambar)]" /> Passivo — o que a obra emite
                  </SelectItem>
                  <SelectItem value="ativo">
                    <Leaf className="text-primary" /> Ativo — o que reduz ou remove
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  name="codigo"
                  placeholder={natureza === "passivo" ? "A1-A3, A4, A5, USO, B1…" : "SUB, RCC, ENE, ARB…"}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unidade">Unidade</Label>
                <Input id="unidade" name="unidade" placeholder="t · tCO₂e/t" required />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="requisito">Requisito</Label>
              <Input id="requisito" name="requisito" placeholder="O que é medido" required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="evidenciaPrimaria">Evidência primária</Label>
              <Textarea id="evidenciaPrimaria" name="evidenciaPrimaria" rows={2} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="testeVerificacao">Teste de verificação</Label>
              <Textarea id="testeVerificacao" name="testeVerificacao" rows={3} required />
            </div>

            {state.error ? (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
          </div>

          <SheetFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Cadastrando…" : "Cadastrar requisito"}
            </Button>
            <SheetClose render={<Button variant="outline" type="button">Cancelar</Button>} />
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
