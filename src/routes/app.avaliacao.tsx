import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Sparkles, Lock, RefreshCw, ClipboardList, BarChart3, Utensils } from "lucide-react";
import { analisarFotoApp, getMealTestStatus } from "@/lib/meal-test.functions";

export const Route = createFileRoute("/app/avaliacao")({
  component: AvaliacaoPage,
  head: () => ({
    meta: [
      { title: "Avaliação · Zero Lipedema" },
      { name: "description", content: "Teste a funcionalidade premium: registre uma refeição por foto e veja a análise de macronutrientes." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type Feedback = { isRefeicao: boolean; pontos: string[]; sugestao: string };
type Macros = { kcal: number; proteina: number; carbo: number; gordura: number; fibra: number };
type MealEntry = {
  id: string;
  createdAt: string;
  preview: string;
  feedback: Feedback;
  macros: Macros;
};

const STORAGE_KEY = "zl_avaliacao_meals_v1";
const METAS: Macros = { kcal: 1800, proteina: 90, carbo: 200, gordura: 60, fibra: 25 };

function fileToBase64(file: File): Promise<{ base64: string; mimetype: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const [, b64] = String(reader.result ?? "").split(",");
      resolve({ base64: b64 ?? "", mimetype: file.type || "image/jpeg" });
    };
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}

// pseudo-hash → macros determinísticos por foto (dados fictícios de teste)
function mockMacros(seed: string): Macros {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const r = (min: number, max: number, salt: number) =>
    min + (((h >>> salt) & 0xff) / 255) * (max - min);
  return {
    kcal: Math.round(r(320, 620, 0)),
    proteina: Math.round(r(18, 42, 3)),
    carbo: Math.round(r(30, 75, 5)),
    gordura: Math.round(r(10, 28, 7)),
    fibra: Math.round(r(4, 12, 11)),
  };
}

function loadMeals(): MealEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as MealEntry[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function saveMeals(m: MealEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
  } catch {
    // ignore
  }
}

function AvaliacaoPage() {
  const qc = useQueryClient();
  const getStatus = useServerFn(getMealTestStatus);
  const analisar = useServerFn(analisarFotoApp);

  const { data: status, isLoading } = useQuery({
    queryKey: ["meal-test-status"],
    queryFn: () => getStatus(),
  });

  const [tab, setTab] = useState<"registro" | "analise">("registro");
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [lastFeedback, setLastFeedback] = useState<Feedback | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMeals(loadMeals());
  }, []);

  const mut = useMutation({
    mutationFn: async (file: File) => {
      const { base64, mimetype } = await fileToBase64(file);
      const res = await analisar({ data: { base64, mimetype } });
      return { res, previewUrl: URL.createObjectURL(file), seed: `${file.size}-${file.name}-${Date.now()}` };
    },
    onSuccess: ({ res, previewUrl, seed }) => {
      qc.invalidateQueries({ queryKey: ["meal-test-status"] });
      if (res.esgotado) {
        setAviso("esgotado");
        setLastFeedback(null);
        return;
      }
      if (!res.ok || !res.feedback) {
        setAviso(res.erro ?? "Tive um probleminha para analisar. Tenta outra foto?");
        setLastFeedback(null);
        return;
      }
      if (!res.feedback.isRefeicao) {
        setAviso("Hmm, não consegui ver uma refeição. Envie o prato de cima, com boa luz — não gastei uma das suas fotos. ✨");
        setLastFeedback(null);
        return;
      }
      setAviso(null);
      setLastFeedback(res.feedback);
      const entry: MealEntry = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        preview: previewUrl,
        feedback: res.feedback,
        macros: mockMacros(seed),
      };
      const next = [entry, ...meals].slice(0, 20);
      setMeals(next);
      saveMeals(next);
    },
    onError: (e: Error) => {
      setAviso(e.message);
      setLastFeedback(null);
    },
  });

  function handleFile(file: File) {
    setPreview(URL.createObjectURL(file));
    setAviso(null);
    setLastFeedback(null);
    mut.mutate(file);
  }

  const esgotadoPago = status && !status.pago && status.restantes === 0;

  const totais = meals.reduce<Macros>(
    (acc, m) => ({
      kcal: acc.kcal + m.macros.kcal,
      proteina: acc.proteina + m.macros.proteina,
      carbo: acc.carbo + m.macros.carbo,
      gordura: acc.gordura + m.macros.gordura,
      fibra: acc.fibra + m.macros.fibra,
    }),
    { kcal: 0, proteina: 0, carbo: 0, gordura: 0, fibra: 0 },
  );

  return (
    <div className="px-4 pt-5 pb-10 sm:px-5 sm:pt-6">
      {/* Intro */}
      <section
        className="relative overflow-hidden rounded-[24px] px-5 py-5 sm:rounded-[28px] sm:px-6 sm:py-6"
        style={{
          background: "linear-gradient(160deg, #2C5578 0%, #16324F 55%, #0D2138 100%)",
          boxShadow: "0 24px 40px -28px rgba(22,50,79,0.55)",
          color: "#F5EFE1",
        }}
      >

        <p
          className="text-[10px] font-semibold uppercase"
          style={{ letterSpacing: "0.28em", color: "#D9A94B" }}
        >
          Amostra Premium
        </p>
        <h1
          className="mt-2 text-[1.25rem] sm:text-[1.5rem]"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 500,
            lineHeight: 1.2,
          }}
        >
          Teste uma das <em className="italic" style={{ color: "#D9A94B" }}>funcionalidades</em> do plano premium
        </h1>
        <p className="mt-3 text-[12.5px] sm:text-[13.5px]" style={{ color: "rgba(245,239,225,0.85)", lineHeight: 1.55 }}>
          Fotografe sua refeição, receba um feedback rápido e veja como fica o acompanhamento dos macronutrientes no seu dia.
        </p>


        {isLoading ? (
          <div className="mt-4 inline-flex items-center gap-2 text-[12px]" style={{ color: "rgba(245,239,225,0.7)" }}>
            <Loader2 className="size-3.5 animate-spin" /> carregando…
          </div>
        ) : (
          <div
            className="mt-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5"
            style={{ background: "rgba(245,239,225,0.14)", border: "1px solid rgba(217,169,75,0.35)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#D9A94B" }} />
            <span className="text-[12px] font-semibold">
              {status?.pago
                ? "Feedback ilimitado ativo"
                : `${status?.restantes ?? 3} de 3 fotos restantes`}
            </span>
          </div>
        )}
      </section>

      {/* CTA botão principal */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
      {!esgotadoPago && aviso !== "esgotado" && (
        <button
          type="button"
          disabled={mut.isPending}
          onClick={() => inputRef.current?.click()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-[14px] font-semibold uppercase transition-opacity disabled:opacity-60"
          style={{
            background: "linear-gradient(180deg, #D9A94B, #AF7F35)",
            color: "#16324F",
            letterSpacing: "0.16em",
            boxShadow: "0 12px 24px -14px rgba(175,127,53,0.65)",
          }}
        >
          {mut.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Analisando…
            </>
          ) : (
            <>
              <Camera className="size-4" /> Tirar foto da refeição
            </>
          )}
        </button>
      )}

      {/* Aviso de esgotado */}
      {(esgotadoPago || aviso === "esgotado") && (
        <section
          className="mt-6 rounded-2xl p-6 text-center"
          style={{
            background: "rgba(255,253,247,0.9)",
            border: "1px solid rgba(216,198,160,0.55)",
            boxShadow: "0 10px 24px -18px rgba(22,50,79,0.35)",
          }}
        >
          <div className="mx-auto grid size-12 place-items-center rounded-full" style={{ background: "rgba(175,127,53,0.12)", color: "#AF7F35" }}>
            <Lock className="size-5" />
          </div>
          <h2 className="mt-3" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, fontSize: "1.25rem", color: "#16324F" }}>
            Seu teste grátis acabou
          </h2>
          <p className="mt-2 text-[13.5px]" style={{ color: "#2F3128", lineHeight: 1.55 }}>
            Você já usou as 3 fotos do teste. Para continuar com feedback ilimitado, conheça o plano completo na aba <strong>Premium</strong>.
          </p>
        </section>
      )}

      {aviso && aviso !== "esgotado" && (
        <div
          className="mt-4 rounded-2xl px-4 py-3.5 text-[13px]"
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

      {preview && lastFeedback && (
        <div
          className="mt-4 overflow-hidden rounded-2xl"
          style={{ border: "1px solid rgba(216,198,160,0.55)" }}
        >
          <img src={preview} alt="Sua refeição" className="w-full object-cover" style={{ maxHeight: 260 }} />
        </div>
      )}

      {/* Sub-tabs */}
      <div
        className="mt-6 grid grid-cols-2 gap-1 rounded-2xl p-1"
        style={{ background: "rgba(255,253,247,0.9)", border: "1px solid rgba(216,198,160,0.55)" }}
      >
        {([
          { id: "registro", label: "Registro", icon: ClipboardList },
          { id: "analise", label: "Análise", icon: BarChart3 },
        ] as const).map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold uppercase transition-all"
              style={
                active
                  ? {
                      background: "linear-gradient(180deg, #2C5578, #16324F)",
                      color: "#F5EFE1",
                      letterSpacing: "0.14em",
                      boxShadow: "0 6px 14px -8px rgba(22,50,79,0.55)",
                    }
                  : { color: "#5C5749", letterSpacing: "0.14em" }
              }
            >
              <Icon className="size-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      <p
        className="mt-3 text-center text-[10.5px] font-semibold uppercase"
        style={{ letterSpacing: "0.2em", color: "#AF7F35" }}
      >
        Dados fictícios para teste
      </p>

      {/* Registro */}
      {tab === "registro" && (
        <section className="mt-4 space-y-3">
          {meals.length === 0 && (
            <div
              className="rounded-2xl px-4 py-8 text-center text-[13.5px]"
              style={{
                background: "rgba(255,253,247,0.9)",
                border: "1px dashed rgba(216,198,160,0.8)",
                color: "#5C5749",
                lineHeight: 1.6,
              }}
            >
              <Utensils className="mx-auto mb-2 size-5" style={{ color: "#AF7F35" }} />
              Nenhuma refeição registrada ainda. Tire uma foto do seu prato para começar.
            </div>
          )}

          {meals.map((m) => (
            <article
              key={m.id}
              className="rounded-2xl p-3 sm:p-4"
              style={{
                background: "rgba(255,253,247,0.95)",
                border: "1px solid rgba(216,198,160,0.55)",
                boxShadow: "0 10px 24px -20px rgba(22,50,79,0.35)",
              }}
            >
              <div className="flex gap-3">
                <img
                  src={m.preview}
                  alt="refeição"
                  className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20"
                  style={{ border: "1px solid rgba(216,198,160,0.55)" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] font-semibold uppercase" style={{ letterSpacing: "0.2em", color: "#AF7F35" }}>
                    {new Date(m.createdAt).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}
                  </p>
                  <p className="mt-1 text-[12.5px] sm:text-[13px]" style={{ color: "#16324F", lineHeight: 1.45 }}>
                    {m.feedback.sugestao}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-5 gap-1">
                {[
                  { l: "kcal", v: m.macros.kcal },
                  { l: "prot", v: `${m.macros.proteina}g` },
                  { l: "carb", v: `${m.macros.carbo}g` },
                  { l: "gord", v: `${m.macros.gordura}g` },
                  { l: "fibra", v: `${m.macros.fibra}g` },
                ].map((x) => (
                  <div
                    key={x.l}
                    className="min-w-0 rounded-lg px-1 py-1.5 text-center"
                    style={{ background: "rgba(22,50,79,0.05)", border: "1px solid rgba(216,198,160,0.45)" }}
                  >
                    <p className="text-[8.5px] font-semibold uppercase" style={{ letterSpacing: "0.1em", color: "#5C5749" }}>
                      {x.l}
                    </p>
                    <p className="truncate text-[11.5px] font-semibold" style={{ color: "#16324F" }}>
                      {x.v}
                    </p>
                  </div>
                ))}
              </div>


              {m.feedback.pontos.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {m.feedback.pontos.slice(0, 3).map((p, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[12.5px]"
                      style={{ color: "#2F3128", lineHeight: 1.45 }}
                    >
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: "#D9A94B" }} />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>
      )}

      {/* Análise */}
      {tab === "analise" && (
        <section className="mt-4 space-y-4">
          <div
            className="rounded-2xl p-5"
            style={{
              background: "rgba(255,253,247,0.95)",
              border: "1px solid rgba(216,198,160,0.55)",
              boxShadow: "0 10px 24px -20px rgba(22,50,79,0.35)",
            }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="size-4" style={{ color: "#AF7F35" }} />
              <p className="text-[10.5px] font-semibold uppercase" style={{ letterSpacing: "0.24em", color: "#AF7F35" }}>
                Comparação com meta diária
              </p>
            </div>

            <div className="mt-4 space-y-3.5">
              {[
                { l: "Calorias", v: totais.kcal, m: METAS.kcal, u: "kcal" },
                { l: "Proteína", v: totais.proteina, m: METAS.proteina, u: "g" },
                { l: "Carboidrato", v: totais.carbo, m: METAS.carbo, u: "g" },
                { l: "Gordura", v: totais.gordura, m: METAS.gordura, u: "g" },
                { l: "Fibra", v: totais.fibra, m: METAS.fibra, u: "g" },
              ].map((row) => {
                const pct = Math.min(100, Math.round((row.v / row.m) * 100));
                return (
                  <div key={row.l}>
                    <div className="mb-1 flex items-center justify-between text-[12.5px]" style={{ color: "#16324F" }}>
                      <span className="font-semibold">{row.l}</span>
                      <span style={{ color: "#5C5749" }}>
                        {row.v}
                        {row.u} <span style={{ opacity: 0.6 }}>/ {row.m}{row.u}</span>
                      </span>
                    </div>
                    <div
                      className="h-2 w-full overflow-hidden rounded-full"
                      style={{ background: "rgba(22,50,79,0.08)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background:
                            pct >= 100
                              ? "linear-gradient(90deg, #AF7F35, #D9A94B)"
                              : "linear-gradient(90deg, #2C5578, #16324F)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="rounded-2xl p-4 text-[13px]"
            style={{
              background: "rgba(22,50,79,0.05)",
              border: "1px solid rgba(216,198,160,0.55)",
              color: "#16324F",
              lineHeight: 1.55,
            }}
          >
            <p className="mb-1 text-[10.5px] font-semibold uppercase" style={{ letterSpacing: "0.24em", color: "#AF7F35" }}>
              Feedback do dia
            </p>
            {meals.length === 0
              ? "Registre pelo menos uma refeição para receber o feedback do dia."
              : totais.proteina < METAS.proteina * 0.5
              ? "Sua proteína está baixa. No próximo prato, priorize ovos, frango ou peixe — ajuda a controlar a fome e reduzir inflamação."
              : totais.fibra < METAS.fibra * 0.4
              ? "Faltou fibra hoje. Inclua folhas verdes, chia ou uma fruta com casca para melhorar o intestino e o inchaço."
              : totais.carbo > METAS.carbo * 0.9
              ? "Volume alto de carboidratos. Se puder, troque parte pelo prato colorido com vegetais e uma proteína magra na próxima refeição."
              : "Bom equilíbrio! Mantenha proteína em toda refeição principal e beba água ao longo do dia para potencializar o desinchaço."}
          </div>

          {meals.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setMeals([]);
                saveMeals([]);
              }}
              className="w-full text-[11.5px] font-semibold uppercase"
              style={{ letterSpacing: "0.16em", color: "#AF7F35" }}
            >
              <RefreshCw className="mr-1 inline size-3" /> Zerar registro do teste
            </button>
          )}
        </section>
      )}
    </div>
  );
}
