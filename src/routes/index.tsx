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
      <main className="min-h-[100dvh] md:h-[100dvh] md:overflow-hidden bg-[hsl(var(--cream,40_45%_95%))] text-[hsl(var(--blue,213_60%_17%))] relative">
        {/* fundo suave */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(1200px 600px at 80% -10%, rgba(200,160,90,0.18), transparent 60%), radial-gradient(900px 500px at -10% 100%, rgba(11,42,74,0.10), transparent 60%)",
          }}
        />

        <div className="relative mx-auto flex h-full max-w-6xl flex-col px-5 pt-[max(env(safe-area-inset-top),0.75rem)] pb-[max(env(safe-area-inset-bottom),0.75rem)] md:px-6 md:pt-16 md:pb-24">
          {/* Topbar */}
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[10px] md:text-[11px] tracking-[0.28em] uppercase text-[hsl(38_45%_40%)] font-medium">
              Zero Lipedema
            </span>
            <span className="text-[10px] md:text-[11px] tracking-[0.24em] uppercase text-[hsl(38_45%_40%)]">
              CRN 10582
            </span>
          </div>

          {/* Conteúdo — mobile: coluna compacta; desktop: 2 colunas */}
          <div className="flex flex-1 min-h-0 flex-col justify-between gap-3 pt-3 md:grid md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-16 md:pt-10 md:justify-normal">
            {/* Texto */}
            <div className="min-w-0 order-2 md:order-1">
              <p className="hidden md:block text-[11px] tracking-[0.32em] uppercase text-[hsl(38_60%_38%)] mb-6">
                Mapa do Lipedema · Teste de 2 min
              </p>
              <h1 className="font-serif leading-[1.05] tracking-tight text-[clamp(1.4rem,6.2vw,2rem)] md:text-6xl">
                Não é falta de esforço.{" "}
                <em className="text-[hsl(38_55%_42%)] font-serif italic">É lipedema</em>{" "}
                <span className="md:inline">e tem solução sem dietas restritas e sofrimento.</span>
              </h1>
              <p className="mt-2 md:mt-6 text-[12.5px] md:text-lg text-[hsl(213_30%_28%)] max-w-xl leading-snug md:leading-relaxed">
                Sou a <strong className="font-semibold">Dra. Gabriela Rosado</strong>, nutricionista
                especialista em lipedema.<span className="hidden md:inline"> Respondendo 8 perguntas rápidas você recebe o seu <em className="italic">mapa personalizado</em> — direto aqui e também no seu WhatsApp.</span>
              </p>

              {/* Bullets: mobile + desktop */}
              <ul className="mt-3 md:mt-8 space-y-2 md:space-y-3 text-[12.5px] md:text-base">
                <li className="flex items-start gap-2.5 md:gap-3">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 mt-0.5 text-[hsl(38_60%_45%)] shrink-0" />
                  <span>Leitura clínica baseada nos seus sintomas reais.</span>
                </li>
                <li className="flex items-start gap-2.5 md:gap-3">
                  <HeartPulse className="w-4 h-4 md:w-5 md:h-5 mt-0.5 text-[hsl(38_60%_45%)] shrink-0" />
                  <span>Estágio percebido e 3 prioridades para começar hoje.</span>
                </li>
                <li className="flex items-start gap-2.5 md:gap-3">
                  <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 mt-0.5 text-[hsl(38_60%_45%)] shrink-0" />
                  <span>Acesso ao app enviado pelo WhatsApp após concluir.</span>
                </li>
              </ul>
            </div>

            {/* Foto */}
            <div className="relative order-1 md:order-2 shrink-0 md:flex-1 md:min-h-0 flex items-center justify-center md:block">
              <div className="hidden md:block absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-[hsl(38_55%_75%)]/40 to-transparent blur-2xl" />
              <div className="relative w-[40vw] max-w-[160px] md:w-full md:max-w-none aspect-[4/5] md:aspect-auto mx-auto rounded-[1.25rem] md:rounded-[1.75rem] overflow-hidden border border-[hsl(38_35%_75%)]/60 shadow-[0_20px_40px_-20px_rgba(11,42,74,0.35)] md:shadow-[0_30px_60px_-30px_rgba(11,42,74,0.35)] bg-[hsl(40_30%_92%)]">
                <img
                  src={draGabrielaAsset.url}
                  alt="Dra. Gabriela Rosado, nutricionista especialista em lipedema (CRN 10582)"
                  className="w-full h-full object-cover md:aspect-[4/5]"
                  loading="eager"
                />
              </div>
              {/* Legenda: só desktop */}
              <div className="hidden md:block absolute -bottom-4 left-8 right-8 rounded-2xl bg-[hsl(213_60%_17%)] text-[hsl(40_45%_95%)] px-5 py-4 shadow-lg">
                <p className="font-serif italic text-lg leading-tight">
                  "Se você já tentou de tudo e nada muda nas pernas — o problema não é você."
                </p>
                <p className="mt-1 text-[11px] tracking-[0.24em] uppercase text-[hsl(38_55%_72%)]">
                  Dra. Gabriela Rosado
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="order-3 shrink-0 md:mt-10 md:order-none md:col-start-1">
              <button
                onClick={() => setOpen(true)}
                className="group relative inline-flex w-full md:w-auto items-center justify-center gap-2 md:gap-3 rounded-full bg-[hsl(213_60%_17%)] text-[hsl(40_45%_95%)] px-6 py-3.5 md:px-10 md:py-5 text-[15px] md:text-lg font-medium shadow-[0_18px_40px_-18px_rgba(11,42,74,0.55)] transition-all hover:shadow-[0_22px_50px_-16px_rgba(11,42,74,0.65)] hover:-translate-y-0.5 animate-[breathe_3.4s_ease-in-out_infinite]"
              >
                <span>Gerar Meu Mapa</span>
                <span aria-hidden>🗺️</span>
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" />
              </button>
              <p className="mt-2 md:mt-4 text-[11px] md:text-xs text-center md:text-left text-[hsl(213_20%_40%)]">
                Leitura educacional. Não substitui avaliação médica.
              </p>
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
