import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { MapaChat } from "@/components/MapaChat";
import { trackMeta } from "@/lib/meta-track";

/**
 * Funil novo: mesmo quiz do /quizz (mesmo componente, mesmas 12 perguntas,
 * mesmo submitMapa). A única diferença é o destino: aqui a lead termina na
 * landing /plano, onde o popup entrega o Mapa e captura o WhatsApp.
 */
export const Route = createFileRoute("/meu-mapa")({
  component: MeuMapaPage,
  head: () => ({
    meta: [
      { title: "Mapa do Lipedema · Gabriela Rosado" },
      {
        name: "description",
        content:
          "Responda 12 perguntas em 3 minutos e receba a leitura personalizada do seu lipedema, feita pela nutricionista Gabriela Rosado (CRN 10582).",
      },
      { property: "og:title", content: "Mapa do Lipedema · Gabriela Rosado" },
      {
        property: "og:description",
        content:
          "Responda 12 perguntas em 3 minutos e receba a leitura personalizada do seu lipedema, feita pela nutricionista Gabriela Rosado (CRN 10582).",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://zerolipedema.com.br/meu-mapa" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://zerolipedema.com.br/meu-mapa" }],
  }),
});

function MeuMapaPage() {
  useEffect(() => {
    trackMeta("ViewContent", { content_name: "Mapa do Lipedema", content_type: "product" });
  }, []);

  return (
    <main className="min-h-[100dvh] overflow-y-auto" style={{ background: "#F5EFE1" }}>
      <MapaChat destino="plano" funil="meu-mapa" />
    </main>
  );
}
