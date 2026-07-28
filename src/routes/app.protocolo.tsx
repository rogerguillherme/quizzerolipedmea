import { createFileRoute, redirect } from "@tanstack/react-router";
import { Protocolo7Screen } from "@/components/Protocolo7";

// Rota mantida apenas por referência histórica: o Protocolo de 7 Dias foi
// descontinuado como produto. Qualquer acesso direto agora é redirecionado
// para o dashboard do app. Mantemos o import do componente para não quebrar
// caso decidamos reativar no futuro.
export const Route = createFileRoute("/app/protocolo")({
  beforeLoad: () => {
    throw redirect({ to: "/app" });
  },
  component: Protocolo7Screen,
  head: () => ({
    meta: [
      { title: "Protocolo 7 Dias · Zero Lipedema" },
      { name: "robots", content: "noindex" },
    ],
  }),
});
