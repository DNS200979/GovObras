"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { despublicarItem, excluirRascunho, publicarItem, removerDocumento } from "../actions";

export function PublicarItemButton({ itemId }: { itemId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Publicar este item? Ele passa a ficar visível pras construtoras que vinculam sua concreteira a uma obra."))
          return;
        startTransition(() => publicarItem(itemId));
      }}
      className="rounded-sm bg-verde px-4 py-2 font-display text-[13px] font-semibold text-papel transition-colors hover:bg-verde/90 disabled:opacity-50"
    >
      {pending ? "Publicando…" : "Publicar"}
    </button>
  );
}

export function DespublicarItemButton({ itemId }: { itemId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => despublicarItem(itemId))}
      className="rounded-sm border border-linha px-4 py-2 font-display text-[13px] font-semibold text-texto-fraco transition-colors hover:border-ambar hover:text-ambar disabled:opacity-50"
    >
      {pending ? "…" : "Voltar para rascunho"}
    </button>
  );
}

export function ExcluirRascunhoButton({ itemId }: { itemId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Excluir este rascunho e todos os documentos anexados? Essa ação não pode ser desfeita."))
          return;
        startTransition(async () => {
          await excluirRascunho(itemId);
          router.push("/esg");
        });
      }}
      className="rounded-sm border border-linha px-4 py-2 font-display text-[13px] font-semibold text-texto-fraco transition-colors hover:border-ambar hover:text-ambar disabled:opacity-50"
    >
      {pending ? "Excluindo…" : "Excluir rascunho"}
    </button>
  );
}

export function RemoverDocumentoButton({
  documentoId,
  itemId,
  storagePath,
}: {
  documentoId: string;
  itemId: string;
  storagePath: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => removerDocumento(documentoId, itemId, storagePath))}
      className="font-mono text-[10px] uppercase tracking-wide text-texto-fraco hover:text-ambar disabled:opacity-50"
    >
      {pending ? "…" : "remover"}
    </button>
  );
}
