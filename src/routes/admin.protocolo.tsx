import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Construction } from "lucide-react";

export const Route = createFileRoute("/admin/protocolo")({
  component: ProtocoloAdmin,
});

function ProtocoloAdmin() {
  return (
    <div>
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#B8974D]">
          App · Protocolo 7 dias
        </p>
        <h1
          className="mt-1 text-3xl italic text-[#0B2A4A]"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          Desafio de entrada
        </h1>
      </header>
      <div className="mt-8 rounded-2xl border border-[#E5DBC3] bg-white/70 p-8">
        <div className="flex items-start gap-4">
          <div className="grid size-12 place-items-center rounded-xl bg-[#EFE5CE]">
            <Sparkles className="size-5 text-[#B8974D]" />
          </div>
          <div>
            <h2
              className="text-xl italic text-[#0B2A4A]"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              Área em preparação
            </h2>
            <p className="mt-2 max-w-lg text-sm text-[#3E4F65]">
              Aqui vão ficar o cadastro dos 7 dias, mensagens automáticas por dia,
              acompanhamento das participantes e relatório final. Vou plugar assim
              que o CRM/funis estiverem sendo usados no dia a dia.
            </p>
            <p className="mt-3 flex items-center gap-2 text-xs text-[#8A7C5C]">
              <Construction className="size-4" /> Próxima entrega
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
