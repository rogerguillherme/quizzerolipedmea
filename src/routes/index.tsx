import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Droplets, MessageSquareOff, Bandage, Utensils } from "lucide-react";
import { track } from "../lib/analytics";
import { MapaQuizDialog } from "@/components/MapaQuizDialog";
import draGabrielaAsset from "../assets/dra-gabriela.png.asset.json";

const draGabriela = draGabrielaAsset.url;

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Mapa do Lipedema — leitura gratuita com Gabriela Rosado" },
      {
        name: "description",
        content:
          "Descubra em 2 minutos o retrato clínico do seu lipedema. Leitura gratuita feita pela IA da nutricionista Gabriela Rosado (CRN 10582), entregue pelo WhatsApp.",
      },
      { property: "og:title", content: "Mapa do Lipedema — leitura gratuita com Gabriela Rosado" },
      {
        property: "og:description",
        content:
          "Descubra em 2 minutos o retrato clínico do seu lipedema. Leitura gratuita feita pela IA da nutricionista Gabriela Rosado (CRN 10582), entregue pelo WhatsApp.",
      },
    ],
  }),
});

const SIGNALS: Array<{ icon: React.ComponentType<{ className?: string }>; text: string }> = [
  { icon: Droplets, text: "Suas pernas incham e doem, mesmo quando o resto do corpo emagrece" },
  { icon: MessageSquareOff, text: "Já te disseram que é só falta de força de vontade" },
  { icon: Bandage, text: "Aparecem hematomas do nada, sem nem lembrar de ter batido em algo" },
  { icon: Utensils, text: "Dietas e treinos que funcionam pra todo mundo — menos pra você" },
];

function Landing() {
  useEffect(() => {
    track("landing_view");
  }, []);

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        ["--cream" as string]: "#F5EFE1",
        ["--cream-line" as string]: "#D8C6A0",
        ["--blue" as string]: "#16324F",
        ["--blue-soft" as string]: "#2C5578",
        ["--blue-pale" as string]: "#AFC4D6",
        ["--gold" as string]: "#AF7F35",
        ["--gold-soft" as string]: "#D9A94B",
        ["--ink-soft" as string]: "#5B5D52",
        background:
          "radial-gradient(120% 60% at 80% 0%, #EFE3CC 0%, transparent 55%), var(--cream)",
        color: "var(--blue)",
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 300,
        lineHeight: 1.55,
      }}
    >
      {/* Paper texture */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(22,50,79,0.018) 0px, rgba(22,50,79,0.018) 1px, transparent 1px, transparent 6px)",
        }}
      />

      {/* Local keyframes for subtle button breathe + floating topics */}
      <style>{`
        @keyframes zl-breathe {
          0%, 100% { box-shadow: 0 14px 30px -14px rgba(22,50,79,0.55), 0 0 0 0 rgba(217,169,75,0.35), inset 0 1px 0 rgba(255,255,255,0.08); }
          50%      { box-shadow: 0 18px 36px -14px rgba(22,50,79,0.6),  0 0 0 6px rgba(217,169,75,0.0),  inset 0 1px 0 rgba(255,255,255,0.08); }
        }
        @keyframes zl-float-a { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes zl-float-b { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes zl-float-c { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        @keyframes zl-float-d { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3.5px); } }
        .zl-cta { animation: zl-breathe 3.4s ease-in-out infinite; transition: transform .25s ease; }
        .zl-cta:hover { transform: translateY(-2px); }
        .zl-topic { animation-duration: 5.5s; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        .zl-topic-0 { animation-name: zl-float-a; animation-delay: 0s; }
        .zl-topic-1 { animation-name: zl-float-b; animation-delay: .6s; }
        .zl-topic-2 { animation-name: zl-float-c; animation-delay: 1.2s; }
        .zl-topic-3 { animation-name: zl-float-d; animation-delay: 1.8s; }
        @media (prefers-reduced-motion: reduce) {
          .zl-cta, .zl-topic { animation: none !important; }
        }
      `}</style>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[520px] flex-col px-5 pb-14 pt-8 sm:px-8 sm:pt-10 lg:max-w-[1080px] lg:flex-row lg:items-center lg:gap-12 lg:px-16 lg:py-16">
        {/* Portrait — integrated into page, not a separate panel */}
        <div className="relative mx-auto mb-6 flex w-full max-w-[360px] justify-center lg:order-last lg:mb-0 lg:max-w-[440px]">
          <svg
            className="absolute inset-0 z-0 h-full w-full"
            viewBox="0 0 500 600"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <g fill="none" stroke="#AF7F35" strokeWidth="1" opacity="0.28">
              <circle cx="250" cy="230" r="180" />
              <circle cx="250" cy="230" r="140" />
              <circle cx="250" cy="230" r="100" />
            </g>
            <g fill="none" stroke="#16324F" strokeWidth="1" opacity="0.1">
              <circle cx="250" cy="230" r="220" />
            </g>
          </svg>
          <img
            src={draGabriela}
            alt="Dra. Gabriela Rosado, nutricionista especialista em lipedema"
            fetchPriority="high"
            className="relative z-10 h-auto w-full max-w-[300px] object-contain lg:max-w-[420px]"
            style={{ filter: "drop-shadow(0 20px 30px rgba(22,50,79,0.22))" }}
          />
          <div
            className="absolute z-20 flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] sm:text-[12px]"
            style={{
              left: "50%",
              bottom: 0,
              transform: "translateX(-50%)",
              color: "var(--blue)",
              background: "rgba(245,239,225,0.95)",
              borderColor: "rgba(175,127,53,0.4)",
              boxShadow: "0 10px 22px -12px rgba(22,50,79,0.3)",
              whiteSpace: "nowrap",
            }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--gold)" }}
            />
            <strong
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: "italic",
                fontWeight: 500,
              }}
            >
              Dra. Gabriela Rosado
            </strong>
            <span>· Nutricionista</span>
          </div>
        </div>

        {/* Text column */}
        <div className="relative flex flex-col lg:flex-1">
          <div className="mb-5 flex items-center gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ border: "1px solid var(--gold)" }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#AF7F35"
                strokeWidth="1.6"
                className="h-3.5 w-3.5"
              >
                <path d="M12 2C8 6 6 10 6 13a6 6 0 0 0 12 0c0-3-2-7-6-11z" />
              </svg>
            </span>
            <span
              className="text-[0.65rem] font-semibold uppercase sm:text-[0.72rem]"
              style={{ letterSpacing: "0.2em", color: "var(--gold)" }}
            >
              Mapa do Lipedema
            </span>
            <span
              className="h-px flex-1"
              style={{
                background:
                  "linear-gradient(90deg, var(--cream-line), transparent)",
              }}
            />
          </div>

          <h1
            className="max-w-[16ch]"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 500,
              letterSpacing: "-0.005em",
              color: "var(--blue)",
              fontSize: "clamp(1.8rem, 6.2vw, 3rem)",
              lineHeight: 1.16,
              margin: 0,
            }}
          >
            Não é falta de esforço. É{" "}
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 500,
                color: "var(--gold)",
              }}
            >
              lipedema
            </em>{" "}
            — e agora dá pra entender o seu.
          </h1>

          <p
            className="mt-4 max-w-[44ch] text-[0.98rem] sm:mt-5 sm:text-[1.06rem]"
            style={{ color: "var(--ink-soft)" }}
          >
            Faça o teste de{" "}
            <strong style={{ fontWeight: 600, color: "var(--blue)" }}>
              2 minutos
            </strong>{" "}
            e receba o seu Mapa do Lipedema: onde você está agora, o que
            priorizar primeiro, e como seguir em frente.
          </p>

          {/* Floating topics */}
          <div className="mt-7 grid gap-3">
            {SIGNALS.map(({ icon: Icon, text }, i) => (
              <div
                key={i}
                className={`zl-topic zl-topic-${i} flex items-start gap-3 rounded-2xl border px-4 py-3.5`}
                style={{
                  background: "rgba(255, 253, 247, 0.85)",
                  borderColor: "rgba(216, 198, 160, 0.55)",
                  boxShadow:
                    "0 10px 24px -18px rgba(22,50,79,0.35), 0 1px 0 rgba(255,255,255,0.6) inset",
                  backdropFilter: "blur(4px)",
                }}
              >
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: "rgba(175,127,53,0.10)",
                    border: "1px solid rgba(175,127,53,0.35)",
                    color: "var(--gold)",
                  }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <p
                  className="m-0 text-[0.95rem] font-normal leading-snug sm:text-[0.98rem]"
                  style={{ color: "var(--blue)" }}
                >
                  {text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 sm:mt-10">
            <Link
              to="/mapa"
              className="zl-cta inline-flex w-full items-center justify-center gap-3 rounded-full py-4 pl-5 pr-6 no-underline sm:w-auto sm:gap-3.5 sm:pl-[22px] sm:pr-[30px]"
              style={{
                background:
                  "linear-gradient(180deg, var(--blue-soft), var(--blue))",
                color: "var(--cream)",
              }}
            >
              <span
                aria-hidden
                className="text-xl leading-none"
                style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }}
              >
                🗺️
              </span>
              <span className="text-left">
                <span
                  className="block text-[1rem]"
                  style={{ fontWeight: 600, letterSpacing: "0.01em" }}
                >
                  Gerar Meu Mapa
                </span>
                <span
                  className="mt-0.5 block text-[0.76rem]"
                  style={{ color: "var(--blue-pale)" }}
                >
                  Teste de 2 minutos · gratuito
                </span>
              </span>
            </Link>
            <div
              className="mt-3 text-center text-[0.78rem] sm:text-left"
              style={{ color: "var(--ink-soft)", letterSpacing: "0.02em" }}
            >
              Personalizado pra você · sem cadastro
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
