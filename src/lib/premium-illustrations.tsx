import type { ReactElement } from "react";

/**
 * Ilustrações SVG dos entregáveis do Plano Premium.
 * Ficam separadas de `premium-features.ts` de propósito: aquele arquivo é
 * importado por código de servidor e não pode carregar JSX/React.
 * Os SVGs são desenhados sem fundo — o card do carrossel fornece o gradiente.
 */

const NAVY = "#16324F";
const GOLD = "#AF7F35";
const GOLD_LIGHT = "#E7BE5C";
const SAND = "#D8C6A0";
const CREAM = "#F5EFE1";
const WHITE = "#FFFDF7";
const SAGE = "#8FA98A";

type Props = { className?: string };

function Svg({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 240 150" className={className} fill="none" aria-hidden focusable="false">
      {children}
    </svg>
  );
}

/** 1 · Rotina — quatro refeições ajustadas, uma por semana. */
function IlustraRotina({ className }: Props) {
  const semanas = [2, 3, 4];
  return (
    <Svg className={className}>
      <line x1="42" y1="86" x2="204" y2="86" stroke={SAND} strokeWidth="3" strokeLinecap="round" strokeDasharray="1 11" />
      <circle cx="42" cy="86" r="23" fill={GOLD} />
      <circle cx="42" cy="86" r="15" fill={WHITE} opacity="0.22" />
      <path d="M34 86 l6 6 l10 -13" stroke={WHITE} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      {semanas.map((n, i) => (
        <g key={n}>
          <circle cx={96 + i * 54} cy="86" r="21" fill={WHITE} stroke={SAND} strokeWidth="2.5" />
          <text x={96 + i * 54} y="92" textAnchor="middle" fontSize="17" fontWeight="600" fill={NAVY} opacity="0.5" fontFamily="'Playfair Display', serif">{n}</text>
        </g>
      ))}
      <text x="42" y="130" textAnchor="middle" fontSize="11" fill={GOLD} fontWeight="700" letterSpacing="1.4">SEM 1</text>
      <path d="M120 34 c14 -12 32 -12 46 0" stroke={GOLD_LIGHT} strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      <circle cx="120" cy="34" r="3" fill={GOLD_LIGHT} opacity="0.7" />
    </Svg>
  );
}

/** 2 · Registro por foto — celular lendo o prato. */
function IlustraFoto({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="70" y="12" width="100" height="126" rx="16" fill={NAVY} />
      <rect x="105" y="20" width="30" height="4" rx="2" fill={WHITE} opacity="0.35" />
      <rect x="78" y="30" width="84" height="86" rx="9" fill={WHITE} />
      <circle cx="120" cy="62" r="23" fill={CREAM} stroke={SAND} strokeWidth="2" />
      <circle cx="112" cy="56" r="6" fill={SAGE} />
      <circle cx="127" cy="60" r="5" fill={GOLD} />
      <circle cx="118" cy="71" r="4.5" fill={GOLD_LIGHT} />
      <path d="M92 46 v-6 a3 3 0 0 1 3 -3 h6" stroke={GOLD} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M148 46 v-6 a3 3 0 0 0 -3 -3 h-6" stroke={GOLD} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M92 78 v6 a3 3 0 0 0 3 3 h6" stroke={GOLD} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M148 78 v6 a3 3 0 0 1 -3 3 h-6" stroke={GOLD} strokeWidth="2.4" strokeLinecap="round" />
      <rect x="90" y="96" width="60" height="5" rx="2.5" fill={SAND} />
      <rect x="90" y="106" width="40" height="5" rx="2.5" fill={SAND} opacity="0.55" />
      <circle cx="120" cy="127" r="6" fill={GOLD_LIGHT} />
      <path d="M188 52 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z" fill={GOLD_LIGHT} opacity="0.75" />
      <circle cx="46" cy="92" r="7" fill={GOLD} opacity="0.35" />
    </Svg>
  );
}

/** 3 · Dicas diárias — bolha de conversa com uma ideia. */
function IlustraDicas({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M46 26 h148 a16 16 0 0 1 16 16 v46 a16 16 0 0 1 -16 16 h-108 l-22 18 v-18 h-18 a16 16 0 0 1 -16 -16 v-46 a16 16 0 0 1 16 -16 z" fill={WHITE} stroke={SAND} strokeWidth="2.5" />
      <circle cx="82" cy="60" r="15" fill={GOLD_LIGHT} />
      <rect x="75" y="74" width="14" height="7" rx="3" fill={NAVY} />
      <path d="M82 34 v7 M60 45 l5 4 M104 45 l-5 4" stroke={GOLD} strokeWidth="2.4" strokeLinecap="round" />
      <rect x="112" y="50" width="76" height="7" rx="3.5" fill={SAND} />
      <rect x="112" y="65" width="54" height="7" rx="3.5" fill={SAND} opacity="0.55" />
      <rect x="150" y="118" width="56" height="24" rx="12" fill={NAVY} />
      <circle cx="166" cy="130" r="3" fill={CREAM} />
      <circle cx="178" cy="130" r="3" fill={CREAM} opacity="0.7" />
      <circle cx="190" cy="130" r="3" fill={CREAM} opacity="0.4" />
    </Svg>
  );
}

/** 4 · Plano alimentar — o prato dividido. */
function IlustraPlano({ className }: Props) {
  return (
    <Svg className={className}>
      <circle cx="120" cy="75" r="50" fill={WHITE} stroke={SAND} strokeWidth="3" />
      <circle cx="120" cy="75" r="41" fill={CREAM} />
      <path d="M120 34 A41 41 0 0 0 120 116 Z" fill={GOLD_LIGHT} />
      <path d="M120 75 L120 34 A41 41 0 0 1 161 75 Z" fill={SAGE} />
      <path d="M120 75 L161 75 A41 41 0 0 1 120 116 Z" fill={SAND} />
      <circle cx="120" cy="75" r="41" fill="none" stroke={WHITE} strokeWidth="2.5" />
      <path d="M40 40 v22 M34 40 v22 M46 40 v22" stroke={NAVY} strokeWidth="2.6" strokeLinecap="round" opacity="0.8" />
      <path d="M40 62 v48" stroke={NAVY} strokeWidth="3.4" strokeLinecap="round" opacity="0.8" />
      <path d="M200 40 c8 8 8 22 0 26 v44" stroke={NAVY} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" fill="none" />
    </Svg>
  );
}

/** 5 · Guia Natural — chá, shot e folha. */
function IlustraNatural({ className }: Props) {
  return (
    <Svg className={className}>
      <ellipse cx="112" cy="128" rx="44" ry="7" fill={SAND} />
      <path d="M84 66 h56 l-6 44 a12 12 0 0 1 -12 11 h-20 a12 12 0 0 1 -12 -11 z" fill={WHITE} stroke={NAVY} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M140 76 a15 15 0 0 1 0 26" stroke={NAVY} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M84 66 h56" stroke={NAVY} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M100 54 c5 -8 -4 -13 1 -22 M112 52 c5 -9 -4 -14 1 -23 M124 54 c5 -8 -4 -13 1 -22" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M176 96 c0 -20 15 -34 34 -34 c0 20 -15 34 -34 34 z" fill={SAGE} />
      <path d="M210 62 c-14 8 -25 20 -30 32" stroke={WHITE} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <rect x="30" y="74" width="24" height="44" rx="7" fill={GOLD} />
      <rect x="36" y="62" width="12" height="12" rx="3" fill={NAVY} />
      <rect x="35" y="86" width="14" height="5" rx="2.5" fill={WHITE} opacity="0.5" />
    </Svg>
  );
}

/** 6 · Desinchando na prática — leveza nas pernas. */
function IlustraDesinchando({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M96 30 h22 c5 30 3 60 -2 86 a9 9 0 0 1 -18 0 c-5 -26 -7 -56 -2 -86 z" fill={CREAM} stroke={NAVY} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M126 30 h22 c5 30 3 60 -2 86 a9 9 0 0 1 -18 0 c-5 -26 -7 -56 -2 -86 z" fill={CREAM} stroke={NAVY} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M70 108 a46 46 0 0 1 0 -62" stroke={GOLD_LIGHT} strokeWidth="3" strokeLinecap="round" opacity="0.85" />
      <path d="M56 116 a58 58 0 0 1 0 -78" stroke={GOLD_LIGHT} strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
      <path d="M174 108 a46 46 0 0 0 0 -62" stroke={GOLD_LIGHT} strokeWidth="3" strokeLinecap="round" opacity="0.85" />
      <path d="M188 116 a58 58 0 0 0 0 -78" stroke={GOLD_LIGHT} strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
      <path d="M108 22 l14 -12 l14 12" stroke={GOLD} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <ellipse cx="122" cy="132" rx="42" ry="6" fill={SAND} opacity="0.7" />
    </Svg>
  );
}

/** 7 · Quadro de Evolução — o progresso registrado. */
function IlustraEvolucao({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="28" y="22" width="184" height="106" rx="16" fill={WHITE} stroke={SAND} strokeWidth="2.5" />
      <rect x="44" y="36" width="46" height="6" rx="3" fill={SAND} />
      <line x1="44" y1="64" x2="196" y2="64" stroke={CREAM} strokeWidth="2" />
      <line x1="44" y1="86" x2="196" y2="86" stroke={CREAM} strokeWidth="2" />
      <line x1="44" y1="108" x2="196" y2="108" stroke={CREAM} strokeWidth="2" />
      <path d="M54 108 L88 98 L122 84 L156 70 L190 52 L190 112 L54 112 Z" fill={GOLD} opacity="0.12" />
      <polyline points="54,108 88,98 122,84 156,70 190,52" stroke={GOLD} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      {[[54, 108], [88, 98], [122, 84], [156, 70]].map(([x, y]) => (
        <circle key={`${x}`} cx={x} cy={y} r="4.5" fill={WHITE} stroke={GOLD} strokeWidth="2.5" />
      ))}
      <circle cx="190" cy="52" r="7" fill={GOLD} />
      <path d="M186.5 52 l2.5 2.5 l4.5 -5" stroke={WHITE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export const PREMIUM_ILLUSTRATIONS: Record<string, (p: Props) => ReactElement> = {
  rotina: IlustraRotina,
  foto: IlustraFoto,
  dicas: IlustraDicas,
  plano: IlustraPlano,
  natural: IlustraNatural,
  desinchando: IlustraDesinchando,
  evolucao: IlustraEvolucao,
};
