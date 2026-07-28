import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getTrafegoMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const nowIso = new Date().toISOString();
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const start7 = new Date(Date.now() - 7 * 86_400_000);

    const [{ data: today }, { data: last7 }] = await Promise.all([
      supabaseAdmin
        .from("page_views")
        .select("path, session_id, referrer")
        .gte("created_at", startToday.toISOString())
        .lte("created_at", nowIso),
      supabaseAdmin
        .from("page_views")
        .select("created_at, session_id")
        .gte("created_at", start7.toISOString()),
    ]);

    const rowsToday = today ?? [];
    const rows7 = last7 ?? [];

    const byPath: Record<string, number> = {};
    const sessionsToday = new Set<string>();
    const byReferrer: Record<string, number> = {};
    for (const r of rowsToday) {
      byPath[r.path] = (byPath[r.path] || 0) + 1;
      if (r.session_id) sessionsToday.add(r.session_id);
      const ref = r.referrer ? new URL(r.referrer).hostname : "direto";
      byReferrer[ref] = (byReferrer[ref] || 0) + 1;
    }

    const byDay: Record<string, { views: number; sessions: Set<string> }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86_400_000);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = { views: 0, sessions: new Set() };
    }
    for (const r of rows7) {
      const key = (r.created_at as string).slice(0, 10);
      if (!byDay[key]) continue;
      byDay[key].views += 1;
      if (r.session_id) byDay[key].sessions.add(r.session_id);
    }

    return {
      today: {
        views: rowsToday.length,
        sessions: sessionsToday.size,
        topPaths: Object.entries(byPath)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([path, count]) => ({ path, count })),
        topReferrers: Object.entries(byReferrer)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([source, count]) => ({ source, count })),
      },
      daily: Object.entries(byDay).map(([date, v]) => ({
        date,
        views: v.views,
        sessions: v.sessions.size,
      })),
    };
  });
