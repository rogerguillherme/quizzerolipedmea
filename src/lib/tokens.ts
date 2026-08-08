/**
 * Paleta e escalas únicas das telas novas do app (Hoje, Registrar, Rotina,
 * Progresso e o carrossel de benefícios).
 *
 * Motivo de existir: as cores estavam escritas à mão em cada arquivo e havia
 * dois dourados claros diferentes (#D9A94B e #E7BE5C) cumprindo a mesma
 * função. Aqui há um único dourado claro: GOLD_LIGHT.
 *
 * Regra de contraste: GOLD (#AF7F35) sobre creme dá ~3.6:1 e reprova no
 * WCAG AA para texto pequeno. Para rótulos pequenos sobre fundo claro use
 * GOLD_LABEL (#8A6224). Sobre fundo navy, GOLD_LIGHT é seguro.
 */
export const NAVY = "#16324F";
export const NAVY_DEEP = "#0D2138";
export const NAVY_SOFT = "#2C5578";

/** Dourado de marca (ícones, bordas, gradientes). Não usar em texto pequeno sobre creme. */
export const GOLD = "#AF7F35";
/** Único dourado claro do sistema (fundo navy, gradientes, dots ativos). */
export const GOLD_LIGHT = "#D9A94B";
/** Dourado escurecido para rótulos pequenos sobre fundo claro (AA: 4.7:1). */
export const GOLD_LABEL = "#8A6224";

export const CREAM = "#F5EFE1";
export const CREAM_SOFT = "#FBF6E9";
export const CREAM_CARD = "rgba(255,253,247,0.95)";

export const INK = "#2F3128";
/** Texto secundário sobre creme, com contraste suficiente sem precisar de opacidade. */
export const INK_SOFT = "#5C5749";

export const BORDER = "rgba(216,198,160,0.55)";
export const BORDER_GOLD = "rgba(175,127,53,0.6)";

/** Raios padronizados: card principal, card interno, pílula. */
export const RADIUS = {
  card: 24,
  inner: 16,
  pill: 9999,
} as const;

/** Escala tipográfica de 6 passos (px). Sem valores avulsos. */
export const FS = {
  xs: 11,
  sm: 12.5,
  md: 14,
  lg: 16,
  xl: 20,
  display: 26,
} as const;

/** Sombras reutilizadas. */
export const SHADOW = {
  card: "0 10px 24px -20px rgba(22,50,79,0.3)",
  raised: "0 24px 40px -28px rgba(22,50,79,0.55)",
  gold: "0 12px 24px -14px rgba(175,127,53,0.65)",
} as const;

/** Gradiente navy dos cards de destaque. */
export const GRADIENT_NAVY = `linear-gradient(160deg, ${NAVY_SOFT} 0%, ${NAVY} 55%, ${NAVY_DEEP} 100%)`;
/** Gradiente dourado dos botões primários. */
export const GRADIENT_GOLD = `linear-gradient(180deg, ${GOLD_LIGHT}, ${GOLD})`;

/** Estilo base do card claro. */
export const CARD_STYLE = {
  background: "rgba(255,253,247,0.9)",
  border: `1px solid ${BORDER}`,
  boxShadow: SHADOW.card,
} as const;

/**
 * Corta um texto na última quebra de palavra antes do limite,
 * fechando com reticências. Evita cortar no meio da palavra.
 */
export function truncarPalavra(texto: string, limite: number): string {
  if (texto.length <= limite) return texto;
  const fatia = texto.slice(0, limite);
  const corte = fatia.lastIndexOf(" ");
  return `${(corte > 40 ? fatia.slice(0, corte) : fatia).replace(/[\s,;.]+$/, "")}…`;
}
