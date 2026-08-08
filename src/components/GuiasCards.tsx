import { Link } from "@tanstack/react-router";
import { ChevronRight, Droplets, Leaf, UtensilsCrossed } from "lucide-react";
import { GUIAS, type Guia } from "@/lib/guias-content";

const NAVY = "#16324F";
const GOLD = "#AF7F35";

export const GUIA_ICONS: Record<Guia["iconKey"], React.ReactNode> = {
  utensils: <UtensilsCrossed className="size-4" />,
  leaf: <Leaf className="size-4" />,
  droplets: <Droplets className="size-4" />,
};

const CARD: React.CSSProperties = {
  background: "rgba(255,253,247,0.9)",
  border: "1px solid rgba(216,198,160,0.55)",
  boxShadow: "0 10px 24px -20px rgba(22,50,79,0.3)",
};

/** Lista dos 3 guias em cards. Usada no índice e nas seções de descoberta. */
export function GuiasCards({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-2.5">
      {GUIAS.map((g) => (
        <Link
          key={g.slug}
          to="/app/guias/$slug"
          params={{ slug: g.slug }}
          className="flex items-center gap-3 rounded-[20px] px-4 py-3.5"
          style={CARD}
        >
          <span
            className="grid size-9 shrink-0 place-items-center rounded-full"
            style={{ background: "rgba(175,127,53,0.12)", color: GOLD }}
          >
            {GUIA_ICONS[g.iconKey]}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="text-[14px]"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, color: NAVY }}
            >
              {g.titulo}
            </p>
            {!compact && (
              <p className="mt-0.5 text-[12px]" style={{ color: "#5C5749", lineHeight: 1.45 }}>
                {g.resumo}
              </p>
            )}
          </div>
          <ChevronRight className="size-4 shrink-0" style={{ color: GOLD }} />
        </Link>
      ))}
    </div>
  );
}
