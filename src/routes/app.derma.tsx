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
  CheckCircle2,
  Circle,
  Loader2,
  ArrowRight,
  Upload,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { track } from "../lib/analytics";
import { trackMeta } from "../lib/meta-track";
import { getPremiumOnboarding } from "@/lib/anamnese.functions";

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

  // Anamnese completa + envio de exames/prescrição fazem parte do Plano Premium (R$67),
  // liberados assim que `isPremium` for true.
  const PREMIUM_ONBOARDING_ENABLED = true;
  if (PREMIUM_ONBOARDING_ENABLED && st?.isPremium) {
    return <PremiumOnboarding st={st!} />;
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

type OnboardingStatus = {
  anamneseCompleta: boolean;
  exameEnviado: boolean;
  exameCount: number;
};

function PremiumOnboarding({ st }: { st: OnboardingStatus }) {
  const steps = [
    {
      key: "anamnese",
      titulo: "Anamnese completa",
      desc: "Cerca de 8 minutos. Salva automaticamente — você pode voltar depois.",
      to: "/app/anamnese" as const,
      done: st.anamneseCompleta,
      cta: st.anamneseCompleta ? "Revisar respostas" : "Começar anamnese",
    },
    {
      key: "exames",
      titulo: "Enviar exames",
      desc: st.exameCount
        ? `${st.exameCount} exame(s) enviado(s). Você pode enviar mais quando quiser.`
        : "Envie foto ou PDF dos seus exames — a IA faz uma leitura prévia e a Gabriela revisa antes de te responder.",
      to: "/app/exames" as const,
      done: st.exameEnviado,
      cta: st.exameEnviado ? "Enviar mais exames" : "Enviar exames",
      locked: !st.anamneseCompleta,
    },
  ];

  const tudoPronto = st.anamneseCompleta && st.exameEnviado;

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
          {tudoPronto ? "Tudo pronto — a Gabriela já pode montar seu protocolo" : "Vamos preparar seu protocolo"}
        </h1>
        <p className="mt-2 text-sm opacity-85">
          {tudoPronto
            ? "Sua anamnese e exames já estão com a equipe. Fica de olho no WhatsApp — a Gabriela responde em até 24h úteis."
            : "Antes de personalizar o seu plano de 30 dias, preciso de duas coisas rápidas."}
        </p>
      </section>

      <section className="mt-5 space-y-3">
        {steps.map((s, i) => (
          <article
            key={s.key}
            className={[
              "rounded-2xl border p-4 transition-opacity",
              s.locked ? "opacity-60" : "",
            ].join(" ")}
            style={{
              background: s.done ? "rgba(221,235,216,0.35)" : "rgba(255,253,247,0.9)",
              borderColor: s.done ? "rgba(46,125,50,0.4)" : "rgba(216,198,160,0.55)",
            }}
          >
            <div className="flex items-start gap-3">
              <span
                className="grid size-9 shrink-0 place-items-center rounded-full"
                style={{
                  background: s.done ? "#2E7D32" : NAVY,
                  color: "#F5EFE1",
                }}
                aria-hidden
              >
                {s.done ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: GOLD }}>
                  Passo {i + 1}
                </p>
                <h3
                  className="text-lg leading-snug"
                  style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, color: NAVY }}
                >
                  {s.titulo}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[#4A4635]">{s.desc}</p>
                <Link
                  to={s.to}
                  aria-disabled={s.locked || undefined}
                  onClick={(e) => {
                    if (s.locked) e.preventDefault();
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.12em]"
                  style={{
                    background: s.done
                      ? "rgba(46,125,50,0.14)"
                      : `linear-gradient(180deg,#E7BE5C,${GOLD})`,
                    color: s.done ? "#2E7D32" : NAVY,
                    pointerEvents: s.locked ? "none" : "auto",
                  }}
                >
                  {s.key === "exames" ? <Upload className="size-3.5" /> : <ClipboardList className="size-3.5" />}
                  {s.cta}
                  <ArrowRight className="size-3.5" />
                </Link>
                {s.locked && (
                  <p className="mt-2 text-[11px] italic text-[#8A7C5C]">
                    Conclua a anamnese para liberar.
                  </p>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

      {tudoPronto && (
        <section
          className="mt-6 rounded-2xl border p-4 text-sm text-[#3E4F65]"
          style={{ borderColor: "rgba(216,198,160,0.6)", background: "rgba(255,253,247,0.9)" }}
        >
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: GOLD }}>
            Enquanto isso, você já pode:
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <Camera className="size-4" style={{ color: NAVY }} />
              <Link to="/app/avaliacao" className="underline underline-offset-2">
                Registrar suas refeições com foto
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <Lightbulb className="size-4" style={{ color: NAVY }} />
              <Link to="/app/missoes" className="underline underline-offset-2">
                Ler as dicas diárias
              </Link>
            </li>
          </ul>
        </section>
      )}

      <p className="mt-4 px-2 text-center text-[10px] italic text-[#8A7C5C]">
        Precisou falar comigo? Chama no WhatsApp — respondo em até 24h úteis.
      </p>
      {/* silêncio para o linter — ícones importados mas usados condicionalmente */}
      {false && <><Sparkles /><ChevronRight /><UtensilsCrossed /><Leaf /><Pill /><MessageCircle /></>}
    </div>
  );
}

