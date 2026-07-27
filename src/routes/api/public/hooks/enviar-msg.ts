// Endpoint interno para enviar uma mensagem manual (Evolution) a um telefone.
// Guardado por x-admin-key === SUPABASE_PUBLISHABLE_KEY.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/enviar-msg")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        const provided = request.headers.get("x-admin-key");
        if (!expected || provided !== expected) {
          return new Response("unauthorized", { status: 401 });
        }
        let body: { telefone?: string; mensagem?: string } = {};
        try {
          body = (await request.json()) as {
            telefone?: string;
            mensagem?: string;
          };
        } catch {
          return new Response("bad json", { status: 400 });
        }
        if (!body.telefone || !body.mensagem) {
          return new Response("missing telefone or mensagem", { status: 400 });
        }
        const { sendWhatsApp } = await import("@/lib/evolution.server");
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const wa = await sendWhatsApp(body.telefone, body.mensagem);
        await supabaseAdmin.from("whatsapp_logs").insert({
          telefone: body.telefone,
          mensagem: body.mensagem,
          status: wa.ok ? "enviado" : "falhou",
          erro: wa.error ?? null,
        });
        return Response.json(wa);
      },
    },
  },
});
