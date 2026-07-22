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
      <p
        className="text-[10px] font-semibold uppercase"
        style={{ letterSpacing: "0.24em", color: "#AF7F35" }}
      >
        Assistente
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
        Fale com a <em className="italic" style={{ color: "#AF7F35" }}>Gabi</em>
      </h1>

      <div className="mt-4 flex items-center gap-3">
        <span
          className="grid size-11 place-items-center rounded-2xl"
          style={{
            background: "linear-gradient(180deg, #2C5578, #16324F)",
            color: "#F5EFE1",
          }}
        >
          <Bot className="size-5" />
        </span>
        <div>
          <p className="text-[14px] font-semibold" style={{ color: "#16324F" }}>
            Assistente Zero
          </p>
          <p className="text-[11.5px]" style={{ color: "#5B5D52" }}>
            IA treinada no método da Gabriela · CRN 10582
          </p>
        </div>
      </div>

      <div
        className="mt-4 rounded-2xl px-3.5 py-3 text-[12px]"
        style={{
          background: "rgba(175,127,53,0.08)",
          border: "1px solid rgba(175,127,53,0.3)",
          color: "#16324F",
        }}
      >
        <p className="font-semibold">WhatsApp é o canal principal.</p>
        <p className="mt-0.5" style={{ color: "#5B5D52" }}>
          O app é o apoio visual. Toda cadência acontece por lá.
        </p>
      </div>

      <div
        className="mt-5 space-y-2 rounded-3xl p-3"
        style={{
          background: "rgba(22,50,79,0.04)",
          border: "1px solid rgba(216,198,160,0.55)",
        }}
      >
        {messages.map((m, i) => (
          <Bubble key={i} m={m} />
        ))}
        <div className="pt-1.5">
          <div
            className="mx-auto w-fit rounded-full px-3 py-1 text-[10.5px]"
            style={{
              background: "rgba(245,239,225,0.85)",
              border: "1px solid rgba(216,198,160,0.5)",
              color: "#5B5D52",
            }}
          >
            IA responde em segundos · escalona para Gabriela quando necessário
          </div>
        </div>
      </div>

      <a
        href="https://wa.me/"
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full px-5 py-4 text-[15px] font-semibold"
        style={{
          background: "linear-gradient(180deg, #2C5578, #16324F)",
          color: "#F5EFE1",
          boxShadow: "0 14px 26px -14px rgba(22,50,79,0.55)",
        }}
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
        className="max-w-[80%] rounded-2xl px-3.5 py-2 text-[13.5px]"
        style={
          isUser
            ? {
                background: "rgba(217,169,75,0.2)",
                color: "#16324F",
                borderBottomRightRadius: 6,
                border: "1px solid rgba(175,127,53,0.35)",
              }
            : {
                background: "#FFFDF7",
                color: "#16324F",
                borderBottomLeftRadius: 6,
                border: "1px solid rgba(216,198,160,0.5)",
              }
        }
      >
        <p className="whitespace-pre-line" style={{ lineHeight: 1.45 }}>
          {m.text}
        </p>
        <div
          className="mt-1 flex items-center justify-end gap-1 text-[10px]"
          style={{ color: "#8A8574" }}
        >
          {m.time}
          {isUser && (m.read ? <CheckCheck className="size-3" /> : <Check className="size-3" />)}
        </div>
      </div>
    </div>
  );
}
