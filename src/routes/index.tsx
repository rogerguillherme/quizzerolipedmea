import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, HeartPulse, MessageCircle, Clock } from "lucide-react";
import { getQuiz } from "../lib/quiz-store";
import { track } from "../lib/analytics";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const [resume, setResume] = useState<null | { nome?: string }>(null);

  useEffect(() => {
    track("landing_view");
    const q = getQuiz();
    // Consider quiz "in progress" if any answer beyond nome exists but likely not finished.
    if (
      q.nome &&
      (q.tempoSintomas || q.regioes || q.hormonal) &&
      !q.impactoEmocional
    ) {
      setResume({ nome: q.nome });
    }
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
            <p className="text-[11px] text-muted-foreground">Gabriela Rosado · CRN 10582</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pb-24 pt-8">
        {resume && (
          <Link
            to="/onboarding"
            className="mb-5 flex items-center gap-3 rounded-2xl border border-sapphire-200 bg-sapphire-50 p-4 text-left"
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Clock className="size-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-primary">
                {resume.nome ? `${resume.nome}, seu Mapa está pela metade` : "Seu Mapa está pela metade"}
              </p>
              <p className="text-xs text-muted-foreground">
                Continuar de onde você parou — leva 1 minuto.
              </p>
            </div>
            <ArrowRight className="size-4 text-primary" />
          </Link>
        )}

        <span className="inline-flex items-center gap-2 rounded-full bg-sapphire-100 px-3 py-1 text-xs font-semibold text-sapphire-800">
          <ShieldCheck className="size-3.5" /> Avaliação gratuita · 2 minutos
        </span>

        <h1 className="mt-4 text-3xl font-extrabold leading-tight text-primary sm:text-4xl">
          Descubra o mapa do seu lipedema — sem cobrança, sem consultório frio.
        </h1>

        <p className="mt-3 text-base text-muted-foreground">
          Se você já tentou dieta e treino e o inchaço, a dor e o formato das pernas
          continuam iguais, o problema não é força de vontade. Vamos entender juntas.
        </p>

        <Link
          to="/onboarding"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-coral px-5 py-4 text-base font-bold text-coral-foreground shadow-lg shadow-coral/20 transition-transform active:scale-[0.98]"
        >
          Começar meu Mapa gratuito <ArrowRight className="size-5" />
        </Link>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          Sem login antes do resultado
        </p>

        <div className="mt-10 space-y-3">
          <FeatureRow
            icon={<HeartPulse className="size-5" />}
            title="Mapa do Lipedema"
            desc="6 perguntas rápidas montam uma leitura visual do seu caso."
          />
          <FeatureRow
            icon={<MessageCircle className="size-5" />}
            title="Acompanhamento no WhatsApp"
            desc="Cadência diária guiada por IA treinada no método da Gabriela."
          />
          <FeatureRow
            icon={<ShieldCheck className="size-5" />}
            title="Baseado em evidência clínica"
            desc="Nutrição funcional, autocuidado vascular e educação hormonal."
          />
        </div>

        <p className="mt-10 text-center text-[11px] leading-relaxed text-muted-foreground">
          Conteúdo educacional de estilo de vida. Não substitui avaliação médica.
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
