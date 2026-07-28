import type { Config } from "tailwindcss";
import { color, font, radius } from "./index";

/** Preset Tailwind compartilhado entre apps/gov e apps/obra. */
const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        ardosia: { DEFAULT: color.ardosia, 2: color.ardosia2 },
        concreto: color.concreto,
        papel: color.papel,
        linha: { DEFAULT: color.linha, forte: color.linhaForte },
        verde: { DEFAULT: color.verde, claro: color.verdeClaro },
        ambar: { DEFAULT: color.ambar, claro: color.ambarClaro },
        texto: { DEFAULT: color.texto, fraco: color.textoFraco },
        azul: color.azul,
      },
      fontFamily: {
        display: font.display.split(",").map((f) => f.trim()),
        body: font.body.split(",").map((f) => f.trim()),
        mono: font.mono.split(",").map((f) => f.trim()),
      },
      borderRadius: {
        sm: radius.sm,
        md: radius.md,
        lg: radius.lg,
      },
    },
  },
};

export default preset;
