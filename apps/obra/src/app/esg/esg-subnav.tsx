import Link from "next/link";
import { cn } from "@carbonfree/ui/cn";

const abas = [
  { href: "/esg", label: "Projetos" },
  { href: "/esg/guia", label: "Guia" },
  { href: "/esg/certificacao", label: "Certificação" },
];

/** Sub-navegação do módulo ESG — as três vivem sob o mesmo item de menu ("ESG"). */
export function EsgSubnav({ ativo }: { ativo: "/esg" | "/esg/guia" | "/esg/certificacao" }) {
  return (
    <div className="mb-6 flex gap-1 border-b border-linha">
      {abas.map((aba) => (
        <Link
          key={aba.href}
          href={aba.href}
          className={cn(
            "border-b-2 px-3 py-2 font-display text-[13px] font-semibold transition-colors",
            aba.href === ativo
              ? "border-verde text-texto"
              : "border-transparent text-texto-fraco hover:text-texto",
          )}
        >
          {aba.label}
        </Link>
      ))}
    </div>
  );
}
