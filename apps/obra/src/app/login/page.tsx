import Image from "next/image";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-concreto p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <Image src="/mbv-logo.png" alt="MBV" width={32} height={32} className="rounded-sm" />
          <div>
            <div className="font-display text-[14px] font-black tracking-wide text-ardosia">
              CarbonFree Obra
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wide text-texto-fraco">
              MBV · Movimento Brasil Verde
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-linha bg-papel p-7 shadow-sm">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-texto-fraco">
            Acesso restrito
          </p>
          <h2 className="mb-6 font-display text-2xl font-extrabold tracking-tight text-ardosia">
            Entrar no painel
          </h2>
          <LoginForm next={next ?? "/"} />
        </div>

        <p className="mt-6 text-center font-mono text-[10.5px] tracking-wide text-texto-fraco">
          CarbonFree Obras · Construtoras e profissionais independentes
        </p>
      </div>
    </div>
  );
}
