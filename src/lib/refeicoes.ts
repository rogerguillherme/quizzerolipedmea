/**
 * Registro de refeições persistido (clientes do plano pago).
 *
 * Cliente do navegador: as leituras/escritas são protegidas por RLS
 * (`refeicoes_registros`) e por policy de pasta no bucket privado `refeicoes`.
 * Quem não comprou continua em localStorage (ver `LOCAL_STORAGE_KEY`).
 */
import { supabase } from "@/integrations/supabase/client";
import { isoLocal } from "@/lib/data-local";

export const LOCAL_STORAGE_KEY = "zl_avaliacao_meals_v1";
const BUCKET = "refeicoes";

export interface Feedback {
  isRefeicao: boolean;
  pontos: string[];
  sugestao: string;
}

export interface Macros {
  kcal: number;
  proteina: number;
  carbo: number;
  gordura: number;
  fibra: number;
}

export interface MealEntry {
  id: string;
  createdAt: string;
  /** URL exibível: objectURL (local) ou signed URL (banco). */
  preview: string;
  feedback: Feedback;
  macros: Macros;
  storagePath?: string | null;
}

/* ---------------------------------------------------------------- local */

export function loadLocalMeals(): MealEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as MealEntry[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveLocalMeals(meals: MealEntry[]): void {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(meals));
  } catch {
    /* quota cheia ou modo privativo: seguir sem persistir */
  }
}

/* ---------------------------------------------------------------- banco */

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Sobe a foto no bucket privado e grava a linha correspondente. */
export async function salvarRefeicaoRemota(input: {
  file: File;
  feedback: Feedback;
  macros: Macros;
  semana?: number | null;
}): Promise<void> {
  const userId = await currentUserId();
  if (!userId) throw new Error("Sessão expirada. Entre novamente.");

  const ext = (input.file.name.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
  const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, input.file, {
      contentType: input.file.type || "image/jpeg",
      upsert: false,
    });
  if (upErr) throw new Error(upErr.message);

  const { error } = await supabase.from("refeicoes_registros").insert({
    user_id: userId,
    storage_path: path,
    feedback: input.feedback as unknown as never,
    macros: input.macros as unknown as never,
    semana: input.semana ?? null,
  });
  if (error) throw new Error(error.message);
}

/** Lista as refeições salvas, mais recentes primeiro, com URLs assinadas. */
export async function listarRefeicoesRemotas(limite = 60): Promise<MealEntry[]> {
  const userId = await currentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("refeicoes_registros")
    .select("id, storage_path, feedback, macros, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limite);
  if (error || !data) return [];

  const paths = data.map((r) => r.storage_path).filter(Boolean) as string[];
  const urlByPath = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, 60 * 60);
    for (const s of signed ?? []) {
      if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
    }
  }

  return data.map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    preview: (r.storage_path && urlByPath.get(r.storage_path)) || "",
    feedback: (r.feedback as unknown as Feedback) ?? {
      isRefeicao: true,
      pontos: [],
      sugestao: "",
    },
    macros: (r.macros as unknown as Macros) ?? {
      kcal: 0,
      proteina: 0,
      carbo: 0,
      gordura: 0,
      fibra: 0,
    },
    storagePath: r.storage_path,
  }));
}

/** Quantas refeições foram registradas hoje (banco ou local). */
export function contarHoje(meals: readonly MealEntry[]): number {
  const hoje = isoLocal();
  return meals.filter((m) => isoLocal(new Date(m.createdAt)) === hoje).length;
}

/**
 * Migração única: leva o que ficou em localStorage para o banco assim que a
 * usuária vira cliente. Só metadados — as fotos antigas eram objectURLs
 * temporárias e não podem ser recuperadas.
 */
const MIGRADO_KEY = "zl_refeicoes_migradas_v1";

export async function migrarLocalParaBanco(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(MIGRADO_KEY)) return;

  const locais = loadLocalMeals();
  window.localStorage.setItem(MIGRADO_KEY, "1");
  if (locais.length === 0) return;

  const userId = await currentUserId();
  if (!userId) return;

  const linhas = locais.map((m) => ({
    user_id: userId,
    storage_path: null,
    feedback: m.feedback as unknown as never,
    macros: m.macros as unknown as never,
    semana: null,
    created_at: m.createdAt,
  }));
  const { error } = await supabase.from("refeicoes_registros").insert(linhas);
  if (!error) {
    window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
}
