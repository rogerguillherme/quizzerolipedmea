/**
 * Tokens de interface do CRM.
 *
 * Estrutura inspirada no design system de dashboard "Vitalis" (cards de
 * métrica, abas com sublinhado, barras de progresso, raios de 14px), porém
 * com a paleta atual do produto: navy, dourado e creme. Nenhuma cor nova
 * foi introduzida, apenas organizadas em um único lugar para o CRM parar de
 * repetir hex solto em cada arquivo.
 */

export const C = {
  /** Fundo geral da tela. */
  app: "#F4EEE1",
  /** Superfície de painel (listas, chat, header). */
  surface: "#FFFDF7",
  /** Superfície levemente destacada (cards, hover). */
  surfaceElevated: "#FBF5E8",
  /** Trilho neutro de barras de progresso e chips. */
  track: "#EFE5CE",
  border: "rgba(216,198,160,0.6)",
  borderStrong: "rgba(175,127,53,0.35)",

  textPrimary: "#16324F",
  textSecondary: "#5C5749",
  textMuted: "#8A7C5C",
  onAccent: "#F7F2E8",

  navy: "#16324F",
  navySoft: "#2C5578",
  gold: "#AF7F35",
  goldLabel: "#8A6224",
  danger: "#E85D75",
} as const;

/** Raios padronizados do dashboard. */
export const R = { sm: 8, md: 10, card: 14, pill: 999 } as const;

/** Sombra discreta de card (nada de blur pesado). */
export const SHADOW_CARD = "0 1px 2px rgba(22,50,79,0.06)";

/** Estilo base reutilizado por todo card do CRM. */
export const CARD: React.CSSProperties = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: R.card,
  boxShadow: SHADOW_CARD,
};

/** Cor por etapa do funil, usada nas barras de progresso. */
export const COR_ETAPA: Record<string, string> = {
  mapa_feito: "#8A7C5C",
  em_conversa: "#2C5578",
  quer_saber_mais: "#AF7F35",
  cliente: "#16324F",
  sem_resposta: "#C0A98A",
};
