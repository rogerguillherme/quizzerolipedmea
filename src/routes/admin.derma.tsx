import { createFileRoute } from "@tanstack/react-router";
import { Crown, Construction } from "lucide-react";

export const Route = createFileRoute("/admin/derma")({
  component: DermaAdmin,
});

function DermaAdmin() {
  return (
    <div>
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#B8974D]">
          App · Método Derma
        </p>
        <h1
          className="mt-1 text-3xl italic text-[#0B2A4A]"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          Programa premium de 90 dias
        </h1>
      </header>
      <div className="mt-8 rounded-2xl border border-[#E5DBC3] bg-gradient-to-br from-[#0B2A4A] to-[#123B66] p-8 text-[#F7F2E8]">
        <div className="flex items-start gap-4">
          <div className="grid size-12 place-items-center rounded-xl bg-[#B8974D]/20">
            <Crown className="size-5 text-[#F2D68A]" />
          </div>
          <div>
            <h2
              className="text-xl italic"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              Cadastros e conteúdos premium
            </h2>
            <p className="mt-2 max-w-lg text-sm opacity-90">
              Assinantes, fase atual (1–3), anamnese completa e conteúdos por fase
              ficarão aqui. A base já suporta — falta interface dedicada.
            </p>
            <p className="mt-3 flex items-center gap-2 text-xs opacity-80">
              <Construction className="size-4" /> Próxima entrega
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
