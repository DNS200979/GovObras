"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const tipologias = [
  "Residencial vertical",
  "Residencial horizontal",
  "Comercial",
  "Galpão logístico",
  "Misto",
];

export const fases = [
  { value: "fundacao", label: "Fundação" },
  { value: "estrutura", label: "Estrutura" },
  { value: "acabamento", label: "Acabamento" },
  { value: "entrega", label: "Entrega" },
];

export interface ObraDefaultValues {
  alvaraNumero?: string;
  nome?: string;
  tipologia?: string;
  areaM2?: number;
  fase?: string;
  cno?: string | null;
  inscricaoImobiliaria?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  construtoraId?: string;
}

interface Props {
  construtoras: { id: string; razao_social: string; cnpj_cpf: string }[];
  defaultValues?: ObraDefaultValues;
  /** permite cadastrar uma construtora nova na hora — só faz sentido no cadastro, não na edição */
  permitirNovaConstrutora?: boolean;
  error?: string;
}

export function ObraCamposForm({
  construtoras,
  defaultValues,
  permitirNovaConstrutora = false,
  error,
}: Props) {
  const [novaConstrutora, setNovaConstrutora] = useState(
    permitirNovaConstrutora && construtoras.length === 0,
  );

  return (
    <div className="grid gap-4 px-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="alvaraNumero">Nº do alvará</Label>
          <Input
            id="alvaraNumero"
            name="alvaraNumero"
            placeholder="ALV-2026-0001"
            defaultValue={defaultValues?.alvaraNumero}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="areaM2">Área construída (m²)</Label>
          <Input
            id="areaM2"
            name="areaM2"
            type="number"
            min="1"
            step="0.01"
            defaultValue={defaultValues?.areaM2}
            required
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="nome">Nome da obra</Label>
        <Input
          id="nome"
          name="nome"
          placeholder="Residencial Vista Verde"
          defaultValue={defaultValues?.nome}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="tipologia">Tipologia</Label>
          <Select name="tipologia" defaultValue={defaultValues?.tipologia} required>
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
          <Select name="fase" defaultValue={defaultValues?.fase ?? "fundacao"}>
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
          <Input id="cno" name="cno" defaultValue={defaultValues?.cno ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="inscricaoImobiliaria">Inscrição imobiliária (opcional)</Label>
          <Input
            id="inscricaoImobiliaria"
            name="inscricaoImobiliaria"
            defaultValue={defaultValues?.inscricaoImobiliaria ?? ""}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="latitude">Latitude (opcional)</Label>
          <Input
            id="latitude"
            name="latitude"
            type="number"
            step="any"
            placeholder="-27.5969"
            defaultValue={defaultValues?.latitude ?? ""}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="longitude">Longitude (opcional)</Label>
          <Input
            id="longitude"
            name="longitude"
            type="number"
            step="any"
            placeholder="-48.5482"
            defaultValue={defaultValues?.longitude ?? ""}
          />
        </div>
      </div>

      {permitirNovaConstrutora ? (
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
      ) : null}

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
          <Select name="construtoraId" defaultValue={defaultValues?.construtoraId} required={!novaConstrutora}>
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

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
