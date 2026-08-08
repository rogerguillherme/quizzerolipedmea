import { createFileRoute, Navigate } from "@tanstack/react-router";

// Rota órfã (mock antigo do desafio). Links antigos caem no registro de refeição.
export const Route = createFileRoute("/app/whatsapp")({
  component: () => <Navigate to="/app/registrar" replace />,
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
});
