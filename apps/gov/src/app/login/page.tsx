import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="rounded-sm bg-primary px-2 py-1 font-display text-[13px] font-black tracking-wide text-primary-foreground">
            CARBONFREE GOV
          </span>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Acesso restrito · Prefeitura
          </p>
        </div>
        <LoginForm next={next ?? "/"} />
      </div>
    </div>
  );
}
