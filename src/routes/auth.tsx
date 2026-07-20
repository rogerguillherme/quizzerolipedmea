import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Mail, Loader2 } from "lucide-react";
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

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("rogerbendlin@hotmail.com");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    // Provision the admin credentials on first visit
    ensureAdminUser({ data: undefined })
      .catch((e) => console.warn("bootstrap:", e))
      .finally(() => setBootstrapping(false));

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErro("E-mail ou senha incorretos.");
      return;
    }
    navigate({ to: "/admin" });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-hero-sapphire px-5">
      <form onSubmit={onSubmit} className="card-clinical w-full max-w-sm p-6">
        <div className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <Lock className="size-5" />
        </div>
        <h1 className="mt-4 font-serif text-2xl font-normal text-primary">Entrar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acesse o painel da Gabriela e todos os apps.
        </p>

        <label className="mt-5 block text-xs font-semibold text-muted-foreground">
          E-mail
        </label>
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-input bg-card px-3">
          <Mail className="size-4 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-transparent py-3 text-sm outline-none"
            autoComplete="email"
            required
          />
        </div>

        <label className="mt-3 block text-xs font-semibold text-muted-foreground">
          Senha
        </label>
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-input bg-card px-3">
          <Lock className="size-4 text-muted-foreground" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 bg-transparent py-3 text-sm outline-none"
            autoComplete="current-password"
            required
          />
        </div>

        {erro && <p className="mt-3 text-xs text-destructive">{erro}</p>}

        <button
          type="submit"
          disabled={loading || bootstrapping}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-50"
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
