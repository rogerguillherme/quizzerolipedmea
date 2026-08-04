import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Search,
  Send,
  Loader2,
  Bot,
  User as UserIcon,
  CheckCircle2,
  Tag as TagIcon,
  Plus,
} from "lucide-react";
import {
  listConversations,
  getConversation,
  sendMessage,
  setConversationMode,
  setConversationStatus,
  listTags,
  createTag,
  setConversationTags,
} from "@/lib/crm.functions";


export const Route = createFileRoute("/admin/crm")({
  component: CRMPage,
});

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
  updated_at: string;
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
type Tag = { id: string; nome: string; cor: string };

function CRMPage() {
  const fetchList = useServerFn(listConversations);
  const fetchThread = useServerFn(getConversation);
  const send = useServerFn(sendMessage);
  const changeMode = useServerFn(setConversationMode);
  const changeStatus = useServerFn(setConversationStatus);
  const fetchTags = useServerFn(listTags);
  const newTag = useServerFn(createTag);
  const setTags = useServerFn(setConversationTags);
  

  const [convs, setConvs] = useState<Conv[]>([]);
  const [tags, setTagsList] = useState<Tag[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [thread, setThread] = useState<Msg[]>([]);
  const [conv, setConv] = useState<Conv | null>(null);
  const [busca, setBusca] = useState("");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement | null>(null);

  async function refreshList() {
    const c = (await fetchList()) as Conv[];
    setConvs(c);
    return c;
  }

  useEffect(() => {
    (async () => {
      const c = await refreshList();
      setTagsList((await fetchTags()) as Tag[]);
      // Sem conversas ainda? A lista fica vazia mesmo. Nada de criar
      // conversa fictícia no banco real.
      setSelected(c[0]?.id ?? null);
      setLoading(false);
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected) return;
    (async () => {
      const r = await fetchThread({ data: { id: selected } });
      setThread((r?.messages ?? []) as Msg[]);
      setConv((r?.conversation ?? null) as Conv | null);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
    })();
  }, [selected, fetchThread]);

  const filtered = useMemo(
    () =>
      convs.filter((c) =>
        `${c.nome ?? ""} ${c.telefone}`
          .toLowerCase()
          .includes(busca.toLowerCase()),
      ),
    [convs, busca],
  );

  async function handleSend() {
    if (!selected || !texto.trim() || enviando) return;
    setEnviando(true);
    try {
      await send({
        data: { conversationId: selected, conteudo: texto.trim() },
      });
      setTexto("");
      const r = await fetchThread({ data: { id: selected } });
      setThread((r?.messages ?? []) as Msg[]);
      setConv((r?.conversation ?? null) as Conv | null);
      await refreshList();
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
    } finally {
      setEnviando(false);
    }
  }

  async function toggleMode() {
    if (!conv) return;
    const novo = conv.modo === "ia" ? "humano" : "ia";
    await changeMode({ data: { id: conv.id, modo: novo } });
    setConv({ ...conv, modo: novo });
  }

  async function marcarResolvido() {
    if (!conv) return;
    await changeStatus({ data: { id: conv.id, status: "resolvido" } });
    setConv({ ...conv, status: "resolvido" });
    await refreshList();
  }

  async function addNewTag() {
    const nome = window.prompt("Nome da etiqueta");
    if (!nome) return;
    const cores = ["#2C6FEA", "#E85D75", "#F2C14E", "#0B2A4A", "#48A386"];
    const cor = cores[Math.floor(Math.random() * cores.length)];
    await newTag({ data: { nome, cor } });
    setTagsList((await fetchTags()) as Tag[]);
  }

  async function toggleTag(tagId: string) {
    if (!conv) return;
    const has = conv.tags.includes(tagId);
    const next = has ? conv.tags.filter((t) => t !== tagId) : [...conv.tags, tagId];
    await setTags({ data: { id: conv.id, tags: next } });
    setConv({ ...conv, tags: next });
    await refreshList();
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-6 animate-spin text-[#0B2A4A]" />
      </div>
    );
  }

  return (
    <div>
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#B8974D]">
          CRM · WhatsApp
        </p>
        <h1
          className="mt-1 text-3xl italic text-[#0B2A4A]"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          Conversas com leads
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr_260px]">
        {/* Lista */}
        <div className="rounded-2xl border border-[#E5DBC3] bg-white/70">
          <div className="flex items-center gap-2 border-b border-[#E5DBC3] px-3">
            <Search className="size-4 text-[#8A7C5C]" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar"
              className="flex-1 bg-transparent py-3 text-sm outline-none"
            />
          </div>
          <div className="max-h-[70vh] overflow-y-auto">
            {filtered.map((c) => {
              const active = selected === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={[
                    "block w-full border-b border-[#E5DBC3] px-3 py-3 text-left transition-colors",
                    active ? "bg-[#EFE5CE]" : "hover:bg-[#F7F2E8]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-bold text-[#0B2A4A]">
                      {c.nome || c.telefone}
                    </p>
                    {c.nao_lidas > 0 && (
                      <span className="rounded-full bg-[#E85D75] px-1.5 text-[10px] font-bold text-white">
                        {c.nao_lidas}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[#8A7C5C]">
                    {c.ultima_mensagem || "—"}
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="rounded-full bg-[#0B2A4A]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#0B2A4A]">
                      {c.app_context}
                    </span>
                    <span
                      className={[
                        "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                        c.modo === "ia"
                          ? "bg-[#B8974D]/20 text-[#8A6D2A]"
                          : "bg-[#2C6FEA]/15 text-[#2C6FEA]",
                      ].join(" ")}
                    >
                      {c.modo}
                    </span>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="p-6 text-center text-xs text-[#8A7C5C]">
                Nenhuma conversa.
              </p>
            )}
          </div>
        </div>

        {/* Thread */}
        <div className="flex min-h-[70vh] flex-col rounded-2xl border border-[#E5DBC3] bg-white/70">
          {conv ? (
            <>
              <div className="flex items-center justify-between border-b border-[#E5DBC3] px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-[#0B2A4A]">
                    {conv.nome || conv.telefone}
                  </p>
                  <p className="text-[11px] text-[#8A7C5C]">{conv.telefone}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={toggleMode}
                    className="flex items-center gap-1.5 rounded-full border border-[#E5DBC3] bg-white px-3 py-1 text-xs font-bold text-[#0B2A4A]"
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
                    className="flex items-center gap-1.5 rounded-full bg-[#0B2A4A] px-3 py-1 text-xs font-bold text-[#F7F2E8]"
                  >
                    <CheckCircle2 className="size-3.5" /> Resolver
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {thread.map((m) => {
                  const mine = m.direcao === "out";
                  return (
                    <div
                      key={m.id}
                      className={mine ? "flex justify-end" : "flex justify-start"}
                    >
                      <div
                        className={[
                          "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                          mine
                            ? m.autor === "ia"
                              ? "bg-[#B8974D]/25 text-[#0B2A4A]"
                              : "bg-[#0B2A4A] text-[#F7F2E8]"
                            : "bg-[#F7F2E8] text-[#0B2A4A]",
                        ].join(" ")}
                      >
                        {mine && m.autor === "ia" && (
                          <p className="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-70">
                            <Bot className="size-3" /> IA
                          </p>
                        )}
                        <p className="whitespace-pre-wrap">{m.conteudo}</p>
                        {m.status === "falhou" && (
                          <p className="mt-1 text-[10px] font-bold text-red-500">
                            envio falhou
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              <div className="border-t border-[#E5DBC3] p-3">
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
                    rows={2}
                    placeholder="Escreva como Gabriela..."
                    className="flex-1 resize-none rounded-xl border border-[#E5DBC3] bg-white p-3 text-sm outline-none focus:border-[#B8974D]"
                  />
                  <button
                    onClick={handleSend}
                    disabled={enviando || !texto.trim()}
                    className="flex size-11 items-center justify-center rounded-xl bg-[#0B2A4A] text-[#F7F2E8] disabled:opacity-40"
                  >
                    {enviando ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center text-sm text-[#8A7C5C]">
              Selecione uma conversa
            </div>
          )}
        </div>

        {/* Etiquetas */}
        <div className="rounded-2xl border border-[#E5DBC3] bg-white/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8A7C5C]">
              <TagIcon className="size-3.5" /> Etiquetas
            </p>
            <button
              onClick={addNewTag}
              className="flex items-center gap-1 rounded-full bg-[#EFE5CE] px-2 py-0.5 text-xs font-bold text-[#0B2A4A]"
            >
              <Plus className="size-3" /> nova
            </button>
          </div>
          <div className="space-y-1.5">
            {tags.map((t) => {
              const active = conv?.tags.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTag(t.id)}
                  className={[
                    "flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs",
                    active
                      ? "border-[#0B2A4A] bg-[#0B2A4A]/5 font-bold text-[#0B2A4A]"
                      : "border-[#E5DBC3] text-[#3E4F65]",
                  ].join(" ")}
                >
                  <span
                    className="size-3 rounded-full"
                    style={{ background: t.cor }}
                  />
                  {t.nome}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
