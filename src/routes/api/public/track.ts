import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
          const path = typeof body.path === "string" ? body.path.slice(0, 500) : "/";
          const referrer = typeof body.referrer === "string" ? body.referrer.slice(0, 500) : null;
          const session_id = typeof body.session_id === "string" ? body.session_id.slice(0, 100) : null;
          const utm_source = typeof body.utm_source === "string" ? body.utm_source.slice(0, 100) : null;
          const utm_medium = typeof body.utm_medium === "string" ? body.utm_medium.slice(0, 100) : null;
          const utm_campaign = typeof body.utm_campaign === "string" ? body.utm_campaign.slice(0, 100) : null;
          const user_agent = request.headers.get("user-agent")?.slice(0, 500) ?? null;

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("page_views").insert({
            path,
            referrer,
            user_agent,
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
