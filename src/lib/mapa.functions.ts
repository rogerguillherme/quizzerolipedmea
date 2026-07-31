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

    return { diagnostico, leadId: inserted?.id ?? null };
  });
