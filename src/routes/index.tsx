import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Sparkles, HeartPulse, ShieldCheck } from "lucide-react";
import draGabrielaAsset from "@/assets/dra-gabriela.png.asset.json";
import { MapaQuizDialog } from "@/components/MapaQuizDialog";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Mapa do Lipedema — Dra. Gabriela Rosado" },
      {
        name: "description",
        content:
          "Teste de 2 minutos com a Dra. Gabriela Rosado (CRN 10582). Descubra em que estágio do lipedema você está e receba seu mapa personalizado.",
      },
      { property: "og:title", content: "Mapa do Lipedema — Dra. Gabriela Rosado" },
      {
        property: "og:description",
        content:
          "Teste de 2 minutos. Responda 8 perguntas e receba a leitura personalizada do seu lipedema no WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: draGabrielaAsset.url },
      { name: "twitter:image", content: draGabrielaAsset.url },
    ],
  }),
});

function LandingPage() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <main className="min-h-[100dvh] bg-[hsl(var(--cream,40_45%_95%))] text-[hsl(var(--blue,213_60%_17%))] relative overflow-hidden">
        {/* fundo suave */}
        <div className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(1200px 600px at 80% -10%, rgba(200,160,90,0.18), transparent 60%), radial-gradient(900px 500px at -10% 100%, rgba(11,42,74,0.10), transparent 60%)",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 pt-10 pb-16 md:pt-16 md:pb-24">
          <div className="flex items-center justify-between mb-10">
            <span className="text-[11px] tracking-[0.28em] uppercase text-[hsl(38_45%_40%)] font-medium">
              Zero Lipedema
            </span>
            <span className="text-[11px] tracking-[0.24em] uppercase text-[hsl(38_45%_40%)]">
              CRN 10582
            </span>
          </div>

          <div className="grid md:grid-cols-[1.05fr_0.95fr] gap-10 md:gap-16 items-center">
            {/* Texto */}
            <div>
              <p className="text-[11px] tracking-[0.32em] uppercase text-[hsl(38_60%_38%)] mb-6">
                Mapa do Lipedema · Teste de 2 min
              </p>
              <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight">
                Não é falta de esforço.{" "}
                <em className="text-[hsl(38_55%_42%)] font-serif italic">É lipedema</em>{" "}
                — e agora dá pra entender o seu.
              </h1>
              <p className="mt-6 text-base md:text-lg text-[hsl(213_30%_28%)] max-w-xl leading-relaxed">
                Sou a <strong className="font-semibold">Dra. Gabriela Rosado</strong>, nutricionista
                especialista em lipedema. Respondendo 8 perguntas rápidas você recebe o seu
                <em className="italic"> mapa personalizado</em> — direto aqui e também no seu WhatsApp.
              </p>

              <ul className="mt-8 space-y-3 text-sm md:text-base">
                <li className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 mt-0.5 text-[hsl(38_60%_45%)]" />
                  <span>Leitura clínica baseada nos seus sintomas reais.</span>
                </li>
                <li className="flex items-start gap-3">
                  <HeartPulse className="w-5 h-5 mt-0.5 text-[hsl(38_60%_45%)]" />
                  <span>Estágio percebido e 3 prioridades para começar hoje.</span>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 mt-0.5 text-[hsl(38_60%_45%)]" />
                  <span>Acesso ao app enviado pelo WhatsApp após concluir.</span>
                </li>
              </ul>

              <div className="mt-10">
                <button
                  onClick={() => setOpen(true)}
                  className="group relative inline-flex items-center gap-3 rounded-full bg-[hsl(213_60%_17%)] text-[hsl(40_45%_95%)] px-8 py-4 md:px-10 md:py-5 text-base md:text-lg font-medium shadow-[0_18px_40px_-18px_rgba(11,42,74,0.55)] transition-all hover:shadow-[0_22px_50px_-16px_rgba(11,42,74,0.65)] hover:-translate-y-0.5 animate-[breathe_3.4s_ease-in-out_infinite]"
                >
                  <span>Gerar Meu Mapa</span>
                  <span aria-hidden>🗺️</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
                <p className="mt-4 text-xs text-[hsl(213_20%_40%)]">
                  Leitura educacional. Não substitui avaliação médica.
                </p>
              </div>
            </div>

            {/* Foto */}
            <div className="relative">
              <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-[hsl(38_55%_75%)]/40 to-transparent blur-2xl" />
              <div className="relative rounded-[1.75rem] overflow-hidden border border-[hsl(38_35%_75%)]/60 shadow-[0_30px_60px_-30px_rgba(11,42,74,0.35)] bg-[hsl(40_30%_92%)]">
                <img
                  src={draGabrielaAsset.url}
                  alt="Dra. Gabriela Rosado, nutricionista especialista em lipedema (CRN 10582)"
                  className="w-full h-auto object-cover aspect-[4/5]"
                  loading="eager"
                />
              </div>
              <div className="absolute -bottom-4 left-4 right-4 md:left-8 md:right-8 rounded-2xl bg-[hsl(213_60%_17%)] text-[hsl(40_45%_95%)] px-5 py-4 shadow-lg backdrop-blur">
                <p className="font-serif italic text-lg leading-tight">
                  "Se você já tentou de tudo e nada muda nas pernas — o problema não é você."
                </p>
                <p className="mt-1 text-[11px] tracking-[0.24em] uppercase text-[hsl(38_55%_72%)]">
                  Dra. Gabriela Rosado
                </p>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes breathe {
            0%, 100% { transform: translateY(0) scale(1); }
            50%      { transform: translateY(-2px) scale(1.015); }
          }
        `}</style>
      </main>

      <MapaQuizDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
