import { createFileRoute } from "@tanstack/react-router";
import { MapaPage } from "./mapa";

export const Route = createFileRoute("/")({
  component: MapaPage,
  head: () => ({
    meta: [
      { title: "Mapa do Lipedema — Teste de 2 minutos com a Dra. Gabriela Rosado" },
      {
        name: "description",
        content:
          "Responda 8 perguntas rápidas e receba a leitura personalizada do seu lipedema, elaborada pela nutricionista Gabriela Rosado (CRN 10582).",
      },
      { property: "og:title", content: "Mapa do Lipedema — Teste de 2 minutos com a Dra. Gabriela Rosado" },
      {
        property: "og:description",
        content:
          "Responda 8 perguntas rápidas e receba a leitura personalizada do seu lipedema, elaborada pela nutricionista Gabriela Rosado (CRN 10582).",
      },
    ],
  }),
});
