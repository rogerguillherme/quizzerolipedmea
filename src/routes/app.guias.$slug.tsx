import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, ChevronRight, Lock, ShieldAlert } from "lucide-react";
import { getMealTestStatus } from "@/lib/meal-test.functions";
import { GUIA_ICONS } from "@/components/GuiasCards";
import { getGuia, type Bloco, type Guia } from "@/lib/guias-content";

export const Route = createFileRoute("/app/guias/$slug")({
  loader: ({ params }) => {
    const guia = getGuia(params.slug);
    if (!guia) throw notFound();
    return { titulo: guia.titulo, subtitulo: guia.subtitulo };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.titulo} · Zero Lipedema` },
          { name: "description", content: loaderData.subtitulo },
          { name: "robots", content: "noindex" },
        ]
      : [
          { title: "Guia não encontrado · Zero Lipedema" },
          { name: "robots", content: "noindex" },
        ],
  }),
  notFoundComponent: GuiaNaoEncontrado,
  component: GuiaLeitura,
});

const NAVY = "#16324F";
const GOLD = "#AF7F35";
const GOLD_SOFT = "#D9A94B";
const CREME = "#F5EFE1";

const CARD: React.CSSProperties = {
  background: "rgba(255,253,247,0.9)",
  border: "1px solid rgba(216,198,160,0.55)",
  boxShadow: "0 10px 24px -20px rgba(22,50,79,0.3)",
};

const CORPO: React.CSSProperties = { fontSize: "14.5px", lineHeight: 1.65, color: "#2F3128" };

function GuiaNaoEncontrado() {
  return (
    <div className="px-5 py-16 text-center">
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", color: NAVY }}>
        Guia não encontrado
      </p>
      <Link to="/app/guias" className="mt-3 inline-block text-[13px] font-semibold" style={{ color: GOLD }}>
        Ver todos os guias
      </Link>
    </div>
  );
}

function TituloBloco({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-[17px]"
      style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, color: NAVY }}
    >
      {children}
    </h2>
  );
}

function RenderBloco({ bloco }: { bloco: Bloco }) {
  if (bloco.tipo === "texto") {
    if (bloco.destaque) {
      return (
        <section
          className="rounded-[24px] px-5 py-5"
          style={{
            background: "linear-gradient(160deg, #2C5578 0%, #16324F 55%, #0D2138 100%)",
            boxShadow: "0 24px 40px -28px rgba(22,50,79,0.55)",
            color: CREME,
          }}
        >
          {bloco.titulo && (
            <p
              className="text-[10px] font-semibold uppercase"
              style={{ letterSpacing: "0.24em", color: GOLD_SOFT }}
            >
              {bloco.titulo}
            </p>
          )}
          <div className="mt-2 space-y-2.5">
            {bloco.paragrafos.map((p, i) => (
              <p key={i} style={{ ...CORPO, color: "rgba(245,239,225,0.9)" }}>
                {p}
              </p>
            ))}
          </div>
        </section>
      );
    }
    return (
      <section className="rounded-[24px] px-5 py-5" style={CARD}>
        {bloco.titulo && <TituloBloco>{bloco.titulo}</TituloBloco>}
        <div className="mt-2.5 space-y-2.5">
          {bloco.paragrafos.map((p, i) => (
            <p key={i} style={CORPO}>
              {p}
            </p>
          ))}
        </div>
      </section>
    );
  }

  if (bloco.tipo === "opcoes") {
    return (
      <section className="rounded-[24px] px-5 py-5" style={CARD}>
        <TituloBloco>{bloco.titulo}</TituloBloco>
        {bloco.legenda && (
          <p className="mt-0.5 text-[11px] font-semibold uppercase" style={{ letterSpacing: "0.18em", color: GOLD }}>
            {bloco.legenda}
          </p>
        )}
        <ol className="mt-3 space-y-2.5">
          {bloco.itens.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold"
                style={{ background: "rgba(175,127,53,0.12)", color: GOLD }}
              >
                {i + 1}
              </span>
              <span style={CORPO}>{item}</span>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  if (bloco.tipo === "substituicoes") {
    return (
      <section className="overflow-hidden rounded-[24px]" style={CARD}>
        <div className="px-5 pt-5">
          <TituloBloco>{bloco.titulo}</TituloBloco>
        </div>
        <div className="mt-3 grid grid-cols-2 px-5 pb-1">
          <p className="text-[10px] font-semibold uppercase" style={{ letterSpacing: "0.18em", color: GOLD }}>
            No lugar de
          </p>
          <p className="text-[10px] font-semibold uppercase" style={{ letterSpacing: "0.18em", color: GOLD }}>
            Use
          </p>
        </div>
        <div className="px-5 pb-5">
          {bloco.itens.map((it, i) => (
            <div
              key={i}
              className="grid grid-cols-2 gap-2 py-2.5"
              style={{ borderTop: "1px solid rgba(216,198,160,0.45)" }}
            >
              <p className="text-[13.5px]" style={{ color: "#5C5749", lineHeight: 1.5 }}>
                {it.de}
              </p>
              <p className="text-[13.5px] font-semibold" style={{ color: NAVY, lineHeight: 1.5 }}>
                {it.para}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (bloco.tipo === "compras") {
    return (
      <section className="rounded-[24px] px-5 py-5" style={CARD}>
        <TituloBloco>{bloco.titulo}</TituloBloco>
        <div className="mt-3 space-y-4">
          {bloco.grupos.map((g) => (
            <div key={g.nome}>
              <p className="text-[10px] font-semibold uppercase" style={{ letterSpacing: "0.2em", color: GOLD }}>
                {g.nome}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {g.itens.map((item) => (
                  <span
                    key={item}
                    className="rounded-full px-3 py-1.5 text-[12.5px]"
                    style={{
                      background: "rgba(22,50,79,0.05)",
                      border: "1px solid rgba(216,198,160,0.5)",
                      color: NAVY,
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (bloco.tipo === "receita") {
    return (
      <section className="rounded-[24px] px-5 py-5" style={CARD}>
        <TituloBloco>{bloco.nome}</TituloBloco>
        <div className="mt-3 space-y-3">
          {[
            { r: "Para quê", v: bloco.paraQue },
            { r: "Como preparar", v: bloco.preparo },
            { r: "Quando tomar", v: bloco.quando },
          ].map((x) => (
            <div key={x.r}>
              <p className="text-[10px] font-semibold uppercase" style={{ letterSpacing: "0.2em", color: GOLD }}>
                {x.r}
              </p>
              <p className="mt-0.5" style={CORPO}>
                {x.v}
              </p>
            </div>
          ))}
        </div>
        <div
          className="mt-4 flex items-start gap-2.5 rounded-2xl px-3.5 py-3"
          style={{ background: "rgba(175,127,53,0.10)", border: "1px solid rgba(175,127,53,0.32)" }}
        >
          <ShieldAlert className="mt-0.5 size-4 shrink-0" style={{ color: GOLD }} />
          <div>
            <p className="text-[10px] font-semibold uppercase" style={{ letterSpacing: "0.18em", color: GOLD }}>
              Quem não deve tomar
            </p>
            <p className="mt-0.5 text-[13px]" style={{ color: "#2F3128", lineHeight: 1.55 }}>
              {bloco.naoIndicado}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[24px] px-5 py-5" style={CARD}>
      <TituloBloco>{bloco.titulo}</TituloBloco>
      <div className="mt-3 space-y-3.5">
        {bloco.itens.map((h) => (
          <div key={h.n} className="flex items-start gap-3">
            <span
              className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold"
              style={{ background: "rgba(175,127,53,0.12)", color: GOLD }}
            >
              {h.n}
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold" style={{ color: NAVY, lineHeight: 1.45 }}>
                {h.nome}
              </p>
              <p className="mt-1 text-[13.5px]" style={{ color: "#2F3128", lineHeight: 1.6 }}>
                {h.porque}
              </p>
              <p className="mt-0.5 text-[13.5px]" style={{ color: "#5C5749", lineHeight: 1.6 }}>
                {h.como}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function GuiaLeitura() {
  const { slug } = Route.useParams();
  const guia = getGuia(slug) as Guia;

  const fetchStatus = useServerFn(getMealTestStatus);
  const { data: status, isLoading } = useQuery({
    queryKey: ["meal-test-status"],
    queryFn: () => fetchStatus(),
  });
  const pago = Boolean(status?.pago);

  // Quem não comprou lê o primeiro bloco; o resto fica borrado atrás do convite.
  const liberados = pago || isLoading ? guia.blocos : guia.blocos.slice(0, 1);
  const bloqueados = pago || isLoading ? [] : guia.blocos.slice(1);

  return (
    <div className="pb-8">
      {/* Cabeçalho fino */}
      <header
        className="sticky top-0 z-10 flex items-center gap-3 px-5 py-3"
        style={{
          background: "rgba(251,246,233,0.92)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(216,198,160,0.45)",
        }}
      >
        <Link
          to="/app/guias"
          aria-label="Voltar para os guias"
          className="grid size-8 shrink-0 place-items-center rounded-full"
          style={{ background: "rgba(22,50,79,0.06)", color: NAVY }}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <span className="shrink-0" style={{ color: GOLD }}>
          {GUIA_ICONS[guia.iconKey]}
        </span>
        <p className="truncate text-[13px] font-semibold" style={{ color: NAVY }}>
          {guia.titulo}
        </p>
      </header>

      <div className="px-5 pt-5">
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 500,
            fontSize: "1.55rem",
            lineHeight: 1.2,
            color: NAVY,
          }}
        >
          {guia.titulo}
        </h1>
        <p className="mt-2 text-[13.5px]" style={{ color: "#5C5749", lineHeight: 1.6 }}>
          {guia.subtitulo}
        </p>

        <div className="mt-5 space-y-4">
          {liberados.map((b, i) => (
            <RenderBloco key={i} bloco={b} />
          ))}
        </div>

        {bloqueados.length > 0 && (
          <div className="relative mt-4">
            <div
              aria-hidden
              className="space-y-4"
              style={{ filter: "blur(6px)", opacity: 0.55, pointerEvents: "none", maxHeight: 520, overflow: "hidden" }}
            >
              {bloqueados.slice(0, 2).map((b, i) => (
                <RenderBloco key={i} bloco={b} />
              ))}
            </div>

            <div
              className="absolute inset-x-0 bottom-0 rounded-[24px] px-5 py-5"
              style={{
                background: "linear-gradient(160deg, #2C5578 0%, #16324F 55%, #0D2138 100%)",
                boxShadow: "0 24px 40px -28px rgba(22,50,79,0.55)",
                color: CREME,
              }}
            >
              <p
                className="flex items-center gap-2 text-[10px] font-semibold uppercase"
                style={{ letterSpacing: "0.22em", color: GOLD_SOFT }}
              >
                <Lock className="size-3.5" /> Continua no plano
              </p>
              <p className="mt-2 text-[13.5px]" style={{ color: "rgba(245,239,225,0.88)", lineHeight: 1.6 }}>
                O guia completo faz parte do Plano Zero Lipedema, junto com a Rotina de 4 semanas e o registro
                de refeições por foto.
              </p>
              <Link
                to="/app/derma"
                className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold"
                style={{ background: GOLD_SOFT, color: NAVY }}
              >
                Liberar meu guia <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        )}

        {guia.rodape && (
          <p
            className="mt-6 rounded-2xl px-4 py-3 text-[11.5px]"
            style={{
              background: "rgba(22,50,79,0.04)",
              border: "1px solid rgba(216,198,160,0.45)",
              color: "#5C5749",
              lineHeight: 1.55,
            }}
          >
            {guia.rodape}
          </p>
        )}

        <Link
          to="/app/guias"
          className="mt-6 inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
          style={{ color: NAVY }}
        >
          ver os outros guias <ChevronRight className="size-3.5" style={{ color: GOLD }} />
        </Link>
      </div>
    </div>
  );
}
