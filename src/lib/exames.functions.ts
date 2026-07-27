// Server functions para o fluxo de exames:
// - registrarExameEnviado: a usuária faz upload no bucket `exames` pelo cliente,
//   depois chama isto pra criar a linha e disparar a leitura via IA.
// - listarMeusExames: histórico da própria usuária.
// - listarExamesPendentes / listarTodosExames: admin (Gabriela).
// - reanalisarExame: admin re-roda a IA.
// - aprovarOuEditarEEnviar: admin aprova o texto (editando se quiser) e dispara o WhatsApp.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RegistrarInput = z.object({
  storagePath: z.string().min(3).max(400),
  nomeArquivo: z.string().min(1).max(200),
  mimetype: z.string().min(3).max(120),
  tamanhoBytes: z.number().int().nonnegative().optional(),
  observacao: z.string().max(500).optional(),
});

async function garantirAdmin(context: { userId: string; supabase: unknown }) {
  const supa = context.supabase as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (c: string, v: string) => {
          eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: unknown }> };
        };
      };
    };
  };
  const { data: role } = await supa
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) throw new Error("Acesso restrito.");
}

async function rodarAnaliseIA(exameId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { analisarExameArquivo } = await import("./exames.server");

  const { data: exame, error } = await supabaseAdmin
    .from("exames_leituras")
    .select("id, storage_path, mimetype, observacao_usuaria")
    .eq("id", exameId)
    .single();
  if (error || !exame) return { ok: false, error: "exame não encontrado" };

  await supabaseAdmin
    .from("exames_leituras")
    .update({ ia_status: "processando" })
    .eq("id", exameId);

  const dl = await supabaseAdmin.storage.from("exames").download(exame.storage_path);
  if (dl.error || !dl.data) {
    await supabaseAdmin
      .from("exames_leituras")
      .update({
        ia_status: "erro",
        ia_erro: dl.error?.message ?? "download falhou",
      })
      .eq("id", exameId);
    return { ok: false, error: dl.error?.message ?? "download falhou" };
  }

  const buf = new Uint8Array(await dl.data.arrayBuffer());
  // Uma vez que o Worker Runtime não tem Buffer nativamente em todos os caminhos,
  // fazemos base64 manualmente em chunks pra não estourar a stack.
  const chunk = 32768;
  let bin = "";
  for (let i = 0; i < buf.length; i += chunk) {
    bin += String.fromCharCode(...buf.slice(i, i + chunk));
  }
  const base64 = btoa(bin);

  const analise = await analisarExameArquivo({
    base64,
    mimetype: exame.mimetype,
    observacaoUsuaria: exame.observacao_usuaria,
  });

  if (!analise.ok || !analise.leitura) {
    await supabaseAdmin
      .from("exames_leituras")
      .update({
        ia_status: "erro",
        ia_erro: analise.error ?? "erro IA",
        ia_processado_em: new Date().toISOString(),
      })
      .eq("id", exameId);
    return { ok: false, error: analise.error };
  }

  const { montarTextoRevisao } = await import("./exames.server");
  const { data: user } = await supabaseAdmin
    .from("profiles")
    .select("nome")
    .eq("id", (await supabaseAdmin.from("exames_leituras").select("user_id").eq("id", exameId).single()).data?.user_id ?? "")
    .maybeSingle();
  const textoSugerido = montarTextoRevisao(analise.leitura, user?.nome ?? null);

  await supabaseAdmin
    .from("exames_leituras")
    .update({
      ia_status: "ok",
      ia_resumo: analise.leitura.resumoParaPaciente,
      ia_itens: analise.leitura.itens as never,
      ia_erro: null,
      ia_modelo: analise.modelo,
      ia_processado_em: new Date().toISOString(),
      revisao_texto: textoSugerido,
      revisao_status: "aguardando",
    })
    .eq("id", exameId);

  return { ok: true };
}

// ---- Usuária (paciente) ----------------------------------------------------

export const registrarExameEnviado = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RegistrarInput.parse(input))
  .handler(async ({ data, context }) => {
    // Confere que o caminho começa com o próprio user_id — segurança extra além da RLS.
    if (!data.storagePath.startsWith(`${context.userId}/`)) {
      throw new Error("storage_path inválido");
    }

    const { data: perfil } = await context.supabase
      .from("profiles")
      .select("nome, telefone")
      .eq("id", context.userId)
      .maybeSingle();

    // Tenta achar lead correspondente pelo telefone pra vincular.
    let leadId: string | null = null;
    if (perfil?.telefone) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: lead } = await supabaseAdmin
        .from("leads")
        .select("id")
        .eq("telefone", perfil.telefone)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lead) leadId = lead.id;
    }

    const { data: inserted, error } = await context.supabase
      .from("exames_leituras")
      .insert({
        user_id: context.userId,
        lead_id: leadId,
        telefone: perfil?.telefone ?? null,
        nome_arquivo: data.nomeArquivo,
        storage_path: data.storagePath,
        mimetype: data.mimetype,
        tamanho_bytes: data.tamanhoBytes ?? null,
        observacao_usuaria: data.observacao ?? null,
        ia_status: "pendente",
      })
      .select("id")
      .single();
    if (error || !inserted) throw new Error(error?.message ?? "falha ao registrar");

    // Dispara IA em segundo plano — a paciente não precisa esperar.
    // Espera 1x aqui pra já ter algum resultado quando ela recarregar.
    await rodarAnaliseIA(inserted.id);
    return { ok: true, id: inserted.id };
  });

export const listarMeusExames = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("exames_leituras")
      .select(
        "id, nome_arquivo, mimetype, ia_status, ia_resumo, revisao_status, enviado_em, created_at",
      )
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    return data ?? [];
  });

// URL assinada para a usuária baixar o próprio arquivo se quiser conferir.
export const gerarUrlAssinadaExame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("exames_leituras")
      .select("storage_path, user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Não encontrado");

    // Admin pode baixar tudo; usuária só o próprio.
    if (row.user_id !== context.userId) {
      const { data: role } = await context.supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", context.userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!role) throw new Error("Acesso restrito.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("exames")
      .createSignedUrl(row.storage_path, 60 * 10);
    if (error || !signed) throw new Error(error?.message ?? "falha ao assinar");
    return { url: signed.signedUrl };
  });

// ---- Admin (Gabriela) ------------------------------------------------------

export const listarExamesAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("exames_leituras")
      .select(
        "id, user_id, lead_id, telefone, nome_arquivo, mimetype, tamanho_bytes, observacao_usuaria, ia_status, ia_resumo, ia_itens, ia_erro, ia_modelo, ia_processado_em, revisao_status, revisao_texto, revisado_em, enviado_em, enviado_status, enviado_erro, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;

    const rows = data ?? [];
    // Junta nome/telefone do profile pra não precisar de outra chamada no front.
    const ids = [...new Set(rows.map((r) => r.user_id))];
    const nomes = new Map<string, { nome: string; telefone: string }>();
    if (ids.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, nome, telefone")
        .in("id", ids);
      for (const p of profs ?? []) nomes.set(p.id, { nome: p.nome, telefone: p.telefone });
    }
    return rows.map((r) => ({
      ...r,
      paciente_nome: nomes.get(r.user_id)?.nome ?? null,
      paciente_telefone: nomes.get(r.user_id)?.telefone ?? r.telefone ?? null,
    }));
  });

export const reanalisarExame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    return await rodarAnaliseIA(data.id);
  });

export const salvarRevisaoExame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        texto: z.string().min(10).max(4000),
        status: z.enum(["aprovado", "editado", "recusado"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("exames_leituras")
      .update({
        revisao_texto: data.texto,
        revisao_status: data.status,
        revisado_por: context.userId,
        revisado_em: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const enviarLeituraExame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        texto: z.string().min(10).max(4000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await garantirAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendWhatsApp } = await import("./evolution.server");

    const { data: row, error } = await supabaseAdmin
      .from("exames_leituras")
      .select("id, telefone, user_id, revisao_texto, revisao_status")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error("Exame não encontrado.");

    const texto = (data.texto ?? row.revisao_texto ?? "").trim();
    if (!texto) throw new Error("Sem texto para enviar.");

    // Descobre telefone (pref. do próprio row, senão do profile).
    let telefone = row.telefone;
    if (!telefone) {
      const { data: p } = await supabaseAdmin
        .from("profiles")
        .select("telefone")
        .eq("id", row.user_id)
        .maybeSingle();
      telefone = p?.telefone ?? null;
    }
    if (!telefone) throw new Error("Paciente sem telefone cadastrado.");

    const wa = await sendWhatsApp(telefone, texto);
    await supabaseAdmin.from("whatsapp_logs").insert({
      telefone,
      mensagem: texto,
      status: wa.ok ? "enviado" : "falhou",
      erro: wa.error ?? null,
    });

    await supabaseAdmin
      .from("exames_leituras")
      .update({
        revisao_texto: texto,
        revisao_status: wa.ok ? "enviado" : row.revisao_status,
        revisado_por: context.userId,
        revisado_em: new Date().toISOString(),
        enviado_em: wa.ok ? new Date().toISOString() : null,
        enviado_status: wa.ok ? "enviado" : "falhou",
        enviado_erro: wa.error ?? null,
      })
      .eq("id", row.id);

    return { ok: wa.ok, erro: wa.error ?? null };
  });
