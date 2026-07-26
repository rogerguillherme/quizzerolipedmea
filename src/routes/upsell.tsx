import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import {
  Lock,
  FileText,
  Video,
  MessagesSquare,
  Stethoscope,
  Sparkles,
  Camera,
  Loader2,
  RefreshCw,
  UtensilsCrossed,
  LineChart,
  ChevronRight,
} from "lucide-react";
import { track } from "../lib/analytics";
import { analisarFotoApp, getMealTestStatus } from "@/lib/meal-test.functions";

export const Route = createFileRoute("/upsell")({
  component: Derma,
});

const NAVY = "#16324F";
const GOLD = "#AF7F35";
const CREAM = "#F5EFE1";
const GOLD_SOFT = "#D9A94B";

const INCLUI = [
  {
    icon: <Camera className="size-4" />,
    title: "Registro de refeição com I.A.",
    body: "Fotografe o prato e receba na hora os pontos de atenção, macros estimados e evolução diária de cada nutriente.",
    highlight: true,
  },
  {
    icon: <Stethoscope className="size-4" />,
    title: "Anamnese completa",
    body: "Avaliação clínica aprofundada da sua história e sintomas — exclusiva deste tier.",
  },
  {
    icon: <FileText className="size-4" />,
    title: "Leitura de exames",
    body: "Interpretação dos seus exames sob a ótica do lipedema.",
  },
  {
    icon: <Sparkles className="size-4" />,
    title: "Prescrição personalizada · 90 dias",
    body: "Plano alimentar e de fitoterápicos ajustado ao seu caso.",
  },
  {
    icon: <Video className="size-4" />,
    title: "Aulas gravadas da Gabriela",
    body: "Biblioteca de módulos: hormônios, alimentação, vascular, emocional.",
  },
  {
    icon: <MessagesSquare className="size-4" />,
    title: "Q&A ao vivo com Gabriela",
    body: "Encontros regulares — turma pequena, sustentável.",
  },
];

// Metas diárias fictícias — só demo.
const METAS = {
  calorias: 1600,
  proteina: 90, // g
  carbo: 160, // g
  gordura: 55, // g
  fibra: 25, // g
  sodio: 2000, // mg
};

type Feedback = { isRefeicao: boolean; pontos: string[]; sugestao: string };

type Macros = {
  calorias: number;
  proteina: number;
  carbo: number;
  gordura: number;
  fibra: number;
  sodio: number;
};

function fileToBase64(file: File): Promise<{ base64: string; mimetype: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const [, b64] = result.split(",");
      resolve({ base64: b64 ?? "", mimetype: file.type || "image/jpeg" });
    };
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}

// Estimativa fictícia — usa hash da sugestão pra variar sem parecer aleatório.
function estimarMacros(seed: string): Macros {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const r = (min: number, max: number, off: number) =>
    min + (((h >> off) & 0xff) / 255) * (max - min);
  return {
    calorias: Math.round(r(320, 640, 0)),
    proteina: Math.round(r(18, 42, 3)),
    carbo: Math.round(r(28, 72, 6)),
    gordura: Math.round(r(9, 24, 9)),
    fibra: Math.round(r(3, 11, 12)),
    sodio: Math.round(r(280, 720, 15)),
  };
}

type Registro = {
  id: string;
  ts: number;
  preview: string;
  feedback: Feedback;
  macros: Macros;
};

function Derma() {
  const [modo, setModo] = useState<"specs" | "demo">("specs");
  const [tab, setTab] = useState<"registro" | "evolucao">("registro");
  const [preview, setPreview] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [macros, setMacros] = useState<Macros | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const qc = useQueryClient();
  const getStatus = useServerFn(getMealTestStatus);
  const analisar = useServerFn(analisarFotoApp);
  const { data: status } = useQuery({
    queryKey: ["meal-test-status"],
    queryFn: () => getStatus(),
  });

  const mut = useMutation({
    mutationFn: async (file: File) => {
      const { base64, mimetype } = await fileToBase64(file);
      return analisar({ data: { base64, mimetype } });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["meal-test-status"] });
      if (res.esgotado) {
        setAviso("Você já usou suas 3 fotos do teste grátis. Assine o Premium para feedback ilimitado.");
        return;
      }
      if (!res.ok || !res.feedback) {
        setAviso(res.erro ?? "Não consegui analisar essa foto agora. Tenta outra?");
        return;
      }
      if (!res.feedback.isRefeicao) {
        setAviso("Hmm, não vi uma refeição nessa foto — me manda o prato de cima, com boa luz.");
        return;
      }
      const fb = res.feedback;
      const m = estimarMacros(fb.sugestao + fb.pontos.join(""));
      setFeedback(fb);
      setMacros(m);
      setAviso(null);
      setRegistros((prev) => [
        {
          id: crypto.randomUUID(),
          ts: Date.now(),
          preview: preview ?? "",
          feedback: fb,
          macros: m,
        },
        ...prev,
      ].slice(0, 8));
    },
    onError: (e: Error) => setAviso(e.message),
  });

  const total = useMemo<Macros>(() => {
    return registros.reduce<Macros>(
      (acc, r) => ({
        calorias: acc.calorias + r.macros.calorias,
        proteina: acc.proteina + r.macros.proteina,
        carbo: acc.carbo + r.macros.carbo,
        gordura: acc.gordura + r.macros.gordura,
        fibra: acc.fibra + r.macros.fibra,
        sodio: acc.sodio + r.macros.sodio,
      }),
      { calorias: 0, proteina: 0, carbo: 0, gordura: 0, fibra: 0, sodio: 0 },
    );
  }, [registros]);

  function handleFile(file: File) {
    setPreview(URL.createObjectURL(file));
    setFeedback(null);
    setMacros(null);
    setAviso(null);
    mut.mutate(file);
  }

  function novaFoto() {
    setPreview(null);
    setFeedback(null);
    setMacros(null);
    setAviso(null);
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.click();
  }

  return (
    <div className="px-5 pt-6 pb-10">
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-semibold uppercase"
          style={{ letterSpacing: "0.24em", color: GOLD }}
        >
          Premium
        </span>
        <span
          className="h-px flex-1"
          style={{ background: "linear-gradient(90deg, rgba(216,198,160,0.7), transparent)" }}
        />
      </div>
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
        Plano <em className="italic" style={{ color: GOLD }}>Premium</em> · 90 dias
      </h1>
      <p className="mt-3 text-[13.5px]" style={{ color: "#2F3128", lineHeight: 1.55 }}>
        Contato humano com a Dra. Gabriela + acompanhamento por I.A. da sua alimentação, dia após dia.
      </p>

      {/* Especificações */}
      <div
        className="mt-5 overflow-hidden rounded-3xl"
        style={{
          background: "rgba(255,253,247,0.92)",
          border: "1px solid rgba(216,198,160,0.55)",
          boxShadow: "0 20px 32px -22px rgba(22,50,79,0.45)",
        }}
      >
        {INCLUI.map((i, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-4"
            style={{
              borderTop: idx === 0 ? "none" : "1px solid rgba(216,198,160,0.4)",
              background: i.highlight ? "rgba(217,169,75,0.10)" : "transparent",
            }}
          >
            <span
              className="grid size-9 shrink-0 place-items-center rounded-full"
              style={{
                background: "rgba(175,127,53,0.14)",
                border: "1px solid rgba(175,127,53,0.35)",
                color: GOLD,
              }}
            >
              {i.icon}
            </span>
            <div className="flex-1">
              <p className="text-[13.5px] font-semibold" style={{ color: NAVY }}>
                {i.title}
              </p>
              <p className="text-[12px]" style={{ color: "#2F3128", lineHeight: 1.5 }}>
                {i.body}
              </p>
              {i.highlight && (
                <button
                  type="button"
                  onClick={() => {
                    setModo("demo");
                    track("premium_meal_demo_opened");
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold uppercase"
                  style={{
                    background: `linear-gradient(180deg, ${GOLD_SOFT}, ${GOLD})`,
                    color: CREAM,
                    letterSpacing: "0.14em",
                    boxShadow: "0 8px 18px -10px rgba(175,127,53,0.55)",
                  }}
                >
                  <Camera className="size-3.5" /> Fazer teste
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Demo do registro de refeição */}
      {modo === "demo" && (
        <section
          className="mt-6 overflow-hidden rounded-3xl"
          style={{
            background: "rgba(255,253,247,0.95)",
            border: "1px solid rgba(216,198,160,0.55)",
            boxShadow: "0 20px 32px -22px rgba(22,50,79,0.45)",
          }}
        >
          <div className="p-5" style={{ background: `linear-gradient(150deg, #2C5578, ${NAVY})`, color: CREAM }}>
            <p className="text-[10px] font-semibold uppercase" style={{ letterSpacing: "0.28em", color: GOLD_SOFT }}>
              Prévia do recurso
            </p>
            <p
              className="mt-2"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, fontSize: "1.35rem", lineHeight: 1.2 }}
            >
              Registro de <em className="italic" style={{ color: GOLD_SOFT }}>refeição</em>
            </p>
            <p className="mt-1 text-[11.5px]" style={{ color: "rgba(245,239,225,0.75)" }}>
              dados fictícios para teste
            </p>
            {status && !status.pago && (
              <div
                className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1"
                style={{ background: "rgba(245,239,225,0.14)", border: "1px solid rgba(217,169,75,0.35)" }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: GOLD_SOFT }} />
                <span className="text-[11px] font-semibold">
                  {status.restantes} de 3 fotos restantes
                </span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 border-b" style={{ borderColor: "rgba(216,198,160,0.5)" }}>
            {([
              { id: "registro", label: "Registro", icon: UtensilsCrossed },
              { id: "evolucao", label: "Evolução", icon: LineChart },
            ] as const).map((t) => {
              const active = tab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex items-center justify-center gap-2 py-3 text-[12px] font-semibold uppercase"
                  style={{
                    letterSpacing: "0.16em",
                    color: active ? NAVY : "#8A7C5C",
                    borderBottom: active ? `2px solid ${GOLD}` : "2px solid transparent",
                    background: active ? "rgba(217,169,75,0.08)" : "transparent",
                  }}
                >
                  <Icon className="size-3.5" /> {t.label}
                </button>
              );
            })}
          </div>

          <div className="p-5">
            {tab === "registro" && (
              <>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />

                {!preview && !mut.isPending && (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-[13.5px] font-semibold uppercase"
                    style={{
                      background: `linear-gradient(180deg, #2C5578, ${NAVY})`,
                      color: CREAM,
                      letterSpacing: "0.16em",
                      boxShadow: "0 12px 24px -14px rgba(22,50,79,0.6)",
                    }}
                  >
                    <Camera className="size-4" /> Tirar / enviar foto
                  </button>
                )}

                {preview && (
                  <div
                    className="overflow-hidden rounded-2xl"
                    style={{ border: "1px solid rgba(216,198,160,0.55)" }}
                  >
                    <img src={preview} alt="Refeição" className="w-full object-cover" style={{ maxHeight: 280 }} />
                  </div>
                )}

                {mut.isPending && (
                  <div className="mt-4 flex items-center gap-2 text-[13px]" style={{ color: NAVY }}>
                    <Loader2 className="size-4 animate-spin" /> Analisando…
                  </div>
                )}

                {aviso && (
                  <div
                    className="mt-4 rounded-xl px-3.5 py-3 text-[12.5px]"
                    style={{
                      background: "rgba(217,169,75,0.12)",
                      border: "1px solid rgba(217,169,75,0.4)",
                      color: "#5C4517",
                      lineHeight: 1.5,
                    }}
                  >
                    {aviso}
                  </div>
                )}

                {feedback && macros && !mut.isPending && (
                  <>
                    <div className="mt-4">
                      <p
                        className="text-[10.5px] font-semibold uppercase"
                        style={{ letterSpacing: "0.24em", color: GOLD }}
                      >
                        Pontos de atenção
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {feedback.pontos.map((p, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-[13px]"
                            style={{ color: NAVY, lineHeight: 1.5 }}
                          >
                            <span
                              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ background: GOLD_SOFT }}
                            />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div
                      className="mt-3 rounded-xl px-3.5 py-3 text-[13px]"
                      style={{
                        background: "rgba(22,50,79,0.05)",
                        border: "1px solid rgba(216,198,160,0.4)",
                        color: NAVY,
                        lineHeight: 1.5,
                      }}
                    >
                      <span className="font-semibold" style={{ color: GOLD }}>Sugestão: </span>
                      {feedback.sugestao}
                    </div>

                    <div className="mt-4">
                      <p
                        className="text-[10.5px] font-semibold uppercase"
                        style={{ letterSpacing: "0.24em", color: GOLD }}
                      >
                        Estimativa do prato
                      </p>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        <MacroChip label="Kcal" valor={`${macros.calorias}`} />
                        <MacroChip label="Prot" valor={`${macros.proteina}g`} />
                        <MacroChip label="Carb" valor={`${macros.carbo}g`} />
                        <MacroChip label="Gord" valor={`${macros.gordura}g`} />
                        <MacroChip label="Fibra" valor={`${macros.fibra}g`} />
                        <MacroChip label="Sódio" valor={`${macros.sodio}mg`} />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={novaFoto}
                      className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase"
                      style={{ letterSpacing: "0.14em", color: GOLD }}
                    >
                      <RefreshCw className="size-3.5" /> Registrar outra refeição
                    </button>
                  </>
                )}

                {registros.length > 0 && !mut.isPending && (
                  <div className="mt-5">
                    <p
                      className="text-[10.5px] font-semibold uppercase"
                      style={{ letterSpacing: "0.24em", color: GOLD }}
                    >
                      Últimos registros
                    </p>
                    <div className="mt-2 space-y-2">
                      {registros.slice(0, 4).map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center gap-3 rounded-xl p-2"
                          style={{
                            background: "rgba(22,50,79,0.04)",
                            border: "1px solid rgba(216,198,160,0.4)",
                          }}
                        >
                          {r.preview ? (
                            <img
                              src={r.preview}
                              alt=""
                              className="size-11 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <span className="grid size-11 shrink-0 place-items-center rounded-lg" style={{ background: "rgba(175,127,53,0.15)", color: GOLD }}>
                              <UtensilsCrossed className="size-4" />
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] font-semibold" style={{ color: NAVY }}>
                              {r.feedback.sugestao}
                            </p>
                            <p className="text-[11px]" style={{ color: "#5C5749" }}>
                              {r.macros.calorias} kcal · {r.macros.proteina}g prot · {r.macros.sodio}mg sódio
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === "evolucao" && (
              <>
                <p
                  className="text-[10.5px] font-semibold uppercase"
                  style={{ letterSpacing: "0.24em", color: GOLD }}
                >
                  Consumo do dia
                </p>
                <p className="mt-1 text-[11.5px]" style={{ color: "#5C5749" }}>
                  {registros.length} refeição{registros.length === 1 ? "" : "s"} registrada{registros.length === 1 ? "" : "s"} · dados fictícios para teste
                </p>

                <div className="mt-4 space-y-3">
                  <Bar label="Calorias" atual={total.calorias} meta={METAS.calorias} unit="kcal" />
                  <Bar label="Proteína" atual={total.proteina} meta={METAS.proteina} unit="g" />
                  <Bar label="Carboidrato" atual={total.carbo} meta={METAS.carbo} unit="g" />
                  <Bar label="Gordura" atual={total.gordura} meta={METAS.gordura} unit="g" />
                  <Bar label="Fibra" atual={total.fibra} meta={METAS.fibra} unit="g" />
                  <Bar label="Sódio" atual={total.sodio} meta={METAS.sodio} unit="mg" invert />
                </div>

                {registros.length === 0 && (
                  <p className="mt-4 text-center text-[12px]" style={{ color: "#5C5749" }}>
                    Registre uma refeição na aba <strong>Registro</strong> pra ver a evolução aparecer aqui.
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* CTA compra */}
      <button
        onClick={() => track("premium_upgrade_clicked")}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-full px-5 py-4 text-[15px] font-semibold"
        style={{
          background: `linear-gradient(180deg, #2C5578, ${NAVY})`,
          color: CREAM,
          boxShadow: "0 14px 26px -14px rgba(22,50,79,0.55)",
        }}
      >
        <Lock className="size-4" /> Quero assinar o Premium
        <ChevronRight className="size-4" />
      </button>
      <p className="mt-3 text-center text-[11px]" style={{ color: "#2F3128" }}>
        Turma reduzida por trimestre. Vaga sob avaliação.
      </p>
    </div>
  );
}

function MacroChip({ label, valor }: { label: string; valor: string }) {
  return (
    <div
      className="rounded-xl px-2 py-2 text-center"
      style={{
        background: "rgba(255,253,247,0.9)",
        border: "1px solid rgba(216,198,160,0.55)",
      }}
    >
      <p
        className="text-[9.5px] font-semibold uppercase"
        style={{ letterSpacing: "0.18em", color: GOLD }}
      >
        {label}
      </p>
      <p
        className="mt-0.5 text-[14px] font-semibold"
        style={{ color: NAVY, fontFamily: "'Playfair Display', serif" }}
      >
        {valor}
      </p>
    </div>
  );
}

function Bar({
  label,
  atual,
  meta,
  unit,
  invert = false,
}: {
  label: string;
  atual: number;
  meta: number;
  unit: string;
  invert?: boolean;
}) {
  const pct = Math.min(100, Math.round((atual / meta) * 100));
  // invert = quanto menor melhor (sódio) → verde até 100, âmbar acima
  const cor = invert
    ? pct > 100
      ? "#B03A3A"
      : pct > 75
        ? GOLD_SOFT
        : "#5A8A5A"
    : pct >= 100
      ? "#5A8A5A"
      : pct >= 60
        ? GOLD_SOFT
        : "#2C5578";

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[12.5px] font-semibold" style={{ color: NAVY }}>
          {label}
        </span>
        <span className="text-[11.5px]" style={{ color: "#5C5749" }}>
          {atual}
          {unit} <span style={{ color: "#8A7C5C" }}>/ {meta}{unit}</span>
        </span>
      </div>
      <div
        className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full"
        style={{ background: "rgba(22,50,79,0.08)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: cor }}
        />
      </div>
    </div>
  );
}
