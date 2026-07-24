import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/definir-senha")({
  component: DefinirSenhaPage,
  head: () => ({
    meta: [
      { title: "Definir nova senha · Zero Lipedema" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function DefinirSenhaPage() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate({ to: "/auth" });
      else setReady(true);
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirma) {
      setErro("As senhas não conferem.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) {
      setLoading(false);
      setErro("Não foi possível atualizar a senha. Tente novamente.");
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user?.id) {
      await supabase
        .from("profiles")
        .update({ senha_temporaria: false })
        .eq("id", userData.user.id);
    }
    setLoading(false);
    navigate({ to: "/app" });
  }

  if (!ready) {
    return (
      <div className="grid min-h-[100dvh] place-items-center" style={{ background: "#F5EFE1" }}>
        <Loader2 className="size-6 animate-spin" style={{ color: "#16324F" }} />
      </div>
    );
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
            Primeiro acesso
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
          Crie a sua <em className="italic" style={{ color: "#AF7F35" }}>senha</em>
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "#2F3128", lineHeight: 1.5 }}>
          Escolha uma senha nova para acessar seu mapa a partir de agora.
        </p>

        <label
          className="mt-5 block text-[10px] font-semibold uppercase"
          style={{ letterSpacing: "0.2em", color: "#AF7F35" }}
        >
          Nova senha
        </label>
        <div
          className="mt-1.5 flex items-center gap-2 rounded-xl px-3"
          style={{ background: "#FFFDF7", border: "1px solid rgba(216,198,160,0.6)" }}
        >
          <Lock className="size-4" style={{ color: "#5C5749" }} />
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="flex-1 bg-transparent py-3 text-[14px] outline-none"
            style={{ color: "#16324F" }}
            autoComplete="new-password"
            required
            minLength={6}
          />
        </div>

        <label
          className="mt-3 block text-[10px] font-semibold uppercase"
          style={{ letterSpacing: "0.2em", color: "#AF7F35" }}
        >
          Confirmar senha
        </label>
        <div
          className="mt-1.5 flex items-center gap-2 rounded-xl px-3"
          style={{ background: "#FFFDF7", border: "1px solid rgba(216,198,160,0.6)" }}
        >
          <Lock className="size-4" style={{ color: "#5C5749" }} />
          <input
            type="password"
            value={confirma}
            onChange={(e) => setConfirma(e.target.value)}
            className="flex-1 bg-transparent py-3 text-[14px] outline-none"
            style={{ color: "#16324F" }}
            autoComplete="new-password"
            required
            minLength={6}
          />
        </div>

        {erro && (
          <p className="mt-3 text-[12px]" style={{ color: "#B23A48" }}>
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[14.5px] font-semibold disabled:opacity-60"
          style={{
            background: "linear-gradient(180deg, #2C5578, #16324F)",
            color: "#F5EFE1",
            boxShadow: "0 14px 26px -14px rgba(22,50,79,0.55)",
          }}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Salvando…
            </>
          ) : (
            "Salvar e entrar"
          )}
        </button>
      </form>
    </div>
  );
}
