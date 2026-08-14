import { MessageSquare, BellDot, ClipboardList, Crown } from "lucide-react";
import { ETAPAS, type Etapa } from "@/lib/crm-labels";
import { C, R, CARD, COR_ETAPA } from "./crm-ui";

export type CrmStatsProps = {
  total: number;
  naoLidas: number;
  comMapa: number;
  clientes: number;
  /** Contagem por etapa, na ordem de ETAPAS. */
  porEtapa: Record<Etapa, number>;
};

type MetricaProps = {
  label: string;
  valor: number;
  icone: React.ComponentType<{ className?: string }>;
  destaque?: boolean;
};

function Metrica({ label, valor, icone: Icon, destaque }: MetricaProps) {
  return (
    <div style={{ ...CARD, padding: 20 }}>
      <div className="flex items-center gap-2">
        <Icon
          className="size-4"
          style={{ color: destaque ? C.danger : C.gold }}
        />
        <p
          className="text-[13px] font-medium"
          style={{ color: C.textSecondary }}
        >
          {label}
        </p>
      </div>
      <p
        className="mt-2 text-[30px] font-bold leading-none tabular-nums"
        style={{ color: destaque && valor > 0 ? C.danger : C.textPrimary }}
      >
        {valor}
      </p>
    </div>
  );
}

/** Faixa de métricas + distribuição do funil, no topo do CRM. */
export function CrmStats({
  total,
  naoLidas,
  comMapa,
  clientes,
  porEtapa,
}: CrmStatsProps) {
  const maior = Math.max(1, ...ETAPAS.map((e) => porEtapa[e.id] ?? 0));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metrica label="Conversas" valor={total} icone={MessageSquare} />
        <Metrica label="Não lidas" valor={naoLidas} icone={BellDot} destaque />
        <Metrica label="Com Mapa" valor={comMapa} icone={ClipboardList} />
        <Metrica label="Clientes" valor={clientes} icone={Crown} />
      </div>

      <div style={{ ...CARD, padding: 20 }}>
        <p
          className="text-[13px] font-bold uppercase"
          style={{ letterSpacing: "0.14em", color: C.goldLabel }}
        >
          Distribuição do funil
        </p>
        <div className="mt-4 space-y-3">
          {ETAPAS.map((e) => {
            const n = porEtapa[e.id] ?? 0;
            return (
              <div key={e.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <p
                    className="text-[13px] font-semibold"
                    style={{ color: C.textPrimary }}
                  >
                    {e.label}
                  </p>
                  <p
                    className="text-[12px] tabular-nums"
                    style={{ color: C.textMuted }}
                  >
                    {n} {total > 0 ? `· ${Math.round((n / total) * 100)}%` : ""}
                  </p>
                </div>
                <div
                  className="mt-1.5 overflow-hidden"
                  style={{ background: C.track, height: 6, borderRadius: R.pill }}
                >
                  <div
                    style={{
                      width: `${Math.round((n / maior) * 100)}%`,
                      height: "100%",
                      borderRadius: R.pill,
                      background: COR_ETAPA[e.id],
                      transition: "width .35s ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
