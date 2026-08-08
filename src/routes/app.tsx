import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Compass, Lightbulb, Sparkles, User, Loader2, CalendarCheck, Camera, ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) {
        navigate({ to: "/auth" });
        return;
      }
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/auth" });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  if (!ready) {
    return (
      <div
        className="grid min-h-[100dvh] place-items-center"
        style={{ background: "#F5EFE1" }}
      >
        <Loader2 className="size-6 animate-spin" style={{ color: "#16324F" }} />
      </div>
    );
  }

  // Ciclo diário: abrir (Hoje) → ação (Registrar / Rotina) → recompensa (Progresso).
  // "Premium" saiu da nav: /app/derma é alcançada por card contextual na Hoje.
  const tabs: { to: string; label: string; icon: typeof Compass; exact?: boolean }[] = [
    { to: "/app", label: "Hoje", icon: Sun, exact: true },
    { to: "/app/registrar", label: "Registrar", icon: Camera },
    { to: "/app/rotina", label: "Rotina", icon: CalendarCheck },
    { to: "/app/progresso", label: "Progresso", icon: TrendingUp },
  ];


  return (
    <div
      className="relative min-h-[100dvh] overflow-x-hidden"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom) + 5.5rem)",
        ["--cream" as string]: "#F5EFE1",
        ["--cream-soft" as string]: "#FBF6E9",
        ["--cream-line" as string]: "#D8C6A0",
        ["--blue" as string]: "#16324F",
        ["--blue-soft" as string]: "#2C5578",
        ["--blue-pale" as string]: "#AFC4D6",
        ["--gold" as string]: "#AF7F35",
        ["--gold-soft" as string]: "#D9A94B",
        ["--ink-soft" as string]: "#2F3128",
        background:
          "radial-gradient(120% 60% at 80% 0%, #EFE3CC 0%, transparent 55%), #F5EFE1",
        color: "#16324F",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      {/* Paper texture */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(22,50,79,0.018) 0px, rgba(22,50,79,0.018) 1px, transparent 1px, transparent 6px)",
        }}
      />

      <header
        className="sticky top-0 z-30 backdrop-blur"
        style={{
          background: "rgba(245,239,225,0.86)",
          borderBottom: "1px solid rgba(216,198,160,0.5)",
        }}
      >
        <div className="mx-auto flex max-w-md items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ border: "1px solid var(--gold)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#AF7F35" strokeWidth="1.6" className="h-3.5 w-3.5">
                <path d="M12 2C8 6 6 10 6 13a6 6 0 0 0 12 0c0-3-2-7-6-11z" />
              </svg>
            </span>
            <div className="leading-tight">
              <p
                className="text-[9px] font-semibold uppercase"
                style={{ letterSpacing: "0.24em", color: "#AF7F35" }}
              >
                Zero Lipedema
              </p>
              <p
                className="text-[13px] italic"
                style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, color: "#16324F" }}
              >
                seu mapa pessoal
              </p>
            </div>
          </div>
          <Link
            to="/app/perfil"
            className="grid size-9 place-items-center rounded-full transition-colors"
            style={{
              border: "1px solid rgba(216,198,160,0.6)",
              background: "rgba(255,253,247,0.85)",
              color: "#16324F",
            }}
            aria-label="Perfil"
          >
            <User className="size-4" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-md">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 backdrop-blur"
        style={{
          background: "rgba(245,239,225,0.94)",
          borderTop: "1px solid rgba(216,198,160,0.5)",
        }}
      >
        <div className="mx-auto grid max-w-md grid-cols-4" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to as "/app"}
                className="flex flex-col items-center gap-1 py-3 transition-colors"
                style={{ color: active ? "#16324F" : "#5C5749" }}
              >
                <span
                  className="grid size-8 place-items-center rounded-full transition-all"
                  style={
                    active
                      ? {
                          background:
                            "linear-gradient(180deg, var(--blue-soft), var(--blue))",
                          color: "#F5EFE1",
                          boxShadow: "0 6px 14px -6px rgba(22,50,79,0.5)",
                        }
                      : { color: "#5C5749" }
                  }
                >
                  <Icon className="size-4" />
                </span>
                <span
                  className="text-[10px] font-semibold uppercase"
                  style={{ letterSpacing: "0.14em" }}
                >
                  {t.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
