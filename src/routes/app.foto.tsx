import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Camera, Loader2, Sparkles, Lock, ArrowLeft, RefreshCw } from "lucide-react";
import { analisarFotoApp, getMealTestStatus } from "@/lib/meal-test.functions";

export const Route = createFileRoute("/app/foto")({
  component: FotoRefeicao,
  head: () => ({
    meta: [
      { title: "Registre uma refeição · Zero Lipedema" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type Feedback = {
  isRefeicao: boolean;
  pontos: string[];
  sugestao: string;
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

function FotoRefeicao() {
  const qc = useQueryClient();
  const getStatus = useServerFn(getMealTestStatus);
  const analisar = useServerFn(analisarFotoApp);

  const { data: status, isLoading } = useQuery({
    queryKey: ["meal-test-status"],
    queryFn: () => getStatus(),
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: async (file: File) => {
      const { base64, mimetype } = await fileToBase64(file);
      return analisar({ data: { base64, mimetype } });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["meal-test-status"] });
      if (res.esgotado) {
        setAviso("esgotado");
        setFeedback(null);
        return;
      }
      if (!res.ok || !res.feedback) {
        setAviso(res.erro ?? "Tive um probleminha para analisar. Tenta outra foto?");
        setFeedback(null);
        return;
      }
      if (!res.feedback.isRefeicao) {
        setAviso("Hmm, não consegui ver uma refeição nessa foto. Me manda o prato de cima, com boa luz — não gastei uma das suas 3 fotos. ✨");
        setFeedback(null);
        return;
      }
      setAviso(null);
      setFeedback(res.feedback);
    },
    onError: (e: Error) => {
      setAviso(e.message);
      setFeedback(null);
    },
  });

  function reset() {
    setPreview(null);
    setFeedback(null);
    setAviso(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleFile(file: File) {
    setFeedback(null);
    setAviso(null);
    setPreview(URL.createObjectURL(file));
    mut.mutate(file);
  }

  const esgotadoPago = status && !status.pago && status.restantes === 0;

  return (
    <div className="px-5 pt-6 pb-10">
      <Link
        to="/app"
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase"
        style={{ letterSpacing: "0.16em", color: "#AF7F35" }}
      >
        <ArrowLeft className="size-3.5" /> Voltar
      </Link>

      <section
        className="relative overflow-hidden rounded-[28px] px-6 py-7"
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
          Teste grátis
        </p>
        <h1
          className="mt-2"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 500,
            fontSize: "1.6rem",
            lineHeight: 1.2,
            color: "#F5EFE1",
          }}
        >
          Registre uma <em className="italic" style={{ color: "#D9A94B" }}>refeição</em>
        </h1>
        <p className="mt-3 text-[13.5px]" style={{ color: "rgba(245,239,225,0.85)", lineHeight: 1.55 }}>
          Envie a foto do prato e receba um feedback rápido — pontos de atenção e uma sugestão prática, sem prescrição.
        </p>

        {isLoading ? (
          <div className="mt-5 inline-flex items-center gap-2 text-[12px]" style={{ color: "rgba(245,239,225,0.7)" }}>
            <Loader2 className="size-3.5 animate-spin" /> carregando…
          </div>
        ) : (
          <div
            className="mt-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5"
            style={{
              background: "rgba(245,239,225,0.14)",
              border: "1px solid rgba(217,169,75,0.35)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#D9A94B" }} />
            <span className="text-[12px] font-semibold" style={{ color: "#F5EFE1" }}>
              {status?.pago
                ? "Feedback ilimitado ativo"
                : `${status?.restantes ?? 3} de 3 fotos restantes`}
            </span>
          </div>
        )}
      </section>

      {esgotadoPago || aviso === "esgotado" ? (
        <section
          className="mt-6 rounded-2xl p-6 text-center"
          style={{
            background: "rgba(255,253,247,0.9)",
            border: "1px solid rgba(216,198,160,0.55)",
            boxShadow: "0 10px 24px -18px rgba(22,50,79,0.35)",
          }}
        >
          <div
            className="mx-auto grid size-12 place-items-center rounded-full"
            style={{ background: "rgba(175,127,53,0.12)", color: "#AF7F35" }}
          >
            <Lock className="size-5" />
          </div>
          <h2
            className="mt-3"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 500,
              fontSize: "1.25rem",
              color: "#16324F",
            }}
          >
            Seu teste grátis acabou
          </h2>
          <p className="mt-2 text-[13.5px]" style={{ color: "#2F3128", lineHeight: 1.55 }}>
            Você já usou as 3 fotos do teste. Para continuar com feedback ilimitado, o plano completo
            (sugestão alimentar, chás/shots, lista de compras e acompanhamento pelo WhatsApp) sai por <strong>R$57</strong> — sem assinatura.
          </p>
          <p className="mt-4 text-[12px]" style={{ color: "#AF7F35", letterSpacing: "0.12em", fontWeight: 600 }}>
            EM BREVE UM LINK DE LIBERAÇÃO AQUI
          </p>
        </section>
      ) : (
        <section className="mt-6">
          {preview && (
            <div
              className="mb-4 overflow-hidden rounded-2xl"
              style={{ border: "1px solid rgba(216,198,160,0.55)" }}
            >
              <img src={preview} alt="Sua refeição" className="w-full object-cover" style={{ maxHeight: 320 }} />
            </div>
          )}

          {mut.isPending && (
            <div
              className="mb-4 flex items-center gap-3 rounded-2xl px-4 py-3.5"
              style={{
                background: "rgba(255,253,247,0.9)",
                border: "1px solid rgba(216,198,160,0.55)",
              }}
            >
              <Loader2 className="size-4 animate-spin" style={{ color: "#16324F" }} />
              <span className="text-[13.5px]" style={{ color: "#16324F" }}>
                Analisando sua refeição…
              </span>
            </div>
          )}

          {aviso && aviso !== "esgotado" && (
            <div
              className="mb-4 rounded-2xl px-4 py-3.5 text-[13px]"
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

          {feedback && (
            <div
              className="mb-4 rounded-2xl p-5"
              style={{
                background: "rgba(255,253,247,0.95)",
                border: "1px solid rgba(216,198,160,0.55)",
                boxShadow: "0 10px 24px -18px rgba(22,50,79,0.35)",
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="size-4" style={{ color: "#AF7F35" }} />
                <p
                  className="text-[10.5px] font-semibold uppercase"
                  style={{ letterSpacing: "0.24em", color: "#AF7F35" }}
                >
                  Feedback da refeição
                </p>
              </div>

              {feedback.pontos.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {feedback.pontos.map((p, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[13.5px]"
                      style={{ color: "#16324F", lineHeight: 1.5 }}
                    >
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: "#D9A94B" }}
                      />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              )}

              {feedback.sugestao && (
                <div
                  className="mt-4 rounded-xl px-3.5 py-3 text-[13.5px]"
                  style={{
                    background: "rgba(22,50,79,0.05)",
                    border: "1px solid rgba(216,198,160,0.4)",
                    color: "#16324F",
                    lineHeight: 1.5,
                  }}
                >
                  <span className="font-semibold" style={{ color: "#AF7F35" }}>Sugestão: </span>
                  {feedback.sugestao}
                </div>
              )}
            </div>
          )}

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

          <button
            type="button"
            disabled={mut.isPending}
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-[14px] font-semibold uppercase transition-opacity disabled:opacity-60"
            style={{
              background: "linear-gradient(180deg, #2C5578, #16324F)",
              color: "#F5EFE1",
              letterSpacing: "0.16em",
              boxShadow: "0 12px 24px -14px rgba(22,50,79,0.6)",
            }}
          >
            {feedback || aviso ? (
              <>
                <RefreshCw className="size-4" /> Enviar outra foto
              </>
            ) : (
              <>
                <Camera className="size-4" /> Tirar / enviar foto
              </>
            )}
          </button>

          {(feedback || aviso) && (
            <button
              type="button"
              onClick={reset}
              className="mt-3 w-full text-[12px] font-semibold uppercase"
              style={{ letterSpacing: "0.16em", color: "#AF7F35" }}
            >
              Limpar
            </button>
          )}

          <p
            className="mt-6 text-center text-[11.5px]"
            style={{ color: "#5C5749", lineHeight: 1.5 }}
          >
            Feedback educacional, não substitui consulta com nutricionista.
          </p>
        </section>
      )}
    </div>
  );
}
