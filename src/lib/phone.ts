// Utilitários de telefone BR — máscara, normalização e validação.
// Formato canônico usado pela Evolution API: 55 + DDD (2) + número (8 ou 9).
// Ex.: (11) 98888-7777 → 5511988887777

const DDDS_VALIDOS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

/** Retorna apenas os dígitos da string. */
export function onlyDigits(input: string): string {
  return (input ?? "").replace(/\D/g, "");
}

/**
 * Normaliza para o formato E.164 brasileiro sem o "+" (55DDDNNNNNNNN/9).
 * Retorna null se o número não for válido.
 */
export function normalizePhoneBR(input: string): string | null {
  let d = onlyDigits(input);
  if (!d) return null;
  // Remove zeros à esquerda ocasionais
  d = d.replace(/^0+/, "");
  // Se já vem com 55 + DDD + número
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) {
    d = d.slice(2);
  }
  // Aceitamos 10 (fixo) ou 11 (celular c/ 9) dígitos
  if (d.length !== 10 && d.length !== 11) return null;
  const ddd = parseInt(d.slice(0, 2), 10);
  if (!DDDS_VALIDOS.has(ddd)) return null;
  const numero = d.slice(2);
  // Celular precisa começar com 9. Se veio 10 dígitos mas deveria ser celular, ainda aceitamos.
  if (numero.length === 9 && numero[0] !== "9") return null;
  return `55${d}`;
}

/** true se o input pode ser normalizado para um telefone BR válido. */
export function isValidPhoneBR(input: string): boolean {
  return normalizePhoneBR(input) !== null;
}

/**
 * Máscara amigável durante a digitação: (11) 9 8888-7777.
 * Não valida — só formata o que já foi digitado.
 */
export function formatPhoneBR(input: string): string {
  let d = onlyDigits(input);
  if (d.startsWith("55") && d.length > 11) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 3) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 7) {
    // celular: (11) 9 8888
    if (d.length > 3 && d[2] === "9") {
      return `(${d.slice(0, 2)}) ${d[2]} ${d.slice(3)}`;
    }
    return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  }
  if (d.length <= 10) {
    // fixo: (11) 3333-4444
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  // celular completo: (11) 9 8888-7777
  return `(${d.slice(0, 2)}) ${d[2]} ${d.slice(3, 7)}-${d.slice(7)}`;
}
