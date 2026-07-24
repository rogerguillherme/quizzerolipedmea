import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, User as UserIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdminUser } from "@/lib/auth.functions";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Entrar · Zero Lipedema" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function looksLikeEmail(v: string) {
  return v.includes("@");
}

function phoneToEmail(v: string) {
  const digits = v.replace(/\D/g, "");
  return `wa${digits}@zerolipedema.app`;
}

async function routeAfterLogin(navigate: ReturnType<typeof useNavigate>) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;

  // Admin?
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const isAdmin = roles?.some((r) => r.role === "admin");
  if (isAdmin) {
    navigate({ to: "/admin" });
    return;
  }

  // Senha temporária?
  const { data: profile } = await supabase
    .from("profiles")
    .select("senha_temporaria")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.senha_temporaria) {
    navigate({ to: "/definir-senha" });
    return;
  }
  navigate({ to: "/app" });
}

function AuthPage() {
  const navigate = useNavigate();
  const [identificador, setIdentificador] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    ensureAdminUser({ data: undefined } as any)
      .catch((e) => console.warn("bootstrap:", e))
      .finally(() => setBootstrapping(false));

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) routeAfterLogin(navigate);
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    const raw = identificador.trim();
    const email = looksLikeEmail(raw) ? raw : phoneToEmail(raw);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErro("Login ou senha incorretos.");
      return;
    }
    await routeAfterLogin(navigate);
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
          Entrar no seu <em className="italic" style={{ color: "#AF7F35" }}>mapa</em>
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "#2F3128", lineHeight: 1.5 }}>
          Use o número de WhatsApp que recebeu o link, e a senha que enviamos por lá.
        </p>

        <label
          className="mt-5 block text-[10px] font-semibold uppercase"
          style={{ letterSpacing: "0.2em", color: "#AF7F35" }}
        >
          WhatsApp ou e-mail
        </label>
        <div
          className="mt-1.5 flex items-center gap-2 rounded-xl px-3"
          style={{
            background: "#FFFDF7",
            border: "1px solid rgba(216,198,160,0.6)",
          }}
        >
          <UserIcon className="size-4" style={{ color: "#5C5749" }} />
          <input
            type="text"
            value={identificador}
            onChange={(e) => setIdentificador(e.target.value)}
            placeholder="(11) 99999-9999"
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
          style={{
            background: "#FFFDF7",
            border: "1px solid rgba(216,198,160,0.6)",
          }}
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
      </form>
    </div>
  );
}
