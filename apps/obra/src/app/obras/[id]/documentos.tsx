"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { tipoDocumentoLabel } from "@/lib/documentos";

const campo =
  "w-full rounded-sm border border-linha bg-papel px-3 py-2 text-[13px] text-texto outline-none focus:border-verde";

export function UploadDocumentoObra({ obraId }: { obraId: string }) {
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
        fd.set("obra_id", obraId);
        startTransition(async () => {
          const res = await fetch("/api/obras/documentos", { method: "POST", body: fd });
          const json = await res.json();
          if (!res.ok) {
            setError(json.error ?? "Não foi possível anexar o documento.");
            return;
          }
          formRef.current?.reset();
          router.refresh();
        });
      }}
      className="grid gap-3 [&>div]:min-w-0"
    >
      <div className="grid gap-3 sm:grid-cols-2 [&>div]:min-w-0">
        <div className="grid gap-1.5">
          <label htmlFor="tipo" className="font-display text-[12px] font-semibold text-texto">
            Tipo de documento
          </label>
          <select id="tipo" name="tipo" required defaultValue="" className={campo}>
            <option value="" disabled>
              Selecione
            </option>
            {Object.entries(tipoDocumentoLabel).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="descricao" className="font-display text-[12px] font-semibold text-texto">
            Descrição (opcional)
          </label>
          <input id="descricao" name="descricao" placeholder="Ex.: 2ª via retificada" className={campo} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="arquivo"
          required
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.dwg"
          className="min-w-0 flex-1 rounded-sm border border-linha bg-papel px-3 py-2 text-[13px] text-texto file:mr-3 file:rounded-sm file:border-0 file:bg-concreto file:px-2.5 file:py-1 file:font-mono file:text-[11px] file:text-texto-fraco"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-sm bg-ardosia px-3.5 py-2 font-display text-[12px] font-semibold text-[#f8f9f6] transition-colors hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Enviando…" : "Anexar"}
        </button>
      </div>

      {error ? <p className="text-[12.5px] text-ambar">{error}</p> : null}
    </form>
  );
}

export function RemoverDocumentoObra({ id, storagePath }: { id: string; storagePath: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Remover este documento?")) return;
        startTransition(async () => {
          await fetch("/api/obras/documentos", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, storagePath }),
          });
          router.refresh();
        });
      }}
      className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-texto-fraco transition-colors hover:text-ambar disabled:opacity-50"
    >
      {pending ? "…" : "remover"}
    </button>
  );
}
