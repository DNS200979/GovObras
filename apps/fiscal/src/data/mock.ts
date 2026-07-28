export interface Vistoria {
  id: string;
  obra: string;
  construtora: string;
  endereco: string;
  fase: "fundacao" | "estrutura" | "acabamento" | "entrega";
  horario: string;
  status: "agendada" | "em_campo" | "concluida";
}

export const agendaHoje: Vistoria[] = [
  {
    id: "V-2201",
    obra: "Galpão Logístico Norte",
    construtora: "Sul Construções",
    endereco: "Rod. SC-401, km 12",
    fase: "estrutura",
    horario: "09:30",
    status: "agendada",
  },
  {
    id: "V-2202",
    obra: "Edifício Corporate Tower",
    construtora: "BF Engenharia",
    endereco: "Av. Beira-Mar Norte, 1450",
    fase: "acabamento",
    horario: "14:00",
    status: "agendada",
  },
  {
    id: "V-2189",
    obra: "Condomínio Bosque Real",
    construtora: "Andrade Incorporações",
    endereco: "R. das Palmeiras, 88",
    fase: "fundacao",
    horario: "08:00 · ontem",
    status: "concluida",
  },
];

/** Checklist por fase (seção 08 do plano — "gerado conforme fase da obra"). */
export const checklistPorFase: Record<Vistoria["fase"], { id: string; label: string }[]> = {
  fundacao: [
    { id: "f1", label: "Locação da obra confere com o projeto aprovado" },
    { id: "f2", label: "MTR de bota-fora emitido e compatível com o volume escavado" },
    { id: "f3", label: "Notas fiscais de concreto/aço conferidas no estoque" },
  ],
  estrutura: [
    { id: "e1", label: "Quantitativo de aço em obra compatível com NF-e declaradas" },
    { id: "e2", label: "Traço do concreto confere com ficha técnica anexada" },
    { id: "e3", label: "Resíduos classe A com destinação e CDF válidos" },
  ],
  acabamento: [
    { id: "a1", label: "Materiais de esquadria/revestimento conferidos por NCM" },
    { id: "a2", label: "Sistema de climatização com ficha técnica de gás fluorado" },
    { id: "a3", label: "Mudas de compensação com sobrevivência conferida em campo" },
  ],
  entrega: [
    { id: "en1", label: "Etiqueta PBE Edifica emitida e compatível com o projeto" },
    { id: "en2", label: "Dossiê final consistente com o inventário homologado" },
  ],
};
