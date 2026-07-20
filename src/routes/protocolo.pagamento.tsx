import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, ShieldCheck, Zap, Gift, Star } from "lucide-react";
import { setApp, getQuiz } from "../lib/quiz-store";

export const Route = createFileRoute("/protocolo/pagamento")({
  component: Checkout,
  head: () => ({
    meta: [{ title: "Desafio Zero Lipedema · 7 dias" }],
  }),
});

function Checkout() {
  const navigate = useNavigate();
  const quiz = getQuiz();
  const [nome, setNome] = useState(quiz.nome || "");
  const [telefone, setTelefone] = useState("");
  const [metodo, setMetodo] = useState<"pix" | "cartao">("pix");
  const [bump, setBump] = useState(false);
  const [processing, setProcessing] = useState(false);

  const base = 57;
  const bumpValue = 32;
  const total = base + (bump ? bumpValue : 0);

  function submit() {
    if (!nome.trim() || telefone.replace(/\D/g, "").length < 10) return;
    setProcessing(true);
    setTimeout(() => {
      setApp({
        nome: nome.trim(),
        telefone,
        desafioAtivo: true,
        diaAtual: 1,
        streak: 0,
        pagoBump: bump,
      });
      navigate({ to: "/app" });
    }, 900);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-5 py-3">
          <button
            onClick={() => navigate({ to: "/onboarding" })}
            className="grid size-9 place-items-center rounded-xl text-primary hover:bg-accent"
          >
            <ArrowLeft className="size-5" />
          </button>
          <p className="font-bold text-primary">Desafio 7 dias</p>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pb-40 pt-5">
        <div className="card-clinical p-5">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-coral" />
            <p className="text-xs font-bold uppercase tracking-wide text-coral">
              Próximo passo do seu Mapa
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold leading-tight text-primary">
            Desafio Zero Lipedema de 7 dias
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadência diária no WhatsApp com agente de IA treinada no método da Gabriela.
            Molde de prato, chá indicado, autocuidado vascular e check-in.
          </p>

          <ul className="mt-4 space-y-2 text-sm">
            {[
              "Missões diárias por 7 dias",
              "Painel de progresso no app",
              "Catálogo de chás e shots liberados",
              "Suporte contínuo pela IA",
            ].map((i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{i}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Order bump */}
        <button
          onClick={() => setBump((b) => !b)}
          className={[
            "mt-4 w-full rounded-2xl border-2 border-dashed p-4 text-left transition-all",
            bump ? "border-coral bg-coral-soft/40" : "border-sapphire-200 bg-sapphire-50",
          ].join(" ")}
        >
          <div className="flex items-start gap-3">
            <div className="grid size-6 place-items-center rounded-md border-2 border-primary bg-background">
              {bump && <CheckCircle2 className="size-5 text-coral" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Gift className="size-4 text-coral" />
                <p className="text-sm font-bold text-primary">Turbinar por +R$ 32</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Aula bônus gravada da Gabriela + kit de treino de autocuidado
                vascular direcionado para os 7 dias.
              </p>
            </div>
          </div>
        </button>

        {/* Social proof */}
        <div className="card-clinical mt-4 p-4">
          <div className="flex items-center gap-1 text-coral">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-4 fill-current" />
            ))}
          </div>
          <p className="mt-2 text-sm italic text-foreground">
            “Na primeira semana já senti as pernas mais leves. Não acreditei que
            era só ajustar o que eu tomava e como me cuidava.”
          </p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            — Camila R., 38 anos
          </p>
        </div>

        {/* Form */}
        <div className="mt-6 space-y-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-sapphire-600">
              Nome
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-ring focus:ring-2 focus:ring-ring"
              placeholder="Como você quer ser chamada"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-sapphire-600">
              WhatsApp
            </label>
            <input
              inputMode="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-ring focus:ring-2 focus:ring-ring"
              placeholder="(DDD) 9 9999-9999"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              É por aqui que sua cadência chega logo após o pagamento.
            </p>
          </div>
        </div>

        {/* Payment method */}
        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-wide text-sapphire-600">
            Forma de pagamento
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              onClick={() => setMetodo("pix")}
              className={[
                "rounded-xl border-2 p-3 text-left transition-all",
                metodo === "pix"
                  ? "border-primary bg-sapphire-100"
                  : "border-border bg-card",
              ].join(" ")}
            >
              <p className="text-sm font-bold text-primary">Pix</p>
              <p className="text-[11px] text-muted-foreground">Aprovação imediata</p>
            </button>
            <button
              onClick={() => setMetodo("cartao")}
              className={[
                "rounded-xl border-2 p-3 text-left transition-all",
                metodo === "cartao"
                  ? "border-primary bg-sapphire-100"
                  : "border-border bg-card",
              ].join(" ")}
            >
              <p className="text-sm font-bold text-primary">Cartão</p>
              <p className="text-[11px] text-muted-foreground">Até 3× sem juros</p>
            </button>
          </div>
        </div>

        {/* Guarantee */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-sapphire-200 bg-sapphire-50 p-4">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-bold text-primary">Garantia dos 7 dias</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Complete os 7 dias seguindo a cadência do WhatsApp. Se não sentir
              diferença, devolvemos 100%. Condicionada ao engajamento mínimo.
            </p>
          </div>
        </div>
      </main>

      {/* Sticky pay bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-5 py-3">
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Total
            </p>
            <p className="text-xl font-extrabold text-primary">
              R$ {total},00
              {bump && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (com bônus)
                </span>
              )}
            </p>
          </div>
          <button
            onClick={submit}
            disabled={processing}
            className="rounded-2xl bg-coral px-6 py-4 text-base font-bold text-coral-foreground shadow-lg shadow-coral/30 transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {processing ? "Processando…" : metodo === "pix" ? "Pagar com Pix" : "Ir para cartão"}
          </button>
        </div>
      </div>

      <div className="fixed bottom-24 right-4 z-30 hidden">
        <Link to="/app">skip</Link>
      </div>
    </div>
  );
}
