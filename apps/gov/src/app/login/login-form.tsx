"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { enviarLink, type EnviarLinkState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<EnviarLinkState, FormData>(enviarLink, {});

  if (state.enviado) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verifique seu e-mail</CardTitle>
          <CardDescription>
            Enviamos um link de acesso. Ele expira em alguns minutos — se não chegar, confira o
            spam ou peça um novo.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>
          Sem senha — enviamos um link de acesso único para o seu e-mail cadastrado no programa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="next" value={next} />
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="voce@prefeitura.gov.br"
                required
                autoFocus
                className="pl-8"
              />
            </div>
          </div>
          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Enviando…" : "Enviar link de acesso"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
