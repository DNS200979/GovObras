import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@carbonfree/ui/shadcn/tooltip";

const archivo = Archivo({ variable: "--font-display", subsets: ["latin"] });
const sourceSerif = Source_Serif_4({ variable: "--font-body", subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({
  variable: "--font-mono-src",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "CarbonFree Gov",
  description: "Painel de comando do programa municipal de carbono de obra.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`dark ${archivo.variable} ${sourceSerif.variable} ${plexMono.variable} antialiased`}
    >
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
