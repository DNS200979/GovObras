"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

const campo =
  "w-full rounded-sm border border-linha bg-papel px-3 py-2 text-[14px] text-texto outline-none focus:border-verde";
const rotulo = "font-display text-[12px] font-semibold text-texto";

const TIPOLOGIAS = [
  "Residencial vertical",
  "Residencial horizontal",
  "Comercial",
  "Industrial",
  "Institucional",
  "Misto",
];

const FASES = [
  { value: "fundacao", label: "Fundação" },
  { value: "estrutura", label: "Estrutura" },
  { value: "acabamento", label: "Acabamento" },
  { value: "entrega", label: "Entrega" },
  { value: "concluida", label: "Concluída" },
];

export function NovaObraForm({ municipios }: { municipios: { id: string; nome: string; uf: string }[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(formRef.current!);
        startTransition(async () => {
          const res = await fetch("/api/obras", { method: "POST", body: fd });
          const json = await res.json();
          if (!res.ok) {
            setError(json.error ?? "Não foi possível cadastrar a obra.");
            return;
          }
          router.push(`/obras/${json.id}`);
        });
      }}
      className="grid gap-5 [&>*]:min-w-0"
    >
      <section className="grid gap-4 [&>div]:min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-wider text-texto-fraco">
          Identificação
        </p>

        <div className="grid gap-1.5">
          <label htmlFor="nome" className={rotulo}>
            Nome da obra
          </label>
          <input id="nome" name="nome" required placeholder="Ex.: Residencial Vista Verde" className={campo} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 [&>div]:min-w-0">
          <div className="grid gap-1.5">
            <label htmlFor="municipio_id" className={rotulo}>
              Município
            </label>
            <select id="municipio_id" name="municipio_id" required defaultValue="" className={campo}>
              <option value="" disabled>
                Selecione
              </option>
              {municipios.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}/{m.uf}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="alvara_numero" className={rotulo}>
              Número do alvará
            </label>
            <input
              id="alvara_numero"
              name="alvara_numero"
              required
              placeholder="Ex.: ALV-2026-1042"
              className={campo}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 [&>div]:min-w-0">
          <div className="grid gap-1.5">
            <label htmlFor="tipologia" className={rotulo}>
              Tipologia
            </label>
            <select id="tipologia" name="tipologia" required defaultValue="" className={campo}>
              <option value="" disabled>
                Selecione
              </option>
              {TIPOLOGIAS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="area_construida_m2" className={rotulo}>
              Área construída (m²)
            </label>
            <input
              id="area_construida_m2"
              name="area_construida_m2"
              required
              inputMode="decimal"
              placeholder="Ex.: 9400"
              className={campo}
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="fase" className={rotulo}>
              Fase atual
            </label>
            <select id="fase" name="fase" defaultValue="fundacao" className={campo}>
              {FASES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-4 border-t border-linha/60 pt-5 [&>div]:min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-wider text-texto-fraco">
          Registros do imóvel <span className="normal-case">(opcional)</span>
        </p>

        <div className="grid gap-4 sm:grid-cols-2 [&>div]:min-w-0">
          <div className="grid gap-1.5">
            <label htmlFor="inscricao_imobiliaria" className={rotulo}>
              Inscrição imobiliária
            </label>
            <input id="inscricao_imobiliaria" name="inscricao_imobiliaria" className={campo} />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="cno" className={rotulo}>
              CNO / CEI
            </label>
            <input id="cno" name="cno" className={campo} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 border-t border-linha/60 pt-5 [&>div]:min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-wider text-texto-fraco">
          Localização <span className="normal-case">(opcional)</span>
        </p>

        <div className="grid gap-4 sm:grid-cols-2 [&>div]:min-w-0">
          <div className="grid gap-1.5">
            <label htmlFor="latitude" className={rotulo}>
              Latitude
            </label>
            <input
              id="latitude"
              name="latitude"
              inputMode="decimal"
              placeholder="-27.5954"
              className={campo}
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="longitude" className={rotulo}>
              Longitude
            </label>
            <input
              id="longitude"
              name="longitude"
              inputMode="decimal"
              placeholder="-48.5480"
              className={campo}
            />
          </div>
        </div>
        <p className="font-mono text-[10.5px] text-texto-fraco">
          Preencha as duas ou deixe as duas em branco. A prefeitura usa a coordenada para o
          agendamento de fiscalização.
        </p>
      </section>

      {error ? (
        <p className="rounded-sm border border-ambar/40 bg-ambar-claro px-3 py-2 text-[13px] text-ambar">
          {error}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm bg-verde px-4 py-2 font-display text-[13px] font-semibold text-papel transition-colors hover:bg-verde/90 disabled:opacity-60"
        >
          {pending ? "Cadastrando…" : "Cadastrar e anexar documentos"}
        </button>
      </div>
    </form>
  );
}
