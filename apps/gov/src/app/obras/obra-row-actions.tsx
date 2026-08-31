"use client";

import { useActionState, useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { Alert, AlertDescription } from "@carbonfree/ui/shadcn/alert";
import { Button } from "@carbonfree/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@carbonfree/ui/shadcn/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@carbonfree/ui/shadcn/sheet";
import { atualizarObra, excluirObra, type CriarObraState } from "./actions";
import { ObraCamposForm, type ObraDefaultValues } from "./obra-campos-form";

interface Props {
  obraId: string;
  obraNome: string;
  defaultValues: ObraDefaultValues;
  construtoras: { id: string; razao_social: string; cnpj_cpf: string }[];
}

export function ObraRowActions({ obraId, obraNome, defaultValues, construtoras }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const atualizarComId = atualizarObra.bind(null, obraId);
  const [state, formAction, updating] = useActionState<CriarObraState, FormData>(atualizarComId, {});

  if (state.ok && editOpen) {
    setEditOpen(false);
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await excluirObra(obraId);
      if (res.error) {
        setDeleteError(res.error);
      } else {
        setDeleteOpen(false);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm"><MoreHorizontal /></Button>} />
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            render={
              <button type="button" onClick={() => setEditOpen(true)} className="w-full">
                <Pencil /> Editar
              </button>
            }
          />
          <DropdownMenuItem
            variant="destructive"
            render={
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setDeleteOpen(true);
                }}
                className="w-full"
              >
                <Trash2 /> Excluir
              </button>
            }
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="overflow-y-auto">
          <form action={formAction}>
            <SheetHeader>
              <SheetTitle>Editar obra</SheetTitle>
              <SheetDescription>{obraNome}</SheetDescription>
            </SheetHeader>

            <ObraCamposForm construtoras={construtoras} defaultValues={defaultValues} error={state.error} />

            <SheetFooter>
              <Button type="submit" disabled={updating}>
                {updating ? "Salvando…" : "Salvar alterações"}
              </Button>
              <SheetClose render={<Button variant="outline" type="button">Cancelar</Button>} />
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {obraNome}?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Só funciona se a obra ainda não tiver inventário,
              fiscalização ou selo vinculado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError ? (
            <Alert variant="destructive">
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={pending} onClick={handleDelete}>
              {pending ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
