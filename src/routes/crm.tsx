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
  ClipboardList,
  ArrowLeft,
  MessageSquare,
  Columns3,
  AlertTriangle,
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
};

function CRMPage() {
  const navigate = useNavigate();
  const [pronto, setPronto] = useState(false);

  const fetchList = useServerFn(listConversationsRich);
  const fetchThread = useServerFn(getConversation);
  const send = useServerFn(sendMessage);
  const changeMode = useServerFn(setConversationMode);
  const changeStatus = useServerFn(setConversationStatus);
  const changeEtapa = useServerFn(setConversationEtapa);

  const [vista, setVista] = useState<"conversas" | "funil">("conversas");
  const [convs, setConvs] = useState<Conv[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [thread, setThread] = useState<Msg[]>([]);
  const [busca, setBusca] = useState("");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [painel, setPainel] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!selected) return;
    (async () => {
      const r = await fetchThread({ data: { id: selected } });
      setThread((r?.messages ?? []) as Msg[]);
      setTimeout(
        () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
        30,
      );
    })();
  }, [selected, fetchThread]);

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
    setEnviando(true);
    setErroEnvio(null);
    try {
      const r = (await send({
        data: { conversationId: selected, conteudo: texto.trim() },
      })) as { ok: boolean; error?: string | null };
      if (!r?.ok) {
        setErroEnvio(
          r?.error
            ? `Não consegui enviar: ${r.error}`
            : "Não consegui enviar essa mensagem pelo WhatsApp.",
        );
      } else {
        setTexto("");
      }
      const t = await fetchThread({ data: { id: selected } });
      setThread((t?.messages ?? []) as Msg[]);
      await refreshList();
      setTimeout(
        () => endRef.current?.scrollIntoView({ behavior: "smooth" }),
        30,
      );
    } catch {
      setErroEnvio("Falha de conexão ao enviar. Tente de novo.");
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
    <div className="flex min-h-0 flex-col">
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
          return (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className="block w-full px-3 py-3 text-left transition-colors"
              style={{
                borderBottom: `1px solid ${BORDER}`,
                background: active ? "#EFE5CE" : "transparent",
                minHeight: 64,
              }}
            >
              <div className="flex items-center gap-1.5">
                {c.lead && (
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: GOLD }}
                    title="Tem Mapa vinculado"
                  />
                )}
                <p
                  className="truncate text-sm font-bold"
                  style={{ color: NAVY }}
                >
                  {c.nome || c.lead?.nome || c.telefone}
                </p>
                <span className="ml-auto shrink-0 text-[11px] text-[#8A7C5C]">
                  {haQuantoTempo(c.ultima_mensagem_em)}
                </span>
                {c.nao_lidas > 0 && (
                  <span
                    className="shrink-0 rounded-full px-1.5 text-[10px] font-bold text-white"
                    style={{ background: "#E85D75" }}
                  >
                    {c.nao_lidas}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-xs text-[#5C5749]">
                {c.ultima_mensagem || "Ainda sem mensagem trocada"}
              </p>
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

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {thread.map((m) => {
          const mine = m.direcao === "out";
          return (
            <div
              key={m.id}
              className={mine ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className="max-w-[80%] rounded-2xl px-4 py-2 text-sm"
                style={
                  mine
                    ? m.autor === "ia"
                      ? { background: "rgba(175,127,53,0.22)", color: NAVY }
                      : { background: NAVY, color: "#F7F2E8" }
                    : { background: "#F7F2E8", color: NAVY }
                }
              >
                {mine && m.autor === "ia" && (
                  <p className="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-70">
                    <Bot className="size-3" /> IA
                  </p>
                )}
                <p className="whitespace-pre-wrap">{m.conteudo}</p>
                {m.status === "falhou" && (
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[#E85D75]">
                    <AlertTriangle className="size-3" /> não chegou no WhatsApp
                  </p>
                )}
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

  return (
    <div
      className="flex h-[100dvh] flex-col overflow-hidden"
      style={{
        background:
          "radial-gradient(900px 500px at 0% 0%, #EFE5CE 0%, transparent 55%), #F7F2E8",
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      {/* Topo */}
      <header
        className="flex shrink-0 items-center gap-3 px-4 py-2"
        style={{ borderBottom: `1px solid ${BORDER}`, background: "#FFFDF7" }}
      >
        <div className="min-w-0">
          <p
            className="text-[10px] font-bold uppercase"
            style={{ letterSpacing: "0.22em", color: GOLD }}
          >
            Zero Lipedema
          </p>
          <h1
            className="text-lg italic leading-tight"
            style={{ fontFamily: '"Playfair Display", serif', color: NAVY }}
          >
            CRM
          </h1>
        </div>
        <div
          className="ml-auto flex rounded-full p-0.5"
          style={{ background: "#EFE5CE" }}
        >
          {(
            [
              ["conversas", "Conversas", MessageSquare],
              ["funil", "Funil", Columns3],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setVista(id)}
              className="flex min-h-11 items-center gap-1.5 rounded-full px-4 text-xs font-bold"
              style={
                vista === id
                  ? { background: NAVY, color: "#F7F2E8" }
                  : { color: NAVY }
              }
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
      </header>

      {vista === "funil" ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
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
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 md:grid-cols-[320px_1fr]">
          {/* Lista: no celular some quando há conversa aberta */}
          <div
            className={[
              selected ? "hidden md:flex" : "flex",
              "min-h-0 flex-col",
            ].join(" ")}
            style={{ borderRight: `1px solid ${BORDER}`, background: "#FFFDF7" }}
          >
            {listaEl}
          </div>
          <div
            className={[
              selected ? "flex" : "hidden md:flex",
              "min-h-0 flex-col",
            ].join(" ")}
            style={{ background: "#FFFDF7" }}
          >
            {conversaEl}
          </div>
        </div>
      )}

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
