import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
          const user_agent = request.headers.get("user-agent");
          const { isBot, sanitizePath, str, registrarDescarte } = await import(
            "@/lib/track.server"
          );

          // Metade das visitas vinha de robô: descarta sem gravar.
          if (isBot(user_agent)) {
            await registrarDescarte("bot");
            return new Response(null, { status: 204 });
          }

          // Defesa no servidor: nada de query string colada dentro do path.
          const path = sanitizePath(body.path);
          const referrer = typeof body.referrer === "string" ? body.referrer.slice(0, 500) : null;
          const session_id = str(body.session_id, 100);
          const utm_source = str(body.utm_source, 100);
          const utm_medium = str(body.utm_medium, 100);
          const utm_campaign = str(body.utm_campaign, 200);

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("page_views").insert({
            path,
            referrer,
            user_agent: user_agent?.slice(0, 500) ?? null,
            session_id,
            utm_source,
            utm_medium,
            utm_campaign,
          });
          return new Response(null, { status: 204 });
        } catch {
          return new Response(null, { status: 204 });
        }
      },
    },
  },
});
