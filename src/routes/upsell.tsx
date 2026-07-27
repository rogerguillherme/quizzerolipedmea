import { createFileRoute } from "@tanstack/react-router";
import {
  Lock,
  FileText,
  Video,
  MessagesSquare,
  Stethoscope,
  
  UtensilsCrossed,
  FlaskConical,
  ChevronRight,
} from "lucide-react";
import { track } from "../lib/analytics";

export const Route = createFileRoute("/upsell")({
  component: Derma,
});

const NAVY = "#16324F";
const GOLD = "#AF7F35";
const CREAM = "#F5EFE1";
const GOLD_SOFT = "#D9A94B";

const INCLUI = [
  {
    icon: <Stethoscope className="size-4" />,
    title: "Anamnese completa",
    body: "Avaliação clínica aprofundada da sua história, sintomas e objetivos — feita uma vez, na entrada do programa.",
  },
  {
    icon: <FileText className="size-4" />,
    title: "Leitura de exames",
    body: "Interpretação dos seus exames de sangue sob a ótica do lipedema, com direcionamento prático.",
  },
  {
    icon: <UtensilsCrossed className="size-4" />,
    title: "Cardápio 100% personalizado",
    body: "Diferente dos cardápios de sugestão do plano de 7 dias, aqui o plano alimentar é montado especificamente pro seu caso, com base na sua anamnese e exames.",
  },
  {
    icon: <FlaskConical className="size-4" />,
    title: "Prescrição individual de chás, shots e suplementos",
    body: "Ajustada ao seu quadro (não o guia geral) — dosagem e combinação pensadas pra você.",
  },
  {
    icon: <Video className="size-4" />,
    title: "Aulas gravadas da Gabriela",
    body: "Biblioteca de módulos: hormônios, alimentação, vascular, emocional.",
  },
  {
    icon: <MessagesSquare className="size-4" />,
    title: "Q&A ao vivo com Gabriela",
    body: "Encontros regulares em turma pequena e sustentável.",
  },
];

function Derma() {
  return (
    <div className="px-5 pt-6 pb-10">
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-semibold uppercase"
          style={{ letterSpacing: "0.24em", color: GOLD }}
        >
          Premium
        </span>
        <span
          className="h-px flex-1"
          style={{ background: "linear-gradient(90deg, rgba(216,198,160,0.7), transparent)" }}
        />
      </div>
      <h1
        className="mt-2"
        style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 500,
          fontSize: "1.75rem",
          lineHeight: 1.15,
          color: NAVY,
        }}
      >
        Plano <em className="italic" style={{ color: GOLD }}>Premium</em> · 90 dias
      </h1>
      <p className="mt-3 text-[13.5px]" style={{ color: "#2F3128", lineHeight: 1.55 }}>
        Contato humano com a Dra. Gabriela + acompanhamento por I.A. da sua alimentação, dia após dia.
      </p>

      {/* Especificações */}
      <div
        className="mt-5 overflow-hidden rounded-3xl"
        style={{
          background: "rgba(255,253,247,0.92)",
          border: "1px solid rgba(216,198,160,0.55)",
          boxShadow: "0 20px 32px -22px rgba(22,50,79,0.45)",
        }}
      >
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
                background: "rgba(175,127,53,0.14)",
                border: "1px solid rgba(175,127,53,0.35)",
                color: GOLD,
              }}
            >
              {i.icon}
            </span>
            <div className="flex-1">
              <p className="text-[13.5px] font-semibold" style={{ color: NAVY }}>
                {i.title}
              </p>
              <p className="text-[12px]" style={{ color: "#2F3128", lineHeight: 1.5 }}>
                {i.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Preço */}
      {/* TODO: confirmar preço final com Roger/Gabriela */}
      <div
        className="mt-6 rounded-3xl px-5 py-5 text-center"
        style={{
          background: "rgba(255,253,247,0.95)",
          border: "1px solid rgba(216,198,160,0.55)",
          boxShadow: "0 20px 32px -22px rgba(22,50,79,0.45)",
        }}
      >
        <p
          className="text-[10.5px] font-semibold uppercase"
          style={{ letterSpacing: "0.24em", color: GOLD }}
        >
          Investimento
        </p>
        <p
          className="mt-1"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 500,
            fontSize: "2rem",
            color: NAVY,
          }}
        >
          R$197
        </p>
        <p className="mt-1 text-[12px]" style={{ color: "#5C5749" }}>
          programa completo de 90 dias
        </p>
      </div>

      {/* CTA compra */}
      {/* TODO: apontar para o link de checkout Kiwify do Método Derma assim que o Roger criar o produto lá */}
      <button
        onClick={() => track("premium_upgrade_clicked")}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full px-5 py-4 text-[15px] font-semibold"
        style={{
          background: `linear-gradient(180deg, #2C5578, ${NAVY})`,
          color: CREAM,
          boxShadow: "0 14px 26px -14px rgba(22,50,79,0.55)",
        }}
      >
        <Lock className="size-4" /> Quero assinar o Premium
        <ChevronRight className="size-4" />
      </button>
      <p className="mt-3 text-center text-[11px]" style={{ color: "#2F3128" }}>
        Turma reduzida por trimestre. Vaga sob avaliação.
      </p>
    </div>
  );
}
