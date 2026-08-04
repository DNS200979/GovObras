"use client";

import { useActionState, useRef } from "react";
import { enviarDocumento, type UploadDocumentoState } from "../actions";

export function UploadDocumentoForm({ projetoId }: { projetoId: string }) {
  const acaoComProjeto = enviarDocumento.bind(null, projetoId);
  const [state, formAction, pending] = useActionState<UploadDocumentoState, FormData>(acaoComProjeto, {});
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-center gap-3"
    >
      <input
        type="file"
        name="arquivo"
        required
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
        className="flex-1 rounded-sm border border-linha bg-papel px-3 py-2 text-[13px] text-texto file:mr-3 file:rounded-sm file:border-0 file:bg-concreto file:px-2.5 file:py-1 file:font-mono file:text-[11px] file:text-texto-fraco"
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-sm bg-ardosia px-3.5 py-2 font-display text-[12px] font-semibold text-papel transition-colors hover:bg-ardosia/90 disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Anexar"}
      </button>
      {state.error ? <p className="w-full text-[12.5px] text-ambar">{state.error}</p> : null}
    </form>
  );
}
