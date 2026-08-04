import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  MessageSquare,
  GitBranch,
  MapPinned,
  Sparkles,
  Crown,
  TrendingUp,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { getDashboardKpis } from "@/lib/admin-leads.functions";

import { listarLeadsAtencao } from "@/lib/mapa-access.functions";
import { getTrafegoMetrics } from "@/lib/trafego.functions";

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
  const [atencao, setAtencao] = useState<LeadAtencao[]>([]);
  const [trafego, setTrafego] = useState<Awaited<ReturnType<typeof getTrafegoMetrics>> | null>(null);
  const [kpiData, setKpiData] = useState<Awaited<ReturnType<typeof getDashboardKpis>> | null>(null);
  const carregarAtencao = useServerFn(listarLeadsAtencao);
  const carregarTrafego = useServerFn(getTrafegoMetrics);
  const carregarKpis = useServerFn(getDashboardKpis);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.auth.getSession();
      if (cancelled || !data.session) return;
      try {
        const [rows, tr, kp] = await Promise.all([
          carregarAtencao(),
          carregarTrafego(),
          carregarKpis(),
        ]);
        if (!cancelled) {
          setAtencao(rows as LeadAtencao[]);
          setTrafego(tr);
          setKpiData(kp);
        }
      } catch {
        /* silencioso */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [carregarAtencao, carregarTrafego, carregarKpis]);

  // KPIs vêm do banco real; enquanto carregam mostramos "—" em vez de números falsos.
  const kpis = [
    { label: "Leads no sistema", value: kpiData ? String(kpiData.leads) : "—" },
    { label: "Mapas completos", value: kpiData ? String(kpiData.mapasCompletos) : "—" },
    { label: "Compras", value: kpiData ? String(kpiData.compras) : "—" },
    {
      label: "Conversão",
      value:
        kpiData && kpiData.conversao !== null
          ? `${Math.round(kpiData.conversao * 100)}%`
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

      {atencao.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="size-4 text-[#B23A48]" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B23A48]">
              Fila de atenção ({atencao.length})
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#E5DBC3] bg-white/80">
            <table className="w-full text-sm">
              <thead className="bg-[#FBF6EB] text-[10px] uppercase tracking-[0.14em] text-[#8A7C5C]">
                <tr>
                  <th className="px-4 py-2.5 text-left">Lead</th>
                  <th className="px-4 py-2.5 text-left">WhatsApp</th>
                  <th className="px-4 py-2.5 text-left">Motivo</th>
                  <th className="px-4 py-2.5 text-left">Quando</th>
                </tr>
              </thead>
              <tbody>
                {atencao.map((l) => (
                  <tr key={l.id} className="border-t border-[#E5DBC3] text-[#0B2A4A]">
                    <td className="px-4 py-2.5 font-medium">{l.nome}</td>
                    <td className="px-4 py-2.5 tabular-nums text-[#3E4F65]">{l.telefone}</td>
                    <td className="px-4 py-2.5 text-[#B23A48]">
                      {MOTIVO_LABEL[l.motivo] ?? l.motivo}
                    </td>
                    <td className="px-4 py-2.5 text-[#3E4F65]">
                      {new Date(l.criadoEm).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {trafego && (
        <section className="mt-10">
          <div className="mb-3 flex items-center gap-2">
            <Eye className="size-4 text-[#B8974D]" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8A7C5C]">
              Tráfego · hoje
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-[#E5DBC3] bg-white/80 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A7C5C]">Page views</p>
              <p className="mt-2 text-3xl italic text-[#0B2A4A] tabular-nums" style={{ fontFamily: '"Playfair Display", serif' }}>
                {trafego.today.views}
              </p>
            </div>
            <div className="rounded-2xl border border-[#E5DBC3] bg-white/80 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A7C5C]">Visitantes únicos</p>
              <p className="mt-2 text-3xl italic text-[#0B2A4A] tabular-nums" style={{ fontFamily: '"Playfair Display", serif' }}>
                {trafego.today.sessions}
              </p>
            </div>
            <div className="rounded-2xl border border-[#E5DBC3] bg-white/80 p-4 md:col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A7C5C]">Últimos 7 dias</p>
              <div className="mt-3 flex h-16 items-end gap-1">
                {trafego.daily.map((d) => {
                  const max = Math.max(1, ...trafego.daily.map((x) => x.views));
                  const h = Math.max(4, Math.round((d.views / max) * 60));
                  return (
                    <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                      <div className="w-full rounded-t bg-[#B8974D]" style={{ height: `${h}px` }} title={`${d.date}: ${d.views}`} />
                      <span className="text-[9px] text-[#8A7C5C]">{d.date.slice(-2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E5DBC3] bg-white/80 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A7C5C]">Páginas mais vistas hoje</p>
              <ul className="mt-2 space-y-1 text-sm text-[#0B2A4A]">
                {trafego.today.topPaths.length === 0 && <li className="text-[#8A7C5C]">Sem visitas ainda hoje.</li>}
                {trafego.today.topPaths.map((p) => (
                  <li key={p.path} className="flex justify-between gap-2">
                    <span className="truncate font-mono text-xs">{p.path}</span>
                    <span className="tabular-nums text-[#B8974D]">{p.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-[#E5DBC3] bg-white/80 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A7C5C]">Origens de tráfego (hoje)</p>
              <ul className="mt-2 space-y-1 text-sm text-[#0B2A4A]">
                {trafego.today.topReferrers.length === 0 && <li className="text-[#8A7C5C]">—</li>}
                {trafego.today.topReferrers.map((r) => (
                  <li key={r.source} className="flex justify-between gap-2">
                    <span className="truncate">{r.source}</span>
                    <span className="tabular-nums text-[#B8974D]">{r.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

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
