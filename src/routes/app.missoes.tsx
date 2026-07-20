import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Circle, Utensils, Leaf, HeartPulse, MessageSquareQuote } from "lucide-react";
import { getApp, setApp } from "../lib/quiz-store";
import { track } from "../lib/analytics";

export const Route = createFileRoute("/app/missoes")({
  component: Missoes,
});

type Missao = {
  id: string;
  titulo: string;
  descricao: string;
  icon: React.ReactNode;
  detalhe: string;
};

const MISSOES: Missao[] = [
  {
    id: "prato",
    titulo: "Monte seu prato",
    descricao: "Um molde flexível — não cardápio fechado.",
    icon: <Utensils className="size-5" />,
    detalhe:
      "½ do prato: vegetais folhosos + coloridos. ¼: proteína magra (frango, peixe, ovos). ¼: carboidrato de baixo IG (batata-doce, quinoa, arroz integral). Adicione 1 colher de azeite.",
  },
  {
    id: "cha",
    titulo: "Chá do dia",
    descricao: "Do Catálogo de Prescrição — liberado.",
    icon: <Leaf className="size-5" />,
    detalhe: "Chá de cavalinha + hibisco (500ml distribuídos ao longo do dia). Ação drenante suave.",
  },
  {
    id: "autocuidado",
    titulo: "Autocuidado vascular",
    descricao: "Movimento simples, sem prescrição de treino.",
    icon: <HeartPulse className="size-5" />,
    detalhe:
      "Elevação de pernas por 10 minutos + 30 bombeios de tornozelo + 5 min de respiração diafragmática antes de dormir.",
  },
  {
    id: "checkin",
    titulo: "Check-in de sintomas",
    descricao: "1 minuto — atualiza seu Radar.",
    icon: <MessageSquareQuote className="size-5" />,
    detalhe:
      "Como estão o inchaço, dor e disposição hoje? Sua resposta ajusta a recomendação da IA para amanhã.",
  },
];

function Missoes() {
  const app = getApp();
  const dia = app.diaAtual || 1;
  const initial = (app.concluidos?.[dia] || []) as string[];
  const [feitas, setFeitas] = useState<string[]>(initial);

  function toggle(id: string) {
    const next = feitas.includes(id) ? feitas.filter((x) => x !== id) : [...feitas, id];
    setFeitas(next);
    const concluidos = { ...(app.concluidos || {}), [dia]: next };
    setApp({ concluidos });
    if (next.length === MISSOES.length) {
      setApp({ streak: (app.streak || 0) + 1 });
      track("day_completed", { dia });
      if (dia >= 7) track("challenge_completed");
    }
  }

  const pct = Math.round((feitas.length / MISSOES.length) * 100);
  const completo = feitas.length === MISSOES.length;

  return (
    <div className="px-5 pt-6">
      <p className="text-xs font-bold uppercase tracking-wide text-sapphire-600">Dia {dia} de 7</p>
      <h1 className="text-2xl font-extrabold text-primary">Missões de hoje</h1>

      <div className="card-clinical mt-4 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-primary">Progresso do dia</p>
          <p className="text-sm font-bold text-primary tabular-nums">
            {feitas.length}/{MISSOES.length}
          </p>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sapphire-100">
          <div
            className="h-full rounded-full bg-coral transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {completo && (
          <p className="mt-3 rounded-xl bg-coral-soft px-3 py-2 text-center text-sm font-bold text-primary">
            🎉 Dia {dia} concluído — sua sequência aumentou!
          </p>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {MISSOES.map((m) => {
          const done = feitas.includes(m.id);
          return (
            <button
              key={m.id}
              onClick={() => toggle(m.id)}
              className={[
                "card-clinical w-full p-4 text-left transition-all",
                done && "bg-sapphire-50",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <div
                  className={[
                    "grid size-11 shrink-0 place-items-center rounded-xl transition-colors",
                    done ? "bg-primary text-primary-foreground" : "bg-sapphire-100 text-sapphire-800",
                  ].join(" ")}
                >
                  {m.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-primary">{m.titulo}</p>
                    {done ? (
                      <CheckCircle2 className="size-4 text-coral" />
                    ) : (
                      <Circle className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{m.descricao}</p>
                  <p className="mt-2 rounded-lg bg-muted p-2 text-xs leading-relaxed text-foreground">
                    {m.detalhe}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
        Conteúdo educacional. Nutricionista (CRN) não prescreve medicamento nem
        exercício estruturado. Autocuidado geral: elevação, bomba de tornozelo,
        respiração e caminhada leve.
      </p>
    </div>
  );
}
