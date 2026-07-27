import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  FileText,
  Upload,
  Loader2,
  Camera,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  registrarExameEnviado,
  listarMeusExames,
} from "@/lib/exames.functions";

export const Route = createFileRoute("/app/exames")({
  component: ExamesPage,
  head: () => ({
    meta: [
      { title: "Meus exames · Zero Lipedema" },
      {
        name: "description",
        content:
          "Envie seus exames laboratoriais para leitura nutricional pela nutricionista Gabriela Rosado.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Exame = Awaited<ReturnType<typeof listarMeusExames>>[number];

function ExamesPage() {
  const listar = useServerFn(listarMeusExames);
  const registrar = useServerFn(registrarExameEnviado);
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [observacao, setObservacao] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["app", "exames"],
    queryFn: () => listar(),
    refetchInterval: (q) => {
      const list = q.state.data as Exame[] | undefined;
      const emAnalise = list?.some((e) => e.ia_status === "pendente" || e.ia_status === "processando");
      return emAnalise ? 4000 : false;
    },
  });

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      setErro(null);
      setProgress("Enviando arquivo…");
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user.id;
      if (!uid) throw new Error("Sessão expirada — faça login de novo.");
      const clean = file.name.replace(/[^\w.\-]/g, "_").slice(0, 120);
      const path = `${uid}/${crypto.randomUUID()}-${clean}`;
      const up = await supabase.storage
        .from("exames")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) throw up.error;
      setProgress("Lendo com IA…");
      const r = await registrar({
        data: {
          storagePath: path,
          nomeArquivo: file.name,
          mimetype: file.type || "application/octet-stream",
          tamanhoBytes: file.size,
          observacao: observacao.trim() || undefined,
        },
      });
      return r;
    },
    onSuccess: () => {
      setProgress(null);
      setObservacao("");
      qc.invalidateQueries({ queryKey: ["app", "exames"] });
    },
    onError: (e: Error) => {
      setProgress(null);
      setErro(e.message);
    },
  });

  const onPick = () => inputRef.current?.click();
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) {
      setErro("Arquivo grande demais (máx. 20MB).");
      return;
    }
    uploadMut.mutate(f);
    e.target.value = "";
  };

  return (
    <div className="px-5 pb-24 pt-4">
      <Link
        to="/app"
        className="mb-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.16em]"
        style={{ color: "#AF7F35" }}
      >
        <ArrowLeft className="size-3.5" /> Voltar
      </Link>

      <header className="mb-4">
        <p
          className="text-[10px] font-bold uppercase"
          style={{ color: "#AF7F35", letterSpacing: "0.22em" }}
        >
          Zero Lipedema
        </p>
        <h1
          className="mt-1 text-2xl leading-tight italic"
          style={{ fontFamily: "'Playfair Display', serif", color: "#16324F" }}
        >
          Seus exames
        </h1>
        <p className="mt-1 text-sm text-[#3E4F65]">
          Envie foto ou PDF do seu exame. A IA da equipe faz uma leitura
          nutricional e a <strong>Gabriela revisa antes de te responder</strong>.
        </p>
      </header>

      <section
        className="rounded-3xl border p-5"
        style={{
          borderColor: "rgba(216,198,160,0.7)",
          background: "linear-gradient(180deg,#FBF6E9,#FFFDF7)",
          boxShadow: "0 10px 30px -20px rgba(22,50,79,0.35)",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="grid size-9 place-items-center rounded-full"
            style={{ background: "#16324F", color: "#F5EFE1" }}
          >
            <Upload className="size-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-[#16324F]">Enviar exame</p>
            <p className="text-[11px] text-[#3E4F65]">JPG, PNG ou PDF · até 20MB</p>
          </div>
        </div>

        <textarea
          value={observacao}
          onChange={(e) => setObservacao(e.target.value.slice(0, 400))}
          placeholder="(opcional) me conta o contexto — quando fez, sintomas atuais…"
          className="mt-3 w-full rounded-2xl border bg-white/80 p-3 text-sm text-[#16324F] placeholder:text-[#8A7C5C] outline-none focus:border-[#AF7F35]"
          style={{ borderColor: "rgba(216,198,160,0.7)", minHeight: 74 }}
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={onPick}
            disabled={uploadMut.isPending}
            className="flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold transition-all disabled:opacity-60"
            style={{
              background: "#16324F",
              color: "#F5EFE1",
              boxShadow: "0 10px 24px -14px rgba(22,50,79,0.6)",
            }}
          >
            <FileText className="size-4" /> Escolher arquivo
          </button>
          <button
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.setAttribute("capture", "environment");
                inputRef.current.click();
                setTimeout(() => inputRef.current?.removeAttribute("capture"), 100);
              }
            }}
            disabled={uploadMut.isPending}
            className="flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition-all disabled:opacity-60"
            style={{
              borderColor: "#AF7F35",
              color: "#AF7F35",
              background: "rgba(255,253,247,0.9)",
            }}
          >
            <Camera className="size-4" /> Tirar foto
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={onFile}
        />

        {progress && (
          <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#16324F]">
            <Loader2 className="size-3.5 animate-spin" /> {progress}
          </p>
        )}
        {erro && (
          <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-700">
            <AlertCircle className="size-3.5" /> {erro}
          </p>
        )}

        <p className="mt-3 text-[10px] leading-relaxed text-[#8A7C5C]">
          Leitura nutricional (CFN 306/2003). Não substitui avaliação médica.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#AF7F35]">
          Histórico
        </h2>

        {isLoading && (
          <div className="grid place-items-center py-10">
            <Loader2 className="size-5 animate-spin text-[#16324F]" />
          </div>
        )}

        {!isLoading && (data?.length ?? 0) === 0 && (
          <div
            className="rounded-2xl border border-dashed p-6 text-center text-sm text-[#3E4F65]"
            style={{ borderColor: "rgba(216,198,160,0.8)" }}
          >
            Nenhum exame ainda. Envie o primeiro acima.
          </div>
        )}

        <ul className="space-y-3">
          {(data ?? []).map((e) => (
            <li
              key={e.id}
              className="rounded-2xl border bg-white/80 p-4"
              style={{ borderColor: "rgba(216,198,160,0.6)" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#16324F]">
                    {e.nome_arquivo}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#5C5749]">
                    {new Date(e.created_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <StatusBadge exame={e} />
              </div>

              {e.ia_status === "ok" && e.ia_resumo && e.revisao_status !== "enviado" && (
                <div className="mt-3 rounded-xl bg-[#F5EFE1]/70 p-3 text-xs leading-relaxed text-[#3E4F65]">
                  <p className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#AF7F35]">
                    <Sparkles className="size-3" /> Leitura prévia da IA
                  </p>
                  <p>{e.ia_resumo}</p>
                  <p className="mt-2 text-[10px] italic text-[#8A7C5C]">
                    A Gabriela ainda vai revisar essa leitura e te responder no WhatsApp com o parecer final.
                  </p>
                </div>
              )}

              {e.revisao_status === "enviado" && (
                <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#16324F]">
                  <CheckCircle2 className="size-3.5" style={{ color: "#2E7D32" }} />
                  Enviado no seu WhatsApp {e.enviado_em
                    ? `· ${new Date(e.enviado_em).toLocaleDateString("pt-BR")}`
                    : ""}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatusBadge({ exame }: { exame: Exame }) {
  if (exame.revisao_status === "enviado") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#DDEBD8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#2E7D32]">
        <CheckCircle2 className="size-3" /> Enviado
      </span>
    );
  }
  if (exame.ia_status === "erro") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-red-700">
        <AlertCircle className="size-3" /> Falha
      </span>
    );
  }
  if (exame.ia_status === "ok") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F0E4C6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#AF7F35]">
        <Clock className="size-3" /> Em revisão
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#E5EFF7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#16324F]">
      <Loader2 className="size-3 animate-spin" /> Analisando
    </span>
  );
}
