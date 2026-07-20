import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ChevronUp, TrendingUp, HeartPulse, Sparkles } from "lucide-react";
import { getApp } from "../lib/quiz-store";

export const Route = createFileRoute("/app/")({
  component: Radar,
});

function Radar() {
  const [expanded, setExpanded] = useState(false);
  const app = getApp();
  const nome = app.nome || "linda";
  const dia = app.diaAtual || 1;
  const streak = app.streak || 0;

  const score = 72;
  const label = score >= 75 ? "Ótimo" : score >= 50 ? "Moderado" : "Leve";
  const trend = [40, 45, 55, 62, 66, 70, score];

  return (
    <div className="px-5 pt-6">
      <p className="text-sm text-muted-foreground">
        Oi, <span className="font-semibold text-primary">{nome}</span> ✨
      </p>
      <h1 className="text-2xl font-extrabold text-primary">
        Hoje é o dia {dia} do seu Desafio
      </h1>

      {/* Score card */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="card-clinical mt-5 w-full p-5 text-left transition-all"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-sapphire-600">
              Seu progresso hoje
            </p>
            <p className="mt-1 text-4xl font-extrabold text-primary tabular-nums">
              {score}
              <span className="text-lg text-muted-foreground">/100</span>
            </p>
            <p className="mt-1 text-sm font-semibold text-coral">{label}</p>
          </div>
          <RingScore value={score} />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingUp className="size-3.5" /> Tendência 7 dias
          </span>
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </div>

        {expanded && <MiniChart values={trend} />}
      </button>

      {/* Streak */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="card-clinical p-4">
          <p className="text-xs font-semibold text-muted-foreground">Sequência</p>
          <p className="mt-1 text-2xl font-extrabold text-primary">{streak} dias</p>
        </div>
        <div className="card-clinical p-4">
          <p className="text-xs font-semibold text-muted-foreground">Dia atual</p>
          <p className="mt-1 text-2xl font-extrabold text-primary">{dia} / 7</p>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 space-y-3">
        <InsightCard
          icon={<HeartPulse className="size-4" />}
          title="Sinais do corpo"
          body="Você marcou menos peso nas pernas desde ontem. Continue com a caminhada leve à noite."
        />
        <InsightCard
          icon={<Sparkles className="size-4" />}
          title="Recomendação da Gabriela"
          body="Priorize proteína no café da manhã e o chá anti-inflamatório do catálogo."
        />
      </div>

      <Link
        to="/app/missoes"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-coral px-5 py-4 text-base font-bold text-coral-foreground shadow-lg shadow-coral/20"
      >
        Ver missões de hoje
      </Link>
    </div>
  );
}

function RingScore({ value }: { value: number }) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width={80} height={80} className="-rotate-90">
      <circle cx={40} cy={40} r={r} stroke="var(--color-sapphire-100)" strokeWidth={8} fill="none" />
      <circle
        cx={40}
        cy={40}
        r={r}
        stroke="var(--color-primary)"
        strokeWidth={8}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

function MiniChart({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  const w = 300;
  const h = 80;
  const step = w / (values.length - 1);
  const points = values
    .map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 10) - 5}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 w-full">
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {values.map((v, i) => (
        <circle
          key={i}
          cx={i * step}
          cy={h - ((v - min) / range) * (h - 10) - 5}
          r={3}
          fill="var(--color-coral)"
        />
      ))}
    </svg>
  );
}

function InsightCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="card-clinical p-4">
      <div className="flex items-center gap-2 text-sapphire-600">
        {icon}
        <p className="text-xs font-bold uppercase tracking-wide">{title}</p>
      </div>
      <p className="mt-1 text-sm text-foreground">{body}</p>
    </div>
  );
}
