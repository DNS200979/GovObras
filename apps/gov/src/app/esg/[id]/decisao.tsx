"use client";

import { useState, useTransition } from "react";
import { Alert, AlertDescription } from "@carbonfree/ui/shadcn/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@carbonfree/ui/shadcn/alert-dialog";
import { Button } from "@carbonfree/ui/shadcn/button";
import { Label } from "@carbonfree/ui/shadcn/label";
import { Textarea } from "@carbonfree/ui/shadcn/textarea";
import { decidirProjeto, marcarEmAnalise } from "../actions";

export function MarcarEmAnaliseButton({ projetoId }: { projetoId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button disabled={pending} onClick={() => startTransition(() => marcarEmAnalise(projetoId))}>
      {pending ? "Movendo…" : "Colocar em análise"}
    </Button>
  );
}

export function DecidirButtons({ projetoId }: { projetoId: string }) {
  const [dialogAberto, setDialogAberto] = useState<"aprovado" | "rejeitado" | null>(null);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decidir() {
    if (!dialogAberto) return;
    if (dialogAberto === "rejeitado" && !motivo.trim()) {
      setError("Informe o motivo da rejeição.");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("motivo", motivo);
      const res = await decidirProjeto(projetoId, dialogAberto, {}, fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      setDialogAberto(null);
      setMotivo("");
      setError(null);
    });
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={() => {
            setError(null);
            setMotivo("");
            setDialogAberto("aprovado");
          }}
        >
          Aprovar
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setError(null);
            setMotivo("");
            setDialogAberto("rejeitado");
          }}
        >
          Rejeitar
        </Button>
      </div>

      <AlertDialog open={dialogAberto !== null} onOpenChange={(open) => !open && setDialogAberto(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogAberto === "aprovado" ? "Aprovar projeto ESG?" : "Rejeitar projeto ESG?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogAberto === "aprovado"
                ? "A construtora será notificada de que o projeto foi aprovado para o processo de desconto fiscal."
                : "Explique o motivo — a construtora vê essa justificativa."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-1.5">
            <Label htmlFor="motivo">
              Motivo {dialogAberto === "rejeitado" ? "(obrigatório)" : "(opcional)"}
            </Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={4}
              placeholder={
                dialogAberto === "aprovado"
                  ? "Observações sobre a aprovação, se houver."
                  : "Ex.: documentação insuficiente para comprovar o benefício ambiental."
              }
            />
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant={dialogAberto === "rejeitado" ? "destructive" : "default"}
              disabled={pending}
              onClick={decidir}
            >
              {pending ? "Salvando…" : dialogAberto === "aprovado" ? "Confirmar aprovação" : "Confirmar rejeição"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
