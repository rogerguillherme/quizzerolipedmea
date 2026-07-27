import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Camera,
  Lightbulb,
  UtensilsCrossed,
  Leaf,
  Pill,
  MessageCircle,
  ClipboardList,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { track } from "../lib/analytics";
import { fbqTrack } from "../lib/meta-pixel";

export const Route = createFileRoute("/app/derma")({
  component: PremiumPlano,
});

const NAVY = "#16324F";
const GOLD = "#AF7F35";
const CREAM_SOFT = "#FBF6E9";

const FEATURES = [
  {
    icon: Camera,
    title: "Registro de Refeições com Fotos",
    body: "Fotografe o prato e receba na hora análise nutricional, pontos de atenção e tenha tudo registrado.",
  },
  {
    icon: Lightbulb,
    title: "Dicas diárias no WhatsApp",
    body: "Todos os dias uma orientação prática pensada para o seu estágio de lipedema.",
  },
  {
    icon: UtensilsCrossed,
    title: "3 cardápios de sugestão alimentar",
    body: "Opções de cardápios práticos anti-inflamatorios, café, almoço, lanches e jantar.",
  },
  {
    icon: Leaf,
    title: "Guia de chás e shots para lipedema",
    body: "Combinações drenantes, anti-inflamatórias e circulatórias com posologia clara.",
  },
  {
    icon: Pill,
    title: "Guia de suplementos anti-lipedema",
    body: "O que realmente ajuda, dosagens de referência e o que evitar.",
  },
  {
    icon: MessageCircle,
    title: "Canal para tirar para dúvidas",
    body: "Canal\u00a0 respostas rápidas quando você mais precisa tirar duvidas, pedir dicas, sugestões a um clique.",
  },
  {
    icon: ClipboardList,
    title: "Quadro de Evolução",
    body: "Acompanhamento contínuo do seu progresso via WhatsApp com simples feedbacks diários da sua rotina e tudo fica registrado na plataforma.",
  },
];

function PremiumPlano() {
  return (
    <div className="px-5 pt-5 pb-8">
      <section
        className="relative overflow-hidden rounded-3xl px-5 py-7"
        style={{
          background: `linear-gradient(160deg, ${NAVY} 0%, #0E2439 100%)`,
          color: CREAM_SOFT,
          boxShadow: "0 20px 40px -20px rgba(22,50,79,0.55)",
        }}
      >
        <div
          aria-hidden
          className="absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)` }}
        />
        <p
          className="text-[10px] font-semibold uppercase"
          style={{ letterSpacing: "0.26em", color: GOLD }}
        >
          Plano Premium
        </p>
        <h1
          className="mt-2 text-3xl leading-tight"
          style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
        >
          Zero Lipedema · 30 dias
        </h1>
        <p className="mt-3 text-sm opacity-85">
          O plano completo de 30 dias para reduzir inchaço, dor e inflamação,
          ajustando seus hábitos alimentares sem viver de Dietas restritivas e
          com resultados a longo prazo.
        </p>

        <div
          className="mt-6 rounded-2xl px-4 py-4"
          style={{
            background: "rgba(255,253,247,0.08)",
            border: "1px solid rgba(216,198,160,0.35)",
          }}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs opacity-70 line-through">R$ 119,90</span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: GOLD, color: NAVY }}
            >
              -44% OFF
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className="text-3xl"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, color: GOLD }}
            >
              R$ 67,00
            </span>
          </div>
          <p className="mt-2 text-[11px] opacity-80">
            Use o cupom{" "}
            <span
              className="rounded px-1.5 py-0.5 font-mono text-[10px] font-bold"
              style={{ background: "rgba(175,127,53,0.25)", color: GOLD }}
            >
              PRIMEIROACESSO
            </span>{" "}
            no checkout
          </p>
        </div>

        <a
          href="https://pay.kiwify.com.br/j0hsxv3"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            track("premium_upgrade_clicked");
            fbqTrack("InitiateCheckout", { content_name: "Plano Premium Zero Lipedema 30d", value: 67, currency: "BRL" });
          }}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-transform active:scale-[0.98]"
          style={{
            background: `linear-gradient(180deg, #E7BE5C, ${GOLD})`,
            color: NAVY,
            boxShadow: "0 10px 22px -10px rgba(175,127,53,0.7)",
          }}
        >
          <Sparkles className="size-4" />
          Ativar plano premium
          <ChevronRight className="size-4" />
        </a>
      </section>

      <section className="mt-6 space-y-3">
        <p
          className="px-1 text-[10px] font-semibold uppercase"
          style={{ letterSpacing: "0.22em", color: GOLD }}
        >
          O que está incluso
        </p>

        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <article
              key={f.title}
              className="flex gap-3 rounded-2xl border p-4"
              style={{
                background: "rgba(255,253,247,0.9)",
                borderColor: "rgba(216,198,160,0.55)",
              }}
            >
              <span
                className="grid size-10 shrink-0 place-items-center rounded-full"
                style={{
                  background: `linear-gradient(180deg, #EFE3CC, #F5EFE1)`,
                  color: NAVY,
                  border: "1px solid rgba(175,127,53,0.35)",
                }}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <h3
                  className="text-[15px] leading-snug"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 500,
                    color: NAVY,
                  }}
                >
                  {f.title}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "#4A4635" }}>
                  {f.body}
                </p>
              </div>
            </article>
          );
        })}
      </section>

      <section
        className="mt-6 rounded-2xl border px-5 py-5 text-center"
        style={{
          background: "rgba(255,253,247,0.7)",
          borderColor: "rgba(216,198,160,0.55)",
        }}
      >
        <p className="text-[13px]" style={{ color: "#4A4635" }}>
          Quer conhecer o acompanhamento completo antes de decidir?
        </p>
        <Link
          to="/upsell"
          onClick={() => track("premium_upgrade_clicked")}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: NAVY }}
        >
          Ver Acompanhamento Zero Lipedema
          <ChevronRight className="size-4" />
        </Link>
      </section>
    </div>
  );
}
