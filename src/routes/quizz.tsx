import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { MapaChat } from "@/components/MapaChat";
import { trackMeta } from "@/lib/meta-track";

export const Route = createFileRoute("/quizz")({
  component: QuizzPage,
  head: () => ({
    meta: [
      { title: "Quiz do Mapa do Lipedema — Gabriela Rosado" },
      {
        name: "description",
        content:
          "Responda 12 perguntas em 3 minutos e receba a leitura personalizada do seu lipedema feita pela nutricionista Gabriela Rosado (CRN 10582).",
      },
      { property: "og:title", content: "Quiz do Mapa do Lipedema — Gabriela Rosado" },
      {
        property: "og:description",
        content:
          "12 perguntas, 3 minutos. Descubra o retrato clínico do seu lipedema e receba seu mapa personalizado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function QuizzPage() {
  useEffect(() => {
    trackMeta("ViewContent", { content_name: "Quiz do Mapa do Lipedema", content_type: "product" });
  }, []);

  return (
    <main className="min-h-[100dvh] overflow-y-auto" style={{ background: "#F5EFE1" }}>
      <MapaChat destino="plano" />
    </main>
  );
}
