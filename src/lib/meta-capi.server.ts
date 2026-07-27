// Meta Conversions API — envio server-side de eventos.
// Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
import { createHash } from "node:crypto";

const GRAPH_VERSION = "v21.0";

function sha256(v: string | undefined | null): string | undefined {
  if (!v) return undefined;
  const norm = String(v).trim().toLowerCase();
  if (!norm) return undefined;
  return createHash("sha256").update(norm).digest("hex");
}

function normalizePhone(v: string | undefined | null): string | undefined {
  if (!v) return undefined;
  const digits = String(v).replace(/\D/g, "");
  return digits || undefined;
}

export type CapiUserData = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  externalId?: string;
  fbp?: string;
  fbc?: string;
  clientIp?: string;
  userAgent?: string;
};

export type CapiEvent = {
  eventName: string;
  eventId?: string;
  eventTime?: number; // seconds
  actionSource?: "website" | "system_generated" | "other";
  eventSourceUrl?: string;
  user: CapiUserData;
  customData?: Record<string, unknown>;
};

export async function sendCapiEvent(evt: CapiEvent): Promise<{
  ok: boolean;
  status: number;
  body: unknown;
}> {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !token) {
    return { ok: false, status: 0, body: { error: "missing META_PIXEL_ID/META_CAPI_ACCESS_TOKEN" } };
  }

  const u = evt.user;
  const user_data: Record<string, unknown> = {
    em: sha256(u.email) ? [sha256(u.email)] : undefined,
    ph: sha256(normalizePhone(u.phone)) ? [sha256(normalizePhone(u.phone))] : undefined,
    fn: sha256(u.firstName) ? [sha256(u.firstName)] : undefined,
    ln: sha256(u.lastName) ? [sha256(u.lastName)] : undefined,
    external_id: sha256(u.externalId) ? [sha256(u.externalId)] : undefined,
    fbp: u.fbp,
    fbc: u.fbc,
    client_ip_address: u.clientIp,
    client_user_agent: u.userAgent,
  };
  for (const k of Object.keys(user_data)) if (user_data[k] === undefined) delete user_data[k];

  const payload = {
    data: [
      {
        event_name: evt.eventName,
        event_time: evt.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: evt.eventId,
        action_source: evt.actionSource ?? "website",
        event_source_url: evt.eventSourceUrl,
        user_data,
        custom_data: evt.customData,
      },
    ],
  };

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}
