import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { MAPA_SYSTEM_PROMPT } from "./mapa.server";

export type Diagnostico = {
  estagio: "Inicial" | "Intermediário" | "Avançado" | "Indeterminado";
  aberturaValidadora: string;
  descricaoEstagio: string;
  prioridades: string[];
  proximoPassoTitulo: string;
  proximoPassoMensagem: string;
};

export const submitMapa = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        nome: z.string().trim().min(2).max(80),
        telefone: z.string().trim().max(40).optional().default(""),
        respostas: z.object({
          tempo: z.string().min(1),
          diagnostico: z.string().min(1),
          sintomaMaior: z.string().min(1),
          dorNivel: z.string().min(1),
          pesoPernas: z.string().min(1),
          dietaExercicio: z.string().min(1),
          sono: z.string().min(1),
          intestino: z.string().min(1),
          atividade: z.string().min(1),
          sinaisNutricionais: z.string().min(1),
          exames: z.string().min(1),
          objetivo: z.string().min(1),
        }),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");

    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-3-flash-preview");

    const r = data.respostas;
    const userPrompt = `Nome: ${data.nome}
Respostas do Mapa:
1. Há quanto tempo percebe inchaço/desproporção: ${r.tempo}
2. Já recebeu diagnóstico de lipedema: ${r.diagnostico}
3. Sintoma que mais incomoda hoje: ${r.sintomaMaior}
4. Nível de dor/incômodo no dia a dia: ${r.dorNivel}
5. Peso varia mas pernas não mudam: ${r.pesoPernas}
6. Já tentou dieta e exercício sem ver diferença: ${r.dietaExercicio}
7. Como anda o sono: ${r.sono}
8. Frequência intestinal: ${r.intestino}
9. Nível de atividade física hoje: ${r.atividade}
10. Sinais de unhas fracas, queda de cabelo ou falta de energia: ${r.sinaisNutricionais}
11. Tem exames recentes (sangue, hormonal): ${r.exames}
12. O que mais gostaria de ter agora: ${r.objetivo}

Devolva o JSON conforme instruções.`;

    let diagnostico: Diagnostico;
    try {
      const { text } = await generateText({
        model,
        system: MAPA_SYSTEM_PROMPT,
        prompt: userPrompt,
      });
      const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
      diagnostico = JSON.parse(cleaned) as Diagnostico;
    } catch (err) {
      console.error("[submitMapa] Falha ao gerar leitura:", err);
      const primeiroNome = data.nome.split(" ")[0];
      diagnostico = {
        estagio: "Indeterminado",
        aberturaValidadora: `Pelo que você compartilhou, ${primeiroNome}, o que você sente é real — e tem nome.`,
        descricaoEstagio:
          "Suas respostas foram registradas. A leitura completa vai chegar pelo WhatsApp em instantes, para você revisar com calma junto da Gabriela.",
        prioridades: [
          "Ter em mãos exames recentes de sangue e hormonais quando falar com a Gabriela.",
          "Anotar em que hora do dia o inchaço piora — ajuda a identificar gatilhos.",
          "Não iniciar dieta restritiva por conta própria — pode piorar o quadro.",
        ],
        proximoPassoTitulo: `Seu Mapa está pronto, ${primeiroNome}.`,
        proximoPassoMensagem:
          "Já enviamos sua leitura para o WhatsApp. Assim você guarda com você e revisa com a Gabriela quando quiser.",
      };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("leads")
      .insert({
        nome: data.nome,
        telefone: data.telefone && data.telefone.length >= 8 ? data.telefone : "pendente",
        respostas: data.respostas,
        origem: "mapa",
        status: "mapa_gerado",
        diagnostico,
      })
      .select("id")
      .single();

    if (insertErr) console.error("[submitMapa] insert error", insertErr);

    // Evento "Lead" (Conversions API). O mesmo eventId volta pro navegador para
    // que o Pixel dispare com eventID idêntico e a Meta deduplique os dois lados.
    let metaEventId: string | null = null;
    if (inserted?.id) {
      metaEventId = `lead-mapa-${inserted.id}`;
      const [firstName, ...rest] = data.nome.trim().split(/\s+/);
      try {
        const { capiFromClient } = await import("@/lib/meta-capi.server");
        await capiFromClient({
          eventName: "Lead",
          eventId: metaEventId,
          phone: data.telefone || undefined,
          firstName: firstName || undefined,
          lastName: rest.join(" ") || undefined,
          externalId: inserted.id,
          customData: { content_name: "Mapa do Lipedema" },
        });
      } catch (e) {
        console.error("[submitMapa] falha ao enviar Lead ao CAPI", e);
      }
    }

    // Entrega o Mapa no WhatsApp automaticamente (promessa feita na tela do quiz).
    // Não cria conta no Auth: o objetivo aqui é só entregar o resultado e abrir o canal.
    const digits = (data.telefone ?? "").replace(/\D/g, "");
    if (digits.length >= 10) {
      const primeiroNome = data.nome.trim().split(/\s+/)[0] || "";
      const prioridades = (diagnostico.prioridades ?? [])
        .slice(0, 3)
        .map((p, i) => `${i + 1}. ${p}`)
        .join("\n");
      const msg =
        `${primeiroNome ? `Oi ${primeiroNome}!` : "Oi!"} 💙 Aqui é a Gabriela.\n\n` +
        `${diagnostico.aberturaValidadora}\n\n` +
        `*Seu Mapa do Lipedema*\n` +
        `Estágio: ${diagnostico.estagio}\n` +
        `${diagnostico.descricaoEstagio}\n\n` +
        `*Suas 3 prioridades agora:*\n${prioridades}\n\n` +
        `Se quiser, me manda por aqui uma foto de uma refeição sua que eu te dou um feedback na hora, se aquele prato ajuda ou atrapalha o seu quadro. É de graça, sem compromisso. ✨`;
      try {
        const { sendWhatsApp } = await import("@/lib/evolution.server");
        const wa = await sendWhatsApp(data.telefone, msg);
        await supabaseAdmin.from("whatsapp_logs").insert({
          telefone: data.telefone,
          mensagem: msg,
          status: wa.ok ? "enviado" : "falhou",
          erro: wa.error ?? null,
        });
      } catch (e) {
        console.error("[submitMapa] falha ao enviar Mapa no WhatsApp", e);
      }
    }

    return { diagnostico, leadId: inserted?.id ?? null, metaEventId };
  });
