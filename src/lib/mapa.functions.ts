import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

/**
 * Respostas do Mapa do Lipedema.
 * Público (sem login). Grava um lead novo e devolve um diagnóstico gerado por IA.
 */
const MapaInput = z.object({
  nome: z.string().trim().min(2).max(80),
  telefone: z.string().trim().min(8).max(40),
  email: z.string().trim().email().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  idade: z.number().int().min(12).max(90).optional(),
  respostas: z.object({
    tempoSintomas: z.string().min(1),
    regioes: z.array(z.string()).min(1),
    dorNivel: z.number().min(0).max(10),
    hormonal: z.string().min(1),
    familia: z.string().min(1),
    tentouDietaExercicio: z.string().min(1),
    impactoEmocional: z.string().min(1),
    inchaco: z.string().optional(),
    hematomas: z.string().optional(),
  }),
});

export type MapaInputType = z.infer<typeof MapaInput>;

export type Diagnostico = {
  estagioProvavel: "Estágio 1" | "Estágio 2" | "Estágio 3" | "Indeterminado";
  resumo: string;
  pontosChave: string[];
  proximosPassos: string[];
  gatilhos: string[];
};

const SYSTEM_PROMPT = `Você é uma assistente clínica da nutricionista Gabriela Rosado (CRN 10582), especialista em lipedema.
Sua função é ler as respostas do "Mapa do Lipedema" de uma mulher e devolver uma leitura acolhedora, técnica e humana — nunca fria.

Regras invioláveis:
- NÃO faz diagnóstico médico. Diga sempre que é uma leitura educacional e sugere avaliação clínica.
- Tom: acolhedor, direto, sem infantilizar. Fale com ela, não sobre ela. Use o primeiro nome quando fizer sentido.
- Português do Brasil, mulher adulta 25–55 anos, cansada de ser desacreditada.
- Nunca prometa cura, emagrecimento ou resultado estético.
- Nunca use jargão médico sem tradução.
- Baseie-se nas respostas. Se algo está ausente, não invente.

Devolva EXCLUSIVAMENTE um JSON válido, sem markdown, sem texto antes ou depois, no formato:
{
  "estagioProvavel": "Estágio 1" | "Estágio 2" | "Estágio 3" | "Indeterminado",
  "resumo": "3-4 frases falando diretamente com ela sobre o que o Mapa mostra.",
  "pontosChave": ["até 5 bullets curtos, cada um até 140 caracteres"],
  "gatilhos": ["até 3 bullets sobre fatores hormonais/genéticos/inflamatórios identificados"],
  "proximosPassos": ["3 bullets acionáveis do que a Gabriela costuma orientar como primeiro passo"]
}`;

export const submitMapa = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => MapaInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");

    // 1) IA gera o diagnóstico
    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-3-flash-preview");

    const userPrompt = `Nome: ${data.nome}
Idade: ${data.idade ?? "não informada"}
Respostas do Mapa:
- Tempo de sintomas: ${data.respostas.tempoSintomas}
- Regiões mais afetadas: ${data.respostas.regioes.join(", ")}
- Nível de dor/peso (0-10): ${data.respostas.dorNivel}
- Momento hormonal: ${data.respostas.hormonal}
- Casos na família: ${data.respostas.familia}
- Já tentou dieta/exercício: ${data.respostas.tentouDietaExercicio}
- Impacto emocional: ${data.respostas.impactoEmocional}
${data.respostas.inchaco ? `- Padrão de inchaço: ${data.respostas.inchaco}` : ""}
${data.respostas.hematomas ? `- Hematomas com facilidade: ${data.respostas.hematomas}` : ""}

Devolva o JSON conforme instruções.`;

    let diagnostico: Diagnostico;
    try {
      const { text } = await generateText({
        model,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
      });
      const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
      diagnostico = JSON.parse(cleaned) as Diagnostico;
    } catch (err) {
      console.error("[submitMapa] Falha ao gerar diagnóstico:", err);
      diagnostico = {
        estagioProvavel: "Indeterminado",
        resumo:
          "Seu Mapa foi registrado. Vou te chamar no WhatsApp para revisar as respostas com calma e montar a leitura personalizada com a Gabriela.",
        pontosChave: [
          "Suas respostas foram salvas com segurança.",
          "A leitura completa vai chegar pelo WhatsApp em instantes.",
        ],
        gatilhos: [],
        proximosPassos: [
          "Abrir a conversa no WhatsApp para receber o Mapa completo.",
          "Ter em mãos: horário de sono, ciclo menstrual e histórico familiar.",
        ],
      };
    }

    // 2) Salva o lead no banco (via anon INSERT policy) — retorna id
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    // Insere primeiro sem diagnóstico (policy anon exige diagnostico IS NULL),
    // depois preenche com service_role para não conflitar com a policy.
    const { data: inserted, error: insertErr } = await supabase
      .from("leads")
      .insert({
        nome: data.nome,
        telefone: data.telefone,
        email: data.email,
        idade: data.idade,
        respostas: data.respostas,
        origem: "mapa",
        status: "mapa_gerado",
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("[submitMapa] insert error", insertErr);
    }

    if (inserted?.id) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("leads")
        .update({ diagnostico })
        .eq("id", inserted.id);
    }

    return { diagnostico, leadId: inserted?.id ?? null };
  });
