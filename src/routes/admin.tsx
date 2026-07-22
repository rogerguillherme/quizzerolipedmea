import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  BarChart3,
  Users,
  AlertTriangle,
  LogOut,
  Filter,
  MessageCircle,
  Send,
  Search,
  Loader2,
  Wifi,
  WifiOff,
  Save,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getEvents,
  getLeads,
  getEscalations,
  saveEscalations,
  seedAdminDemoIfEmpty,
  type Lead,
  type LeadStatus,
} from "../lib/analytics";
import {
  getEvolutionConfig,
  salvarEvolutionConfig,
  testarEvolution,
  getWhatsAppLogs,
} from "../lib/admin-evolution.functions";

export const Route = createFileRoute("/admin")({
  component: Admin,
  head: () => ({
    meta: [
      { title: "Painel · Gabriela · Zero Lipedema" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function Admin() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<"funil" | "leads" | "fila" | "wa">("funil");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!data.session) {
        navigate({ to: "/auth" });
        return;
      }
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!role) {
        await supabase.auth.signOut();
        navigate({ to: "/auth" });
        return;
      }
      seedAdminDemoIfEmpty();
      setChecking(false);
    })();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sapphire-600">
              Painel interno · não exposto às usuárias
            </p>
            <p className="text-lg font-extrabold text-primary">Zero Lipedema</p>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-primary"
          >
            <LogOut className="size-4" /> Sair
          </button>
        </div>
        <nav className="mx-auto flex max-w-4xl gap-1 px-5 pb-2">
          <TabBtn active={tab === "funil"} onClick={() => setTab("funil")}>
            <BarChart3 className="size-4" /> Funil
          </TabBtn>
          <TabBtn active={tab === "leads"} onClick={() => setTab("leads")}>
            <Users className="size-4" /> Leads
          </TabBtn>
          <TabBtn active={tab === "fila"} onClick={() => setTab("fila")}>
            <AlertTriangle className="size-4" /> Fila{" "}
            <FilaBadge />
          </TabBtn>
          <TabBtn active={tab === "wa"} onClick={() => setTab("wa")}>
            <MessageCircle className="size-4" /> WhatsApp
          </TabBtn>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-6">
        {tab === "funil" && <FunnelView />}
        {tab === "leads" && <LeadsView />}
        {tab === "fila" && <FilaView />}
        {tab === "wa" && <WhatsAppView />}
      </main>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-2 text-sm font-semibold transition-colors",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-primary",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function FilaBadge() {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(getEscalations().filter((e) => !e.respondido).length);
  }, []);
  if (!n) return null;
  return (
    <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-coral px-1.5 text-[10px] font-bold text-coral-foreground">
      {n}
    </span>
  );
}


// ---------- Funnel ---------------------------------------------------------

function FunnelView() {
  const events = useMemo(() => getEvents(), []);

  const counts: Record<string, number> = {};
  for (const e of events) counts[e.name] = (counts[e.name] || 0) + 1;

  const steps: { key: string; label: string }[] = [
    { key: "landing_view", label: "Abriu o link" },
    { key: "quiz_started", label: "Iniciou o Mapa" },
    { key: "quiz_completed", label: "Completou o Mapa" },
    { key: "checkout_view", label: "Chegou ao checkout" },
    { key: "purchase_completed", label: "Comprou o Desafio" },
    { key: "bump_activated", label: "Ativou o bônus" },
    { key: "challenge_completed", label: "Completou o Desafio" },
    { key: "derma_upgrade_clicked", label: "Interesse Método Derma" },
  ];

  const top = counts[steps[0].key] || 1;

  return (
    <div>
      <h2 className="text-lg font-extrabold text-primary">Funil de conversão</h2>
      <p className="text-sm text-muted-foreground">
        Cada etapa registrada em cima do lead/telefone. Use para ver onde as pessoas desistem.
      </p>

      <div className="mt-5 space-y-2">
        {steps.map((s, i) => {
          const n = counts[s.key] || 0;
          const pctTotal = Math.round((n / top) * 100);
          const prev = i > 0 ? counts[steps[i - 1].key] || 0 : 0;
          const conv = i > 0 && prev > 0 ? Math.round((n / prev) * 100) : null;
          return (
            <div key={s.key} className="card-clinical p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-primary">{s.label}</span>
                <span className="tabular-nums font-bold text-primary">
                  {n}
                  {conv !== null && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      · {conv}% da etapa anterior
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sapphire-100">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pctTotal}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPI label="Conversão landing → compra" value={rate(counts.purchase_completed, counts.landing_view)} />
        <KPI label="Conversão Mapa → checkout" value={rate(counts.checkout_view, counts.quiz_completed)} />
        <KPI label="Ativação de bump" value={rate(counts.bump_activated, counts.purchase_completed)} />
        <KPI label="Upgrade Derma" value={rate(counts.derma_upgrade_clicked, counts.challenge_completed)} />
      </div>
    </div>
  );
}

function rate(a?: number, b?: number) {
  if (!a || !b) return "—";
  return `${Math.round((a / b) * 100)}%`;
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-clinical p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-extrabold text-primary tabular-nums">{value}</p>
    </div>
  );
}

// ---------- Leads ----------------------------------------------------------

const STATUS_LABELS: Record<LeadStatus, string> = {
  mapa_iniciado: "Mapa iniciado",
  mapa_completo: "Mapa completo",
  checkout: "No checkout",
  desafio_ativo: "Desafio ativo",
  desafio_parado: "Parada há dias",
  desafio_completo: "Desafio completo",
  reembolso: "Pediu reembolso",
  metodo_derma: "Método Derma",
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  mapa_iniciado: "bg-sapphire-100 text-sapphire-800",
  mapa_completo: "bg-sapphire-100 text-sapphire-800",
  checkout: "bg-gold/20 text-primary",
  desafio_ativo: "bg-coral-soft text-primary",
  desafio_parado: "bg-destructive/10 text-destructive",
  desafio_completo: "bg-primary text-primary-foreground",
  reembolso: "bg-destructive/15 text-destructive",
  metodo_derma: "bg-gold/30 text-primary",
};

function LeadsView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filtro, setFiltro] = useState<"todos" | LeadStatus>("todos");
  const [busca, setBusca] = useState("");

  useEffect(() => setLeads(getLeads()), []);

  const filtered = leads.filter((l) => {
    if (filtro !== "todos" && l.status !== filtro) return false;
    if (busca && !`${l.nome} ${l.telefone}`.toLowerCase().includes(busca.toLowerCase()))
      return false;
    return true;
  });

  const filtros: ("todos" | LeadStatus)[] = [
    "todos",
    "desafio_ativo",
    "desafio_parado",
    "reembolso",
    "metodo_derma",
  ];

  return (
    <div>
      <h2 className="text-lg font-extrabold text-primary">Leads</h2>
      <p className="text-sm text-muted-foreground">
        {leads.length} pessoas no sistema · última atualização em tempo real
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card px-3">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou telefone"
          className="flex-1 bg-transparent py-2 text-sm outline-none"
        />
      </div>

      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="size-4 shrink-0 text-muted-foreground" />
        {filtros.map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={[
              "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              filtro === f
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground",
            ].join(" ")}
          >
            {f === "todos" ? "Todos" : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="mt-4 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {filtered.map((l) => (
          <div key={l.id} className="grid grid-cols-[1fr_auto] items-center gap-3 p-4">
            <div>
              <p className="font-semibold text-primary">{l.nome}</p>
              <p className="text-xs text-muted-foreground">
                {l.telefone}
                {l.diaDesafio ? ` · Dia ${l.diaDesafio}/7` : ""}
                {l.bump ? " · com bump" : ""}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Última atividade {relTime(l.ultimaAtividade)}
              </p>
            </div>
            <span
              className={[
                "rounded-full px-2.5 py-1 text-[11px] font-bold",
                STATUS_COLORS[l.status],
              ].join(" ")}
            >
              {STATUS_LABELS[l.status]}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nada por aqui com esse filtro.
          </div>
        )}
      </div>
    </div>
  );
}

function relTime(ts: number) {
  const diff = Date.now() - ts;
  const h = Math.round(diff / 3_600_000);
  if (h < 1) return "há minutos";
  if (h < 24) return `há ${h}h`;
  const d = Math.round(h / 24);
  return `há ${d}d`;
}

// ---------- Fila de escalonamento -----------------------------------------

function FilaView() {
  const [list, setList] = useState(() => getEscalations());
  const [resposta, setResposta] = useState<Record<string, string>>({});

  const pendentes = list
    .filter((e) => !e.respondido)
    .sort((a, b) => a.createdAt - b.createdAt);
  const respondidas = list.filter((e) => e.respondido);

  function responder(id: string) {
    const texto = (resposta[id] || "").trim();
    if (!texto) return;
    const next = list.map((e) =>
      e.id === id ? { ...e, respondido: true, resposta: texto } : e,
    );
    setList(next);
    saveEscalations(next);
    setResposta((r) => ({ ...r, [id]: "" }));
  }

  return (
    <div>
      <h2 className="text-lg font-extrabold text-primary">Fila de escalonamento</h2>
      <p className="text-sm text-muted-foreground">
        Mensagens que a IA não conseguiu responder. Ordenadas pelas mais antigas primeiro.
        Sua resposta vai direto pelo WhatsApp — sem abrir o Business.
      </p>

      <div className="mt-5 space-y-3">
        {pendentes.length === 0 && (
          <div className="card-clinical p-6 text-center text-sm text-muted-foreground">
            Tudo em dia por aqui. A IA está dando conta.
          </div>
        )}
        {pendentes.map((e) => (
          <div key={e.id} className="card-clinical p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-primary">{e.leadNome}</p>
                <p className="text-xs text-muted-foreground">
                  {e.leadTelefone} · {relTime(e.createdAt)}
                </p>
              </div>
              <span className="rounded-full bg-coral-soft px-2 py-0.5 text-[10px] font-bold text-primary">
                Pendente
              </span>
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-muted p-3 text-sm text-foreground">
              <MessageCircle className="mt-0.5 size-4 shrink-0 text-sapphire-600" />
              <p>{e.pergunta}</p>
            </div>
            <textarea
              value={resposta[e.id] || ""}
              onChange={(ev) => setResposta((r) => ({ ...r, [e.id]: ev.target.value }))}
              rows={3}
              placeholder="Responder como Gabriela — vai como mensagem no WhatsApp da lead."
              className="mt-3 w-full rounded-xl border border-input bg-card p-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring"
            />
            <div className="mt-2 flex items-center justify-end">
              <button
                onClick={() => responder(e.id)}
                disabled={!resposta[e.id]?.trim()}
                className="flex items-center gap-2 rounded-xl bg-coral px-4 py-2 text-sm font-bold text-coral-foreground disabled:opacity-40"
              >
                <Send className="size-4" /> Enviar pelo WhatsApp
              </button>
            </div>
          </div>
        ))}
      </div>

      {respondidas.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Recentes respondidas ({respondidas.length})
          </p>
          <div className="mt-2 space-y-2">
            {respondidas.slice(-5).reverse().map((e) => (
              <div key={e.id} className="rounded-xl border border-border bg-card p-3">
                <p className="text-sm font-semibold text-primary">{e.leadNome}</p>
                <p className="mt-1 text-xs text-muted-foreground">{e.pergunta}</p>
                <p className="mt-2 rounded-lg bg-sapphire-50 p-2 text-sm text-foreground">
                  ↳ {e.resposta}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- WhatsApp (Evolution) ------------------------------------------

function WhatsAppView() {
  const fetchCfg = useServerFn(getEvolutionConfig);
  const saveCfg = useServerFn(salvarEvolutionConfig);
  const testar = useServerFn(testarEvolution);
  const fetchLogs = useServerFn(getWhatsAppLogs);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [instanceName, setInstanceName] = useState("");
  const [status, setStatus] = useState<{
    ok: boolean;
    state?: string;
    error?: string;
    configured?: boolean;
  } | null>(null);
  const [hasEnv, setHasEnv] = useState({ url: false, key: false, instance: false });
  const [logs, setLogs] = useState<
    Array<{
      id: string;
      telefone: string;
      mensagem: string;
      status: string;
      erro: string | null;
      created_at: string;
    }>
  >([]);

  useEffect(() => {
    (async () => {
      try {
        const cfg = await fetchCfg();
        setBaseUrl(cfg.baseUrl ?? "");
        setInstanceName(cfg.instanceName ?? "");
        setStatus(cfg.status);
        setHasEnv({ url: cfg.hasUrl, key: cfg.hasKey, instance: cfg.hasInstance });
        const l = await fetchLogs();
        setLogs(l as typeof logs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchCfg, fetchLogs]);

  async function handleSalvar() {
    setSaving(true);
    try {
      await saveCfg({ data: { baseUrl, instanceName } });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestar() {
    setTesting(true);
    try {
      const s = await testar();
      setStatus(s);
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const conectado = status?.ok && status?.state === "open";
  const missingEnv = !hasEnv.url || !hasEnv.key || !hasEnv.instance;

  return (
    <div>
      <h2 className="text-lg font-extrabold text-primary">Evolution API · WhatsApp</h2>
      <p className="text-sm text-muted-foreground">
        Conexão usada para enviar login e senha aos leads assim que o Mapa é gerado.
      </p>

      {/* Status */}
      <div className="card-clinical mt-5 p-5">
        <div className="flex items-center gap-3">
          {conectado ? (
            <div className="grid size-10 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Wifi className="size-5" />
            </div>
          ) : (
            <div className="grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive">
              <WifiOff className="size-5" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-bold text-primary">
              {conectado ? "Conectado" : "Desconectado"}
            </p>
            <p className="text-xs text-muted-foreground">
              {status?.state ? `Estado: ${status.state}` : status?.error ?? "Sem status"}
            </p>
          </div>
          <button
            onClick={handleTestar}
            disabled={testing}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-primary disabled:opacity-60"
          >
            {testing ? "Testando..." : "Testar conexão"}
          </button>
        </div>
      </div>

      {/* Secrets */}
      <div className="card-clinical mt-4 p-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-sapphire-600">
          Segredos do servidor
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Configure na área de secrets do projeto. Nunca são expostos ao navegador.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          <SecretRow label="EVOLUTION_API_URL" ok={hasEnv.url} />
          <SecretRow label="EVOLUTION_API_KEY" ok={hasEnv.key} />
          <SecretRow label="EVOLUTION_INSTANCE" ok={hasEnv.instance} />
        </ul>
        {missingEnv && (
          <p className="mt-3 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-800">
            Peça pra configurar os 3 segredos acima antes de tentar enviar mensagens.
          </p>
        )}
      </div>

      {/* Config editável */}
      <div className="card-clinical mt-4 p-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-sapphire-600">
          Referências (apenas anotação)
        </p>
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">
              URL base (referência visual)
            </span>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://evo.seu-servidor.com"
              className="mt-1 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">
              Nome da instância
            </span>
            <input
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="zerolipedema"
              className="mt-1 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
        </div>
        <button
          onClick={handleSalvar}
          disabled={saving}
          className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          <Save className="size-4" /> {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      {/* Logs */}
      <div className="mt-6">
        <p className="text-[11px] font-bold uppercase tracking-wide text-sapphire-600">
          Últimos envios ({logs.length})
        </p>
        <div className="mt-3 space-y-2">
          {logs.length === 0 && (
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              Ainda não há mensagens enviadas.
            </p>
          )}
          {logs.map((l) => (
            <div key={l.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-primary">{l.telefone}</span>
                <span
                  className={
                    l.status === "enviado"
                      ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-700"
                      : "rounded-full bg-destructive/10 px-2 py-0.5 text-destructive"
                  }
                >
                  {l.status}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                {l.mensagem.slice(0, 160)}
                {l.mensagem.length > 160 ? "…" : ""}
              </p>
              {l.erro && (
                <p className="mt-1 text-[11px] text-destructive">Erro: {l.erro}</p>
              )}
              <p className="mt-1 text-[10px] text-muted-foreground">
                {new Date(l.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SecretRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
      <code className="text-xs">{label}</code>
      <span
        className={
          ok
            ? "rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-700"
            : "rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive"
        }
      >
        {ok ? "configurado" : "ausente"}
      </span>
    </li>
  );
}
