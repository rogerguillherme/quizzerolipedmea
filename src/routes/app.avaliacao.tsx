import { createFileRoute, Navigate } from "@tanstack/react-router";

// Rota antiga (links do WhatsApp já enviados). O conteúdo virou /app/registrar.
export const Route = createFileRoute("/app/avaliacao")({
  component: () => <Navigate to="/app/registrar" replace />,
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
});
