"use client";

import { useActionState } from "react";
import { entrar, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(entrar, {});

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <div className="grid gap-1.5">
        <label htmlFor="email" className="font-display text-[12px] font-semibold text-texto">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="voce@concreteira.com.br"
          required
          autoFocus
          className="rounded-sm border border-linha bg-papel px-3 py-2 text-[14px] text-texto outline-none focus:border-verde"
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="password" className="font-display text-[12px] font-semibold text-texto">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="rounded-sm border border-linha bg-papel px-3 py-2 text-[14px] text-texto outline-none focus:border-verde"
        />
      </div>
      {state.error ? (
        <p className="rounded-sm border border-ambar/40 bg-ambar/10 px-3 py-2 text-[13px] text-ambar">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-sm bg-verde px-4 py-2 font-display text-[13px] font-semibold text-papel transition-colors hover:bg-verde/90 disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
