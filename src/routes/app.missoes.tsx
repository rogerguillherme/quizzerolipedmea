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
    icon: <Utensils className="size-4" />,
    detalhe:
      "½ do prato: vegetais folhosos + coloridos. ¼: proteína magra (frango, peixe, ovos). ¼: carboidrato de baixo IG (batata-doce, quinoa, arroz integral). Adicione 1 colher de azeite.",
  },
  {
    id: "cha",
    titulo: "Chá do dia",
    descricao: "Do Catálogo de Prescrição — liberado.",
    icon: <Leaf className="size-4" />,
    detalhe:
      "Chá de cavalinha + hibisco (500ml distribuídos ao longo do dia). Ação drenante suave.",
  },
  {
    id: "autocuidado",
    titulo: "Autocuidado vascular",
    descricao: "Movimento simples, sem prescrição de treino.",
    icon: <HeartPulse className="size-4" />,
    detalhe:
      "Elevação de pernas por 10 minutos + 30 bombeios de tornozelo + 5 min de respiração diafragmática antes de dormir.",
  },
  {
    id: "checkin",
    titulo: "Check-in de sintomas",
    descricao: "1 minuto — atualiza seu Radar.",
    icon: <MessageSquareQuote className="size-4" />,
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
      <p
        className="text-[10px] font-semibold uppercase"
        style={{ letterSpacing: "0.24em", color: "#AF7F35" }}
      >
        Dia {dia} de 7
      </p>
      <h1
        className="mt-2"
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 500,
          fontSize: "1.75rem",
          lineHeight: 1.15,
          color: "#16324F",
        }}
      >
        Missões de <em className="italic" style={{ color: "#AF7F35" }}>hoje</em>
      </h1>

      <div
        className="mt-5 rounded-2xl p-4"
        style={{
          background: "rgba(255,253,247,0.9)",
          border: "1px solid rgba(216,198,160,0.55)",
          boxShadow: "0 10px 24px -20px rgba(22,50,79,0.3)",
        }}
      >
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold" style={{ color: "#16324F" }}>
            Progresso do dia
          </p>
          <p
            className="text-[13px] font-bold tabular-nums"
            style={{ color: "#AF7F35" }}
          >
            {feitas.length}/{MISSOES.length}
          </p>
        </div>
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(216,198,160,0.35)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #D9A94B, #AF7F35)",
            }}
          />
        </div>
        {completo && (
          <p
            className="mt-3 rounded-xl px-3 py-2 text-center text-[13px] font-semibold"
            style={{
              background: "rgba(217,169,75,0.15)",
              color: "#16324F",
              border: "1px solid rgba(175,127,53,0.35)",
            }}
          >
            🎉 Dia {dia} concluído — sua sequência aumentou!
          </p>
        )}
      </div>

      <div className="mt-5 space-y-2.5">
        {MISSOES.map((m) => {
          const done = feitas.includes(m.id);
          return (
            <button
              key={m.id}
              onClick={() => toggle(m.id)}
              className="w-full rounded-2xl p-4 text-left transition-all"
              style={{
                background: done
                  ? "rgba(217,169,75,0.08)"
                  : "rgba(255,253,247,0.9)",
                border: `1px solid ${
                  done ? "rgba(175,127,53,0.5)" : "rgba(216,198,160,0.55)"
                }`,
                boxShadow: "0 10px 24px -20px rgba(22,50,79,0.3)",
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-full transition-colors"
                  style={
                    done
                      ? {
                          background:
                            "linear-gradient(180deg, var(--blue-soft), var(--blue))",
                          color: "#F5EFE1",
                        }
                      : {
                          background: "rgba(175,127,53,0.1)",
                          border: "1px solid rgba(175,127,53,0.35)",
                          color: "#AF7F35",
                        }
                  }
                >
                  {m.icon}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className="text-[14.5px] font-semibold"
                      style={{ color: "#16324F" }}
                    >
                      {m.titulo}
                    </p>
                    {done ? (
                      <CheckCircle2 className="size-4" style={{ color: "#AF7F35" }} />
                    ) : (
                      <Circle className="size-4" style={{ color: "#B8AC8C" }} />
                    )}
                  </div>
                  <p className="text-[12.5px]" style={{ color: "#5B5D52" }}>
                    {m.descricao}
                  </p>
                  <p
                    className="mt-2 rounded-lg p-2.5 text-[11.5px] leading-relaxed"
                    style={{
                      background: "rgba(22,50,79,0.04)",
                      color: "#16324F",
                    }}
                  >
                    {m.detalhe}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p
        className="mt-6 text-center text-[11px] leading-relaxed"
        style={{ color: "#5B5D52" }}
      >
        Conteúdo educacional. Nutricionista (CRN) não prescreve medicamento nem
        exercício estruturado. Autocuidado geral: elevação, bomba de tornozelo,
        respiração e caminhada leve.
      </p>
    </div>
  );
}
