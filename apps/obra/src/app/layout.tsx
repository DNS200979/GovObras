import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ variable: "--font-display", subsets: ["latin"] });
const sourceSerif = Source_Serif_4({ variable: "--font-body", subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "MBV Construtoras",
  description: "Documentação ESG, obras e balanço de carbono da construtora.",
  manifest: "/manifest.webmanifest",
};

/**
 * Aplica o tema salvo antes da primeira pintura — sem isso a tela pisca em
 * claro antes do React assumir. Roda inline, então precede a hidratação.
 */
const aplicarTema = `(function(){try{var t=localStorage.getItem('cf-tema');if(t==='escuro'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${archivo.variable} ${sourceSerif.variable} ${plexMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: aplicarTema }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
