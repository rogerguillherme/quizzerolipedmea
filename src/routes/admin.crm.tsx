import { createFileRoute, redirect } from "@tanstack/react-router";

// O CRM agora vive em /crm, fora do painel administrativo.
export const Route = createFileRoute("/admin/crm")({
  beforeLoad: () => {
    throw redirect({ to: "/crm" });
  },
  component: () => null,
});
