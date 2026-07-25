// SERVER-ONLY — helpers para a Evolution API (WhatsApp)
// Nunca importe este arquivo em código do cliente. Os secrets vivem em process.env.

function evoConfig() {
  const url = process.env.EVOLUTION_API_URL;
  const key = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;
  if (!url || !key || !instance) {
    return { ok: false as const, error: "Evolution API não configurada" };
  }
  return { ok: true as const, url: url.replace(/\/$/, ""), key, instance };
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 11) return `55${digits}`;
  return digits;
}

export async function sendWhatsApp(
  telefone: string,
  mensagem: string,
): Promise<{ ok: boolean; error?: string }> {
  const cfg = evoConfig();
  if (!cfg.ok) return { ok: false, error: cfg.error };

  const number = normalizePhone(telefone);
  try {
    const res = await fetch(
      `${cfg.url}/message/sendText/${cfg.instance}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: cfg.key,
        },
        body: JSON.stringify({ number, text: mensagem }),
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function checkEvolutionStatus(): Promise<{
  ok: boolean;
  state?: string;
  error?: string;
  configured: boolean;
}> {
  const cfg = evoConfig();
  if (!cfg.ok) return { ok: false, error: cfg.error, configured: false };
  try {
    const res = await fetch(
      `${cfg.url}/instance/connectionState/${cfg.instance}`,
      { headers: { apikey: cfg.key } },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        configured: true,
        error: `HTTP ${res.status}: ${text.slice(0, 120)}`,
      };
    }
    const json = (await res.json()) as {
      instance?: { state?: string };
      state?: string;
    };
    return {
      ok: true,
      configured: true,
      state: json?.instance?.state ?? json?.state ?? "unknown",
    };
  } catch (e) {
    return { ok: false, configured: true, error: (e as Error).message };
  }
}

/**
 * Baixa uma mídia (imagem) recebida via webhook e devolve em base64 + mimetype.
 * Usa o endpoint /chat/getBase64FromMediaMessage/{instance} da Evolution v2.
 * `messagePayload` é o objeto `data` inteiro do webhook (com key + message).
 */
export async function downloadEvolutionMediaBase64(
  messagePayload: unknown,
): Promise<{ ok: boolean; base64?: string; mimetype?: string; error?: string }> {
  const cfg = evoConfig();
  if (!cfg.ok) return { ok: false, error: cfg.error };
  try {
    const res = await fetch(
      `${cfg.url}/chat/getBase64FromMediaMessage/${cfg.instance}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: cfg.key },
        body: JSON.stringify({
          message: messagePayload,
          convertToMp4: false,
        }),
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    }
    const json = (await res.json()) as { base64?: string; mimetype?: string };
    if (!json?.base64) return { ok: false, error: "resposta sem base64" };
    return {
      ok: true,
      base64: json.base64,
      mimetype: json.mimetype ?? "image/jpeg",
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
