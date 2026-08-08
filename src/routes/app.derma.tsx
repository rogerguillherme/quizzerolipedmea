import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Camera,
  Lightbulb,
  Sparkles,
  ChevronRight,
  Loader2,
  ArrowRight,
  Sunrise,
} from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { track } from "../lib/analytics";
import { trackMeta } from "../lib/meta-track";
import { getPremiumOnboarding } from "@/lib/anamnese.functions";
import { PremiumFeaturesCarousel } from "@/components/PremiumFeaturesCarousel";

export const Route = createFileRoute("/app/derma")({
  component: PremiumPlano,
});

const NAVY = "#16324F";
const GOLD = "#AF7F35";
const CREAM_SOFT = "#FBF6E9";




function PremiumPlano() {
  const getStatus = useServerFn(getPremiumOnboarding);
  const { data: st, isLoading } = useQuery({
    queryKey: ["premium-onboarding"],
    queryFn: () => getStatus(),
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="size-6 animate-spin" style={{ color: NAVY }} />
      </div>
    );
  }

  // Pós-compra do Plano Premium (R$67): a entrega é a Rotina Zero Lipedema,
  // que agora vive na rota própria /app/rotina.
  // Anamnese, leitura de exames e prescrição personalizada NÃO fazem parte
  // deste plano (são exclusivos do plano de R$297) e não aparecem aqui.
  if (st?.isPremium) {
    return <Navigate to="/app/rotina" replace />;
  }

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

      </section>

      <section className="mt-6">
        <p
          className="px-1 text-[10px] font-semibold uppercase"
          style={{ letterSpacing: "0.22em", color: GOLD }}
        >
          O que está incluso
        </p>

        <div className="mt-3">
          <PremiumFeaturesCarousel />
        </div>
      </section>


      <section
        className="mt-6 overflow-hidden rounded-3xl px-5 py-6"
        style={{
          background: `linear-gradient(160deg, ${NAVY} 0%, #0E2439 100%)`,
          color: CREAM_SOFT,
          boxShadow: "0 20px 40px -20px rgba(22,50,79,0.55)",
        }}
      >
        <div
          className="rounded-2xl px-4 py-4"
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
            trackMeta("InitiateCheckout", { content_name: "Plano Premium Zero Lipedema 30d", content_type: "product", value: 67, currency: "BRL" });
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
    </div>
  );
}

const SEMANAS = [
  {
    n: 2,
    refeicao: "Almoço",
    desc: "A refeição de maior impacto no seu dia.",
  },
  {
    n: 3,
    refeicao: "Lanche",
    desc: "Onde mais aparecem os gatilhos e os escapes.",
  },
  {
    n: 4,
    refeicao: "Jantar",
    desc: "Fecha o ciclo e influencia o inchaço ao acordar.",
  },
] as const;

function RotinaPreview() {
  return (
    <div className="px-5 pt-5 pb-8">
      <section
        className="relative overflow-hidden rounded-3xl px-5 py-6"
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
          className="text-[10px] font-bold uppercase"
          style={{ letterSpacing: "0.26em", color: GOLD }}
        >
          Plano Premium · ativo
        </p>
        <h1
          className="mt-2 text-2xl leading-tight"
          style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500 }}
        >
          Sua Rotina Zero Lipedema
        </h1>
        <p className="mt-2 text-sm opacity-85">
          A gente ajusta uma refeição por semana, sem contar caloria e sem cortar
          quantidade.
        </p>
      </section>

      <section className="mt-5">
        <article
          className="rounded-2xl border p-4"
          style={{
            background: "rgba(255,253,247,0.95)",
            borderColor: "rgba(175,127,53,0.55)",
            boxShadow: "0 14px 30px -22px rgba(22,50,79,0.5)",
          }}
        >
          <div className="flex items-start gap-3">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-full"
              style={{
                background: `linear-gradient(180deg, #E7BE5C, ${GOLD})`,
                color: NAVY,
              }}
              aria-hidden
            >
              <Sunrise className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: GOLD }}
                >
                  Semana 1
                </p>
                <span
                  className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em]"
                  style={{ background: "rgba(175,127,53,0.18)", color: GOLD }}
                >
                  Comece por aqui
                </span>
              </div>
              <h2
                className="text-xl leading-snug"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 500,
                  color: NAVY,
                }}
              >
                Café da manhã
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-[#4A4635]">
                Sua missão desta semana é trocar os alimentos do café da manhã para o
                padrão anti-inflamatório: sem glúten, sem lactose, com uma fruta e um
                tipo de proteína. Sem limitar quantidade. É a refeição mais fácil de
                controlar e a sua primeira vitória rápida.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-5 space-y-2">
        <p
          className="px-1 text-[10px] font-semibold uppercase"
          style={{ letterSpacing: "0.22em", color: GOLD }}
        >
          O que vem depois
        </p>
        {SEMANAS.map((s) => (
          <article
            key={s.n}
            className="flex items-start gap-3 rounded-2xl border p-3.5"
            style={{
              background: "rgba(255,253,247,0.7)",
              borderColor: "rgba(216,198,160,0.45)",
            }}
          >
            <span
              className="grid size-8 shrink-0 place-items-center rounded-full text-[12px] font-bold"
              style={{
                background: "rgba(22,50,79,0.06)",
                color: NAVY,
                border: "1px solid rgba(216,198,160,0.6)",
              }}
              aria-hidden
            >
              {s.n}
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold" style={{ color: NAVY }}>
                Semana {s.n} · {s.refeicao}
              </p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#5C5749]">
                {s.desc}
              </p>
            </div>
          </article>
        ))}
        <p className="px-1 pt-1 text-[12px] leading-relaxed text-[#5C5749]">
          Ao fim das 4 semanas, suas refeições principais estão ajustadas, sem nenhuma
          fase de restrição.
        </p>
      </section>

      <section
        className="mt-6 rounded-2xl border p-4"
        style={{ borderColor: "rgba(216,198,160,0.6)", background: "rgba(255,253,247,0.9)" }}
      >
        <p
          className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: GOLD }}
        >
          Enquanto isso, você já pode:
        </p>
        <ul className="space-y-2 text-sm text-[#3E4F65]">
          <li className="flex items-center gap-2">
            <Camera className="size-4" style={{ color: NAVY }} />
            <Link to="/app/avaliacao" className="underline underline-offset-2">
              Registrar suas refeições com foto
            </Link>
            <ArrowRight className="size-3.5 opacity-60" />
          </li>
          <li className="flex items-center gap-2">
            <Lightbulb className="size-4" style={{ color: NAVY }} />
            <Link to="/app/missoes" className="underline underline-offset-2">
              Ler as dicas diárias
            </Link>
            <ArrowRight className="size-3.5 opacity-60" />
          </li>
        </ul>
      </section>
    </div>
  );
}
