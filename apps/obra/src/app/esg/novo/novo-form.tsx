"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { ObraResumo, RequisitoResumo } from "@/lib/queries";

const categorias = [
  { value: "ambiental", label: "Ambiental" },
  { value: "social", label: "Social" },
  { value: "governanca", label: "Governança" },
];

const naturezaLabel: Record<string, string> = { passivo: "Passivo", ativo: "Ativo" };

export function NovoProjetoForm({
  obras,
  requisitos,
}: {
  obras: ObraResumo[];
  requisitos: RequisitoResumo[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // `[&>div]:min-w-0` + `w-full` nos controles: sem isso a opção mais longa do
  // select (nome de requisito) define o min-content da coluna do grid e os
  // campos estouram a largura do card.
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
      className="grid gap-4 [&>div]:min-w-0"
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
          className="w-full rounded-sm border border-linha bg-papel px-3 py-2 text-[14px] text-texto outline-none focus:border-verde"
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
          className="w-full rounded-sm border border-linha bg-papel px-3 py-2 text-[14px] text-texto outline-none focus:border-verde"
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
        <label htmlFor="requisito_id" className="font-display text-[12px] font-semibold text-texto">
          Requisito auditável relacionado (opcional)
        </label>
        <select
          id="requisito_id"
          name="requisito_id"
          defaultValue=""
          className="w-full rounded-sm border border-linha bg-papel px-3 py-2 text-[14px] text-texto outline-none focus:border-verde"
        >
          <option value="">Nenhum</option>
          {requisitos.map((r) => (
            <option key={r.id} value={r.id}>
              {naturezaLabel[r.natureza]} · {r.codigo} — {r.requisito}
            </option>
          ))}
        </select>
        <p className="font-mono text-[10.5px] text-texto-fraco">
          Ajuda a prefeitura a entender a qual item do checklist esse projeto se refere.
        </p>
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
          className="w-full rounded-sm border border-linha bg-papel px-3 py-2 text-[14px] text-texto outline-none focus:border-verde"
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
          className="w-full rounded-sm border border-linha bg-papel px-3 py-2 text-[14px] text-texto outline-none focus:border-verde"
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
