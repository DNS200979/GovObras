"use client";

import { useActionState, useMemo, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { Badge } from "@carbonfree/ui/shadcn/badge";
import { Button } from "@carbonfree/ui/shadcn/button";
import { Calendar } from "@carbonfree/ui/shadcn/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@carbonfree/ui/shadcn/card";
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
import type { Fiscalizacao } from "@/lib/queries";
import { criarVistoria, type CriarVistoriaState } from "./actions";

const statusVariant: Record<string, "success" | "secondary" | "outline" | "warning"> = {
  agendada: "secondary",
  em_campo: "warning",
  concluida: "success",
  cancelada: "outline",
};

const statusLabel: Record<string, string> = {
  agendada: "Agendada",
  em_campo: "Em campo",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

function toDateKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface Props {
  fiscalizacoes: Fiscalizacao[];
  obras: { id: string; nome: string; alvara_numero: string }[];
  fiscais: { id: string; nome: string }[];
}

export function AgendaClient({ fiscalizacoes, obras, fiscais }: Props) {
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [sheetOpen, setSheetOpen] = useState(false);

  const porDia = useMemo(() => {
    const map = new Map<string, Fiscalizacao[]>();
    for (const f of fiscalizacoes) {
      if (!f.agendadoPara) continue;
      const key = toDateKey(f.agendadoPara);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    }
    return map;
  }, [fiscalizacoes]);

  const diasComVistoria = useMemo(
    () => [...porDia.keys()].map((k) => new Date(`${k}T00:00:00`)),
    [porDia],
  );

  const selectedKey = selected
    ? `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`
    : "";
  const doDia = porDia.get(selectedKey) ?? [];

  const [state, formAction, pending] = useActionState<CriarVistoriaState, FormData>(criarVistoria, {});

  if (state.ok && sheetOpen) {
    setSheetOpen(false);
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Calendário</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selected}
            onSelect={setSelected}
            modifiers={{ tem_vistoria: diasComVistoria }}
            modifiersClassNames={{ tem_vistoria: "font-bold underline decoration-primary decoration-2" }}
            className="w-full"
          />
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>
            {selected?.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
          </CardTitle>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              render={
                <Button size="sm">
                  <CalendarPlus />
                  Nova vistoria
                </Button>
              }
            />
            <SheetContent>
              <form action={formAction}>
                <SheetHeader>
                  <SheetTitle>Agendar vistoria</SheetTitle>
                  <SheetDescription>
                    Programação de fiscalização — seção 06 do plano (distribuição por fiscal e território).
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 px-4">
                  <div className="grid gap-2">
                    <Label htmlFor="obraId">Obra</Label>
                    <Select name="obraId" required>
                      <SelectTrigger id="obraId" className="w-full">
                        <SelectValue placeholder="Selecione a obra" />
                      </SelectTrigger>
                      <SelectContent>
                        {obras.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.nome} · {o.alvara_numero}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fiscalId">Fiscal</Label>
                    <Select name="fiscalId" required>
                      <SelectTrigger id="fiscalId" className="w-full">
                        <SelectValue placeholder="Selecione o fiscal" />
                      </SelectTrigger>
                      <SelectContent>
                        {fiscais.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="data">Data</Label>
                      <input
                        id="data"
                        name="data"
                        type="date"
                        required
                        defaultValue={selectedKey}
                        className="border-input h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="hora">Horário</Label>
                      <input
                        id="hora"
                        name="hora"
                        type="time"
                        defaultValue="09:00"
                        className="border-input h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none"
                      />
                    </div>
                  </div>
                  {state.error ? (
                    <p className="text-destructive text-sm">{state.error}</p>
                  ) : null}
                </div>
                <SheetFooter>
                  <Button type="submit" disabled={pending}>
                    {pending ? "Agendando…" : "Agendar"}
                  </Button>
                  <SheetClose
                    render={
                      <Button variant="outline" type="button">
                        Cancelar
                      </Button>
                    }
                  />
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </CardHeader>
        <CardContent className="space-y-2">
          {doDia.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma vistoria agendada para este dia.
            </p>
          ) : (
            doDia
              .sort((a, b) => (a.agendadoPara! < b.agendadoPara! ? -1 : 1))
              .map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <div>
                    <div className="font-medium">{f.obra}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {f.construtora} · {f.fiscal}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {new Date(f.agendadoPara!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <Badge variant={statusVariant[f.status] ?? "secondary"}>
                      {statusLabel[f.status] ?? f.status}
                    </Badge>
                  </div>
                </div>
              ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
