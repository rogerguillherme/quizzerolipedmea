import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Plus,
  Save,
  Trash2,
  MessageSquare,
  Clock,
  Bot,
  SplitSquareVertical,
  Tag as TagIcon,
  Loader2,
  Power,
  PowerOff,
  GitBranch,
} from "lucide-react";
import {
  listFunnels,
  saveFunnel,
  deleteFunnel,
} from "@/lib/funnels.functions";
import { MERGE_TAGS, applyMergeTags } from "@/lib/merge-tags";
import { useRef } from "react";

export const Route = createFileRoute("/admin/funis")({
  component: FunilPage,
});

type StepTipo = "mensagem" | "espera" | "gatilho_ia" | "condicao" | "tag";

type Step = {
  id: string;
  tipo: StepTipo;
  texto?: string;
  espera_min?: number;
  ia_prompt?: string;
  condicao_campo?: string;
  condicao_valor?: string;
  tag_id?: string;
};

type Funnel = {
  id?: string;
  nome: string;
  descricao?: string;
  app_key: "mapa" | "protocolo" | "derma";
  gatilho_tipo: "manual" | "mapa_completo" | "tag" | "dia_desafio";
  gatilho_valor?: string;
  ativo: boolean;
  steps: Step[];
};

type IconCmp = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

const STEP_META: Record<
  StepTipo,
  { icon: IconCmp; label: string; cor: string }
> = {
  mensagem: { icon: MessageSquare, label: "Mensagem", cor: "#2C6FEA" },
  espera: { icon: Clock, label: "Espera", cor: "#F2C14E" },
  gatilho_ia: { icon: Bot, label: "Resposta da IA", cor: "#B8974D" },
  condicao: { icon: SplitSquareVertical, label: "Condição", cor: "#E85D75" },
  tag: { icon: TagIcon, label: "Adicionar etiqueta", cor: "#48A386" },
};

function FunilPage() {
  const fetchFunnels = useServerFn(listFunnels);
  const save = useServerFn(saveFunnel);
  const del = useServerFn(deleteFunnel);

  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Funnel | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const list = (await fetchFunnels()) as unknown as Funnel[];
    setFunnels(list);
  }

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function novoFunil() {
    setEditing({
      nome: "Novo funil",
      descricao: "",
      app_key: "mapa",
      gatilho_tipo: "manual",
      gatilho_valor: "",
      ativo: true,
      steps: [{ id: crypto.randomUUID(), tipo: "mensagem", texto: "" }],
    });
  }

  async function salvar() {
    if (!editing) return;
    setSaving(true);
    try {
      await save({ data: editing });
      await refresh();
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  async function remover(id: string) {
    if (!window.confirm("Excluir este funil?")) return;
    await del({ data: { id } });
    await refresh();
    if (editing?.id === id) setEditing(null);
  }

  function addStep(tipo: StepTipo) {
    if (!editing) return;
    const novo: Step = { id: crypto.randomUUID(), tipo };
    if (tipo === "espera") novo.espera_min = 60;
    setEditing({ ...editing, steps: [...editing.steps, novo] });
  }
  function updateStep(id: string, patch: Partial<Step>) {
    if (!editing) return;
    setEditing({
      ...editing,
      steps: editing.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  }
  function removeStep(id: string) {
    if (!editing) return;
    setEditing({ ...editing, steps: editing.steps.filter((s) => s.id !== id) });
  }
  function moveStep(id: string, delta: -1 | 1) {
    if (!editing) return;
    const idx = editing.steps.findIndex((s) => s.id === id);
    const next = [...editing.steps];
    const target = idx + delta;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setEditing({ ...editing, steps: next });
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
      <header className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#B8974D]">
            Automação
          </p>
          <h1
            className="mt-1 text-3xl italic text-[#0B2A4A]"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            Funis de mensagem
          </h1>
          <p className="mt-1 max-w-lg text-sm text-[#3E4F65]">
            Crie fluxos automáticos por app: mensagem, espera, resposta da IA,
            condição e etiquetas. Dispare por gatilho ou manualmente.
          </p>
        </div>
        <button
          onClick={novoFunil}
          className="flex items-center gap-2 rounded-xl bg-[#0B2A4A] px-4 py-2 text-sm font-bold text-[#F7F2E8]"
        >
          <Plus className="size-4" /> Novo funil
        </button>
      </header>

      {editing ? (
        <FunilEditor
          value={editing}
          onChange={setEditing}
          onSave={salvar}
          saving={saving}
          onCancel={() => setEditing(null)}
          addStep={addStep}
          updateStep={updateStep}
          removeStep={removeStep}
          moveStep={moveStep}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {funnels.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-[#E5DBC3] bg-white/50 p-10 text-center">
              <GitBranch className="mx-auto size-8 text-[#B8974D]" />
              <p className="mt-3 text-sm text-[#3E4F65]">
                Nenhum funil ainda. Crie o primeiro para automatizar mensagens.
              </p>
            </div>
          )}
          {funnels.map((f) => (
            <div
              key={f.id}
              className="rounded-2xl border border-[#E5DBC3] bg-white/70 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A7C5C]">
                    {f.app_key}
                  </p>
                  <h3
                    className="mt-0.5 text-xl italic text-[#0B2A4A]"
                    style={{ fontFamily: '"Playfair Display", serif' }}
                  >
                    {f.nome}
                  </h3>
                </div>
                <span
                  className={[
                    "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    f.ativo
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-neutral-200 text-neutral-500",
                  ].join(" ")}
                >
                  {f.ativo ? (
                    <Power className="size-3" />
                  ) : (
                    <PowerOff className="size-3" />
                  )}
                  {f.ativo ? "ativo" : "pausado"}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#3E4F65]">
                Gatilho: <b>{f.gatilho_tipo}</b>
                {f.gatilho_valor ? ` · ${f.gatilho_valor}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {f.steps.slice(0, 6).map((s) => {
                  const m = STEP_META[s.tipo];
                  return (
                    <span
                      key={s.id}
                      className="flex items-center gap-1 rounded-full bg-[#EFE5CE] px-2 py-0.5 text-[10px] font-semibold text-[#0B2A4A]"
                    >
                      <m.icon className="size-3" style={{ color: m.cor }} />
                      {m.label}
                    </span>
                  );
                })}
                {f.steps.length > 6 && (
                  <span className="text-[10px] text-[#8A7C5C]">
                    +{f.steps.length - 6}
                  </span>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setEditing(f)}
                  className="rounded-xl border border-[#E5DBC3] bg-white px-3 py-1.5 text-xs font-bold text-[#0B2A4A]"
                >
                  Editar
                </button>
                <button
                  onClick={() => f.id && remover(f.id)}
                  className="flex items-center gap-1 rounded-xl bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600"
                >
                  <Trash2 className="size-3" /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FunilEditor({
  value,
  onChange,
  onSave,
  saving,
  onCancel,
  addStep,
  updateStep,
  removeStep,
  moveStep,
}: {
  value: Funnel;
  onChange: (f: Funnel) => void;
  onSave: () => void;
  saving: boolean;
  onCancel: () => void;
  addStep: (t: StepTipo) => void;
  updateStep: (id: string, patch: Partial<Step>) => void;
  removeStep: (id: string) => void;
  moveStep: (id: string, delta: -1 | 1) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#E5DBC3] bg-white/70 p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A7C5C]">
            Nome
          </span>
          <input
            value={value.nome}
            onChange={(e) => onChange({ ...value, nome: e.target.value })}
            className="mt-1 w-full rounded-xl border border-[#E5DBC3] bg-white px-3 py-2 text-sm outline-none focus:border-[#B8974D]"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A7C5C]">
            App
          </span>
          <select
            value={value.app_key}
            onChange={(e) =>
              onChange({ ...value, app_key: e.target.value as Funnel["app_key"] })
            }
            className="mt-1 w-full rounded-xl border border-[#E5DBC3] bg-white px-3 py-2 text-sm"
          >
            <option value="mapa">Mapa do Lipedema</option>
            <option value="protocolo">Protocolo 7 dias</option>
            <option value="derma">Método Derma</option>
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A7C5C]">
            Descrição
          </span>
          <input
            value={value.descricao ?? ""}
            onChange={(e) => onChange({ ...value, descricao: e.target.value })}
            className="mt-1 w-full rounded-xl border border-[#E5DBC3] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A7C5C]">
            Gatilho de entrada
          </span>
          <select
            value={value.gatilho_tipo}
            onChange={(e) =>
              onChange({
                ...value,
                gatilho_tipo: e.target.value as Funnel["gatilho_tipo"],
              })
            }
            className="mt-1 w-full rounded-xl border border-[#E5DBC3] bg-white px-3 py-2 text-sm"
          >
            <option value="manual">Manual (a partir do CRM)</option>
            <option value="mapa_completo">Ao completar o Mapa</option>
            <option value="dia_desafio">Dia X do desafio</option>
            <option value="tag">Ao receber etiqueta</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A7C5C]">
            Valor do gatilho
          </span>
          <input
            value={value.gatilho_valor ?? ""}
            onChange={(e) => onChange({ ...value, gatilho_valor: e.target.value })}
            placeholder="ex: 3 (dia) · quente (tag)"
            className="mt-1 w-full rounded-xl border border-[#E5DBC3] bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 md:col-span-2">
          <input
            type="checkbox"
            checked={value.ativo}
            onChange={(e) => onChange({ ...value, ativo: e.target.checked })}
          />
          <span className="text-sm text-[#0B2A4A]">Funil ativo</span>
        </label>
      </div>

      <div className="mt-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8A7C5C]">
          Etapas do fluxo
        </p>
        <div className="mt-3 space-y-2">
          {value.steps.map((s, i) => {
            const meta = STEP_META[s.tipo];
            return (
              <div
                key={s.id}
                className="flex items-start gap-3 rounded-xl border border-[#E5DBC3] bg-white p-3"
              >
                <div
                  className="grid size-9 shrink-0 place-items-center rounded-lg"
                  style={{ background: meta.cor + "22", color: meta.cor }}
                >
                  <meta.icon className="size-4" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A7C5C]">
                    {i + 1}. {meta.label}
                  </p>
                  <StepFields step={s} onChange={(p) => updateStep(s.id, p)} />
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveStep(s.id, -1)}
                    className="rounded px-2 text-xs text-[#8A7C5C] hover:bg-[#F7F2E8]"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveStep(s.id, 1)}
                    className="rounded px-2 text-xs text-[#8A7C5C] hover:bg-[#F7F2E8]"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeStep(s.id)}
                    className="rounded px-2 text-xs text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(STEP_META) as StepTipo[]).map((t) => {
            const m = STEP_META[t];
            return (
              <button
                key={t}
                onClick={() => addStep(t)}
                className="flex items-center gap-1.5 rounded-full border border-[#E5DBC3] bg-white px-3 py-1.5 text-xs font-semibold text-[#0B2A4A] hover:bg-[#EFE5CE]"
              >
                <m.icon className="size-3.5" style={{ color: m.cor }} />
                + {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[#0B2A4A] px-4 py-2 text-sm font-bold text-[#F7F2E8] disabled:opacity-60"
        >
          <Save className="size-4" /> {saving ? "Salvando..." : "Salvar funil"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl border border-[#E5DBC3] bg-white px-4 py-2 text-sm font-bold text-[#0B2A4A]"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function StepFields({
  step,
  onChange,
}: {
  step: Step;
  onChange: (patch: Partial<Step>) => void;
}) {
  if (step.tipo === "mensagem") {
    return <MensagemField step={step} onChange={onChange} />;
  }
  if (step.tipo === "espera") {
    return (
      <label className="mt-1 flex items-center gap-2 text-sm">
        Esperar
        <input
          type="number"
          value={step.espera_min ?? 60}
          onChange={(e) => onChange({ espera_min: Number(e.target.value) })}
          className="w-24 rounded-lg border border-[#E5DBC3] px-2 py-1"
        />
        minutos
      </label>
    );
  }
  if (step.tipo === "gatilho_ia") {
    return (
      <textarea
        value={step.ia_prompt ?? ""}
        onChange={(e) => onChange({ ia_prompt: e.target.value })}
        rows={2}
        placeholder="Instrução para a IA (ex: pergunte se a lead conseguiu montar o prato ontem)"
        className="mt-1 w-full resize-none rounded-lg border border-[#E5DBC3] bg-[#FBF6EB] p-2 text-sm"
      />
    );
  }
  if (step.tipo === "condicao") {
    return (
      <div className="mt-1 grid grid-cols-2 gap-2">
        <input
          value={step.condicao_campo ?? ""}
          onChange={(e) => onChange({ condicao_campo: e.target.value })}
          placeholder="Campo (ex: perfil)"
          className="rounded-lg border border-[#E5DBC3] px-2 py-1 text-sm"
        />
        <input
          value={step.condicao_valor ?? ""}
          onChange={(e) => onChange({ condicao_valor: e.target.value })}
          placeholder="Valor esperado"
          className="rounded-lg border border-[#E5DBC3] px-2 py-1 text-sm"
        />
      </div>
    );
  }
  return (
    <input
      value={step.tag_id ?? ""}
      onChange={(e) => onChange({ tag_id: e.target.value })}
      placeholder="ID da etiqueta"
      className="mt-1 w-full rounded-lg border border-[#E5DBC3] px-2 py-1 text-sm"
    />
  );
}

const EXEMPLO_LEAD = {
  nome: "Maria Silva",
  telefone: "+55 11 99999-9999",
  diagnostico: { estagio: "Estágio 2" },
  respostas: {
    tempo: "5-10 anos",
    diagnostico: "Sim, confirmado",
    sintomaMaior: "Dor nas pernas",
    pesoPernas: "Sim, sempre",
    dietaExercicio: "Não mudou nada",
    atividade: "Sedentária",
    exames: "Não",
    objetivo: "Aliviar a dor",
  },
};

function MensagemField({
  step,
  onChange,
}: {
  step: Step;
  onChange: (patch: Partial<Step>) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const texto = step.texto ?? "";

  function inserirTag(tag: string) {
    const el = ref.current;
    const marker = `{${tag}}`;
    if (!el) {
      onChange({ texto: texto + marker });
      return;
    }
    const start = el.selectionStart ?? texto.length;
    const end = el.selectionEnd ?? texto.length;
    const novo = texto.slice(0, start) + marker + texto.slice(end);
    onChange({ texto: novo });
    // reposiciona o cursor após o marcador inserido
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + marker.length;
      el.setSelectionRange(pos, pos);
    });
  }

  const preview = applyMergeTags(texto, EXEMPLO_LEAD);

  return (
    <div className="mt-1 space-y-2">
      <textarea
        ref={ref}
        value={texto}
        onChange={(e) => onChange({ texto: e.target.value })}
        rows={3}
        placeholder="Texto da mensagem — clique nos parâmetros abaixo para inserir"
        className="w-full resize-none rounded-lg border border-[#E5DBC3] bg-[#FBF6EB] p-2 text-sm outline-none focus:border-[#B8974D]"
      />

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A7C5C]">
          Parâmetros do formulário
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {MERGE_TAGS.map((t) => (
            <button
              key={t.key}
              type="button"
              title={`${t.descricao} · exemplo: ${t.exemplo}`}
              onClick={() => inserirTag(t.key)}
              className="rounded-full border border-[#E5DBC3] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#0B2A4A] hover:border-[#B8974D] hover:bg-[#EFE5CE]"
            >
              {`{${t.key}}`}
              <span className="ml-1 text-[9px] font-normal text-[#8A7C5C]">
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {texto && (
        <div className="rounded-lg border border-dashed border-[#E5DBC3] bg-white/60 p-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A7C5C]">
            Pré-visualização (dados de exemplo)
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-[#0B2A4A]">
            {preview}
          </p>
        </div>
      )}
    </div>
  );
}
