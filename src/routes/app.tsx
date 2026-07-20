import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { Activity, ListChecks, MessageCircle, Lock, User } from "lucide-react";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const tabs: { to: string; label: string; icon: typeof Activity; exact?: boolean }[] = [
    { to: "/app", label: "Radar", icon: Activity, exact: true },
    { to: "/app/missoes", label: "Missões", icon: ListChecks },
    { to: "/app/whatsapp", label: "WhatsApp", icon: MessageCircle },
    { to: "/app/derma", label: "Método", icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              Z
            </div>
            <p className="text-sm font-bold text-primary">Zero Lipedema</p>
          </div>
          <Link
            to="/app/perfil"
            className="grid size-9 place-items-center rounded-xl border border-border bg-card text-primary hover:bg-accent"
            aria-label="Perfil"
          >
            <User className="size-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={[
                  "flex flex-col items-center gap-1 py-3 text-[11px] font-semibold transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                ].join(" ")}
              >
                <Icon
                  className={["size-5", active ? "text-primary" : "text-muted-foreground"].join(" ")}
                />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
