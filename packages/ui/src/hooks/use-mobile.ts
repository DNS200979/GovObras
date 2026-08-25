import * as React from "react"

const MOBILE_BREAKPOINT = 768
const CONSULTA = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

/**
 * O viewport é estado externo ao React — `useSyncExternalStore` é o jeito
 * de assiná-lo sem espelhar o valor em state (que exigiria setState dentro
 * de efeito, e renderiza duas vezes a cada mudança).
 */
function inscrever(aoMudar: () => void) {
  const mql = window.matchMedia(CONSULTA)
  mql.addEventListener("change", aoMudar)
  return () => mql.removeEventListener("change", aoMudar)
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    inscrever,
    () => window.matchMedia(CONSULTA).matches,
    // No servidor não existe viewport: assume desktop, como antes.
    () => false,
  )
}
