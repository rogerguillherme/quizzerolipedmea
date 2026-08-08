import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/track/event")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as Record<
            string,
            unknown
          >;
          const user_agent = request.headers.get("user-agent");
          const { isBot, sanitizePath, str, registrarDescarte } = await import(
            "@/lib/track.server"
          );

          if (isBot(user_agent)) {
            await registrarDescarte("bot");
            return new Response(null, { status: 204 });
          }

          const nome = str(body.nome, 80);
          if (!nome) return new Response(null, { status: 204 });

          const lead_id =
            typeof body.lead_id === "string" &&
            /^[0-9a-f-]{36}$/i.test(body.lead_id)
              ? body.lead_id
              : null;

          const meta =
            body.meta && typeof body.meta === "object" ? body.meta : {};

          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          await supabaseAdmin.from("eventos").insert({
            nome,
            session_id: str(body.session_id, 100),
            lead_id,
            path: sanitizePath(body.path),
            meta: {
              ...(meta as Record<string, unknown>),
              atribuicao: body.atribuicao ?? null,
            } as never,
            utm_source: str(body.utm_source, 100),
            utm_medium: str(body.utm_medium, 100),
            utm_campaign: str(body.utm_campaign, 200),
            utm_content: str(body.utm_content, 200),
            utm_term: str(body.utm_term, 200),
            fbclid: str(body.fbclid, 255),
            user_agent: user_agent?.slice(0, 500) ?? null,
          });
          return new Response(null, { status: 204 });
        } catch {
          return new Response(null, { status: 204 });
        }
      },
    },
  },
});
