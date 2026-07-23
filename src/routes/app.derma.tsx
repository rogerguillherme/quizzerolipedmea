import { createFileRoute } from "@tanstack/react-router";
import { Lock, FileText, Video, MessagesSquare, Stethoscope, Sparkles } from "lucide-react";
import { track } from "../lib/analytics";

export const Route = createFileRoute("/app/derma")({
  component: Derma,
});

const INCLUI = [
  {
    icon: <Stethoscope className="size-4" />,
    title: "Anamnese completa",
    body: "Avaliação clínica aprofundada da sua história e sintomas — exclusiva deste tier.",
  },
  {
    icon: <FileText className="size-4" />,
    title: "Leitura de exames",
    body: "Interpretação dos seus exames sob a ótica do lipedema.",
  },
  {
    icon: <Sparkles className="size-4" />,
    title: "Prescrição personalizada · 90 dias",
    body: "Plano alimentar e de fitoterápicos ajustado ao seu caso — não é o mesmo do Desafio.",
  },
  {
    icon: <Video className="size-4" />,
    title: "Aulas gravadas da Gabriela",
    body: "Biblioteca de módulos: hormônios, alimentação, vascular, emocional.",
  },
  {
    icon: <MessagesSquare className="size-4" />,
    title: "Q&A ao vivo com Gabriela",
    body: "Encontros regulares com a nutricionista — turma pequena, sustentável.",
  },
];

function Derma() {
  return (
    <div className="px-5 pt-6">
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-semibold uppercase"
          style={{ letterSpacing: "0.24em", color: "#AF7F35" }}
        >
          Método Derma
        </span>
        <span
          className="h-px flex-1"
          style={{
            background:
              "linear-gradient(90deg, rgba(216,198,160,0.7), transparent)",
          }}
        />
      </div>
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
        Protocolo de <em className="italic" style={{ color: "#AF7F35" }}>90 dias</em> com a Gabriela
      </h1>
      <p className="mt-3 text-[13.5px]" style={{ color: "#2F3128", lineHeight: 1.55 }}>
        Este é o tier onde você tem contato humano real com a Gabriela. O desafio
        de 7 dias abre a porta — o Método Derma sustenta a mudança.
      </p>

      <div
        className="mt-6 overflow-hidden rounded-3xl"
        style={{
          background: "rgba(255,253,247,0.92)",
          border: "1px solid rgba(216,198,160,0.55)",
          boxShadow: "0 20px 32px -22px rgba(22,50,79,0.45)",
        }}
      >
        <div
          className="p-5"
          style={{
            background: "linear-gradient(150deg, #2C5578 0%, #16324F 70%)",
            color: "#F5EFE1",
          }}
        >
          <p
            className="text-[10px] font-semibold uppercase"
            style={{ letterSpacing: "0.28em", color: "#D9A94B" }}
          >
            Método Derma · 90 dias
          </p>
          <p
            className="mt-2"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 500,
              fontSize: "1.6rem",
              lineHeight: 1.15,
            }}
          >
            Em <em className="italic" style={{ color: "#D9A94B" }}>breve</em>
          </p>
          <p className="mt-2 text-[12.5px]" style={{ color: "rgba(245,239,225,0.85)" }}>
            Vaga sob avaliação — turma reduzida por trimestre.
          </p>
        </div>
        <div>
          {INCLUI.map((i, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-4"
              style={{
                borderTop: idx === 0 ? "none" : "1px solid rgba(216,198,160,0.4)",
              }}
            >
              <span
                className="grid size-9 shrink-0 place-items-center rounded-full"
                style={{
                  background: "rgba(175,127,53,0.1)",
                  border: "1px solid rgba(175,127,53,0.35)",
                  color: "#AF7F35",
                }}
              >
                {i.icon}
              </span>
              <div>
                <p className="text-[13.5px] font-semibold" style={{ color: "#16324F" }}>
                  {i.title}
                </p>
                <p className="text-[12px]" style={{ color: "#2F3128", lineHeight: 1.5 }}>
                  {i.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => track("derma_upgrade_clicked")}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full px-5 py-4 text-[15px] font-semibold"
        style={{
          background: "linear-gradient(180deg, #2C5578, #16324F)",
          color: "#F5EFE1",
          boxShadow: "0 14px 26px -14px rgba(22,50,79,0.55)",
        }}
      >
        <Lock className="size-4" /> Quero saber quando abrir vaga
      </button>
      <p className="mt-3 text-center text-[11px]" style={{ color: "#2F3128" }}>
        Ao completar seus 7 dias, você recebe o convite de avaliação para o Método.
      </p>
    </div>
  );
}
