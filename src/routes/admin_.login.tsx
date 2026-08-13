import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdminUser } from "@/lib/auth.functions";

export const Route = createFileRoute("/admin_/login")({
  component: AdminLoginPage,
  validateSearch: (search: Record<string, unknown>): { redirect?: string } =>
    typeof search.redirect === "string" ? { redirect: search.redirect } : {},
  head: () => ({
    meta: [
      { title: "Painel · Zero Lipedema" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  // Só aceitamos caminhos internos: nada de redirecionar para fora do app.
  const destino =
    redirect && redirect.startsWith("/") && !redirect.startsWith("//")
      ? redirect
      : "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    ensureAdminUser({ data: undefined } as never)
      .catch((e) => console.warn("bootstrap:", e))
      .finally(() => setBootstrapping(false));

    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (roles) navigate({ to: destino });
    });
  }, [navigate, destino]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    const { data: signIn, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error || !signIn.user) {
      setLoading(false);
      setErro("E-mail ou senha incorretos.");
      return;
    }
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", signIn.user.id)
      .eq("role", "admin")
      .maybeSingle();
    setLoading(false);
    if (!roles) {
      await supabase.auth.signOut();
      setErro("Este acesso é restrito à equipe. Alunas entram em /auth.");
      return;
    }
    navigate({ to: destino });
  }

  return (
    <div
      className="relative grid min-h-[100dvh] place-items-center overflow-hidden px-5"
      style={{
        background:
          "radial-gradient(120% 60% at 80% 0%, #EFE3CC 0%, transparent 55%), #F5EFE1",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(22,50,79,0.018) 0px, rgba(22,50,79,0.018) 1px, transparent 1px, transparent 6px)",
        }}
      />
      <form
        onSubmit={onSubmit}
        className="relative z-10 w-full max-w-sm rounded-3xl p-6"
        style={{
          background: "rgba(255,253,247,0.94)",
          border: "1px solid rgba(216,198,160,0.6)",
          boxShadow: "0 22px 40px -24px rgba(22,50,79,0.35)",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ border: "1px solid #AF7F35" }}
          >
            <Lock className="h-3.5 w-3.5" style={{ color: "#AF7F35" }} />
          </span>
          <span
            className="text-[10px] font-semibold uppercase"
            style={{ letterSpacing: "0.24em", color: "#AF7F35" }}
          >
            Zero Lipedema
          </span>
        </div>

        <h1
          className="mt-4"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 500,
            fontSize: "1.8rem",
            lineHeight: 1.1,
            color: "#16324F",
          }}
        >
          Entrar no <em className="italic" style={{ color: "#AF7F35" }}>painel</em>
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "#2F3128", lineHeight: 1.5 }}>
          Acesso restrito à equipe da Gabriela.
        </p>

        <label
          className="mt-5 block text-[10px] font-semibold uppercase"
          style={{ letterSpacing: "0.2em", color: "#AF7F35" }}
        >
          E-mail
        </label>
        <div
          className="mt-1.5 flex items-center gap-2 rounded-xl px-3"
          style={{ background: "#FFFDF7", border: "1px solid rgba(216,198,160,0.6)" }}
        >
          <Mail className="size-4" style={{ color: "#5C5749" }} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-transparent py-3 text-[14px] outline-none"
            style={{ color: "#16324F" }}
            autoComplete="username"
            required
          />
        </div>

        <label
          className="mt-3 block text-[10px] font-semibold uppercase"
          style={{ letterSpacing: "0.2em", color: "#AF7F35" }}
        >
          Senha
        </label>
        <div
          className="mt-1.5 flex items-center gap-2 rounded-xl px-3"
          style={{ background: "#FFFDF7", border: "1px solid rgba(216,198,160,0.6)" }}
        >
          <Lock className="size-4" style={{ color: "#5C5749" }} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 bg-transparent py-3 text-[14px] outline-none"
            style={{ color: "#16324F" }}
            autoComplete="current-password"
            required
          />
        </div>

        {erro && (
          <p className="mt-3 text-[12px]" style={{ color: "#B23A48" }}>
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || bootstrapping}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[14.5px] font-semibold disabled:opacity-60"
          style={{
            background: "linear-gradient(180deg, #2C5578, #16324F)",
            color: "#F5EFE1",
            boxShadow: "0 14px 26px -14px rgba(22,50,79,0.55)",
          }}
        >
          {loading || bootstrapping ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {bootstrapping ? "Preparando…" : "Entrando…"}
            </>
          ) : (
            "Entrar"
          )}
        </button>

        <p className="mt-4 text-center text-[11px]" style={{ color: "#5C5749" }}>
          É aluna?{" "}
          <a href="/auth" style={{ color: "#AF7F35", fontWeight: 600 }}>
            Entrar no seu mapa
          </a>
        </p>
      </form>
    </div>
  );
}
