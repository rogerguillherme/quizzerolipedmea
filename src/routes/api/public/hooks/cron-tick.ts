// Cron hourly: cadência do Protocolo (dias 2-7) + reengajamento leve + fila de atenção.
// Chamado por pg_cron via pg_net (ver migração scheduled_cron_tick).
// Endpoint público — validamos com apikey (anon key do Supabase).
import { createFileRoute } from "@tanstack/react-router";
import {
  DICAS_7_DIAS,
  RECEITAS_PRATICAS,
  ESCALONAMENTO_DIAS_SEM_RESPOSTA,
} from "@/lib/protocolo7";
import { dicaParaDia } from "@/lib/dicas-rotina";
import { horaLocal, hojeISO, isoLocal, diasEntre } from "@/lib/data-local";

const MS_HORA = 60 * 60 * 1000;
const MS_DIA = 24 * MS_HORA;
/** Janela de envio (hora local de São Paulo): 08h até 10h. */
const JANELA_INICIO = 8;
const JANELA_FIM = 10;

type Jornada = {
  ativa?: boolean;
  iniciado_em?: string;
  dias_enviados?: number[];
  feedback?: Record<string, string>;
  ultimo_feedback_em?: string;
};

type LeadResp = Record<string, unknown> & { jornada_7dias?: Jornada; atencao?: unknown; reengaje?: Record<string, string> };

function diasDesde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / MS_DIA);
}

function horasDesde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / MS_HORA);
}

async function processarCadenciaProtocolo(
  supabaseAdmin: Awaited<ReturnType<typeof import("@/integrations/supabase/client.server").supabaseAdmin.from>> extends never ? never : import("@supabase/supabase-js").SupabaseClient,
  sendWhatsApp: (t: string, m: string) => Promise<{ ok: boolean; error?: string }>,
) {
  const { data: leads } = await supabaseAdmin
    .from("leads")
    .select("id, nome, telefone, respostas")
    .eq("status", "protocolo_7d_ativo")
    .limit(500);

  const resultados: Array<{ lead: string; dia?: number; status: string }> = [];

  for (const lead of leads ?? []) {
    const respostas = (lead.respostas ?? {}) as LeadResp;
    const j = respostas.jornada_7dias;
    if (!j?.ativa || !j.iniciado_em) continue;

    const diaAtual = Math.min(7, diasDesde(j.iniciado_em) + 1);
    const enviados = new Set(j.dias_enviados ?? []);

    // Envia todos os dias devidos que ainda não foram enviados (idempotente).
    for (let d = 2; d <= diaAtual; d++) {
      if (enviados.has(d)) continue;
      const dica = DICAS_7_DIAS.find((x) => x.dia === d);
      if (!dica) continue;

      const receita = RECEITAS_PRATICAS.find((r) => r.dia === d);
      const feedbackAnterior = j.feedback?.[String(d - 1)] ? "" :
        `\n\nComo foi ontem? Responde só: *Sim* / *Mais ou menos* / *Não*.`;

      const receitaBloco = receita
        ? `\n\n🥣 *Receita de hoje — ${receita.titulo}*\n${receita.descricao}\n` +
          receita.passos.map((p, i) => `${i + 1}. ${p}`).join("\n")
        : "";

      const msg =
        `Dia ${d} · ${dica.titulo}\n\n${dica.texto}` +
        receitaBloco +
        (d < 7 ? feedbackAnterior : "\n\nHoje é o último dia — dá uma olhada no seu progresso no app 💙");

      const wa = await sendWhatsApp(lead.telefone, msg);
      await supabaseAdmin.from("whatsapp_logs").insert({
        telefone: lead.telefone,
        mensagem: msg,
        status: wa.ok ? "enviado" : "falhou",
        erro: wa.error ?? null,
      });

      if (wa.ok) {
        enviados.add(d);
        j.dias_enviados = Array.from(enviados).sort((a, b) => a - b);
        respostas.jornada_7dias = j;
        await supabaseAdmin
          .from("leads")
          .update({ respostas: respostas as never })
          .eq("id", lead.id);
        resultados.push({ lead: lead.id, dia: d, status: "enviado" });
      } else {
        resultados.push({ lead: lead.id, dia: d, status: "falhou" });
        break; // pra não empilhar mensagens no mesmo lead se a API tá fora
      }
    }

    // Fila de atenção: 3+ dias sem responder feedback.
    const refFeedback = j.ultimo_feedback_em ?? j.iniciado_em;
    if (
      refFeedback &&
      diasDesde(refFeedback) >= ESCALONAMENTO_DIAS_SEM_RESPOSTA &&
      !respostas.atencao
    ) {
      respostas.atencao = {
        motivo: "sem_feedback_3d",
        criado_em: new Date().toISOString(),
      };
      await supabaseAdmin
        .from("leads")
        .update({ respostas: respostas as never })
        .eq("id", lead.id);
    }
  }

  return resultados;
}

/**
 * Régua pré-venda. Quatro toques, todos na janela da manhã (08h-10h de São
 * Paulo) para não mandar mensagem de madrugada:
 *   +20h  · convite pro teste grátis de foto
 *   +44h  · quebra de objeção ("já tentei de tudo")
 *   +68h  · oferta do Plano Premium (R$67)
 *   +6d   · última chamada
 * Cada toque é idempotente via `respostas.reengaje`.
 */
async function processarReengajamento(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  sendWhatsApp: (t: string, m: string) => Promise<{ ok: boolean; error?: string }>,
) {
  const enviados: string[] = [];

  // Fora da janela da manhã não enviamos nada da régua pré-venda.
  const hora = horaLocal();
  if (hora < JANELA_INICIO || hora >= JANELA_FIM) return enviados;

  const CHECKOUT_URL = "https://pay.kiwify.com.br/j0hsxv3";

  // Referência de tempo: leads em "mapa_gerado" podem nunca ter updated_at tocado,
  // então usamos created_at pra elas.
  const refTempo = (lead: { status?: string; created_at?: string; updated_at?: string }) =>
    new Date(
      (lead.status === "acesso_criado" ? lead.updated_at : lead.created_at) ??
        lead.created_at ??
        lead.updated_at ??
        0,
    ).getTime();

  const { data: leads } = await supabaseAdmin
    .from("leads")
    .select("id, nome, telefone, respostas, status, created_at, updated_at")
    .in("status", ["mapa_gerado", "acesso_criado"])
    .neq("telefone", "pendente")
    .gt("created_at", new Date(Date.now() - 14 * MS_DIA).toISOString())
    .limit(500);

  for (const lead of leads ?? []) {
    const respostas = (lead.respostas ?? {}) as LeadResp;
    const reengaje = respostas.reengaje ?? {};
    const digits = String(lead.telefone ?? "").replace(/\D/g, "");
    if (digits.length < 10) continue;

    const idade = Date.now() - refTempo(lead);
    const nome = (lead.nome || "").split(" ")[0] || "";
    const oi = nome ? `Oi ${nome}` : "Oi";
    const teste = (respostas.teste_fotos as { usadas?: number } | undefined) ?? {};
    const jaTestouFoto = Number(teste.usadas ?? 0) > 0;

    // Um toque por lead por execução: escolhemos o mais recente devido.
    let chave: string | null = null;
    let msg = "";

    if (idade >= 6 * MS_DIA && !reengaje.pos6d_at) {
      // +6 dias — última chamada.
      chave = "pos6d_at";
      msg =
        `${oi}, aqui é a Gabriela 💙\n\n` +
        `Essa é a minha última mensagem sobre isso, prometo. O acesso ao *Plano Premium Zero Lipedema* segue por R$67, sem assinatura, com 7 dias de garantia.\n\n` +
        `Se agora não é a hora, tudo bem. Seu Mapa continua valendo e eu sigo por aqui quando você quiser retomar.\n\n` +
        `🔗 ${CHECKOUT_URL}`;
    } else if (idade >= 68 * MS_HORA && !reengaje.pos48h_at) {
      // +68h — pitch do plano.
      chave = "pos48h_at";
      msg =
        `${oi}, aqui é a Gabriela 💙\n\n` +
        `Voltando pra te fazer um convite direto: hoje eu libero seu acesso ao Plano Premium Zero Lipedema por um valor de inauguração, de R$119 por apenas R$67, sem assinatura obrigatória.\n\n` +
        `O centro do plano é a Rotina Zero Lipedema: a gente ajusta uma refeição por semana, começando pelo café da manhã, sem contar caloria e sem passar fome. E você pode fotografar seu prato pra receber a leitura na hora, o que ajuda, o que atrapalha e o que ajustar na próxima refeição.\n\n` +
        `Tem 7 dias de garantia: se não fizer sentido pra você, é só me chamar que devolvo, sem burocracia. E como bônus, libero todos os meus guias e receitas práticas.\n\n` +
        `🔗 Pra ativar: ${CHECKOUT_URL}\n\n` +
        `Qualquer dúvida, me chama por aqui. ✨`;
    } else if (idade >= 44 * MS_HORA && !reengaje.pos2h_foto_at) {
      // +44h — quebra de objeção ("já tentei de tudo", "não tenho tempo").
      chave = "pos2h_foto_at";
      msg =
        `${oi} 💙 Aqui é a Gabriela.\n\n` +
        `A frase que eu mais escuto é: "eu já tentei de tudo e nada funciona". Faz sentido, porque quase tudo que te ofereceram foi dieta restritiva, e lipedema não responde a restrição, responde a inflamação.\n\n` +
        `Por isso a Rotina Zero Lipedema muda uma refeição por semana, não a sua vida inteira de uma vez. Semana 1 é só o café da manhã. Leva alguns minutos por dia e você não precisa contar caloria nem passar fome.\n\n` +
        `Se ficou alguma dúvida, me pergunta aqui que eu respondo. ✨`;
    } else if (idade >= 20 * MS_HORA && !reengaje.pos1h_at && !jaTestouFoto) {
      // +20h — convite pro teste grátis de foto.
      chave = "pos1h_at";
      msg =
        `${oi}! 💙 Aqui é a Gabriela.\n\n` +
        `Tem uma coisa bem legal que você ainda não testou: me manda aqui mesmo, respondendo esta mensagem, uma foto de qualquer refeição sua que eu te dou um feedback na hora, se aquele prato ajuda ou atrapalha o seu quadro.\n\n` +
        `É grátis, são 3 fotos de teste, sem compromisso. É só mandar a foto por aqui. ✨`;
    }


    if (!chave) continue;

    const wa = await sendWhatsApp(lead.telefone, msg);
    await supabaseAdmin.from("whatsapp_logs").insert({
      telefone: lead.telefone,
      mensagem: msg,
      status: wa.ok ? "enviado" : "falhou",
      erro: wa.error ?? null,
    });
    if (wa.ok) {
      reengaje[chave] = new Date().toISOString();
      respostas.reengaje = reengaje;
      await supabaseAdmin
        .from("leads")
        .update({ respostas: respostas as never })
        .eq("id", lead.id);
      enviados.push(lead.id);
    }
  }

  return enviados;
}

/**
 * Cadência pós-compra da Rotina Zero Lipedema (`status = 'plano_ativo'`).
 *
 * Cinco tipos de toque, todos idempotentes por `respostas.rotina_msgs` e
 * limitados a UMA mensagem por lead por dia (`ultimo_envio`, data local):
 *   1. D0 + 4h  · lembrete de acesso (só entre 08h e 21h, para não acordar ninguém)
 *   2. Diário   · dica do dia, janela 08h-10h, respeitando a semana vivida
 *   3. Retomada · 2+ dias sem check-in, janela 08h-10h, no máximo a cada 3 dias
 *   4. Semana   · fechamento de cada semana concluída
 *   5. Final    · conclusão dos 28 dias + convite do Método Derma (R$297)
 */
async function processarCadenciaRotina(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseAdmin: any,
  sendWhatsApp: (t: string, m: string) => Promise<{ ok: boolean; error?: string }>,
) {
  const resultados: Array<{ lead: string; tipo: string; status: string }> = [];

  const hora = horaLocal();
  const janelaManha = hora >= JANELA_INICIO && hora < JANELA_FIM;
  const janelaDia = hora >= JANELA_INICIO && hora < 21;
  if (!janelaDia) return resultados;

  const hoje = hojeISO();

  const { data: leads } = await supabaseAdmin
    .from("leads")
    .select("id, nome, telefone, respostas, user_id, updated_at, created_at")
    .eq("status", "plano_ativo")
    .neq("telefone", "pendente")
    .limit(500);

  for (const lead of leads ?? []) {
    const respostas = (lead.respostas ?? {}) as LeadResp;
    const msgs =
      (respostas.rotina_msgs as
        | {
            inicio?: string;
            ultimo_envio?: string;
            acesso_4h?: string;
            dias_enviados?: number[];
            semanas_fechadas?: number[];
            retomada_em?: string;
            conclusao?: string;
          }
        | undefined) ?? {};

    // Uma mensagem por lead por dia, sem exceção.
    if (msgs.ultimo_envio === hoje) continue;

    const inicioISO =
      msgs.inicio ?? lead.updated_at ?? lead.created_at ?? new Date().toISOString();
    const inicio = new Date(inicioISO);
    const horasDesdeCompra = (Date.now() - inicio.getTime()) / MS_HORA;
    const dia = Math.floor(horasDesdeCompra / 24) + 1;

    const nome = (lead.nome || "").split(" ")[0] || "";
    const ola = nome ? `${nome}, ` : "";

    let tipo: string | null = null;
    let msg = "";
    const proximo = { ...msgs, inicio: inicioISO };

    // 1. Lembrete de acesso — 4h depois da compra.
    if (!msgs.acesso_4h && horasDesdeCompra >= 4) {
      tipo = "acesso_4h";
      msg =
        `${ola}aqui é a Gabriela 💙\n\n` +
        `Passei só pra lembrar que seu acesso já está liberado. Abre o app, toca em *Rotina* na barra de baixo e começa a missão da *Semana 1*: o café da manhã.\n\n` +
        `Não precisa mudar tudo hoje. Uma refeição de cada vez já é o suficiente pra começar.`;
      proximo.acesso_4h = new Date().toISOString();
    } else if (janelaManha) {
      // Estado real da Rotina: semana vivida e último check-in.
      let semanaAtual = Math.min(4, Math.max(1, Math.ceil(dia / 7)));
      let ultimoCheckin: string | null = null;
      let totalCheckins = 0;

      if (lead.user_id) {
        const { data: prog } = await supabaseAdmin
          .from("rotina_progresso")
          .select("semana_atual")
          .eq("user_id", lead.user_id)
          .maybeSingle();
        if (prog?.semana_atual) {
          semanaAtual = Math.min(4, Math.max(1, Number(prog.semana_atual)));
        }

        const { data: checkins } = await supabaseAdmin
          .from("rotina_checkins")
          .select("data")
          .eq("user_id", lead.user_id)
          .order("data", { ascending: false })
          .limit(50);
        totalCheckins = checkins?.length ?? 0;
        ultimoCheckin = (checkins?.[0]?.data as string | undefined) ?? null;
      }

      const diasSemCheckin = ultimoCheckin
        ? diasEntre(hoje, ultimoCheckin)
        : dia - 1;

      const semanasFechadas = new Set<number>(proximo.semanas_fechadas ?? []);
      const semanaConcluida = Math.min(4, Math.floor(dia / 7));
      const diasEnviados = new Set<number>(proximo.dias_enviados ?? []);

      if (dia > 28 && !msgs.conclusao) {
        // 5. Conclusão dos 28 dias + convite do plano de R$297.
        tipo = "conclusao";
        msg =
          `${ola}você chegou ao fim dos 28 dias da Rotina Zero Lipedema 💙\n\n` +
          `Suas quatro refeições principais estão ajustadas, sem dieta e sem contar caloria. Só isso já muda muita coisa no inchaço e na dor.\n\n` +
          `Se você quiser ir além, existe o passo seguinte: o *Método Derma*, meu acompanhamento de 90 dias com anamnese completa, leitura dos seus exames e prescrição personalizada, por R$297.\n\n` +
          `Se fizer sentido pra você, responde *QUERO SABER* aqui que eu te explico direitinho como funciona.`;
        proximo.conclusao = new Date().toISOString();
      } else if (
        semanaConcluida >= 1 &&
        semanaConcluida <= 4 &&
        !semanasFechadas.has(semanaConcluida)
      ) {
        // 4. Fechamento de semana.
        const foco = ["o café da manhã", "o almoço", "o lanche", "o jantar"][
          semanaConcluida - 1
        ];
        const proximaFoco = ["o almoço", "o lanche", "o jantar", ""][
          semanaConcluida - 1
        ];
        tipo = `semana_${semanaConcluida}`;
        msg =
          `${ola}fim da Semana ${semanaConcluida} 💙\n\n` +
          `Você passou sete dias ajustando ${foco}. Repara no que mudou: inchaço ao acordar, disposição, roupa no fim do dia.\n\n` +
          (proximaFoco
            ? `A partir de agora a gente ajusta ${proximaFoco}, mantendo o que você já conquistou. Abre a aba *Rotina* pra ver a missão nova.`
            : `Abre a aba *Progresso* pra ver sua sequência completa.`);
        semanasFechadas.add(semanaConcluida);
        proximo.semanas_fechadas = Array.from(semanasFechadas).sort((a, b) => a - b);
      } else if (diasSemCheckin >= 2 && totalCheckins > 0) {
        // 3. Retomada — no máximo a cada 3 dias.
        const ultimaRetomada = proximo.retomada_em
          ? diasEntre(hoje, isoLocal(new Date(proximo.retomada_em)))
          : 99;
        if (ultimaRetomada >= 3) {
          tipo = "retomada";
          msg =
            `${ola}faz ${diasSemCheckin} dias sem check-in e eu passei aqui sem cobrança nenhuma 💙\n\n` +
            `Rotina que funciona é a que aceita falha. Não precisa recomeçar do zero: é só cumprir a missão de hoje e marcar no app, na aba *Hoje*.\n\n` +
            `Se algo travou, me conta aqui que a gente ajusta juntas.`;
          proximo.retomada_em = new Date().toISOString();
        }
      }

      // 2. Dica do dia — só se nada mais importante foi disparado.
      if (!tipo && dia >= 1 && dia <= 28 && !diasEnviados.has(dia)) {
        const dica = dicaParaDia(dia, semanaAtual);
        if (dica) {
          tipo = `dica_${dia}`;
          msg =
            `${ola}dia ${dia} da sua Rotina 💙\n\n` +
            `${dica.texto}\n\n` +
            `Quando cumprir a missão de hoje, marca lá no app na aba *Hoje*.`;
          diasEnviados.add(dia);
          proximo.dias_enviados = Array.from(diasEnviados).sort((a, b) => a - b);
        }
      }
    }

    if (!tipo || !msg) continue;

    const wa = await sendWhatsApp(lead.telefone, msg);
    await supabaseAdmin.from("whatsapp_logs").insert({
      telefone: lead.telefone,
      mensagem: msg,
      status: wa.ok ? "enviado" : "falhou",
      erro: wa.error ?? null,
    });

    if (wa.ok) {
      proximo.ultimo_envio = hoje;
      respostas.rotina_msgs = proximo;
      await supabaseAdmin
        .from("leads")
        .update({ respostas: respostas as never })
        .eq("id", lead.id);
      resultados.push({ lead: lead.id, tipo, status: "enviado" });
    } else {
      resultados.push({ lead: lead.id, tipo, status: "falhou" });
    }
  }

  return resultados;
}



export const Route = createFileRoute("/api/public/hooks/cron-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Segurança mínima: exige apikey igual à anon key do projeto.
        const apiKey = request.headers.get("apikey") ?? "";
        const expected =
          process.env.SUPABASE_PUBLISHABLE_KEY ??
          process.env.SUPABASE_ANON_KEY ??
          "";
        if (!expected || apiKey !== expected) {
          return new Response("unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { sendWhatsApp } = await import("@/lib/evolution.server");

        // TODO: Protocolo de 7 Dias descontinuado, reativar só se decidirmos voltar com isso
        // const cadencia = await processarCadenciaProtocolo(
        //   supabaseAdmin as any,
        //   sendWhatsApp,
        // );
        const cadencia: Array<{ lead: string; dia?: number; status: string }> = [];
        const reengajados = await processarReengajamento(
          supabaseAdmin,
          sendWhatsApp,
        );
        const rotina = await processarCadenciaRotina(supabaseAdmin, sendWhatsApp);

        // suppress unused import warning
        void horasDesde;
        void processarCadenciaProtocolo;

        return Response.json({
          ok: true,
          cadencia,
          reengajados,
          rotina,
          ts: new Date().toISOString(),
        });
      },
      GET: async () =>
        Response.json({ service: "Zero Lipedema · Cron tick", ok: true }),
    },
  },
});
