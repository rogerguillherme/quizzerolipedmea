import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Activity,
  HeartHandshake,
} from "lucide-react";
import { track } from "../lib/analytics";

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
          "6 perguntas, um Mapa personalizado do seu caso e o primeiro passo do protocolo — direto no seu WhatsApp.",
      },
    ],
  }),
});

function Landing() {
  useEffect(() => {
    track("landing_view");
  }, []);

  return (
    <div className="min-h-screen bg-hero-sapphire">
      <header className="mx-auto flex max-w-md items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground font-bold">
            Z
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-primary">Zero Lipedema</p>
            <p className="text-[11px] text-muted-foreground">
              Gabriela Rosado · CRN 10582
            </p>
          </div>
        </div>
        <span className="rounded-full bg-sapphire-100 px-2.5 py-1 text-[10px] font-bold text-sapphire-800">
          Gratuito
        </span>
      </header>

      <main className="mx-auto max-w-md px-5 pb-16 pt-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-sapphire-100 px-3 py-1 text-xs font-semibold text-sapphire-800">
          <Sparkles className="size-3.5" /> Leitura personalizada em 2 minutos
        </span>

        <h1 className="mt-4 text-3xl font-extrabold leading-tight text-primary sm:text-4xl">
          Descubra o Mapa do seu Lipedema — direto no seu WhatsApp.
        </h1>

        <p className="mt-3 text-base text-muted-foreground">
          Se dieta e treino nunca resolveram, o problema não é você. Responda 6
          perguntas e receba a leitura do seu caso, feita pela IA da Gabriela
          Rosado, com o primeiro passo do protocolo.
        </p>

        <Link
          to="/mapa"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-coral px-5 py-4 text-base font-bold text-coral-foreground shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]"
        >
          Fazer meu Mapa gratuito <ArrowRight className="size-5" />
        </Link>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          Sem cadastro. Sem cobrança. Sem julgamento.
        </p>

        <div className="mt-10 space-y-3">
          <FeatureRow
            icon={<Activity className="size-5" />}
            title="1. Mapa do Lipedema (grátis)"
            desc="Leitura clínica do seu estágio, gatilhos hormonais e regiões afetadas."
          />
          <FeatureRow
            icon={<HeartHandshake className="size-5" />}
            title="2. Protocolo de 7 dias"
            desc="Refeições substitutas, chás e checklist diário — para reduzir inchaço e dor."
          />
          <FeatureRow
            icon={<ShieldCheck className="size-5" />}
            title="3. Acompanhamento completo"
            desc="Plano alimentar personalizado, análise de exames e feedback no WhatsApp."
          />
        </div>

        <div className="mt-10 card-clinical p-5">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sapphire-100 text-sapphire-800">
              <MessageCircle className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">
                Tudo acontece no seu WhatsApp
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Depois do Mapa, você recebe o acesso ao app pelo WhatsApp e
                continua a jornada quando fizer sentido para você.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-[11px] leading-relaxed text-muted-foreground">
          Conteúdo educacional de estilo de vida. Não substitui avaliação
          médica. Gabriela Rosado — CRN 10582.
        </p>
      </main>
    </div>
  );
}

function FeatureRow({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="card-clinical flex items-start gap-3 p-4">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sapphire-100 text-sapphire-800">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-primary">{title}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
