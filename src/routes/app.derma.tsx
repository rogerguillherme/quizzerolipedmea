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
      <div className="flex items-center gap-2 text-coral">
        <Lock className="size-4" />
        <p className="text-xs font-bold uppercase tracking-wide">Acesso ao Método Derma</p>
      </div>
      <h1 className="mt-2 text-2xl font-extrabold text-primary">
        Protocolo de 90 dias com a Gabriela
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Este é o tier onde você tem contato humano real com a Gabriela.
        O desafio de 7 dias abre a porta — o Método Derma sustenta a mudança.
      </p>

      <div className="card-clinical mt-5 overflow-hidden">
        <div className="bg-gradient-to-br from-sapphire-800 to-sapphire-600 p-5 text-primary-foreground">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
            Método Derma · 90 dias
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold">Em breve</span>
          </div>
          <p className="mt-2 text-sm opacity-90">
            Vaga sob avaliação — turma reduzida por trimestre.
          </p>
        </div>
        <div className="divide-y divide-border">
          {INCLUI.map((i, idx) => (
            <div key={idx} className="flex items-start gap-3 p-4">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-sapphire-100 text-sapphire-800">
                {i.icon}
              </div>
              <div>
                <p className="font-bold text-primary">{i.title}</p>
                <p className="text-sm text-muted-foreground">{i.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => track("derma_upgrade_clicked")}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-coral px-5 py-4 text-base font-bold text-coral-foreground"
      >
        <Lock className="size-4" /> Quero saber quando abrir vaga
      </button>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Ao completar seus 7 dias, você recebe o convite de avaliação para o Método.
      </p>
    </div>
  );
}
