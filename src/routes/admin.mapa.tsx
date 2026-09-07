import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Loader2, Phone, Calendar, FileText, Crown, Check } from "lucide-react";
import { listQuizLeads } from "@/lib/admin-leads.functions";
import { enviarAcessoPremium } from "@/lib/premium-access.functions";

export const Route = createFileRoute("/admin/mapa")({
  ssr: false,
  component: MapaAdminPage,
});

type QuizLead = {
  id: string;
  nome: string;
  telefone: string;
  respostas: Record<string, string> | null;
  diagnostico: { estagio?: string } | null;
  status: string;
  created_at: string;
};

const RESPOSTA_LABELS: Record<string, string> = {
  tempo: "Tempo com sintomas",
  diagnostico: "Diagnóstico",
  sintomaMaior: "Sintoma principal",
  pesoPernas: "Peso × pernas",
  dietaExercicio: "Dieta & exercício",
  atividade: "Nível de atividade",
  exames: "Exames recentes",
  objetivo: "Objetivo",
};

function MapaAdminPage() {
  const fetchLeads = useServerFn(listQuizLeads);
  const liberarPremium = useServerFn(enviarAcessoPremium);
  const qc = useQueryClient();
  // Só chamamos a server fn protegida depois que a sessão existe no cliente;
  // sem isso o bearer não é anexado e o servidor responde "No authorization header".
  const [sessionReady, setSessionReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.auth.getSession();
      if (!cancelled) setSessionReady(!!data.session);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { data, isLoading: queryLoading, error } = useQuery({
    queryKey: ["admin", "quiz-leads"],
    queryFn: () => fetchLeads(),
    enabled: sessionReady,
    retry: false,
  });

  const premiumMut = useMutation({
    mutationFn: (leadId: string) => liberarPremium({ data: { leadId } }),
    onSuccess: (r, leadId) => {
      qc.invalidateQueries({ queryKey: ["admin", "quiz-leads"] });
      if (r.ok) alert("Acesso Premium enviado no WhatsApp ✓");
      else alert(`Falhou: ${r.erro ?? "erro"}`);
      void leadId;
    },
    onError: (e: Error) => alert(`Erro: ${e.message}`),
  });

  const isLoading = !sessionReady || queryLoading;
  const leads = (data ?? []) as QuizLead[];
  const [busca, setBusca] = useState("");
  const [expandido, setExpandido] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!busca.trim()) return leads;
    const q = busca.toLowerCase();
    return leads.filter((l) =>
      `${l.nome} ${l.telefone}`.toLowerCase().includes(q),
    );
  }, [leads, busca]);

  const total = leads.length;
  const comTelefone = leads.filter(
    (l) => l.telefone && l.telefone !== "pendente" && l.telefone.length >= 8,
  ).length;
  const comDiagnostico = leads.filter((l) => l.diagnostico).length;

  return (
    <div>
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#B8974D]">
          App · Mapa do Lipedema
        </p>
        <h1
          className="mt-1 text-3xl italic text-[#0B2A4A]"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          Leads do quiz
        </h1>
        <p className="mt-1 text-sm text-[#5A6B7F]">
          Todas as pessoas que preencheram a avaliação do Mapa.
        </p>
      </header>

      <section className="mt-6 grid grid-cols-3 gap-2">
        <Stat label="Total" value={total} />
        <Stat label="Com telefone" value={comTelefone} />
        <Stat label="Com leitura" value={comDiagnostico} />
      </section>

      <section className="mt-8">
        <div className="flex items-center gap-2 rounded-xl border border-[#E5DBC3] bg-white/70 px-3">
          <Search className="size-4 text-[#8A7C5C]" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou telefone"
            className="flex-1 bg-transparent py-2 text-sm outline-none"
          />
        </div>

        {isLoading && (
          <div className="mt-8 flex justify-center">
            <Loader2 className="size-5 animate-spin text-[#0B2A4A]" />
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Não consegui carregar os leads: {(error as Error).message}
          </div>
        )}

        {!isLoading && !error && (
          <div className="mt-4 space-y-2">
            {filtered.length === 0 && (
              <div className="rounded-2xl border border-[#E5DBC3] bg-white/70 p-8 text-center text-sm text-[#8A7C5C]">
                Nenhum lead encontrado.
              </div>
            )}
            {filtered.map((l) => {
              const aberto = expandido === l.id;
              const dataFmt = new Date(l.created_at).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });
              const telOk =
                l.telefone && l.telefone !== "pendente" && l.telefone.length >= 8;
              return (
                <div
                  key={l.id}
                  className="overflow-hidden rounded-2xl border border-[#E5DBC3] bg-white/70"
                >
                  <button
                    onClick={() => setExpandido(aberto ? null : l.id)}
                    className="grid w-full grid-cols-[1fr_auto] items-center gap-3 p-4 text-left"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#0B2A4A]">
                        {l.nome}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[#8A7C5C]">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3" />
                          {telOk ? l.telefone : "sem telefone"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="size-3" />
                          {dataFmt}
                        </span>
                      </div>
                    </div>
                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-[11px] font-bold",
                        l.diagnostico
                          ? "bg-[#EFE5CE] text-[#0B2A4A]"
                          : "bg-[#F1E9D8] text-[#8A7C5C]",
                      ].join(" ")}
                    >
                      {l.diagnostico?.estagio ?? "Sem leitura"}
                    </span>
                  </button>

                  {aberto && (
                    <div className="border-t border-[#E5DBC3] bg-[#FBF6EA] p-4">
                      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A7C5C]">
                        <FileText className="size-3" /> Respostas do quiz
                      </div>
                      {l.respostas ? (
                        <dl className="space-y-2 text-sm">
                          {Object.entries(RESPOSTA_LABELS).map(([k, label]) => {
                            const v = l.respostas?.[k];
                            if (!v) return null;
                            return (
                              <div key={k}>
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#B8974D]">
                                  {label}
                                </dt>
                                <dd className="text-[#0B2A4A]">{v}</dd>
                              </div>
                            );
                          })}
                        </dl>
                      ) : (
                        <p className="text-sm text-[#8A7C5C]">
                          Sem respostas gravadas.
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={
                            !telOk ||
                            premiumMut.isPending ||
                            l.status === "plano_ativo"
                          }
                          onClick={() => {
                            if (
                              confirm(
                                `Liberar acesso Premium para ${l.nome}? Isso envia a mensagem no WhatsApp e marca como plano_ativo.`,
                              )
                            ) {
                              premiumMut.mutate(l.id);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#0B2A4A] px-3 py-1.5 text-xs font-bold text-[#F5EBD1] shadow-sm transition hover:bg-[#0B2A4A]/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {premiumMut.isPending && premiumMut.variables === l.id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : l.status === "plano_ativo" ? (
                            <Check className="size-3" />
                          ) : (
                            <Crown className="size-3" />
                          )}
                          {l.status === "plano_ativo"
                            ? "Premium ativo"
                            : "Liberar Premium"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[#E5DBC3] bg-white/70 p-3 text-center">
      <p className="text-2xl font-bold tabular-nums text-[#0B2A4A]">{value}</p>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A7C5C]">
        {label}
      </p>
    </div>
  );
}
