import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Acesso restrito.");
}

export const getAppSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ app_key: z.string().min(1).max(40) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: rows } = await context.supabase
      .from("app_settings")
      .select("setting_key, value")
      .eq("app_key", data.app_key);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out: Record<string, any> = {};
    for (const r of rows ?? []) out[r.setting_key] = r.value;
    return out;
  });

export const setAppSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        app_key: z.string().min(1).max(40),
        setting_key: z.string().min(1).max(60),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: z.any() as unknown as z.ZodType<any>,
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("app_settings").upsert(
      {
        app_key: data.app_key,
        setting_key: data.setting_key,
        value: data.value ?? {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "app_key,setting_key" },
    );
    if (error) throw error;
    return { ok: true };
  });
