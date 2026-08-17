"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { materializarEntrega } from "../actions";

export function MaterializarButton({ entregaId }: { entregaId: string }) {
  const [pending, startTransition] = useTransition();
  const [mensagem, setMensagem] = useState<{ ok: boolean; texto: string } | null>(null);
  const router = useRouter();

  return (
    <div className="mt-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMensagem(null);
          startTransition(async () => {
            const resultado = await materializarEntrega(entregaId);
            setMensagem({ ok: resultado.ok, texto: resultado.mensagem });
            if (resultado.ok) router.refresh();
          });
        }}
        className="rounded-sm bg-verde px-3 py-1.5 font-display text-[11.5px] font-semibold text-papel transition-colors hover:bg-verde/90 disabled:opacity-50"
      >
        {pending ? "Materializando…" : "Materializar no inventário"}
      </button>
      {mensagem ? (
        <p className={`mt-1.5 text-[12px] leading-snug ${mensagem.ok ? "text-verde" : "text-ambar"}`}>
          {mensagem.texto}
        </p>
      ) : null}
    </div>
  );
}
