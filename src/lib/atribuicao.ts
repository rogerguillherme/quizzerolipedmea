// Atribuição de tráfego (primeiro toque) + normalização de path.
// A UTM só existe na primeira URL da sessão: se não guardarmos aqui, a
// atribuição se perde no momento em que a lead navega para o quiz.

const ATRIB_KEY = "zl:atribuicao";
const SID_KEY = "__zl_sid";

const isBrowser = typeof window !== "undefined";

export type Atribuicao = {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  fbclid?: string | null;
  gclid?: string | null;
  referrer?: string | null;
  landing_path?: string | null;
  primeiro_acesso_em?: string | null;
};

/** Só o pathname, sem query e sem hash, cortado em 200 caracteres. */
export function normalizePath(input?: string): string {
  let p = input ?? (isBrowser ? window.location.pathname : "/");
  p = p.split("?")[0].split("#")[0];
  if (!p) p = "/";
  return p.slice(0, 200);
}

/** Identificador estável de sessão (compartilhado com o pageview). */
export function getSessionId(): string {
  if (!isBrowser) return "";
  try {
    let sid = sessionStorage.getItem(SID_KEY) || "";
    if (!sid) {
      sid =
        globalThis.crypto?.randomUUID?.() ??
        String(Date.now()) + Math.random().toString(36).slice(2);
      sessionStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    return "";
  }
}

function paramsAtuais(): Atribuicao {
  if (!isBrowser) return {};
  try {
    const q = new URL(window.location.href).searchParams;
    const get = (k: string) => {
      const v = q.get(k);
      return v ? v.slice(0, 200) : null;
    };
    return {
      utm_source: get("utm_source"),
      utm_medium: get("utm_medium"),
      utm_campaign: get("utm_campaign"),
      utm_content: get("utm_content"),
      utm_term: get("utm_term"),
      fbclid: get("fbclid"),
      gclid: get("gclid"),
    };
  } catch {
    return {};
  }
}

/**
 * Registra a atribuição de primeiro toque. Nunca sobrescreve o que já existe:
 * o primeiro toque é o que responde "essa venda veio de qual campanha".
 */
export function capturarAtribuicao(): Atribuicao {
  if (!isBrowser) return {};
  try {
    const existente = localStorage.getItem(ATRIB_KEY);
    if (existente) return JSON.parse(existente) as Atribuicao;
    const atual = paramsAtuais();
    const registro: Atribuicao = {
      ...atual,
      referrer: document.referrer ? document.referrer.slice(0, 500) : null,
      landing_path: normalizePath(),
      primeiro_acesso_em: new Date().toISOString(),
    };
    localStorage.setItem(ATRIB_KEY, JSON.stringify(registro));
    return registro;
  } catch {
    return {};
  }
}

export function getAtribuicao(): Atribuicao {
  if (!isBrowser) return {};
  try {
    const raw = localStorage.getItem(ATRIB_KEY);
    if (raw) return JSON.parse(raw) as Atribuicao;
  } catch {
    /* ignore */
  }
  return paramsAtuais();
}

/** Envia sem bloquear a navegação e sem deixar erro de rede vazar para a tela. */
export function enviarBeacon(url: string, payload: unknown) {
  if (!isBrowser) return;
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(
        url,
        new Blob([body], { type: "application/json" }),
      );
      if (ok) return;
    }
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* nunca quebra a página */
  }
}
