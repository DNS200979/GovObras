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
  // SisobraPref
  dataAlvara?: string | null;
  dataInicioObra?: string | null;
  dataFinalObra?: string | null;
  tipoAlvara?: string | null;
  responsavelExecObra?: string | null;
  cep?: string | null;
  tipoLogradouro?: string | null;
  logradouro?: string | null;
  numeroImovel?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  areaCategoria?: string | null;
  areaDestinacao?: string | null;
  areaTipoObra?: string | null;
  respTecnicoTipo?: string | null;
  respTecnicoNome?: string | null;
  respTecnicoRegistro?: string | null;
  respTecnicoDocumento?: string | null;
}

/* Listas do leiaute SisobraPref (Manual Web Service, schemas v1.03). */
const tiposAlvara = [
  { value: "inicial", label: "Inicial" },
  { value: "retificado", label: "Retificado" },
];

const responsaveisExecucao = [
  { value: "proprietario_do_imovel", label: "Proprietário do imóvel" },
  { value: "dono_da_obra", label: "Dono da obra" },
  { value: "incorporador_construcao_civil", label: "Incorporador" },
  { value: "empresa_construtora", label: "Empresa construtora" },
  { value: "empresa_lider_consorcio", label: "Empresa líder de consórcio" },
  { value: "consorcio", label: "Consórcio" },
  { value: "construcao_nome_coletivo", label: "Construção em nome coletivo" },
];

const categoriasArea = [
  { value: "obra_nova", label: "Obra nova" },
  { value: "acrescimo", label: "Acréscimo" },
  { value: "reforma", label: "Reforma" },
  { value: "demolicao", label: "Demolição" },
  { value: "existente", label: "Existente" },
];

const destinacoesArea = [
  { value: "residencial_unifamiliar", label: "Residencial unifamiliar" },
  { value: "residencial_multifamiliar", label: "Residencial multifamiliar" },
  { value: "comercial_salas_lojas", label: "Comercial (salas/lojas)" },
  { value: "edificio_garagens", label: "Edifício garagens" },
  { value: "galpao_industrial", label: "Galpão industrial" },
  { value: "casa_popular", label: "Casa popular" },
  { value: "conjunto_habitacional_popular", label: "Conjunto habitacional popular" },
];

const tiposObra = [
  { value: "alvenaria", label: "Alvenaria" },
  { value: "madeira", label: "Madeira" },
  { value: "mista", label: "Mista" },
];

const tiposRespTecnico = [
  { value: "engenheiro", label: "Engenheiro (CREA/ART)" },
  { value: "arquiteto", label: "Arquiteto (CAU/RRT)" },
  { value: "tecnologo", label: "Tecnólogo" },
  { value: "tecnico_industrial", label: "Técnico industrial" },
];

const tiposLogradouro = [
  "Rua", "Avenida", "Alameda", "Travessa", "Praça", "Rodovia", "Estrada", "Beco", "Outros",
];

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

      {/* ---- SisobraPref: o que a Receita exige no envio mensal ---- */}
      <div className="mt-2 border-t border-border pt-4">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Dados do alvará · SisobraPref (Receita Federal)
        </p>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Sem a data do alvará a obra não entra no envio mensal.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="dataAlvara">Data do alvará</Label>
          <Input id="dataAlvara" name="dataAlvara" type="date" defaultValue={defaultValues?.dataAlvara ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="dataInicioObra">Início da obra</Label>
          <Input id="dataInicioObra" name="dataInicioObra" type="date" defaultValue={defaultValues?.dataInicioObra ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="dataFinalObra">Fim previsto</Label>
          <Input id="dataFinalObra" name="dataFinalObra" type="date" defaultValue={defaultValues?.dataFinalObra ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="tipoAlvara">Tipo do alvará</Label>
          <Select name="tipoAlvara" defaultValue={defaultValues?.tipoAlvara ?? "inicial"}>
            <SelectTrigger id="tipoAlvara" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {tiposAlvara.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="responsavelExecObra">Responsável pela execução</Label>
          <Select name="responsavelExecObra" defaultValue={defaultValues?.responsavelExecObra ?? "empresa_construtora"}>
            <SelectTrigger id="responsavelExecObra" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {responsaveisExecucao.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="cep">CEP</Label>
          <Input id="cep" name="cep" placeholder="88010-000" defaultValue={defaultValues?.cep ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tipoLogradouro">Tipo</Label>
          <Select name="tipoLogradouro" defaultValue={defaultValues?.tipoLogradouro ?? "Rua"}>
            <SelectTrigger id="tipoLogradouro" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {tiposLogradouro.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 grid gap-2">
          <Label htmlFor="logradouro">Logradouro</Label>
          <Input id="logradouro" name="logradouro" defaultValue={defaultValues?.logradouro ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="numeroImovel">Número</Label>
          <Input id="numeroImovel" name="numeroImovel" defaultValue={defaultValues?.numeroImovel ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="complemento">Complemento</Label>
          <Input id="complemento" name="complemento" defaultValue={defaultValues?.complemento ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="bairro">Bairro</Label>
          <Input id="bairro" name="bairro" defaultValue={defaultValues?.bairro ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="areaCategoria">Categoria da área</Label>
          <Select name="areaCategoria" defaultValue={defaultValues?.areaCategoria ?? "obra_nova"}>
            <SelectTrigger id="areaCategoria" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categoriasArea.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="areaDestinacao">Destinação</Label>
          <Select name="areaDestinacao" defaultValue={defaultValues?.areaDestinacao ?? ""}>
            <SelectTrigger id="areaDestinacao" className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {destinacoesArea.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="areaTipoObra">Tipo da obra</Label>
          <Select name="areaTipoObra" defaultValue={defaultValues?.areaTipoObra ?? "alvenaria"}>
            <SelectTrigger id="areaTipoObra" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {tiposObra.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="respTecnicoTipo">Responsável técnico</Label>
          <Select name="respTecnicoTipo" defaultValue={defaultValues?.respTecnicoTipo ?? ""}>
            <SelectTrigger id="respTecnicoTipo" className="w-full"><SelectValue placeholder="Opcional" /></SelectTrigger>
            <SelectContent>
              {tiposRespTecnico.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="respTecnicoNome">Nome do profissional</Label>
          <Input id="respTecnicoNome" name="respTecnicoNome" defaultValue={defaultValues?.respTecnicoNome ?? ""} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="respTecnicoRegistro">Registro no conselho (CREA/CAU)</Label>
          <Input id="respTecnicoRegistro" name="respTecnicoRegistro" defaultValue={defaultValues?.respTecnicoRegistro ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="respTecnicoDocumento">Documento (ART/RRT)</Label>
          <Input id="respTecnicoDocumento" name="respTecnicoDocumento" defaultValue={defaultValues?.respTecnicoDocumento ?? ""} />
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
