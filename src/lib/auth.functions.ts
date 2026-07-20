import { createServerFn } from "@tanstack/react-start";

const ADMIN_EMAIL = "rogerbendlin@hotmail.com";
const ADMIN_PASSWORD = "admin@@@";

/**
 * Idempotent bootstrap: creates the admin user if not present and grants the
 * `admin` role. Safe to call on every visit to the login screen.
 */
export const ensureAdminUser = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // 1) Find or create the auth user
  let userId: string | null = null;

  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw new Error(listErr.message);

  const existing = list.users.find(
    (u) => (u.email ?? "").toLowerCase() === ADMIN_EMAIL.toLowerCase(),
  );

  if (existing) {
    userId = existing.id;
    // Ensure the password matches what the user expects
    await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
  } else {
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (createErr) throw new Error(createErr.message);
    userId = created.user?.id ?? null;
  }

  if (!userId) throw new Error("Falha ao provisionar usuário admin.");

  // 2) Grant admin role (idempotent)
  const { error: roleErr } = await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
  if (roleErr) throw new Error(roleErr.message);

  return { ok: true as const };
});
