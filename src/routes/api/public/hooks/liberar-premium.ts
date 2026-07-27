// Endpoint interno para liberar acesso Premium manualmente por leadId.
// Guardado por header x-admin-key === SUPABASE_PUBLISHABLE_KEY (rotacionável).
// Usado principalmente como fallback administrativo; a rota admin em /admin/mapa
// chama a versão autenticada (enviarAcessoPremium server fn).
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/liberar-premium")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        const provided = request.headers.get("x-admin-key");
        if (!expected || provided !== expected) {
          return new Response("unauthorized", { status: 401 });
        }

        let body: { leadId?: string } = {};
        try {
          body = (await request.json()) as { leadId?: string };
        } catch {
          return new Response("bad json", { status: 400 });
        }
        if (!body.leadId) {
          return new Response("missing leadId", { status: 400 });
        }

        const { enviarPremiumParaLead } = await import(
          "@/lib/premium-access.functions"
        );
        try {
          const r = await enviarPremiumParaLead(body.leadId);
          return Response.json(r);
        } catch (e) {
          return Response.json(
            { ok: false, erro: (e as Error).message },
            { status: 500 },
          );
        }
      },
    },
  },
});
