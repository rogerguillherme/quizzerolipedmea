import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { getApp } from "../lib/quiz-store";
import { addRefund, track, saveEscalations, getEscalations } from "../lib/analytics";

export const Route = createFileRoute("/app/reembolso")({
  component: Reembolso,
});

function Reembolso() {
  const app = getApp();
  const navigate = useNavigate();
  const [motivo, setMotivo] = useState("");
  const [enviado, setEnviado] = useState<null | "aprovado" | "em_revisao">(null);

  const diasCompletos = useMemo(() => {
    const c = app.concluidos || {};
    // A day counts as "completed" if all 4 missions are marked.
    return Object.values(c).filter((arr) => (arr as string[]).length >= 4).length;
  }, [app.concluidos]);

  const engajamentoMinimo = diasCompletos >= 5;

  function enviar() {
    if (!motivo.trim()) return;
    const status: "aprovado" | "em_revisao" = engajamentoMinimo ? "aprovado" : "em_revisao";
    addRefund({
      id: crypto.randomUUID(),
      nome: app.nome || "Sem nome",
      telefone: app.telefone || "",
      motivo,
      diasCompletos,
      status,
      createdAt: Date.now(),
    });
    track("refund_requested", { status, diasCompletos });
    // Casos fora da regra caem na fila da Gabriela para revisão humana.
    if (status === "em_revisao") {
      const list = getEscalations();
      list.push({
        id: crypto.randomUUID(),
        leadNome: app.nome || "Sem nome",
        leadTelefone: app.telefone || "",
        pergunta: `Pedido de reembolso em revisão (${diasCompletos} dias de missão completos): ${motivo}`,
        createdAt: Date.now(),
      });
      saveEscalations(list);
    }
    setEnviado(status);
  }

  if (enviado) {
    return (
      <div className="px-5 pt-6">
        <div className="card-clinical p-6">
          <ShieldCheck className="size-8 text-primary" />
          <h1 className="mt-3 text-xl font-extrabold text-primary">
            {enviado === "aprovado"
              ? "Recebido — vamos processar seu reembolso"
              : "Recebido — a Gabriela vai olhar seu caso"}
          </h1>
          <p className="mt-2 text-sm text-foreground">
            {enviado === "aprovado"
              ? "Você completou os dias mínimos combinados. Vamos devolver o valor no mesmo método de pagamento em até 5 dias úteis. Sem cobrança de nada."
              : "Como você ainda não completou os dias mínimos da cadência, seu pedido cai na fila da Gabriela para revisão humana — não é negado automaticamente. Você recebe uma resposta pelo WhatsApp em até 24h."}
          </p>
          <button
            onClick={() => navigate({ to: "/app" })}
            className="mt-5 w-full rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pt-4">
      <div className="flex items-center gap-2">
        <Link to="/app/perfil" className="grid size-9 place-items-center rounded-xl text-primary hover:bg-accent">
          <ArrowLeft className="size-5" />
        </Link>
        <p className="font-bold text-primary">Pedir reembolso</p>
      </div>

      <div className="card-clinical mt-5 p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-sapphire-600">
          Como funciona
        </p>
        <p className="mt-2 text-sm text-foreground">
          A garantia dos 7 dias exige que você tenha completado a cadência mínima
          (5 dias de missão marcados no app). Se completou, o reembolso é aprovado
          automaticamente. Se não, a Gabriela olha seu caso pessoalmente — sem
          negativa automática.
        </p>

        <div className="mt-4 rounded-xl bg-sapphire-50 p-3">
          <p className="text-xs text-muted-foreground">Sua situação hoje</p>
          <p className="mt-1 text-lg font-extrabold text-primary">
            {diasCompletos} de 5 dias mínimos completos
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sapphire-100">
            <div
              className="h-full rounded-full bg-coral"
              style={{ width: `${Math.min(100, (diasCompletos / 5) * 100)}%` }}
            />
          </div>
        </div>

        {!engajamentoMinimo && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-coral/40 bg-coral-soft/30 p-3 text-xs text-primary">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-coral" />
            <p>
              Seu pedido vai para revisão humana da Gabriela — não é negado. Ela responde
              pelo WhatsApp em até 24h.
            </p>
          </div>
        )}
      </div>

      <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-sapphire-600">
        O que aconteceu?
      </label>
      <textarea
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Conta pra gente com suas palavras — quanto mais direto, melhor."
        rows={5}
        className="mt-1 w-full rounded-xl border border-input bg-card p-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring"
      />

      <button
        onClick={enviar}
        disabled={!motivo.trim()}
        className="mt-5 w-full rounded-2xl bg-coral px-5 py-4 text-base font-bold text-coral-foreground disabled:opacity-40"
      >
        Enviar pedido
      </button>
    </div>
  );
}
