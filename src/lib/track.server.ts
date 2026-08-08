// Helpers server-side de rastreamento: filtro de robô e normalização de path.

const BOT_PATTERNS = [
  "bot",
  "crawler",
  "spider",
  "headless",
  "preview",
  "facebookexternalhit",
  "whatsapp",
  "lighthouse",
  "bingpreview",
];

export function isBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true; // sem UA não é navegador de gente
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some((p) => ua.includes(p));
}

/** Defesa no servidor: não confia no cliente para normalizar o path. */
export function sanitizePath(input: unknown): string {
  if (typeof input !== "string" || !input) return "/";
  return input.split("?")[0].split("#")[0].slice(0, 200) || "/";
}

export function str(input: unknown, max = 200): string | null {
  return typeof input === "string" && input.trim()
    ? input.trim().slice(0, max)
    : null;
}

/** Contador de descartes por robô, para sabermos o tamanho do filtro. */
export async function registrarDescarte(motivo: "bot") {
  try {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const setting_key = `track_descartes_${motivo}`;
    const { data } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("app_key", "mapa")
      .eq("setting_key", setting_key)
      .maybeSingle();
    const atual = Number(
      (data?.value as { total?: number } | null)?.total ?? 0,
    );
    await supabaseAdmin.from("app_settings").upsert(
      {
        app_key: "mapa",
        setting_key,
        value: { total: atual + 1, ultimo_em: new Date().toISOString() } as never,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "app_key,setting_key" },
    );
  } catch {
    /* contador nunca pode derrubar o endpoint */
  }
}
