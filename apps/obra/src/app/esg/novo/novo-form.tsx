"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { ObraResumo } from "@/lib/queries";

const categorias = [
  { value: "ambiental", label: "Ambiental" },
  { value: "social", label: "Social" },
  { value: "governanca", label: "Governança" },
];

export function NovoProjetoForm({ obras }: { obras: ObraResumo[] }) {
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
          const res = await fetch("/api/esg", { method: "POST", body: fd });
          const json = await res.json();
          if (!res.ok) {
            setError(json.error ?? "Não foi possível criar o projeto.");
            return;
          }
          router.push(`/esg/${json.id}`);
        });
      }}
      className="grid gap-4"
    >
      <div className="grid gap-1.5">
        <label htmlFor="obra_id" className="font-display text-[12px] font-semibold text-texto">
          Obra
        </label>
        <select
          id="obra_id"
          name="obra_id"
          required
          defaultValue=""
          className="rounded-sm border border-linha bg-papel px-3 py-2 text-[14px] text-texto outline-none focus:border-verde"
        >
          <option value="" disabled>
            Selecione a obra
          </option>
          {obras.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome} · {o.alvaraNumero}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="categoria" className="font-display text-[12px] font-semibold text-texto">
          Categoria
        </label>
        <select
          id="categoria"
          name="categoria"
          required
          defaultValue=""
          className="rounded-sm border border-linha bg-papel px-3 py-2 text-[14px] text-texto outline-none focus:border-verde"
        >
          <option value="" disabled>
            Selecione a categoria
          </option>
          {categorias.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="titulo" className="font-display text-[12px] font-semibold text-texto">
          Título
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          required
          placeholder="Ex.: Reaproveitamento de água pluvial no canteiro"
          className="rounded-sm border border-linha bg-papel px-3 py-2 text-[14px] text-texto outline-none focus:border-verde"
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="descricao" className="font-display text-[12px] font-semibold text-texto">
          Descrição
        </label>
        <textarea
          id="descricao"
          name="descricao"
          required
          rows={5}
          placeholder="Descreva o projeto, seu impacto e a documentação que será anexada."
          className="rounded-sm border border-linha bg-papel px-3 py-2 text-[14px] text-texto outline-none focus:border-verde"
        />
      </div>

      {error ? (
        <p className="rounded-sm border border-ambar/40 bg-ambar/10 px-3 py-2 text-[13px] text-ambar">
          {error}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm bg-verde px-4 py-2 font-display text-[13px] font-semibold text-papel transition-colors hover:bg-verde/90 disabled:opacity-60"
        >
          {pending ? "Criando…" : "Criar projeto e anexar documentos"}
        </button>
      </div>
    </form>
  );
}
