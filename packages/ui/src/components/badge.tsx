import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.06em] whitespace-nowrap",
  {
    variants: {
      tone: {
        /** faixas AAA/AA — desempenho excelente, sem sanção */
        ativo: "bg-verde-claro text-verde",
        /** faixa C — não conformidade, exige plano de adequação */
        passivo: "bg-ambar-claro text-ambar",
        /** faixas A/B — neutro, dentro do esperado */
        neutro: "bg-[#E6EBEF] text-azul",
        /** estado padrão da plataforma (rascunho, pendente) */
        default: "bg-concreto text-texto-fraco",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
