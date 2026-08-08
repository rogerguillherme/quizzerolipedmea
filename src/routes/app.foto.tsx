import { createFileRoute, Navigate } from "@tanstack/react-router";

// Rota órfã: o registro de refeição por foto vive em /app/registrar.
export const Route = createFileRoute("/app/foto")({
  component: () => <Navigate to="/app/registrar" replace />,
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
});
