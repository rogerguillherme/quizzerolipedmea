/**
 * Prova social em formato de print de WhatsApp: DESLIGADA por padrão.
 *
 * Por que existe assim: depoimento fabricado apresentado como real é
 * publicidade enganosa (CDC art. 37), expõe diretamente a nutricionista que
 * assina a peça com o CRN visível e é um dos motivos mais comuns de reprovação
 * de criativo no Meta (esta conta já teve anúncio reprovado).
 *
 * A estrutura está pronta; o conteúdo real entra depois. Só ligue `REAIS`
 * quando houver print real de paciente COM autorização por escrito.
 */

import { useEffect, useState } from "react";

export interface DepoimentoMsg {
  /** Texto da mensagem. Recebida da paciente ou enviada pela Gabriela. */
  t: string;
  /** Horário exibido dentro do balão, ex.: "08:14". */
  h: string;
  /** true = balão enviado (Gabriela, verde à direita). */
  enviado?: boolean;
}

export interface Depoimento {
  nome: string;
  inicial: string;
  msgs: readonly DepoimentoMsg[];
}

/**
 * NÃO LIGUE ISTO SEM OS PRINTS REAIS.
 *
 * `REAIS = false` mantém a seção fora do ar (só aparece com `?preview` na URL,
 * para conferência visual) e carimba cada card com a tarja "exemplo".
 * Ao trocar para `true`, a tarja some e o aviso passa a dizer que são
 * mensagens reais publicadas com autorização.
 */
export const REAIS = false;

/**
 * Conteúdo. Enquanto não houver print real, os campos ficam como marcadores
 * explícitos: nenhum nome, cidade, idade, telefone ou frase inventada.
 * Para publicar: substitua `nome`, `inicial`, `t` e `h` pelo conteúdo real.
 */
export const DEPOIMENTOS: readonly Depoimento[] = [
  {
    nome: "[nome da paciente]",
    inicial: "•",
    msgs: [
      { t: "[cole aqui a mensagem real da paciente]", h: "--:--" },
      { t: "[cole aqui a resposta real da Gabriela]", h: "--:--", enviado: true },
    ],
  },
  {
    nome: "[nome da paciente]",
    inicial: "•",
    msgs: [
      { t: "[cole aqui a mensagem real da paciente]", h: "--:--" },
      { t: "[cole aqui a resposta real da Gabriela]", h: "--:--", enviado: true },
    ],
  },
  {
    nome: "[nome da paciente]",
    inicial: "•",
    msgs: [
      { t: "[cole aqui a mensagem real da paciente]", h: "--:--" },
      { t: "[cole aqui a continuação real da conversa]", h: "--:--" },
    ],
  },
];

const WA = {
  header: "#075E54",
  avatar: "#128C7E",
  fundo: "#ECE5DD",
  recebido: "#FFFFFF",
  enviado: "#D9FDD3",
  texto: "#111B21",
  hora: "#667781",
  tique: "#53BDEB",
} as const;

/** Detecta `?preview` sem quebrar a hidratação (só lê no cliente). */
function usePreview(): boolean {
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    setPreview(new URLSearchParams(window.location.search).has("preview"));
  }, []);
  return preview;
}

function Balao({ msg }: { msg: DepoimentoMsg }) {
  const enviado = msg.enviado === true;
  return (
    <div className={`flex ${enviado ? "justify-end" : "justify-start"}`}>
      <div
        style={{
          maxWidth: "85%",
          background: enviado ? WA.enviado : WA.recebido,
          color: WA.texto,
          borderRadius: 8,
          borderTopLeftRadius: enviado ? 8 : 2,
          borderTopRightRadius: enviado ? 2 : 8,
          boxShadow: "0 1px 1px rgba(0,0,0,.13)",
          padding: "7px 9px 5px",
        }}
      >
        <p className="whitespace-pre-line text-[0.86rem] leading-snug">{msg.t}</p>
        <p
          className="mt-1 flex items-center justify-end gap-1 text-right"
          style={{ fontSize: "0.65rem", color: WA.hora }}
        >
          {msg.h}
          {enviado && (
            <svg width="15" height="11" viewBox="0 0 16 11" aria-hidden style={{ color: WA.tique }}>
              <path
                d="M1 5.5 4 8.5 9.5 2M6.5 8.5 11.5 2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </p>
      </div>
    </div>
  );
}

function CardConversa({ d, exemplo }: { d: Depoimento; exemplo: boolean }) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        borderRadius: 20,
        border: "1px solid #E8DCC0",
        background: WA.fundo,
        boxShadow: "0 20px 40px -32px rgba(18,48,80,.55)",
      }}
    >
      {exemplo && (
        <span
          aria-hidden
          className="pointer-events-none absolute right-[-34px] top-[14px] z-10 px-10 py-1 text-[11px] font-bold uppercase tracking-widest"
          style={{ background: "#C0271F", color: "#fff", transform: "rotate(38deg)" }}
        >
          exemplo
        </span>
      )}

      <div className="flex items-center gap-3 px-4 py-3" style={{ background: WA.header }}>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[0.9rem] font-semibold"
          style={{ background: WA.avatar, color: "#fff" }}
          aria-hidden
        >
          {d.inicial}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[0.88rem] font-semibold" style={{ color: "#fff" }}>
            {d.nome}
          </span>
          <span className="block text-[0.7rem]" style={{ color: "rgba(255,255,255,.72)" }}>
            online
          </span>
        </span>
      </div>

      <div className="space-y-2 px-3 py-4">
        {d.msgs.map((m, i) => (
          <Balao key={i} msg={m} />
        ))}
      </div>
    </div>
  );
}

/**
 * Seção de prova social. Retorna `null` enquanto `REAIS` for false e a URL
 * não tiver `?preview`. É o que impede a estrutura vazia de ir ao ar.
 */
export function DepoimentosWhatsapp({ navy, navySoft, goldLabel }: {
  navy: string;
  navySoft: string;
  goldLabel: string;
}) {
  const preview = usePreview();
  if (!REAIS && !preview) return null;

  return (
    <section id="depoimentos" className="relative mx-auto max-w-5xl px-6 pb-20">
      <p
        className="text-[11px] font-semibold uppercase"
        style={{ letterSpacing: "0.22em", color: goldLabel }}
      >
        Quem já começou
      </p>
      <h2
        className="mt-2 text-[26px] leading-snug sm:text-[32px]"
        style={{ fontFamily: "Georgia, serif", color: navy }}
      >
        O que elas escrevem <em className="pl-em">depois</em>
      </h2>

      <div
        className="mt-8 grid gap-5"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(288px, 1fr))" }}
      >
        {DEPOIMENTOS.map((d, i) => (
          <CardConversa key={i} d={d} exemplo={!REAIS} />
        ))}
      </div>

      <p className="mt-6 text-[13px] leading-relaxed" style={{ color: REAIS ? navySoft : "#C0271F" }}>
        {REAIS
          ? "Mensagens reais, publicadas com autorização. Resultados variam de pessoa para pessoa."
          : "Estrutura de exemplo. Nenhum depoimento real foi coletado ainda. Não publique esta seção assim."}
      </p>
    </section>
  );
}
