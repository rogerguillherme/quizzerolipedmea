import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  FileText,
  Sparkles,
  Send,
  RefreshCw,
  Save,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  listarExamesAdmin,
  reanalisarExame,
  salvarRevisaoExame,
  enviarLeituraExame,
  gerarUrlAssinadaExame,
} from "@/lib/exames.functions";

export const Route = createFileRoute("/admin/exames")({
  component: ExamesAdminPage,
  head: () => ({
    meta: [
      { title: "Exames · Painel Gabriela" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Row = Awaited<ReturnType<typeof listarExamesAdmin>>[number];

const FILTROS = [
  { key: "todos", label: "Todos" },
  { key: "aguardando", label: "A revisar" },
  { key: "enviado", label: "Enviados" },
  { key: "erro", label: "Falhas IA" },
] as const;
type FiltroKey = (typeof FILTROS)[number]["key"];

function ExamesAdminPage() {
  const listar = useServerFn(listarExamesAdmin);
  const reanalisar = useServerFn(reanalisarExame);
  const salvar = useServerFn(salvarRevisaoExame);
  const enviar = useServerFn(enviarLeituraExame);
  const assinar = useServerFn(gerarUrlAssinadaExame);
  const qc = useQueryClient();

  const [filtro, setFiltro] = useState<FiltroKey>("aguardando");
  const [selId, setSelId] = useState<string | null>(null);
  const [texto, setTexto] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "exames"],
    queryFn: () => listar(),
    refetchInterval: 15000,
  });

  const rows = (data ?? []) as Row[];
  const filtered = useMemo(() => {
    if (filtro === "todos") return rows;
    if (filtro === "enviado") return rows.filter((r) => r.revisao_status === "enviado");
    if (filtro === "erro") return rows.filter((r) => r.ia_status === "erro");
    return rows.filter(
      (r) => r.revisao_status === "aguardando" || r.revisao_status === "editado" || r.revisao_status === "aprovado",
    );
  }, [rows, filtro]);

  const selected = rows.find((r) => r.id === selId) ?? null;

  // Hidrata o textarea SOMENTE ao trocar de exame. Os refetches de 15s e as
  // invalidações das mutations não podem apagar o que a Gabriela já digitou.
  const hidratadoRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selected) {
      hidratadoRef.current = null;
      return;
    }
    if (hidratadoRef.current === selected.id) return;
    hidratadoRef.current = selected.id;
    setTexto(selected.revisao_texto ?? "");
  }, [selected]);

  const abrirArquivo = async () => {
    if (!selected) return;
    const r = await assinar({ data: { id: selected.id } });
    window.open(r.url, "_blank", "noopener,noreferrer");
  };

  const reMut = useMutation({
    mutationFn: (id: string) => reanalisar({ data: { id } }),
    onSuccess: async () => {
      // A reanálise reescreve o texto no servidor: liberamos a hidratação
      // para que o novo texto da IA apareça no textarea.
      hidratadoRef.current = null;
      await qc.invalidateQueries({ queryKey: ["admin", "exames"] });
    },
  });

  const saveMut = useMutation({
    mutationFn: (opts: { id: string; status: "aprovado" | "editado" | "recusado" }) =>
      salvar({ data: { id: opts.id, texto, status: opts.status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "exames"] });
      alert("Revisão salva ✓");
    },
  });
  const sendMut = useMutation({
    mutationFn: (id: string) => enviar({ data: { id, texto } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["admin", "exames"] });
      if (r.ok) alert("Enviado no WhatsApp ✓");
      else alert(`Falhou: ${r.erro}`);
    },
  });

  return (
    <div>
      <header className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B8974D]">
          Painel Gabriela
        </p>
        <h1 className="mt-1 text-2xl italic text-[#0B2A4A]" style={{ fontFamily: '"Playfair Display", serif' }}>
          Exames — leitura e revisão
        </h1>
        <p className="mt-1 text-sm text-[#3E4F65]">
          Cada exame enviado pelas pacientes recebe leitura nutricional automática.
          Você revisa, edita se precisar e envia pelo WhatsApp.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTROS.map((f) => {
          const active = f.key === filtro;
          const n =
            f.key === "todos"
              ? rows.length
              : f.key === "enviado"
                ? rows.filter((r) => r.revisao_status === "enviado").length
                : f.key === "erro"
                  ? rows.filter((r) => r.ia_status === "erro").length
                  : rows.filter(
                      (r) =>
                        r.revisao_status === "aguardando" ||
                        r.revisao_status === "editado" ||
                        r.revisao_status === "aprovado",
                    ).length;
          return (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={[
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "bg-[#0B2A4A] text-[#F7F2E8]"
                  : "border border-[#E5DBC3] bg-[#FBF6EB] text-[#3E4F65] hover:bg-[#EFE5CE]",
              ].join(" ")}
            >
              {f.label} <span className="ml-1 opacity-70">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        {/* Lista */}
        <aside className="rounded-2xl border border-[#E5DBC3] bg-[#FBF6EB]/80">
          {isLoading && (
            <div className="grid place-items-center py-12">
              <Loader2 className="size-5 animate-spin text-[#0B2A4A]" />
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <p className="p-6 text-center text-sm text-[#5C5749]">
              Nada nesta fila.
            </p>
          )}
          <ul className="max-h-[70vh] divide-y divide-[#EFE5CE] overflow-y-auto">
            {filtered.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => setSelId(r.id)}
                  className={[
                    "w-full px-4 py-3 text-left transition-colors",
                    selId === r.id ? "bg-[#EFE5CE]" : "hover:bg-[#F5ECD4]",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#0B2A4A]">
                        {r.paciente_nome ?? "—"}
                      </p>
                      <p className="truncate text-[11px] text-[#5C5749]">
                        {r.paciente_telefone ?? "sem telefone"} · {r.nome_arquivo}
                      </p>
                    </div>
                    <ItemBadge row={r} />
                  </div>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#8A7C5C]">
                    {new Date(r.created_at).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Detalhe */}
        <section className="rounded-2xl border border-[#E5DBC3] bg-white p-4 lg:p-5">
          {!selected && (
            <div className="grid h-full min-h-[40vh] place-items-center text-center text-sm text-[#5C5749]">
              <div>
                <FileText className="mx-auto mb-2 size-6 text-[#B8974D]" />
                Selecione um exame na lista para revisar.
              </div>
            </div>
          )}

          {selected && (
            <>
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#B8974D]">
                    Paciente
                  </p>
                  <p className="text-lg font-bold text-[#0B2A4A]">
                    {selected.paciente_nome ?? "—"}{" "}
                    <span className="text-sm font-normal text-[#5C5749]">
                      · {selected.paciente_telefone ?? "sem telefone"}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={abrirArquivo}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DBC3] px-3 py-1.5 text-xs font-semibold text-[#0B2A4A] hover:bg-[#F5ECD4]"
                  >
                    <ExternalLink className="size-3.5" /> Abrir arquivo
                  </button>
                  <button
                    onClick={() => reMut.mutate(selected.id)}
                    disabled={reMut.isPending}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DBC3] px-3 py-1.5 text-xs font-semibold text-[#0B2A4A] hover:bg-[#F5ECD4] disabled:opacity-60"
                  >
                    {reMut.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="size-3.5" />
                    )}
                    Reanalisar IA
                  </button>
                </div>
              </div>

              {selected.observacao_usuaria && (
                <div className="mb-3 rounded-xl bg-[#F5EFE1] px-3 py-2 text-xs text-[#3E4F65]">
                  <span className="font-bold">Contexto da paciente:</span>{" "}
                  {selected.observacao_usuaria}
                </div>
              )}

              {selected.ia_status === "erro" && (
                <div className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800">
                  <AlertTriangle className="mr-1 inline size-3.5" /> IA falhou:{" "}
                  {selected.ia_erro ?? "sem detalhe"}
                </div>
              )}

              {/* Itens estruturados */}
              {selected.ia_status === "ok" && (
                <div className="mb-4 rounded-2xl border border-[#EFE5CE] p-3">
                  <p className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#B8974D]">
                    <Sparkles className="size-3.5" /> Leitura da IA (
                    {selected.ia_modelo ?? "modelo"})
                  </p>
                  {selected.ia_resumo && (
                    <p className="mb-3 text-sm text-[#3E4F65]">{selected.ia_resumo}</p>
                  )}
                  <ul className="space-y-2">
                    {(Array.isArray(selected.ia_itens)
                      ? (selected.ia_itens as unknown as Array<{
                          exame?: string;
                          valor?: string;
                          referencia?: string;
                          flag?: string;
                          leituraNutricional?: string;
                          direcionamento?: string;
                          encaminharMedico?: boolean;
                        }>)
                      : []
                    ).map((i, idx) => (
                        <li
                          key={idx}
                          className="rounded-xl border border-[#F0E4C6] bg-[#FBF6EB]/60 p-3 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-[#0B2A4A]">
                              {i.exame}
                            </span>
                            <FlagPill flag={String(i.flag ?? "")} />
                          </div>
                          {(i.valor || i.referencia) && (
                            <p className="mt-0.5 text-[11px] text-[#5C5749]">
                              {i.valor}{" "}
                              {i.referencia ? (
                                <span className="opacity-70">(ref. {i.referencia})</span>
                              ) : null}
                            </p>
                          )}
                          {i.leituraNutricional && (
                            <p className="mt-1 text-[#3E4F65]">{i.leituraNutricional}</p>
                          )}
                          {i.direcionamento && (
                            <p className="mt-1 text-[#3E4F65]">
                              <span className="font-semibold">→</span> {i.direcionamento}
                            </p>
                          )}
                          {i.encaminharMedico && (
                            <p className="mt-1 font-semibold text-[#B8974D]">
                              ⚠ Encaminhar para avaliação médica
                            </p>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Texto que vai pra paciente */}
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.16em] text-[#B8974D]">
                Mensagem para a paciente (edite se precisar)
              </label>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                className="w-full rounded-2xl border border-[#E5DBC3] bg-white p-3 text-sm text-[#0B2A4A] outline-none focus:border-[#B8974D]"
                style={{ minHeight: 260, fontFamily: "'Nunito', sans-serif" }}
              />

              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button
                  onClick={() => saveMut.mutate({ id: selected.id, status: "recusado" })}
                  disabled={saveMut.isPending || sendMut.isPending}
                  className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  Marcar como recusado
                </button>
                <button
                  onClick={() => saveMut.mutate({ id: selected.id, status: "editado" })}
                  disabled={saveMut.isPending || sendMut.isPending}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E5DBC3] px-3 py-2 text-xs font-semibold text-[#0B2A4A] hover:bg-[#F5ECD4] disabled:opacity-60"
                >
                  {saveMut.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Save className="size-3.5" />
                  )}
                  Salvar rascunho
                </button>
                <button
                  onClick={() => {
                    if (
                      !confirm(
                        `Enviar essa leitura no WhatsApp de ${selected.paciente_nome ?? "paciente"}?`,
                      )
                    )
                      return;
                    sendMut.mutate(selected.id);
                  }}
                  disabled={sendMut.isPending || !texto.trim()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#0B2A4A] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#F7F2E8] hover:opacity-90 disabled:opacity-60"
                >
                  {sendMut.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Send className="size-3.5" />
                  )}
                  Aprovar e enviar
                </button>
              </div>

              {selected.revisao_status === "enviado" && (
                <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#2E7D32]">
                  <CheckCircle2 className="size-3.5" /> Enviado em{" "}
                  {selected.enviado_em
                    ? new Date(selected.enviado_em).toLocaleString("pt-BR")
                    : ""}
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function ItemBadge({ row }: { row: Row }) {
  if (row.revisao_status === "enviado")
    return (
      <span className="shrink-0 rounded-full bg-[#DDEBD8] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#2E7D32]">
        Enviado
      </span>
    );
  if (row.ia_status === "erro")
    return (
      <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-red-700">
        Falha
      </span>
    );
  if (row.ia_status === "ok")
    return (
      <span className="shrink-0 rounded-full bg-[#F0E4C6] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#B8974D]">
        Revisar
      </span>
    );
  return (
    <span className="shrink-0 rounded-full bg-[#E5EFF7] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#0B2A4A]">
      Analisando
    </span>
  );
}

function FlagPill({ flag }: { flag: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    alto: { bg: "#FCE4E4", fg: "#B23A48", label: "↑ Alto" },
    baixo: { bg: "#FFF1CC", fg: "#8B6A00", label: "↓ Baixo" },
    limitrofe: { bg: "#F0E4C6", fg: "#B8974D", label: "≈ Limítrofe" },
    normal: { bg: "#DDEBD8", fg: "#2E7D32", label: "✓ Normal" },
    indeterminado: { bg: "#E5DBC3", fg: "#5C5749", label: "?" },
  };
  const m = map[flag] ?? map.indeterminado;
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
      style={{ background: m.bg, color: m.fg }}
    >
      {m.label}
    </span>
  );
}
