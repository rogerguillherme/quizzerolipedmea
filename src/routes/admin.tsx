import {
  createFileRoute,
  Outlet,
  useNavigate,
  useRouterState,
  Link,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  GitBranch,
  MapPinned,
  Sparkles,
  Crown,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () => ({
    meta: [
      { title: "Painel · Gabriela · Zero Lipedema" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const NAV: Array<{
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section: "geral" | "apps" | "config";
}> = [
  { to: "/admin", label: "Visão geral", icon: LayoutDashboard, section: "geral" },
  { to: "/admin/crm", label: "CRM & Chat", icon: MessageSquare, section: "geral" },
  { to: "/admin/funis", label: "Funis de mensagem", icon: GitBranch, section: "geral" },
  { to: "/admin/mapa", label: "Mapa do Lipedema", icon: MapPinned, section: "apps" },
  { to: "/admin/protocolo", label: "Protocolo 7 dias", icon: Sparkles, section: "apps" },
  { to: "/admin/derma", label: "Método Derma", icon: Crown, section: "apps" },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings, section: "config" },
];

function AdminLayout() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!data.session) {
        navigate({ to: "/admin/login" });
        return;
      }
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!role) {
        await supabase.auth.signOut();
        navigate({ to: "/admin/login" });
        return;
      }
      setChecking(false);
    })();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F7F2E8]">
        <Loader2 className="size-6 animate-spin text-[#0B2A4A]" />
      </div>
    );
  }

  const groups: Array<{ key: "geral" | "apps" | "config"; label: string }> = [
    { key: "geral", label: "Operação" },
    { key: "apps", label: "Apps" },
    { key: "config", label: "Sistema" },
  ];

  return (
    <div
      className="min-h-screen text-[#0B2A4A]"
      style={{
        background:
          "radial-gradient(1000px 600px at 0% 0%, #EFE5CE 0%, transparent 50%), #F7F2E8",
      }}
    >
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-[#E5DBC3] bg-[#FBF6EB]/80 backdrop-blur md:flex md:flex-col">
          <div className="border-b border-[#E5DBC3] px-5 py-5">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B8974D]"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              Zero Lipedema
            </p>
            <p
              className="mt-1 text-lg italic text-[#0B2A4A]"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              Painel Gabriela
            </p>
          </div>

          <nav className="flex-1 space-y-6 px-3 py-5">
            {groups.map((g) => (
              <div key={g.key}>
                <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A7C5C]">
                  {g.label}
                </p>
                <ul className="space-y-0.5">
                  {NAV.filter((n) => n.section === g.key).map((n) => {
                    const active =
                      n.to === "/admin"
                        ? pathname === "/admin" || pathname === "/admin/"
                        : pathname.startsWith(n.to);
                    return (
                      <li key={n.to}>
                        <Link
                          to={n.to}
                          className={[
                            "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all",
                            active
                              ? "bg-[#0B2A4A] text-[#F7F2E8] shadow-sm"
                              : "text-[#3E4F65] hover:bg-[#EFE5CE]",
                          ].join(" ")}
                        >
                          <n.icon className="size-4" />
                          {n.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="border-t border-[#E5DBC3] p-3">
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#3E4F65] hover:bg-[#EFE5CE]"
            >
              <LogOut className="size-4" /> Sair
            </button>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1">
          {/* Mobile nav */}
          <div className="border-b border-[#E5DBC3] bg-[#FBF6EB]/95 backdrop-blur md:hidden">
            <div className="flex gap-1 overflow-x-auto px-3 py-2">
              {NAV.map((n) => {
                const active =
                  n.to === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={[
                      "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
                      active
                        ? "bg-[#0B2A4A] text-[#F7F2E8]"
                        : "text-[#3E4F65]",
                    ].join(" ")}
                  >
                    <n.icon className="size-3.5" /> {n.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
