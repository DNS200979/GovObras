"use client";

import { useActionState } from "react";
import { criarItemEsg, type CriarItemEsgState } from "../actions";

const campo =
  "w-full rounded-sm border border-linha bg-papel px-3 py-2 text-[14px] text-texto outline-none focus:border-verde";
const rotulo = "font-display text-[12px] font-semibold text-texto";

const categorias = [
  { value: "ambiental", label: "Ambiental" },
  { value: "social", label: "Social" },
  { value: "governanca", label: "Governança" },
];

export function NovoItemEsgForm() {
  const [state, formAction, pending] = useActionState<CriarItemEsgState, FormData>(criarItemEsg, {});

  return (
    <form action={formAction} className="grid gap-4 [&>div]:min-w-0">
      <div className="grid gap-1.5">
        <label htmlFor="categoria" className={rotulo}>
          Categoria
        </label>
        <select id="categoria" name="categoria" required defaultValue="" className={campo}>
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
        <label htmlFor="titulo" className={rotulo}>
          Título
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          required
          placeholder="Ex.: Certificação ISO 14001"
          className={campo}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="descricao" className={rotulo}>
          Descrição
        </label>
        <textarea
          id="descricao"
          name="descricao"
          required
          rows={5}
          placeholder="Descreva a certificação, política ou prática, e a documentação que será anexada."
          className={campo}
        />
      </div>

      {state.error ? (
        <p className="rounded-sm border border-ambar/40 bg-ambar/10 px-3 py-2 text-[13px] text-ambar">
          {state.error}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-sm bg-verde px-4 py-2 font-display text-[13px] font-semibold text-papel transition-colors hover:bg-verde/90 disabled:opacity-60"
        >
          {pending ? "Criando…" : "Criar item e anexar documentos"}
        </button>
      </div>
    </form>
  );
}
