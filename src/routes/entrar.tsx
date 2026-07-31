import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Entrada direta pelo link enviado no WhatsApp.
 *
 * O link carrega `?t=<token_hash>` (magic link gerado no servidor). Aqui a gente
 * troca esse token por uma sessão e manda a lead direto pra tela onde ela
 * escolhe a própria senha, sem precisar digitar login nem senha aleatória.
 */
export const Route = createFileRoute("/entrar")({
  component: EntrarPage,
  head: () => ({
    meta: [
      { title: "Entrando no seu Mapa · Zero Lipedema" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function EntrarPage() {
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function entrar() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("t") ?? params.get("token_hash");

      // Sem token: pode ser um link antigo. Cai no login tradicional.
      if (!token) {
        navigate({ to: "/auth" });
        return;
      }

      const { data, error } = await supabase.auth.verifyOtp({
        type: "magiclink",
        token_hash: token,
      });

      if (cancelado) return;

      if (error || !data.session) {
        setErro(
          "Esse link expirou. Me chama no WhatsApp que eu te mando um novo em segundos 💙",
        );
        return;
      }

      // Sessão criada: agora ela escolhe a senha dela.
      navigate({ to: "/definir-senha" });
    }

    void entrar();
    return () => {
      cancelado = true;
    };
  }, [navigate]);

  return (
    <div
      className="grid min-h-[100dvh] place-items-center px-6 text-center"
      style={{
        background:
          "radial-gradient(120% 60% at 80% 0%, #EFE3CC 0%, transparent 55%), #F5EFE1",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      {erro ? (
        <div className="max-w-sm">
          <p className="text-[14px]" style={{ color: "#16324F", lineHeight: 1.6 }}>
            {erro}
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/auth" })}
            className="mt-5 rounded-full px-5 py-3 text-[14px] font-semibold"
            style={{
              background: "linear-gradient(180deg, #2C5578, #16324F)",
              color: "#F5EFE1",
            }}
          >
            Entrar com senha
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2" style={{ color: "#16324F" }}>
          <Loader2 className="size-5 animate-spin" />
          <span className="text-[14px]">Abrindo o seu Mapa…</span>
        </div>
      )}
    </div>
  );
}
