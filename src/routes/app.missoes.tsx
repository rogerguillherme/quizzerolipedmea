import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Utensils,
  Leaf,
  HeartPulse,
  MessageSquareQuote,
  Coffee,
  ChevronDown,
} from "lucide-react";
import { CHA_INDICADO } from "../lib/protocolo7";

export const Route = createFileRoute("/app/missoes")({
  component: Missoes,
});

const CARD = {
  background: "rgba(255,253,247,0.9)",
  border: "1px solid rgba(216,198,160,0.55)",
  boxShadow: "0 10px 24px -20px rgba(22,50,79,0.3)",
};

const NAVY = "#16324F";
const GOLD = "#AF7F35";

type Dica = {
  id: string;
  titulo: string;
  descricao: string;
  icon: React.ReactNode;
  detalhe: string;
};

const DICAS: Dica[] = [
  {
    id: "aliados",
    titulo: "Alimentos que ajudam no dia a dia",
    descricao: "Itens simples, de qualquer mercado.",
    icon: <Utensils className="size-4" />,
    detalhe:
      "Frutas (banana, mamão, laranja, maçã), arroz integral, batata-doce, mandioca, ovo, frango grelhado, peixe (tilápia, sardinha), feijão, lentilha, folhas (alface, couve), brócolis, abobrinha, azeite de oliva no lugar do óleo comum, água, água de coco, chá de gengibre e chá de camomila.",
  },
  {
    id: "evitar",
    titulo: "Alimentos que costumam piorar",
    descricao: "Reduza esses itens da rotina.",
    icon: <Leaf className="size-4" />,
    detalhe:
      "Pão francês e pão de forma em excesso, salgadinhos de pacote, biscoito recheado, refrigerante e suco de caixinha, embutidos (presunto, salsicha, mortadela), molho de tomate pronto e caldo em cubo, frituras (salgados de padaria, batata frita), açúcar de mesa em excesso e macarrão instantâneo.",
  },
  {
    id: "refeicao",
    titulo: "Exemplo de refeições do dia",
    descricao: "Modelo para trocar dentro da mesma lógica.",
    icon: <HeartPulse className="size-4" />,
    detalhe:
      "Café: pão integral + ovo mexido + mamão, ou iogurte natural + banana + castanhas. Almoço: arroz + feijão + frango grelhado + salada, ou arroz + feijão + peixe assado + abobrinha. Tarde: banana com chá de gengibre, ou maçã com um punhado de castanhas. Jantar: sopa de legumes com frango desfiado, ou omelete de claras + salada de folhas.",
  },
  {
    id: "olhos",
    titulo: "Primeiro se come com os olhos",
    descricao: "A apresentação muda a percepção da refeição.",
    icon: <MessageSquareQuote className="size-4" />,
    detalhe:
      "Capriche em 2-3 cores no prato, use uma louça que você goste, corte os alimentos de forma organizada (fatias, cubos, rodelas), sirva pouco de cada vez e repita se precisar, e faça a refeição sem tela para perceber fome e saciedade.",
  },
];

function Missoes() {
  const [aberta, setAberta] = useState<string | null>(null);

  return (
    <div className="px-5 pt-6 pb-24">
      <p
        className="text-[10px] font-semibold uppercase"
        style={{ letterSpacing: "0.24em", color: GOLD }}
      >
        Guia essencial
      </p>
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
        Dicas para <em className="italic" style={{ color: GOLD }}>cuidar</em> do lipedema
      </h1>
      <p className="mt-2 text-[13px]" style={{ color: "#2F3128" }}>
        Toque em cada dica para expandir o conteúdo.
      </p>

      {/* Dicas minimizadas — clique para expandir */}
      <div className="mt-5 space-y-2">
        {DICAS.map((d) => {
          const open = aberta === d.id;
          return (
            <div
              key={d.id}
              className="overflow-hidden rounded-2xl transition-all"
              style={CARD}
            >
              <button
                onClick={() => setAberta(open ? null : d.id)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                aria-expanded={open}
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-full"
                  style={{
                    background: "rgba(175,127,53,0.1)",
                    border: "1px solid rgba(175,127,53,0.35)",
                    color: GOLD,
                  }}
                >
                  {d.icon}
                </span>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold" style={{ color: NAVY }}>
                    {d.titulo}
                  </p>
                  <p className="text-[12px]" style={{ color: "#5C5749" }}>
                    {d.descricao}
                  </p>
                </div>
                <ChevronDown
                  className="size-4 shrink-0 transition-transform"
                  style={{
                    color: NAVY,
                    transform: open ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </button>
              {open && (
                <div className="px-4 pb-4">
                  <p
                    className="rounded-lg p-3 text-[12.5px] leading-relaxed"
                    style={{ background: "rgba(22,50,79,0.04)", color: NAVY }}
                  >
                    {d.detalhe}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Chá indicado — sempre com contraindicação */}
      <div className="mt-5 rounded-2xl p-4" style={CARD}>
        <div className="flex items-center gap-2">
          <Coffee className="size-4" style={{ color: GOLD }} />
          <p className="text-[13px] font-semibold uppercase tracking-widest" style={{ color: GOLD }}>
            Chá indicado
          </p>
        </div>
        <p
          className="mt-2 text-[15px] font-semibold"
          style={{ color: NAVY, fontFamily: "'Playfair Display', serif" }}
        >
          {CHA_INDICADO.nome}
        </p>
        <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: "#2F3128" }}>
          {CHA_INDICADO.como}
        </p>
        <div
          className="mt-3 rounded-xl p-3"
          style={{
            background: "rgba(176,58,58,0.06)",
            border: "1px solid rgba(176,58,58,0.25)",
          }}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#B03A3A" }}>
            ⚠ Contraindicação
          </p>
          <p className="mt-1 text-[12px] leading-relaxed" style={{ color: "#5C1F1F" }}>
            {CHA_INDICADO.contraindicacao}
          </p>
        </div>
      </div>

      <p
        className="mt-6 text-center text-[11px] leading-relaxed"
        style={{ color: "#2F3128" }}
      >
        Para iniciar o Protocolo de 7 Dias, use a aba <strong>Protocolo</strong> no menu.
      </p>
    </div>
  );
}
