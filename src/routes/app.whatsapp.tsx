import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Bot, Check, CheckCheck } from "lucide-react";
import { getApp } from "../lib/quiz-store";

export const Route = createFileRoute("/app/whatsapp")({
  component: WhatsApp,
});

type Msg = { from: "ia" | "user"; text: string; time: string; read?: boolean };

function WhatsApp() {
  const app = getApp();
  const nome = app.nome || "linda";
  const messages: Msg[] = [
    {
      from: "ia",
      text: `Bom dia, ${nome}! Hoje é o dia ${app.diaAtual || 1} do seu Desafio. Como você acordou? 1) Leve  2) Neutra  3) Inchada`,
      time: "07:12",
    },
    { from: "user", text: "2", time: "08:04", read: true },
    {
      from: "ia",
      text: "Anotado. Vou puxar a versão mais suave da rotina de hoje. Antes do almoço, tente a bomba de tornozelo por 2 min — te avisar depois?",
      time: "08:05",
    },
    { from: "user", text: "Sim, pode avisar 🙌", time: "08:06", read: true },
    {
      from: "ia",
      text: "Perfeito. Seu chá de hoje é cavalinha + hibisco. Já tem em casa?",
      time: "08:07",
    },
  ];

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <Bot className="size-6" />
        </div>
        <div>
          <p className="font-bold text-primary">Assistente Zero</p>
          <p className="text-xs text-muted-foreground">
            IA treinada no método da Gabriela · CRN 10582
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-sapphire-200 bg-sapphire-50 p-3 text-xs text-primary">
        <p className="font-semibold">WhatsApp é o canal principal.</p>
        <p className="mt-0.5 text-muted-foreground">
          O app é o apoio visual. Toda cadência acontece por lá.
        </p>
      </div>

      <div className="mt-5 space-y-2 rounded-2xl border border-border bg-sapphire-50/40 p-3">
        {messages.map((m, i) => (
          <Bubble key={i} m={m} />
        ))}
        <div className="pt-2">
          <div className="mx-auto w-fit rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
            IA respondendo em segundos · escalona para Gabriela quando necessário
          </div>
        </div>
      </div>

      <a
        href="https://wa.me/"
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[oklch(0.68_0.16_150)] px-5 py-4 text-base font-bold text-white shadow-lg"
      >
        <MessageCircle className="size-5" /> Abrir conversa no WhatsApp
      </a>
    </div>
  );
}

function Bubble({ m }: { m: Msg }) {
  const isUser = m.from === "user";
  return (
    <div className={["flex", isUser ? "justify-end" : "justify-start"].join(" ")}>
      <div
        className={[
          "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
          isUser
            ? "rounded-br-sm bg-coral-soft text-primary"
            : "rounded-bl-sm bg-card text-foreground",
        ].join(" ")}
      >
        <p className="whitespace-pre-line leading-snug">{m.text}</p>
        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
          {m.time}
          {isUser && (m.read ? <CheckCheck className="size-3" /> : <Check className="size-3" />)}
        </div>
      </div>
    </div>
  );
}
