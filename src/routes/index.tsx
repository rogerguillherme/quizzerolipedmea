import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { track } from "../lib/analytics";
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
      { property: "og:title", content: "Mapa do Lipedema — leitura gratuita" },
      {
        property: "og:description",
        content:
          "8 perguntas rápidas, um Mapa personalizado do seu caso e o primeiro passo do protocolo — direto no seu WhatsApp.",
      },
    ],
  }),
});

const SIGNALS = [
  "Suas pernas incham e doem, mesmo quando o resto do corpo emagrece",
  "Já te disseram que é só falta de força de vontade",
  "Aparecem hematomas do nada, sem nem lembrar de ter batido em algo",
  "Já tentou dietas e treinos que funcionam pra todo mundo, menos pra você",
];
const ROMAN = ["i.", "ii.", "iii.", "iv."];

function Landing() {
  useEffect(() => {
    track("landing_view");
  }, []);

  return (
    <div
      className="relative min-h-screen"
      style={{
        ["--cream" as string]: "#F5EFE1",
        ["--cream-line" as string]: "#D8C6A0",
        ["--blue" as string]: "#16324F",
        ["--blue-soft" as string]: "#2C5578",
        ["--blue-pale" as string]: "#AFC4D6",
        ["--gold" as string]: "#AF7F35",
        ["--gold-soft" as string]: "#D9A94B",
        ["--ink-soft" as string]: "#5B5D52",
        background: "var(--cream)",
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
      {/* Corner frames — desktop only */}
      <span
        aria-hidden
        className="pointer-events-none fixed z-20 hidden lg:block"
        style={{
          top: 22,
          left: 22,
          width: 46,
          height: 46,
          borderTop: "1px solid var(--gold)",
          borderLeft: "1px solid var(--gold)",
          opacity: 0.55,
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none fixed z-20 hidden lg:block"
        style={{
          bottom: 22,
          right: 22,
          width: 46,
          height: 46,
          borderBottom: "1px solid var(--gold)",
          borderRight: "1px solid var(--gold)",
          opacity: 0.55,
        }}
      />

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Photo panel — first on mobile */}
        <div
          className="relative order-first flex items-end justify-center overflow-hidden lg:order-last"
          style={{
            background:
              "radial-gradient(120% 90% at 70% 20%, #EFE3CC 0%, #E4D5B6 55%, #D9C69C 100%)",
          }}
        >
          <svg
            className="absolute inset-0 z-0 h-full w-full"
            viewBox="0 0 700 900"
            preserveAspectRatio="xMidYMax slice"
            aria-hidden="true"
          >
            <g fill="none" stroke="#AF7F35" strokeWidth="1" opacity="0.35">
              <circle cx="470" cy="260" r="230" />
              <circle cx="470" cy="260" r="185" />
              <circle cx="470" cy="260" r="140" />
            </g>
            <g fill="none" stroke="#16324F" strokeWidth="1" opacity="0.12">
              <circle cx="470" cy="260" r="280" />
            </g>
          </svg>
          <img
            src={draGabriela}
            alt="Dra. Gabriela Rosado, nutricionista especialista em lipedema"
            fetchPriority="high"
            className="relative z-10 h-[52vh] w-auto max-w-[86%] object-contain object-bottom sm:h-[58vh] lg:h-auto lg:max-h-[92vh] lg:w-full lg:max-w-[460px]"
            style={{ filter: "drop-shadow(0 24px 32px rgba(22,50,79,0.22))" }}
          />
          <div
            className="absolute z-20 flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] sm:gap-2.5 sm:px-4 sm:py-2.5 sm:text-[13px]"
            style={{
              left: 14,
              bottom: 14,
              color: "var(--blue)",
              background: "rgba(245,239,225,0.92)",
              borderColor: "rgba(175,127,53,0.4)",
              boxShadow: "0 10px 22px -12px rgba(22,50,79,0.3)",
            }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--gold)" }}
            />
            <strong
              style={{
                fontFamily: "'Fraunces', serif",
                fontStyle: "italic",
                fontWeight: 500,
              }}
            >
              Dra. Gabriela Rosado
            </strong>
            <span className="hidden sm:inline">· Nutricionista</span>
          </div>
        </div>

        {/* Content */}
        <div className="relative flex max-w-none flex-col justify-center px-5 pb-12 pt-10 sm:px-8 lg:max-w-[640px] lg:px-16 lg:py-[68px]">
          <div className="mb-6 flex items-center gap-3 sm:mb-7 sm:gap-3.5">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-[34px] sm:w-[34px]"
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
              className="text-[0.65rem] font-semibold uppercase sm:text-[0.7rem]"
              style={{ letterSpacing: "0.18em", color: "var(--gold)" }}
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
            className="max-w-[15ch]"
            style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 500,
              letterSpacing: "-0.01em",
              color: "var(--blue)",
              fontSize: "clamp(1.85rem, 6vw, 3.15rem)",
              lineHeight: 1.14,
              margin: 0,
            }}
          >
            Não é falta de esforço. É{" "}
            <em
              style={{ fontStyle: "italic", fontWeight: 500, color: "var(--gold)" }}
            >
              lipedema
            </em>{" "}
            — e agora dá pra entender o seu.
          </h1>

          <p
            className="mt-5 max-w-[44ch] text-[0.98rem] sm:mt-6 sm:text-[1.08rem]"
            style={{ color: "var(--ink-soft)" }}
          >
            Responda 8 perguntas rápidas e receba o seu{" "}
            <strong style={{ fontWeight: 600, color: "var(--blue)" }}>
              Mapa do Lipedema
            </strong>
            : onde você está agora, o que priorizar primeiro, e como seguir em
            frente.
          </p>

          <div className="mt-8 sm:mt-10" style={{ borderTop: "1px solid var(--cream-line)" }}>
            {SIGNALS.map((text, i) => (
              <div
                key={i}
                className="grid items-baseline gap-4 py-3.5 sm:gap-5 sm:py-4"
                style={{
                  gridTemplateColumns: "28px 1fr",
                  borderBottom: "1px solid var(--cream-line)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontStyle: "italic",
                    fontSize: "1rem",
                    color: "var(--gold)",
                  }}
                >
                  {ROMAN[i]}
                </span>
                <p
                  className="m-0 text-[0.95rem] font-normal sm:text-base"
                  style={{ color: "var(--blue)" }}
                >
                  {text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-9 sm:mt-12">
            <Link
              to="/mapa"
              className="inline-flex w-full items-center justify-center gap-3 rounded-full py-4 pl-5 pr-6 no-underline transition-transform hover:-translate-y-0.5 sm:w-auto sm:gap-3.5 sm:pl-[22px] sm:pr-[30px]"
              style={{
                background: "linear-gradient(180deg, var(--blue-soft), var(--blue))",
                color: "var(--cream)",
                boxShadow:
                  "0 14px 30px -14px rgba(22,50,79,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: "var(--gold-soft)" }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="1.8"
                  stroke="#16324F"
                  className="h-[15px] w-[15px]"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <span className="text-left">
                <span
                  className="block text-[0.98rem]"
                  style={{ fontWeight: 600, letterSpacing: "0.01em" }}
                >
                  Quero meu mapa
                </span>
                <span
                  className="mt-0.5 block text-[0.76rem]"
                  style={{ color: "var(--blue-pale)" }}
                >
                  Leva menos de 2 minutos
                </span>
              </span>
            </Link>
            <div
              className="mt-4 text-center text-[0.78rem] sm:text-left sm:text-[0.8rem]"
              style={{ color: "var(--ink-soft)", letterSpacing: "0.02em" }}
            >
              Gratuito · personalizado pra você
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
