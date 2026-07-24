import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  MessageSquare,
  GitBranch,
  MapPinned,
  Sparkles,
  Crown,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import {
  getEvents,
  getLeads,
  seedAdminDemoIfEmpty,
} from "@/lib/analytics";
import { listarLeadsAtencao } from "@/lib/mapa-access.functions";

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

type LeadAtencao = {
  id: string;
  nome: string;
  telefone: string;
  status: string;
  motivo: string;
  criadoEm: string;
};

const MOTIVO_LABEL: Record<string, string> = {
  envio_dia1_falhou: "WhatsApp não enviou (dia 1)",
  sem_feedback_3d: "3+ dias sem responder",
};

function DashboardPage() {
  const [ready, setReady] = useState(false);
  const [atencao, setAtencao] = useState<LeadAtencao[]>([]);
  const carregarAtencao = useServerFn(listarLeadsAtencao);

  useEffect(() => {
    seedAdminDemoIfEmpty();
    setReady(true);
    carregarAtencao()
      .then((rows) => setAtencao(rows as LeadAtencao[]))
      .catch(() => {
        /* silencioso — sem cobrança */
      });
  }, [carregarAtencao]);

  const events = useMemo(() => (ready ? getEvents() : []), [ready]);
  const leads = useMemo(() => (ready ? getLeads() : []), [ready]);

  const counts: Record<string, number> = {};
  for (const e of events) counts[e.name] = (counts[e.name] || 0) + 1;

  const kpis = [
    { label: "Leads no sistema", value: String(leads.length) },
    { label: "Mapas completos", value: String(counts.quiz_completed || 0) },
    { label: "Compras", value: String(counts.purchase_completed || 0) },
    {
      label: "Conversão",
      value:
        counts.landing_view && counts.purchase_completed
          ? `${Math.round((counts.purchase_completed / counts.landing_view) * 100)}%`
          : "—",
    },
  ];

  const cards: Array<{
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    desc: string;
  }> = [
    { to: "/admin/crm", icon: MessageSquare, title: "CRM & Chat", desc: "Conversas com leads, tags e escalonamento." },
    { to: "/admin/funis", icon: GitBranch, title: "Funis de mensagem", desc: "Fluxos automáticos por app e gatilho." },
    { to: "/admin/mapa", icon: MapPinned, title: "Mapa do Lipedema", desc: "Leads, funil e cadastros do quiz." },
    { to: "/admin/protocolo", icon: Sparkles, title: "Protocolo 7 dias", desc: "Configurações, conteúdos e progresso." },
    { to: "/admin/derma", icon: Crown, title: "Método Derma", desc: "Assinantes e conteúdos premium." },
  ];

  return (
    <div>
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#B8974D]">
          Painel interno
        </p>
        <h1
          className="mt-1 text-3xl italic text-[#0B2A4A] md:text-4xl"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          Bem-vinda, Gabriela.
        </h1>
        <p className="mt-1 max-w-xl text-sm text-[#3E4F65]">
          Aqui você acompanha, responde e ajusta cada camada do Zero Lipedema.
        </p>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-[#E5DBC3] bg-white/70 p-4 backdrop-blur"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A7C5C]">
              {k.label}
            </p>
            <p
              className="mt-2 text-3xl italic text-[#0B2A4A] tabular-nums"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              {k.value}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="size-4 text-[#B8974D]" />
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8A7C5C]">
            Áreas do painel
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="group rounded-2xl border border-[#E5DBC3] bg-white/80 p-5 transition-all hover:-translate-y-0.5 hover:border-[#B8974D] hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-[#EFE5CE] text-[#0B2A4A]">
                  <c.icon className="size-5" />
                </div>
                <h3
                  className="text-lg italic text-[#0B2A4A]"
                  style={{ fontFamily: '"Playfair Display", serif' }}
                >
                  {c.title}
                </h3>
              </div>
              <p className="mt-3 text-sm text-[#3E4F65]">{c.desc}</p>
              <p className="mt-3 text-xs font-semibold text-[#B8974D] group-hover:underline">
                Abrir →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
