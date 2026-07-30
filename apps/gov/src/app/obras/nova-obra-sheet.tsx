"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { criarObra, type CriarObraState } from "./actions";

const tipologias = [
  "Residencial vertical",
  "Residencial horizontal",
  "Comercial",
  "Galpão logístico",
  "Misto",
];

const fases = [
  { value: "fundacao", label: "Fundação" },
  { value: "estrutura", label: "Estrutura" },
  { value: "acabamento", label: "Acabamento" },
  { value: "entrega", label: "Entrega" },
];

interface Props {
  construtoras: { id: string; razao_social: string; cnpj_cpf: string }[];
}

export function NovaObraSheet({ construtoras }: Props) {
  const [open, setOpen] = useState(false);
  const [novaConstrutora, setNovaConstrutora] = useState(construtoras.length === 0);
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

          <div className="grid gap-4 px-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="alvaraNumero">Nº do alvará</Label>
                <Input id="alvaraNumero" name="alvaraNumero" placeholder="ALV-2026-0001" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="areaM2">Área construída (m²)</Label>
                <Input id="areaM2" name="areaM2" type="number" min="1" step="0.01" required />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nome">Nome da obra</Label>
              <Input id="nome" name="nome" placeholder="Residencial Vista Verde" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tipologia">Tipologia</Label>
                <Select name="tipologia" required>
                  <SelectTrigger id="tipologia" className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipologias.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fase">Fase atual</Label>
                <Select name="fase" defaultValue="fundacao">
                  <SelectTrigger id="fase" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fases.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cno">CNO/CEI (opcional)</Label>
                <Input id="cno" name="cno" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inscricaoImobiliaria">Inscrição imobiliária (opcional)</Label>
                <Input id="inscricaoImobiliaria" name="inscricaoImobiliaria" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="latitude">Latitude (opcional)</Label>
                <Input id="latitude" name="latitude" type="number" step="any" placeholder="-27.5969" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="longitude">Longitude (opcional)</Label>
                <Input id="longitude" name="longitude" type="number" step="any" placeholder="-48.5482" />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <Label htmlFor="novaConstrutora" className="text-sm font-normal">
                Construtora ainda não cadastrada
              </Label>
              <input
                id="novaConstrutora"
                name="novaConstrutora"
                type="checkbox"
                checked={novaConstrutora}
                onChange={(e) => setNovaConstrutora(e.target.checked)}
                className="h-4 w-4"
              />
            </div>

            {novaConstrutora ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 grid gap-2">
                  <Label htmlFor="razaoSocial">Razão social</Label>
                  <Input id="razaoSocial" name="razaoSocial" required={novaConstrutora} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cnpjCpf">CNPJ/CPF</Label>
                  <Input id="cnpjCpf" name="cnpjCpf" required={novaConstrutora} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tipoConstrutora">Tipo</Label>
                  <Select name="tipoConstrutora" defaultValue="pj">
                    <SelectTrigger id="tipoConstrutora" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pj">Empresa (PJ)</SelectItem>
                      <SelectItem value="profissional_independente">Profissional independente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="construtoraId">Construtora</Label>
                <Select name="construtoraId" required={!novaConstrutora}>
                  <SelectTrigger id="construtoraId" className="w-full">
                    <SelectValue placeholder="Selecione a construtora" />
                  </SelectTrigger>
                  <SelectContent>
                    {construtoras.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.razao_social} · {c.cnpj_cpf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {state.error ? (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
          </div>

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
