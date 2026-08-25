"use client";

import { useSyncExternalStore } from "react";

/**
 * A fonte de verdade do tema é a classe `dark` no <html> — escrita pelo
 * script de boot antes da hidratação e por este botão. Espelhá-la em state
 * criava duas verdades e exigia setState dentro de efeito; aqui o React
 * apenas observa o DOM.
 */
function inscrever(aoMudar: () => void) {
  const observador = new MutationObserver(aoMudar);
  observador.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observador.disconnect();
}

const lerNoCliente = () => document.documentElement.classList.contains("dark");
/** No servidor não há <html> para inspecionar — `null` marca "ainda não sei". */
const lerNoServidor = () => null;

export function ThemeToggle() {
  const escuro = useSyncExternalStore(inscrever, lerNoCliente, lerNoServidor);
  const conhecido = escuro !== null;

  function alternar() {
    const proximo = !escuro;
    // Só mexe no DOM: o observador acima avisa o React.
    document.documentElement.classList.toggle("dark", proximo);
    try {
      localStorage.setItem("cf-tema", proximo ? "escuro" : "claro");
    } catch {
      // navegador sem localStorage — o tema vale só para esta sessão
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      // O ícone só é correto depois de ler a classe no cliente; até lá fica
      // invisível para não piscar o símbolo errado.
      aria-label={escuro ? "Usar tema claro" : "Usar tema escuro"}
      title={escuro ? "Usar tema claro" : "Usar tema escuro"}
      className={`flex h-7 w-7 items-center justify-center rounded-sm border border-linha text-texto-fraco transition-colors hover:border-verde hover:text-verde ${
        conhecido ? "" : "invisible"
      }`}
    >
      {escuro ? (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
