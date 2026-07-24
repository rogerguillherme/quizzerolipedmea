import { createFileRoute } from "@tanstack/react-router";
import { Protocolo7Screen } from "@/components/Protocolo7";

export const Route = createFileRoute("/app/protocolo")({
  component: Protocolo7Screen,
  head: () => ({
    meta: [
      { title: "Protocolo 7 Dias · Zero Lipedema" },
      { name: "robots", content: "noindex" },
    ],
  }),
});
