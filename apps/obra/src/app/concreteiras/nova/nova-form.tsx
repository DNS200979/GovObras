"use client";

import { useActionState } from "react";
import type { ObraResumo } from "@/lib/queries";
import { vincularConcreteira, type VincularConcreteiraState } from "../actions";

const campo =
  "w-full rounded-sm border border-linha bg-papel px-3 py-2 text-[14px] text-texto outline-none focus:border-verde";
const rotulo = "font-display text-[12px] font-semibold text-texto";

export function NovaConcreteiraForm({ obras }: { obras: ObraResumo[] }) {
  const [state, formAction, pending] = useActionState<VincularConcreteiraState, FormData>(
    vincularConcreteira,
    {},
  );

  return (
    <form action={formAction} className="grid gap-4 [&>div]:min-w-0">
      <div className="grid gap-1.5">
        <label htmlFor="obra_id" className={rotulo}>
          Obra
        </label>
        <select id="obra_id" name="obra_id" required defaultValue="" className={campo}>
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
        <label htmlFor="cnpj" className={rotulo}>
          CNPJ da concreteira
        </label>
        <input
          id="cnpj"
          name="cnpj"
          type="text"
          required
          placeholder="00.000.000/0000-00"
          className={campo}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="razao_social" className={rotulo}>
          Razão social (só se a concreteira ainda não existir no sistema)
        </label>
        <input
          id="razao_social"
          name="razao_social"
          type="text"
          placeholder="Ex.: Concreto Forte Materiais Ltda."
          className={campo}
        />
        <p className="font-mono text-[10.5px] text-texto-fraco">
          Se o CNPJ já existir, esse campo é ignorado e a concreteira encontrada é vinculada
          direto.
        </p>
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
          {pending ? "Vinculando…" : "Vincular concreteira"}
        </button>
      </div>
    </form>
  );
}
