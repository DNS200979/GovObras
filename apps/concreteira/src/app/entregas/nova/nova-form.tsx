"use client";

import { useActionState, useState } from "react";
import type { FatorEmissao, ObraVinculada } from "@/lib/queries";
import { criarEntrega, type CriarEntregaState } from "../actions";

const campo =
  "w-full rounded-sm border border-linha bg-papel px-3 py-2 text-[14px] text-texto outline-none focus:border-verde";
const campoSm =
  "w-full rounded-sm border border-linha bg-papel px-2.5 py-1.5 text-[13px] text-texto outline-none focus:border-verde";
const rotulo = "font-display text-[12px] font-semibold text-texto";

interface LinhaComposicao {
  key: number;
  insumo: string;
  quantidade: string;
  unidade: string;
  fatorId: string;
}

let proximaChave = 0;
function linhaVazia(): LinhaComposicao {
  proximaChave += 1;
  return { key: proximaChave, insumo: "", quantidade: "", unidade: "", fatorId: "" };
}

export function NovaEntregaForm({ obras, fatores }: { obras: ObraVinculada[]; fatores: FatorEmissao[] }) {
  const [state, formAction, pending] = useActionState<CriarEntregaState, FormData>(criarEntrega, {});
  const [linhas, setLinhas] = useState<LinhaComposicao[]>([linhaVazia()]);

  function atualizarLinha(key: number, campo: keyof Omit<LinhaComposicao, "key">, valor: string) {
    setLinhas((atual) => atual.map((l) => (l.key === key ? { ...l, [campo]: valor } : l)));
  }

  return (
    <form action={formAction} className="grid gap-4 [&>div]:min-w-0">
      <div className="grid gap-1.5">
        <label htmlFor="obra_concreteira_id" className={rotulo}>
          Obra
        </label>
        <select id="obra_concreteira_id" name="obra_concreteira_id" required defaultValue="" className={campo}>
          <option value="" disabled>
            Selecione a obra
          </option>
          {obras.map((o) => (
            <option key={o.vinculoId} value={o.vinculoId}>
              {o.obraNome} · alvará {o.alvaraNumero}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <label htmlFor="volume_m3" className={rotulo}>
            Volume (m³)
          </label>
          <input id="volume_m3" name="volume_m3" type="text" inputMode="decimal" required placeholder="8,5" className={campo} />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="data_entrega" className={rotulo}>
            Data da entrega
          </label>
          <input id="data_entrega" name="data_entrega" type="date" required className={campo} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="traco" className={rotulo}>
          Traço (opcional)
        </label>
        <input
          id="traco"
          name="traco"
          type="text"
          placeholder="Ex.: 1:2:3 — fck 25 MPa"
          className={campo}
        />
      </div>

      <div className="grid gap-2 border-t border-linha/60 pt-4">
        <div className="flex items-center justify-between">
          <span className={rotulo}>Composição — o que foi somado ao cimento</span>
          <button
            type="button"
            onClick={() => setLinhas((atual) => [...atual, linhaVazia()])}
            className="font-mono text-[10.5px] uppercase tracking-wide text-verde hover:underline"
          >
            + adicionar insumo
          </button>
        </div>
        <p className="font-mono text-[10.5px] text-texto-fraco">
          Ex.: brita 1, areia média, aditivo plastificante, cinza volante — linha incompleta é
          ignorada ao salvar.
        </p>

        {linhas.map((l) => (
          <div key={l.key} className="grid grid-cols-[1fr_90px_80px_1fr_28px] items-center gap-2">
            <input
              name="insumo"
              value={l.insumo}
              onChange={(e) => atualizarLinha(l.key, "insumo", e.target.value)}
              placeholder="Insumo"
              className={campoSm}
            />
            <input
              name="quantidade"
              value={l.quantidade}
              onChange={(e) => atualizarLinha(l.key, "quantidade", e.target.value)}
              inputMode="decimal"
              placeholder="Qtde"
              className={campoSm}
            />
            <input
              name="unidade"
              value={l.unidade}
              onChange={(e) => atualizarLinha(l.key, "unidade", e.target.value)}
              placeholder="t, kg, m³…"
              className={campoSm}
            />
            <select
              name="fator_id"
              value={l.fatorId}
              onChange={(e) => atualizarLinha(l.key, "fatorId", e.target.value)}
              className={campoSm}
            >
              <option value="">Fator de emissão (opcional)</option>
              {fatores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.categoria} · {f.unidade}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setLinhas((atual) => (atual.length > 1 ? atual.filter((x) => x.key !== l.key) : atual))}
              className="font-mono text-[13px] text-texto-fraco hover:text-ambar"
              aria-label="Remover linha"
              title="Remover linha"
            >
              ×
            </button>
          </div>
        ))}
        <p className="font-mono text-[10.5px] text-texto-fraco">
          O fator só é usado se a unidade daqui bater exatamente com a que o fator espera (ex.:
          fator em tCO2e/t exige quantidade em "t") — sem isso a linha entra na entrega mas fica
          de fora do cálculo de carbono.
        </p>
      </div>

      <div className="grid gap-2 border-t border-linha/60 pt-4">
        <span className={rotulo}>Evidência da entrega (NF-e/CT-e)</span>
        <p className="font-mono text-[10.5px] text-texto-fraco">
          Sem esse documento a entrega fica registrada, mas não pode ser materializada no
          inventário de carbono da obra — o lançamento sempre exige uma evidência.
        </p>
        <div className="flex gap-3">
          <select name="evidencia_tipo" defaultValue="nfe" className={`${campoSm} w-32 shrink-0`}>
            <option value="nfe">NF-e</option>
            <option value="cte">CT-e</option>
          </select>
          <input
            type="file"
            name="evidencia_arquivo"
            accept=".pdf,.xml,.jpg,.jpeg,.png"
            className="flex-1 rounded-sm border border-linha bg-papel px-3 py-2 text-[13px] text-texto file:mr-3 file:rounded-sm file:border-0 file:bg-concreto file:px-2.5 file:py-1 file:font-mono file:text-[11px] file:text-texto-fraco"
          />
        </div>
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
          {pending ? "Registrando…" : "Declarar entrega"}
        </button>
      </div>
    </form>
  );
}
