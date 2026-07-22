import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Wifi,
  WifiOff,
  Save,
  Loader2,
  MessageCircle,
  Bot,
  Palette,
  Webhook,
  Copy,
} from "lucide-react";
import {
  getEvolutionConfig,
  salvarEvolutionConfig,
  testarEvolution,
  getWhatsAppLogs,
} from "@/lib/admin-evolution.functions";
import {
  getAppSettings,
  setAppSetting,
} from "@/lib/settings.functions";

export const Route = createFileRoute("/admin/configuracoes")({
  component: ConfigPage,
});

type Tab = "evolution" | "ia" | "marca" | "tecnico";

function ConfigPage() {
  const [tab, setTab] = useState<Tab>("evolution");

  return (
    <div>
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#B8974D]">
          Sistema
        </p>
        <h1
          className="mt-1 text-3xl italic text-[#0B2A4A]"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          Configurações
        </h1>
      </header>

      <div className="flex gap-1 overflow-x-auto border-b border-[#E5DBC3]">
        <TabBtn active={tab === "evolution"} onClick={() => setTab("evolution")} icon={MessageCircle}>
          Evolution (WhatsApp)
        </TabBtn>
        <TabBtn active={tab === "ia"} onClick={() => setTab("ia")} icon={Bot}>
          IA & Automação
        </TabBtn>
        <TabBtn active={tab === "marca"} onClick={() => setTab("marca")} icon={Palette}>
          Marca
        </TabBtn>
        <TabBtn active={tab === "tecnico"} onClick={() => setTab("tecnico")} icon={Webhook}>
          Técnico
        </TabBtn>
      </div>

      <div className="mt-6">
        {tab === "evolution" && <EvolutionTab />}
        {tab === "ia" && <IATab />}
        {tab === "marca" && <MarcaTab />}
        {tab === "tecnico" && <TecnicoTab />}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
        active
          ? "border-[#0B2A4A] text-[#0B2A4A]"
          : "border-transparent text-[#8A7C5C] hover:text-[#0B2A4A]",
      ].join(" ")}
    >
      <Icon className="size-4" />
      {children}
    </button>
  );
}

// ===== EVOLUTION =====
function EvolutionTab() {
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
        setLogs((await fetchLogs()) as typeof logs);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchCfg, fetchLogs]);

  if (loading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2 className="size-6 animate-spin text-[#0B2A4A]" />
      </div>
    );
  }

  const conectado = status?.ok && status?.state === "open";
  const missing = !hasEnv.url || !hasEnv.key || !hasEnv.instance;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-[#E5DBC3] bg-white/70 p-5">
        <div className="flex items-center gap-3">
          {conectado ? (
            <div className="grid size-10 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <Wifi className="size-5" />
            </div>
          ) : (
            <div className="grid size-10 place-items-center rounded-full bg-red-100 text-red-600">
              <WifiOff className="size-5" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm font-bold text-[#0B2A4A]">
              {conectado ? "Conectado" : missing ? "Aguardando configuração" : "Desconectado"}
            </p>
            <p className="text-xs text-[#8A7C5C]">
              {status?.state ? `Estado: ${status.state}` : status?.error ?? "Sem status"}
            </p>
          </div>
          <button
            onClick={async () => {
              setTesting(true);
              try {
                setStatus(await testar());
              } finally {
                setTesting(false);
              }
            }}
            disabled={testing || missing}
            className="rounded-xl border border-[#E5DBC3] bg-white px-3 py-2 text-sm font-semibold text-[#0B2A4A] disabled:opacity-40"
          >
            {testing ? "Testando..." : "Testar"}
          </button>
        </div>

        <div className="mt-5 space-y-2 border-t border-[#E5DBC3] pt-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8A7C5C]">
            Segredos do servidor
          </p>
          <SecretRow label="EVOLUTION_API_URL" ok={hasEnv.url} />
          <SecretRow label="EVOLUTION_API_KEY" ok={hasEnv.key} />
          <SecretRow label="EVOLUTION_INSTANCE" ok={hasEnv.instance} />
          {missing && (
            <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              <p className="font-bold">Como conectar:</p>
              <ol className="mt-1 list-decimal space-y-0.5 pl-4">
                <li>Suba uma instância do Evolution API (ou contrate um provedor).</li>
                <li>Gere uma API Key e escolha um nome de instância.</li>
                <li>Peça no chat: "configurar Evolution" — abro o formulário seguro para os 3 valores.</li>
                <li>Escaneie o QR Code pelo painel da instância.</li>
              </ol>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5DBC3] bg-white/70 p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#8A7C5C]">
          Referências (anotações)
        </p>
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-[#8A7C5C]">URL base</span>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://evo.seu-servidor.com"
              className="mt-1 w-full rounded-xl border border-[#E5DBC3] bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#8A7C5C]">Instância</span>
            <input
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="zerolipedema"
              className="mt-1 w-full rounded-xl border border-[#E5DBC3] bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>
        <button
          onClick={async () => {
            setSaving(true);
            try {
              await saveCfg({ data: { baseUrl, instanceName } });
            } finally {
              setSaving(false);
            }
          }}
          disabled={saving}
          className="mt-4 flex items-center gap-2 rounded-xl bg-[#0B2A4A] px-4 py-2 text-sm font-bold text-[#F7F2E8] disabled:opacity-60"
        >
          <Save className="size-4" /> {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      <div className="lg:col-span-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#8A7C5C]">
          Últimos envios ({logs.length})
        </p>
        <div className="mt-3 space-y-2">
          {logs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#E5DBC3] p-6 text-center text-sm text-[#8A7C5C]">
              Nenhum envio ainda.
            </div>
          )}
          {logs.map((l) => (
            <div
              key={l.id}
              className="rounded-xl border border-[#E5DBC3] bg-white/70 p-3 text-sm"
            >
              <div className="flex items-center justify-between text-xs text-[#8A7C5C]">
                <span>{l.telefone}</span>
                <span
                  className={
                    l.status === "enviado" ? "text-emerald-600" : "text-red-500"
                  }
                >
                  {l.status}
                </span>
              </div>
              <p className="mt-1 line-clamp-2">{l.mensagem}</p>
              {l.erro && (
                <p className="mt-1 text-xs text-red-500">{l.erro}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SecretRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center justify-between rounded-lg bg-[#FBF6EB] px-3 py-1.5 text-sm">
      <code className="font-mono text-xs">{label}</code>
      <span
        className={[
          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
          ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
        ].join(" ")}
      >
        {ok ? "definido" : "faltando"}
      </span>
    </li>
  );
}

// ===== IA =====
function IATab() {
  const fetchS = useServerFn(getAppSettings);
  const saveS = useServerFn(setAppSetting);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tomIA, setTomIA] = useState("");
  const [respostaAuto, setRespostaAuto] = useState(true);
  const [horario, setHorario] = useState({ inicio: "08:00", fim: "20:00" });

  useEffect(() => {
    (async () => {
      const s = (await fetchS({ data: { app_key: "ia" } })) as Record<
        string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any
      >;
      setTomIA(s.tom ?? "Acolhedora, técnica, direta. Como uma nutricionista experiente conversando por WhatsApp.");
      setRespostaAuto(s.resposta_auto ?? true);
      setHorario(s.horario ?? { inicio: "08:00", fim: "20:00" });
      setLoading(false);
    })();
  }, [fetchS]);

  async function salvar() {
    setSaving(true);
    try {
      await Promise.all([
        saveS({ data: { app_key: "ia", setting_key: "tom", value: tomIA } }),
        saveS({
          data: { app_key: "ia", setting_key: "resposta_auto", value: respostaAuto },
        }),
        saveS({ data: { app_key: "ia", setting_key: "horario", value: horario } }),
      ]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2 className="size-6 animate-spin text-[#0B2A4A]" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-[#E5DBC3] bg-white/70 p-5">
        <p className="text-sm font-bold text-[#0B2A4A]">
          Tom e personalidade da IA
        </p>
        <p className="text-xs text-[#8A7C5C]">
          Instruções que a IA usa em todas as respostas do WhatsApp.
        </p>
        <textarea
          value={tomIA}
          onChange={(e) => setTomIA(e.target.value)}
          rows={6}
          className="mt-3 w-full resize-none rounded-xl border border-[#E5DBC3] bg-white p-3 text-sm outline-none focus:border-[#B8974D]"
        />
      </div>
      <div className="rounded-2xl border border-[#E5DBC3] bg-white/70 p-5">
        <p className="text-sm font-bold text-[#0B2A4A]">Comportamento</p>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={respostaAuto}
            onChange={(e) => setRespostaAuto(e.target.checked)}
          />
          IA responde automaticamente perguntas abertas
        </label>
        <div className="mt-4">
          <p className="text-xs font-semibold text-[#8A7C5C]">
            Horário para disparos automáticos
          </p>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="time"
              value={horario.inicio}
              onChange={(e) => setHorario({ ...horario, inicio: e.target.value })}
              className="rounded-lg border border-[#E5DBC3] px-2 py-1 text-sm"
            />
            <span className="text-sm text-[#8A7C5C]">até</span>
            <input
              type="time"
              value={horario.fim}
              onChange={(e) => setHorario({ ...horario, fim: e.target.value })}
              className="rounded-lg border border-[#E5DBC3] px-2 py-1 text-sm"
            />
          </div>
        </div>
      </div>
      <div className="lg:col-span-2">
        <button
          onClick={salvar}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[#0B2A4A] px-4 py-2 text-sm font-bold text-[#F7F2E8] disabled:opacity-60"
        >
          <Save className="size-4" /> {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}

// ===== MARCA =====
function MarcaTab() {
  const fetchS = useServerFn(getAppSettings);
  const saveS = useServerFn(setAppSetting);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nomeGabi, setNomeGabi] = useState("Gabriela Rosado");
  const [crn, setCrn] = useState("CRN 10582");
  const [waNumero, setWaNumero] = useState("");

  useEffect(() => {
    (async () => {
      const s = (await fetchS({ data: { app_key: "marca" } })) as Record<
        string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any
      >;
      if (s.nome_profissional) setNomeGabi(s.nome_profissional);
      if (s.crn) setCrn(s.crn);
      if (s.whatsapp) setWaNumero(s.whatsapp);
      setLoading(false);
    })();
  }, [fetchS]);

  async function salvar() {
    setSaving(true);
    try {
      await Promise.all([
        saveS({
          data: { app_key: "marca", setting_key: "nome_profissional", value: nomeGabi },
        }),
        saveS({ data: { app_key: "marca", setting_key: "crn", value: crn } }),
        saveS({
          data: { app_key: "marca", setting_key: "whatsapp", value: waNumero },
        }),
      ]);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2 className="size-6 animate-spin text-[#0B2A4A]" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#E5DBC3] bg-white/70 p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-[#8A7C5C]">
            Nome profissional
          </span>
          <input
            value={nomeGabi}
            onChange={(e) => setNomeGabi(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E5DBC3] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-[#8A7C5C]">Registro</span>
          <input
            value={crn}
            onChange={(e) => setCrn(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[#E5DBC3] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs font-semibold text-[#8A7C5C]">
            WhatsApp público (aparece nos CTAs)
          </span>
          <input
            value={waNumero}
            onChange={(e) => setWaNumero(e.target.value)}
            placeholder="+5511999999999"
            className="mt-1 w-full rounded-xl border border-[#E5DBC3] bg-white px-3 py-2 text-sm"
          />
        </label>
      </div>
      <button
        onClick={salvar}
        disabled={saving}
        className="mt-4 flex items-center gap-2 rounded-xl bg-[#0B2A4A] px-4 py-2 text-sm font-bold text-[#F7F2E8] disabled:opacity-60"
      >
        <Save className="size-4" /> {saving ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}

// ===== TECNICO =====
function TecnicoTab() {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/public/webhooks/evolution`
      : "/api/public/webhooks/evolution";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-[#E5DBC3] bg-white/70 p-5">
        <p className="text-sm font-bold text-[#0B2A4A]">Webhook Evolution</p>
        <p className="text-xs text-[#8A7C5C]">
          Cole esta URL na configuração da sua instância Evolution para receber
          as mensagens dos leads no CRM.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#0B2A4A] p-3 font-mono text-xs text-[#F7F2E8]">
          <span className="flex-1 truncate">{url}</span>
          <button
            onClick={() => navigator.clipboard.writeText(url)}
            className="rounded-lg bg-[#F7F2E8]/10 p-1 hover:bg-[#F7F2E8]/20"
          >
            <Copy className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5DBC3] bg-white/70 p-5">
        <p className="text-sm font-bold text-[#0B2A4A]">Ambiente</p>
        <ul className="mt-3 space-y-1 text-xs text-[#3E4F65]">
          <li>• Backend: Lovable Cloud</li>
          <li>• IA: Lovable AI Gateway (Gemini)</li>
          <li>• Framework: TanStack Start</li>
        </ul>
      </div>
    </div>
  );
}
