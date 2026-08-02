// Camada única de rastreamento Meta: dispara o evento no Pixel (browser) e o
// mesmo evento na Conversions API (servidor), com o mesmo eventID para dedupe.
import { fbqTrack, fbqTrackCustom } from "@/lib/meta-pixel";
import { sendMetaEvent } from "@/lib/meta-events.functions";

// Eventos padrão da Meta (usam fbq('track')). Qualquer outro nome vira custom.
const STANDARD_EVENTS = new Set([
  "PageView",
  "ViewContent",
  "Lead",
  "CompleteRegistration",
  "InitiateCheckout",
  "AddToCart",
  "AddPaymentInfo",
  "Purchase",
  "Contact",
  "Subscribe",
  "StartTrial",
  "Schedule",
  "SubmitApplication",
  "Search",
]);

export type MetaUser = {
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  externalId?: string;
};

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

/** Dados do lead que já temos no localStorage do app (nome/telefone). */
function localUser(): MetaUser {
  if (typeof window === "undefined") return {};
  try {
    const app = JSON.parse(localStorage.getItem("zl:app") || "{}") as {
      nome?: string;
      telefone?: string;
      leadId?: string;
    };
    const [firstName, ...rest] = String(app.nome || "").trim().split(/\s+/);
    return {
      phone: app.telefone,
      firstName: firstName || undefined,
      lastName: rest.join(" ") || undefined,
      externalId: app.leadId || app.telefone,
    };
  } catch {
    return {};
  }
}

function newEventId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

/**
 * Dispara um evento no Pixel + Conversions API.
 * Falhas de rede são silenciosas de propósito: rastreamento nunca pode quebrar
 * a experiência do usuário.
 */
export function trackMeta(
  eventName: string,
  params?: Record<string, unknown>,
  user?: MetaUser,
): void {
  if (typeof window === "undefined") return;
  const eventId = newEventId();
  const payload = { ...(params || {}), eventID: eventId };

  try {
    if (STANDARD_EVENTS.has(eventName)) fbqTrack(eventName, payload);
    else fbqTrackCustom(eventName, payload);
  } catch {
    /* pixel indisponível (adblock) — o CAPI ainda cobre o evento */
  }

  const u = { ...localUser(), ...(user || {}) };
  try {
    void sendMetaEvent({
      data: {
        eventName,
        eventId,
        eventSourceUrl: window.location.href,
        phone: u.phone,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        externalId: u.externalId,
        fbp: readCookie("_fbp"),
        fbc: readCookie("_fbc") || fbcFromUrl(),
        customData: params,
      },
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

/** Reconstrói o _fbc quando o clique veio com ?fbclid= e o cookie ainda não existe. */
function fbcFromUrl(): string | undefined {
  try {
    const fbclid = new URL(window.location.href).searchParams.get("fbclid");
    if (!fbclid) return undefined;
    return `fb.1.${Date.now()}.${fbclid}`;
  } catch {
    return undefined;
  }
}
