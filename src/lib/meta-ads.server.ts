// SERVER-ONLY — integração com a Marketing API do Meta (Graph API).
// Nada aqui pode ser importado por código de cliente: usa secrets e service role.

const GRAPH = "https://graph.facebook.com/v21.0";
const PROVIDER = "meta_ads";
const TOKEN_KEY = "long_lived_token";
/** Renova o token quando faltar menos de 5 dias para expirar. */
const RENEW_THRESHOLD_MS = 5 * 24 * 60 * 60 * 1000;

export type MetaAdRow = {
  adId: string;
  adName: string;
  adsetName: string;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpm: number;
  cpc: number;
  ctr: number;
  leads: number;
};

type StoredToken = { value: string | null; expires_at: string | null };

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ausente: ${name}`);
  return v;
}

async function readStoredToken(): Promise<StoredToken | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("integrations_config")
    .select("value, expires_at")
    .eq("provider", PROVIDER)
    .eq("config_key", TOKEN_KEY)
    .maybeSingle();
  return (data as StoredToken | null) ?? null;
}

async function saveToken(token: string, expiresInSeconds: number | null) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const expiresAt = expiresInSeconds
    ? new Date(Date.now() + expiresInSeconds * 1000).toISOString()
    : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
  await supabaseAdmin.from("integrations_config").upsert(
    {
      provider: PROVIDER,
      config_key: TOKEN_KEY,
      value: token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider,config_key" },
  );
  return expiresAt;
}

/** Troca um token (curta ou longa duração) por um token de longa duração. */
async function exchangeForLongLived(currentToken: string) {
  const url = new URL(`${GRAPH}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", requireEnv("META_APP_ID"));
  url.searchParams.set("client_secret", requireEnv("META_APP_SECRET"));
  url.searchParams.set("fb_exchange_token", currentToken);

  const res = await fetch(url.toString());
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: { message?: string };
  };
  if (!res.ok || !json.access_token) {
    throw new Error(
      `Falha ao trocar o token do Meta: ${json.error?.message ?? res.status}`,
    );
  }
  const expiresAt = await saveToken(json.access_token, json.expires_in ?? null);
  return { token: json.access_token, expiresAt };
}

/**
 * Devolve um token de longa duração válido, renovando automaticamente
 * quando faltar menos de 5 dias para expirar.
 */
export async function getValidMetaToken(): Promise<{
  token: string;
  expiresAt: string | null;
  renewed: boolean;
}> {
  const stored = await readStoredToken();
  const expiresAtMs = stored?.expires_at ? Date.parse(stored.expires_at) : 0;
  const stillFresh =
    !!stored?.value && expiresAtMs - Date.now() > RENEW_THRESHOLD_MS;

  if (stillFresh) {
    return { token: stored!.value!, expiresAt: stored!.expires_at, renewed: false };
  }

  // Renova a partir do token guardado (se houver) ou do secret original.
  const base = stored?.value ?? requireEnv("META_ADS_ACCESS_TOKEN");
  try {
    const { token, expiresAt } = await exchangeForLongLived(base);
    return { token, expiresAt, renewed: true };
  } catch (err) {
    // Se a renovação falhar mas ainda houver token guardado válido, usa ele.
    if (stored?.value && expiresAtMs > Date.now()) {
      return { token: stored.value, expiresAt: stored.expires_at, renewed: false };
    }
    throw err;
  }
}

function num(v: unknown): number {
  const n = typeof v === "string" ? Number.parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * A API do Meta reporta o MESMO lead em categorias diferentes:
 * `lead` é o agregado e `offsite_conversion.fb_pixel_lead` é a mesma
 * conversão vista pelo Pixel. Somar as duas duplicava o número no painel.
 * Por isso pegamos o maior valor entre elas, e somamos à parte apenas os
 * leads nativos (onsite), que são de fato eventos distintos.
 */
const LEAD_ACTION_TYPES = ["lead", "offsite_conversion.fb_pixel_lead"] as const;
const ONSITE_LEAD_ACTION_TYPES = ["onsite_conversion.lead_grouped"] as const;

function countLeads(actions: Array<{ action_type: string; value: string }>): number {
  const byType = new Map<string, number>();
  for (const a of actions) {
    byType.set(a.action_type, Math.max(byType.get(a.action_type) ?? 0, num(a.value)));
  }
  const offsite = Math.max(...LEAD_ACTION_TYPES.map((t) => byType.get(t) ?? 0), 0);
  const onsite = ONSITE_LEAD_ACTION_TYPES.reduce(
    (acc, t) => acc + (byType.get(t) ?? 0),
    0,
  );
  return offsite + onsite;
}

/**
 * Campanha de lipedema (a conta tem campanhas de outros produtos misturadas).
 * Pode ser sobrescrita por env sem novo deploy de código.
 */
const LIPEDEMA_CAMPAIGN_ID = "52547312091169";

function campaignId(): string {
  return process.env["META_LIPEDEMA_CAMPAIGN_ID"] || LIPEDEMA_CAMPAIGN_ID;
}

/**
 * Busca insights por anúncio no período informado (YYYY-MM-DD),
 * restrito à campanha de lipedema e somente a anúncios ativos.
 */
export async function fetchMetaInsights(since: string, until: string) {
  const { token, expiresAt, renewed } = await getValidMetaToken();

  const url = new URL(`${GRAPH}/${campaignId()}/insights`);
  url.searchParams.set(
    "fields",
    "campaign_name,adset_name,ad_name,ad_id,spend,impressions,clicks,cpm,cpc,ctr,actions",
  );
  url.searchParams.set("level", "ad");
  url.searchParams.set("time_range", JSON.stringify({ since, until }));
  // Exclui anúncios pausados/arquivados do agregado.
  url.searchParams.set(
    "filtering",
    JSON.stringify([
      { field: "ad.effective_status", operator: "IN", value: ["ACTIVE"] },
    ]),
  );
  url.searchParams.set("limit", "200");
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString());
  const json = (await res.json()) as {
    data?: Array<Record<string, unknown>>;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(`Meta Insights: ${json.error?.message ?? res.status}`);
  }

  const rows: MetaAdRow[] = (json.data ?? []).map((r) => {
    const actions = (r["actions"] as Array<{ action_type: string; value: string }>) ?? [];
    const leads = countLeads(actions);
    return {
      adId: String(r["ad_id"] ?? ""),
      adName: String(r["ad_name"] ?? "(sem nome)"),
      adsetName: String(r["adset_name"] ?? ""),
      campaignName: String(r["campaign_name"] ?? ""),
      spend: num(r["spend"]),
      impressions: num(r["impressions"]),
      clicks: num(r["clicks"]),
      cpm: num(r["cpm"]),
      cpc: num(r["cpc"]),
      ctr: num(r["ctr"]),
      leads,
    };
  });

  const totals = rows.reduce(
    (acc, r) => {
      acc.spend += r.spend;
      acc.impressions += r.impressions;
      acc.clicks += r.clicks;
      acc.leads += r.leads;
      return acc;
    },
    { spend: 0, impressions: 0, clicks: 0, leads: 0 },
  );

  return {
    rows,
    totals: {
      ...totals,
      cpm: totals.impressions ? (totals.spend / totals.impressions) * 1000 : 0,
      cpc: totals.clicks ? totals.spend / totals.clicks : 0,
      ctr: totals.impressions ? (totals.clicks / totals.impressions) * 100 : 0,
    },
    tokenExpiresAt: expiresAt,
    tokenRenewed: renewed,
  };
}

/** Números reais do banco no mesmo período. */
export async function fetchSupabaseFunnel(since: string, until: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const fromIso = new Date(`${since}T00:00:00.000Z`).toISOString();
  const toIso = new Date(`${until}T23:59:59.999Z`).toISOString();

  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("status, telefone")
    .gte("created_at", fromIso)
    .lte("created_at", toIso)
    .limit(5000);
  if (error) throw error;

  const rows = data ?? [];
  const porStatus: Record<string, number> = {};
  let comTelefone = 0;
  let planoAtivo = 0;
  for (const r of rows) {
    const status = r.status ?? "sem_status";
    porStatus[status] = (porStatus[status] ?? 0) + 1;
    if (r.telefone && r.telefone !== "pendente") comTelefone += 1;
    if (status === "plano_ativo") planoAtivo += 1;
  }

  return { total: rows.length, porStatus, comTelefone, planoAtivo };
}
