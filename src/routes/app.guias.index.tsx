import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Lock } from "lucide-react";
import { getMealTestStatus } from "@/lib/meal-test.functions";
import { GuiasCards } from "@/components/GuiasCards";

export const Route = createFileRoute("/app/guias/")({
  component: GuiasIndex,
  head: () => ({
    meta: [
      { title: "Guias · Zero Lipedema" },
      {
        name: "description",
        content:
          "Plano alimentar anti-inflamatório, Guia Natural e Guia Desinchando na Prática: os materiais de apoio da Rotina Zero Lipedema.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const NAVY = "#16324F";
const GOLD = "#AF7F35";
const GOLD_SOFT = "#D9A94B";

function GuiasIndex() {
  const fetchStatus = useServerFn(getMealTestStatus);
  const { data: status } = useQuery({ queryKey: ["meal-test-status"], queryFn: () => fetchStatus() });
  const pago = Boolean(status?.pago);

  return (
    <div className="px-5 pt-6 pb-8">
      <p className="text-[10px] font-semibold uppercase" style={{ letterSpacing: "0.24em", color: GOLD }}>
        Materiais de apoio
      </p>
      <h1
        className="mt-1.5"
        style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, fontSize: "1.6rem", color: NAVY }}
      >
        Seus guias
      </h1>
      <p className="mt-2 text-[13.5px]" style={{ color: "#5C5749", lineHeight: 1.6 }}>
        Três materiais que caminham junto com a Rotina: o que comer, o que preparar em casa e o que fazer no
        dia a dia para as pernas pesarem menos.
      </p>

      <div className="mt-5">
        <GuiasCards />
      </div>

      {!pago && (
        <section
          className="mt-6 rounded-[24px] px-5 py-5"
          style={{
            background: "linear-gradient(160deg, #2C5578 0%, #16324F 55%, #0D2138 100%)",
            boxShadow: "0 24px 40px -28px rgba(22,50,79,0.55)",
            color: "#F5EFE1",
          }}
        >
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase" style={{ letterSpacing: "0.22em", color: GOLD_SOFT }}>
            <Lock className="size-3.5" /> Conteúdo do plano
          </p>
          <p className="mt-2 text-[13.5px]" style={{ color: "rgba(245,239,225,0.88)", lineHeight: 1.6 }}>
            Você pode ler o começo de cada guia. O conteúdo completo faz parte do Plano Zero Lipedema, junto
            com a Rotina de 4 semanas e o registro de refeições por foto.
          </p>
          <Link
            to="/app/derma"
            className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold"
            style={{ background: GOLD_SOFT, color: NAVY }}
          >
            Ver o plano <ArrowRight className="size-4" />
          </Link>
        </section>
      )}
    </div>
  );
}
