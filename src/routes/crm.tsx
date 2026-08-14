import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Search,
  Send,
  Loader2,
  Bot,
  User as UserIcon,
  CheckCircle2,
  CheckCheck,
  Clock,

  ClipboardList,
  ArrowLeft,
  MessageSquare,
  Columns3,
  AlertTriangle,
  LayoutDashboard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  listConversationsRich,
  getConversation,
  sendMessage,
  setConversationMode,
  setConversationStatus,
  setConversationEtapa,
} from "@/lib/crm.functions";
import { LeadPanel, type LeadCRM } from "@/components/crm/LeadPanel";
import { CrmKanban } from "@/components/crm/CrmKanban";
import { haQuantoTempo, type Etapa } from "@/lib/crm-labels";
import { CrmStats } from "@/components/crm/CrmStats";
import { C, R, CARD } from "@/components/crm/crm-ui";

export const Route = createFileRoute("/crm")({
  ssr: false,
  component: CRMPage,
  head: () => ({
    meta: [
      { title: "CRM · Zero Lipedema" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const NAVY = "#16324F";
const GOLD = "#AF7F35";
const BORDER = "rgba(216,198,160,0.6)";

type Conv = {
  id: string;
  telefone: string;
  nome: string | null;
  app_context: string;
  status: string;
  modo: string;
  ultima_mensagem: string | null;
  ultima_mensagem_em: string | null;
  nao_lidas: number;
  tags: string[];
  etapa: Etapa;
  updated_at: string;
  lead: LeadCRM;
};
type Msg = {
  id: string;
  conversation_id: string;
  direcao: "in" | "out";
  autor: string;
  conteudo: string;
  status: string;
  created_at: string;
  midia_url?: string | null;
  midia_tipo?: string | null;
};

/** Renderiza a mídia recebida no WhatsApp (imagem, áudio, vídeo ou arquivo). */
function Midia({ url, tipo }: { url: string; tipo: string }) {
  if (tipo.startsWith("image"))
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <img
          src={url}
          alt="Imagem enviada no WhatsApp"
          className="max-h-64 w-full rounded-xl object-cover"
          loading="lazy"
        />
      </a>
    );
  if (tipo.startsWith("audio"))
    return <audio controls src={url} className="w-56 max-w-full" />;
  if (tipo.startsWith("video"))
    return <video controls src={url} className="max-h-64 w-full rounded-xl" />;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="text-xs font-bold underline"
    >
      Abrir arquivo
    </a>
  );
}


/** Hora curta (HH:MM) do balão, no padrão do WhatsApp. */
function hora(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** Rótulo da faixa de data ("Hoje", "Ontem" ou a data). */
function diaLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hoje = new Date();
  const dia = (x: Date) =>
    `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
  const ontem = new Date(hoje.getTime() - 864e5);
  if (dia(d) === dia(hoje)) return "Hoje";
  if (dia(d) === dia(ontem)) return "Ontem";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Iniciais para o avatar redondo da lista. */
function iniciais(nome: string) {
  const p = nome.trim().split(/\s+/).slice(0, 2);
  return p.map((x) => x[0]?.toUpperCase() ?? "").join("") || "?";
}


function CRMPage() {
  const navigate = useNavigate();
  const [pronto, setPronto] = useState(false);

  const fetchList = useServerFn(listConversationsRich);
  const fetchThread = useServerFn(getConversation);
  const send = useServerFn(sendMessage);
  const changeMode = useServerFn(setConversationMode);
  const changeStatus = useServerFn(setConversationStatus);
  const changeEtapa = useServerFn(setConversationEtapa);

  const [vista, setVista] = useState<"geral" | "conversas" | "funil">("geral");
  const [convs, setConvs] = useState<Conv[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [thread, setThread] = useState<Msg[]>([]);
  const [temMais, setTemMais] = useState(false);
  const [carregandoThread, setCarregandoThread] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);
  /** Cache em memória por conversa: abre instantâneo ao voltar nela. */
  const threadCache = useRef(
    new Map<string, { msgs: Msg[]; temMais: boolean }>(),
  );
  const [busca, setBusca] = useState("");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [painel, setPainel] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);


  // Guard de admin próprio da rota: volta pra /crm depois do login.
  useEffect(() => {
    let vivo = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!vivo) return;
      if (!data.session) {
        navigate({ to: "/admin/login", search: { redirect: "/crm" } as never });
        return;
      }
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!vivo) return;
      if (!role) {
        await supabase.auth.signOut();
        navigate({ to: "/admin/login", search: { redirect: "/crm" } as never });
        return;
      }
      setPronto(true);
    })();
    return () => {
      vivo = false;
    };
  }, [navigate]);

  async function refreshList() {
    const c = (await fetchList()) as Conv[];
    setConvs(c);
    return c;
  }

  useEffect(() => {
    if (!pronto) return;
    (async () => {
      await refreshList();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronto]);

  // Abre a conversa: mostra o cache na hora e busca a página recente em seguida.
  useEffect(() => {
    if (!selected) return;
    const id = selected;
    const cache = threadCache.current.get(id);
    if (cache) {
      setThread(cache.msgs);
      setTemMais(cache.temMais);
      setCarregandoThread(false);
    } else {
      setThread([]);
      setTemMais(false);
      setCarregandoThread(true);
    }
    let vivo = true;
    (async () => {
      try {
        const r = (await fetchThread({ data: { id, limit: 40 } })) as {
          messages: Msg[];
          temMais: boolean;
        };
        if (!vivo) return;
        const msgs = (r?.messages ?? []) as Msg[];
        threadCache.current.set(id, { msgs, temMais: !!r?.temMais });
        setThread(msgs);
        setTemMais(!!r?.temMais);
        setConvs((old) =>
          old.map((c) => (c.id === id ? { ...c, nao_lidas: 0 } : c)),
        );
      } finally {
        if (vivo) setCarregandoThread(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [selected, fetchThread]);

  // Vai para o fim quando a conversa termina de carregar.
  useEffect(() => {
    if (carregandoThread) return;
    endRef.current?.scrollIntoView({ block: "end" });
  }, [selected, carregandoThread]);

  /** Carrega o histórico anterior mantendo a posição de leitura. */
  async function carregarAnteriores() {
    if (!selected || carregandoMais || thread.length === 0) return;
    setCarregandoMais(true);
    const el = scrollRef.current;
    const antes = el ? el.scrollHeight - el.scrollTop : 0;
    try {
      const r = (await fetchThread({
        data: { id: selected, limit: 40, before: thread[0]!.created_at },
      })) as { messages: Msg[]; temMais: boolean };
      const novas = (r?.messages ?? []) as Msg[];
      const juntas = [...novas, ...thread];
      threadCache.current.set(selected, {
        msgs: juntas,
        temMais: !!r?.temMais,
      });
      setThread(juntas);
      setTemMais(!!r?.temMais);
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - antes;
      });
    } finally {
      setCarregandoMais(false);
    }
  }



  const conv = useMemo(
    () => convs.find((c) => c.id === selected) ?? null,
    [convs, selected],
  );

  const ordenadas = useMemo(() => {
    const t = (c: Conv) =>
      Date.parse(c.ultima_mensagem_em ?? c.updated_at ?? "") || 0;
    return [...convs].sort((a, b) => {
      if ((b.nao_lidas > 0 ? 1 : 0) !== (a.nao_lidas > 0 ? 1 : 0))
        return (b.nao_lidas > 0 ? 1 : 0) - (a.nao_lidas > 0 ? 1 : 0);
      return t(b) - t(a);
    });
  }, [convs]);

  const totais = useMemo(() => {
    const porEtapa = {
      mapa_feito: 0,
      em_conversa: 0,
      quer_saber_mais: 0,
      cliente: 0,
      sem_resposta: 0,
    } as Record<Etapa, number>;
    let naoLidas = 0;
    let comMapa = 0;
    for (const c of convs) {
      if (porEtapa[c.etapa] !== undefined) porEtapa[c.etapa] += 1;
      if (c.nao_lidas > 0) naoLidas += 1;
      if (c.lead) comMapa += 1;
    }
    return { porEtapa, naoLidas, comMapa, clientes: porEtapa.cliente };
  }, [convs]);

  const filtered = useMemo(
    () =>
      ordenadas.filter((c) =>
        `${c.nome ?? ""} ${c.telefone}`
          .toLowerCase()
          .includes(busca.toLowerCase()),
      ),
    [ordenadas, busca],
  );

  async function handleSend() {
    if (!selected || !texto.trim() || enviando) return;
    const id = selected;
    const conteudo = texto.trim();
    setEnviando(true);
    setErroEnvio(null);

    // Balão otimista: aparece na hora, como no WhatsApp.
    const provisorio: Msg = {
      id: `tmp-${Date.now()}`,
      conversation_id: id,
      direcao: "out",
      autor: "humano",
      conteudo,
      status: "enviando",
      created_at: new Date().toISOString(),
    };
    setThread((t) => [...t, provisorio]);
    setTexto("");
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ block: "end" }));

    try {
      const r = (await send({
        data: { conversationId: id, conteudo },
      })) as { ok: boolean; error?: string | null };
      if (!r?.ok) {
        setErroEnvio(
          r?.error
            ? `Não consegui enviar: ${r.error}`
            : "Não consegui enviar essa mensagem pelo WhatsApp.",
        );
      }
      setThread((t) => {
        const novo = t.map((m) =>
          m.id === provisorio.id
            ? { ...m, status: r?.ok ? "enviado" : "falhou" }
            : m,
        );
        threadCache.current.set(id, { msgs: novo, temMais });
        return novo;
      });
      setConvs((old) =>
        old.map((c) =>
          c.id === id
            ? {
                ...c,
                ultima_mensagem: conteudo,
                ultima_mensagem_em: provisorio.created_at,
                modo: "humano",
              }
            : c,
        ),
      );
    } catch {
      setErroEnvio("Falha de conexão ao enviar. Tente de novo.");
      setThread((t) =>
        t.map((m) => (m.id === provisorio.id ? { ...m, status: "falhou" } : m)),
      );
    } finally {
      setEnviando(false);
    }
  }


  async function toggleMode() {
    if (!conv) return;
    const novo = conv.modo === "ia" ? "humano" : "ia";
    await changeMode({ data: { id: conv.id, modo: novo } });
    await refreshList();
  }

  async function marcarResolvido() {
    if (!conv) return;
    await changeStatus({ data: { id: conv.id, status: "resolvido" } });
    await refreshList();
  }

  async function moverEtapa(id: string, etapa: Etapa) {
    setConvs((old) => old.map((c) => (c.id === id ? { ...c, etapa } : c)));
    await changeEtapa({ data: { id, etapa } });
    await refreshList();
  }

  if (!pronto || loading) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-[#F7F2E8]">
        <Loader2 className="size-6 animate-spin" style={{ color: NAVY }} />
      </div>
    );
  }

  const listaEl = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="flex items-center gap-2 px-3"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <Search className="size-4" style={{ color: GOLD }} />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone"
          className="min-h-11 flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.map((c) => {
          const active = selected === c.id;
          const nome = c.nome || c.lead?.nome || c.telefone;
          return (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors"
              style={{
                borderBottom: `1px solid ${BORDER}`,
                background: active ? "#EFE5CE" : "transparent",
                minHeight: 68,
              }}
            >
              <span
                className="grid size-11 shrink-0 place-items-center rounded-full text-[13px] font-bold"
                style={{ background: C.track, color: NAVY }}
                aria-hidden
              >
                {iniciais(nome)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  {c.lead && (
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: GOLD }}
                      title="Tem Mapa vinculado"
                    />
                  )}
                  <span
                    className="truncate text-[15px] font-bold"
                    style={{ color: NAVY }}
                  >
                    {nome}
                  </span>
                  <span
                    className="ml-auto shrink-0 text-[11px]"
                    style={{ color: c.nao_lidas > 0 ? GOLD : "#8A7C5C" }}
                  >
                    {haQuantoTempo(c.ultima_mensagem_em)}
                  </span>
                </span>
                <span className="mt-0.5 flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[#5C5749]">
                    {c.ultima_mensagem || "Ainda sem mensagem trocada"}
                  </span>
                  {c.nao_lidas > 0 && (
                    <span
                      className="grid min-w-5 shrink-0 place-items-center rounded-full px-1.5 text-[11px] font-bold text-white"
                      style={{ background: "#E85D75" }}
                    >
                      {c.nao_lidas}
                    </span>
                  )}
                </span>
              </span>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <p className="p-8 text-center text-[13px] text-[#8A7C5C]">
            {busca
              ? "Nenhuma conversa com esse nome ou número."
              : "Ainda não chegou nenhuma conversa por aqui. Assim que alguém responder no WhatsApp, ela aparece nesta lista."}
          </p>
        )}
      </div>
    </div>
  );

  const conversaEl = conv ? (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <button
          onClick={() => setSelected(null)}
          className="grid size-11 place-items-center rounded-full md:hidden"
          aria-label="Voltar para a lista"
        >
          <ArrowLeft className="size-5" style={{ color: NAVY }} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold" style={{ color: NAVY }}>
            {conv.nome || conv.lead?.nome || conv.telefone}
          </p>
          <p className="text-[11px] text-[#8A7C5C]">{conv.telefone}</p>
        </div>
        <button
          onClick={() => setPainel(true)}
          className="grid size-11 place-items-center rounded-full"
          style={{ border: `1px solid ${BORDER}`, color: NAVY }}
          aria-label="Ver resumo do Mapa"
          title="Resumo do Mapa"
        >
          <ClipboardList className="size-4" />
        </button>
        <button
          onClick={toggleMode}
          className="hidden min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-bold sm:flex"
          style={{ border: `1px solid ${BORDER}`, color: NAVY }}
        >
          {conv.modo === "ia" ? (
            <>
              <Bot className="size-3.5" /> IA responde
            </>
          ) : (
            <>
              <UserIcon className="size-3.5" /> Humano
            </>
          )}
        </button>
        <button
          onClick={marcarResolvido}
          className="hidden min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-bold sm:flex"
          style={{ background: NAVY, color: "#F7F2E8" }}
        >
          <CheckCircle2 className="size-3.5" /> Resolver
        </button>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3"
        style={{
          background: C.chatBg,
          backgroundImage:
            "radial-gradient(rgba(22,50,79,0.05) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        {temMais && (
          <div className="flex justify-center pb-2">
            <button
              onClick={carregarAnteriores}
              disabled={carregandoMais}
              className="min-h-9 rounded-full px-4 text-[12px] font-bold"
              style={{ background: C.surface, color: NAVY, border: `1px solid ${BORDER}` }}
            >
              {carregandoMais ? "Carregando..." : "Carregar mensagens anteriores"}
            </button>
          </div>
        )}

        {carregandoThread && thread.length === 0 && (
          <div className="grid place-items-center py-10">
            <Loader2 className="size-5 animate-spin" style={{ color: NAVY }} />
          </div>
        )}

        {thread.map((m, i) => {
          const mine = m.direcao === "out";
          const soRotulo = /^\[(imagem|áudio|vídeo|documento|figurinha)\]$/.test(
            m.conteudo?.trim() ?? "",
          );
          const anterior = thread[i - 1];
          const novaData =
            !anterior || diaLabel(anterior.created_at) !== diaLabel(m.created_at);
          const agrupada =
            !novaData &&
            !!anterior &&
            anterior.direcao === m.direcao &&
            anterior.autor === m.autor;
          return (
            <div key={m.id}>
              {novaData && (
                <div className="flex justify-center py-3">
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-bold"
                    style={{
                      background: "rgba(255,253,247,0.9)",
                      color: "#5C5749",
                    }}
                  >
                    {diaLabel(m.created_at)}
                  </span>
                </div>
              )}
              <div
                className={mine ? "flex justify-end" : "flex justify-start"}
                style={{ marginTop: agrupada ? 2 : 8 }}
              >
                <div
                  className="relative max-w-[85%] space-y-1 px-3 py-1.5 text-[14px] leading-snug md:max-w-[70%]"
                  style={{
                    borderRadius: 12,
                    borderTopRightRadius: mine && !agrupada ? 2 : 12,
                    borderTopLeftRadius: !mine && !agrupada ? 2 : 12,
                    boxShadow: "0 1px 1px rgba(22,50,79,0.14)",
                    ...(mine
                      ? m.autor === "ia"
                        ? { background: "#EADFC4", color: NAVY }
                        : { background: "#DCF3E4", color: NAVY }
                      : { background: "#FFFDF7", color: NAVY }),
                  }}
                >
                  {mine && m.autor === "ia" && !agrupada && (
                    <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-70">
                      <Bot className="size-3" /> IA
                    </p>
                  )}
                  {m.midia_url && (
                    <Midia url={m.midia_url} tipo={m.midia_tipo ?? ""} />
                  )}
                  {!(m.midia_url && soRotulo) && (
                    <p className="whitespace-pre-wrap break-words pr-12">
                      {m.conteudo}
                    </p>
                  )}
                  <span className="float-right -mt-3 ml-2 flex items-center gap-0.5 text-[10px] opacity-60">
                    {hora(m.created_at)}
                    {mine &&
                      (m.status === "enviando" ? (
                        <Clock className="size-3" />
                      ) : m.status === "falhou" ? (
                        <AlertTriangle className="size-3 text-[#E85D75]" />
                      ) : (
                        <CheckCheck className="size-3" />
                      ))}
                  </span>
                  {m.status === "falhou" && (
                    <p className="clear-both flex items-center gap-1 pt-1 text-[10px] font-bold text-[#E85D75]">
                      <AlertTriangle className="size-3" /> não chegou no WhatsApp
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>


      <div
        className="sticky bottom-0 p-3"
        style={{
          borderTop: `1px solid ${BORDER}`,
          background: "#FFFDF7",
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
        }}
      >
        {erroEnvio && (
          <p
            className="mb-2 flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold"
            style={{ background: "rgba(232,93,117,0.12)", color: "#B03A52" }}
          >
            <AlertTriangle className="size-3.5" /> {erroEnvio}
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder="Escreva como Gabriela..."
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl p-3 text-base outline-none"
            style={{ border: `1px solid ${BORDER}`, background: "#FFF" }}
          />
          <button
            onClick={handleSend}
            disabled={enviando || !texto.trim()}
            className="grid size-11 shrink-0 place-items-center rounded-2xl disabled:opacity-40"
            style={{ background: NAVY, color: "#F7F2E8" }}
            aria-label="Enviar"
          >
            {enviando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div className="grid flex-1 place-items-center p-8 text-center text-[13px] text-[#8A7C5C]">
      Escolha uma conversa à esquerda para começar a responder.
    </div>
  );

  const kanbanEl = (
    <CrmKanban
      conversas={convs.map((c) => ({
        id: c.id,
        nome: c.nome || c.lead?.nome || null,
        telefone: c.telefone,
        ultima_mensagem: c.ultima_mensagem,
        ultima_mensagem_em: c.ultima_mensagem_em,
        nao_lidas: c.nao_lidas,
        etapa: c.etapa,
        temMapa: !!c.lead,
      }))}
      onAbrir={(id) => {
        setSelected(id);
        setVista("conversas");
      }}
      onMover={moverEtapa}
    />
  );

  const NAV = [
    { id: "geral", label: "Visão geral", icon: LayoutDashboard },
    { id: "conversas", label: "Conversas", icon: MessageSquare },
    { id: "funil", label: "Funil", icon: Columns3 },
  ] as const;

  return (
    <div
      className="flex h-[100dvh] overflow-hidden"
      style={{ background: C.app, fontFamily: "'Nunito', sans-serif" }}
    >
      {/* Sidebar do painel */}
      <aside
        className="hidden w-60 shrink-0 flex-col md:flex"
        style={{ background: C.surface, borderRight: `1px solid ${C.border}` }}
      >
        <div className="px-5 py-5" style={{ borderBottom: `1px solid ${C.border}` }}>
          <p
            className="text-[10px] font-bold uppercase"
            style={{ letterSpacing: "0.22em", color: C.goldLabel }}
          >
            Zero Lipedema
          </p>
          <p
            className="mt-1 text-[20px] font-bold leading-tight"
            style={{ color: C.textPrimary }}
          >
            CRM
          </p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((n) => {
            const active = vista === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setVista(n.id)}
                className="flex min-h-11 w-full items-center gap-2 px-3 text-[13px] font-semibold transition-colors"
                style={{
                  borderRadius: R.md,
                  background: active ? C.navy : "transparent",
                  color: active ? C.onAccent : C.textSecondary,
                }}
              >
                <n.icon className="size-4" /> {n.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3" style={{ borderTop: `1px solid ${C.border}` }}>
          <p className="text-[12px]" style={{ color: C.textMuted }}>
            {convs.length} conversas · {totais.naoLidas} não lidas
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topo */}
        <header
          className="flex shrink-0 items-center gap-3 px-4 py-2 md:px-6 md:py-3"
          style={{ borderBottom: `1px solid ${C.border}`, background: C.surface }}
        >
          <div className="min-w-0">
            <p
              className="text-[10px] font-bold uppercase md:hidden"
              style={{ letterSpacing: "0.22em", color: C.goldLabel }}
            >
              Zero Lipedema
            </p>
            <h1
              className="truncate text-[18px] font-bold leading-tight md:text-[22px]"
              style={{ color: C.textPrimary }}
            >
              {NAV.find((n) => n.id === vista)?.label}
            </h1>
          </div>

          {/* Mobile: pílulas */}
          <div
            className="ml-auto flex p-0.5 md:hidden"
            style={{ background: C.track, borderRadius: R.pill }}
          >
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setVista(n.id)}
                className="flex min-h-10 items-center gap-1 px-3 text-[12px] font-bold"
                style={
                  vista === n.id
                    ? { background: C.navy, color: C.onAccent, borderRadius: R.pill }
                    : { color: C.textPrimary }
                }
                aria-label={n.label}
              >
                <n.icon className="size-3.5" />
              </button>
            ))}
          </div>
        </header>

        {vista === "geral" ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
            <CrmStats
              total={convs.length}
              naoLidas={totais.naoLidas}
              comMapa={totais.comMapa}
              clientes={totais.clientes}
              porEtapa={totais.porEtapa}
            />
            <div className="mt-4" style={{ ...CARD, padding: 20 }}>
              <p
                className="text-[13px] font-bold uppercase"
                style={{ letterSpacing: "0.14em", color: C.goldLabel }}
              >
                Precisam de resposta
              </p>
              <div className="mt-3 divide-y" style={{ borderColor: C.border }}>
                {ordenadas
                  .filter((c) => c.nao_lidas > 0)
                  .slice(0, 6)
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelected(c.id);
                        setVista("conversas");
                      }}
                      className="flex w-full items-center gap-2 py-3 text-left"
                    >
                      <span className="min-w-0 flex-1">
                        <span
                          className="block truncate text-[13px] font-bold"
                          style={{ color: C.textPrimary }}
                        >
                          {c.nome || c.lead?.nome || c.telefone}
                        </span>
                        <span
                          className="block truncate text-[12px]"
                          style={{ color: C.textSecondary }}
                        >
                          {c.ultima_mensagem || "Ainda sem mensagem"}
                        </span>
                      </span>
                      <span
                        className="shrink-0 text-[12px]"
                        style={{ color: C.textMuted }}
                      >
                        {haQuantoTempo(c.ultima_mensagem_em)}
                      </span>
                    </button>
                  ))}
                {totais.naoLidas === 0 && (
                  <p className="py-6 text-center text-[13px]" style={{ color: C.textMuted }}>
                    Tudo respondido por aqui.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : vista === "funil" ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{kanbanEl}</div>
        ) : (
          <div className="grid min-h-0 flex-1 md:grid-cols-[320px_1fr]">
            {/* Lista: no celular some quando há conversa aberta */}
            <div
              className={[
                selected ? "hidden md:flex" : "flex",
                "min-h-0 flex-col",
              ].join(" ")}
              style={{ borderRight: `1px solid ${C.border}`, background: C.surface }}
            >
              {listaEl}
            </div>
            <div
              className={[
                selected ? "flex" : "hidden md:flex",
                "min-h-0 flex-col",
              ].join(" ")}
              style={{ background: C.surface }}
            >
              {conversaEl}
            </div>
          </div>
        )}
      </div>

      {painel && conv && (
        <LeadPanel
          conversaId={conv.id}
          telefone={conv.telefone}
          lead={conv.lead}
          onClose={() => setPainel(false)}
          onVinculado={async () => {
            await refreshList();
            setPainel(false);
          }}
        />
      )}
    </div>
  );
}

