import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { enviarAcessoMapa } from "@/lib/plano.functions";
import { formatPhoneBR, onlyDigits } from "@/lib/phone";
import { marcarMapaEnviado, type MapaSessao } from "@/lib/mapa-sessao";
import { track } from "@/lib/analytics";
import { trackMeta } from "@/lib/meta-track";

const C = {
  navy: "#16324F",
  navySoft: "#1E4266",
  cream: "#FBF7EE",
  gold: "#8A6224",
  goldLight: "#C79246",
  line: "#E4D9BE",
} as const;

/**
 * Popup do Mapa na landing /plano.
 *
 * Bottom sheet no celular, card centralizado no desktop. É aqui, e só aqui,
 * que o WhatsApp da lead é capturado e o acesso à plataforma é disparado.
 */
export function MapaPopup({
  sessao,
  open,
  onClose,
  onVerFases,
}: {
  sessao: MapaSessao;
  open: boolean;
  onClose: () => void;
  /** Fecha o popup e leva a lead até o bloco de preço. Ponto de maior intenção. */
  onVerFases?: () => void;
}) {
  const enviar = useServerFn(enviarAcessoMapa);
  const [telefone, setTelefone] = useState(() =>
    sessao.telefone ? formatPhoneBR(sessao.telefone) : "",
  );
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    track("mapa_popup_aberto", {
      lead_id: sessao.leadId,
      funil: sessao.funil ?? "plano-direto",
      estagio: sessao.diagnostico?.estagio,
    });
  }, [open, sessao.leadId, sessao.funil, sessao.diagnostico?.estagio]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const d = sessao.diagnostico;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digitos = onlyDigits(telefone).replace(/^55/, "");
    if (digitos.length !== 10 && digitos.length !== 11) {
      setErro("Preciso do número com DDD, tipo (11) 90000-0000.");
      return;
    }
    if (!sessao.leadId) {
      setErro("Perdi seu Mapa aqui do meu lado. Recarrega a página e tenta de novo?");
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      const r = await enviar({ data: { leadId: sessao.leadId, telefone } });
      if (r.ok) {
        marcarMapaEnviado(r.telefone);
        track("whatsapp_capturado", {
          lead_id: sessao.leadId,
          funil: sessao.funil ?? "plano-direto",
        });
        // Eventos que a Meta usa para otimizar a campanha. Advanced matching
        // vai por dentro do trackMeta (telefone/nome hasheados no servidor).
        trackMeta(
          "Lead",
          { content_name: "Mapa do Lipedema", lead_id: sessao.leadId },
          { phone: r.telefone, firstName: sessao.nome, externalId: sessao.leadId },
        );
        trackMeta(
          "CompleteRegistration",
          { content_name: "Acesso ao app Zero Lipedema", status: "acesso_criado" },
          { phone: r.telefone, firstName: sessao.nome, externalId: sessao.leadId },
        );
        setSucesso(true);
      } else {
        setErro(r.mensagem);
      }
    } catch {
      setErro("Algo travou aqui do meu lado. Quer tentar de novo?");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Seu Mapa do Lipedema"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-t-3xl shadow-2xl animate-[mapa-sheet-in_.42s_cubic-bezier(.16,1,.3,1)] sm:rounded-3xl"
        style={{ background: C.cream, maxHeight: "92dvh" }}
      >
        <div className="max-h-[92dvh] overflow-y-auto">
          {/* Topo navy */}
          <div className="relative px-6 pb-7 pt-7" style={{ background: C.navy }}>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}
            >
              <X className="h-5 w-5" />
            </button>
            <span
              className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide"
              style={{ background: "rgba(199,146,70,.22)", color: C.goldLight }}
            >
              Estágio percebido: {d.estagio}
            </span>
            <h2
              className="mt-4 pr-10 text-[22px] font-semibold leading-snug"
              style={{ color: "#fff", fontFamily: "Georgia, serif" }}
            >
              {d.aberturaValidadora}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "#CBD9E6" }}>
              {d.descricaoEstagio}
            </p>
          </div>

          <div className="px-6 py-6">
            <p className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: C.gold }}>
              Suas 3 prioridades agora
            </p>
            <ol className="mt-3 space-y-3">
              {(d.prioridades ?? []).slice(0, 3).map((p, i) => (
                <li key={p} className="flex gap-3">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                    style={{ background: C.navy, color: C.goldLight }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-[15px] leading-relaxed" style={{ color: C.navy }}>
                    {p}
                  </span>
                </li>
              ))}
            </ol>

            {sucesso ? (
              <div className="mt-7 rounded-2xl border p-5 text-center" style={{ borderColor: C.line }}>
                <CheckCircle2 className="mx-auto h-9 w-9" style={{ color: C.gold }} />
                <p className="mt-3 text-[17px] font-semibold" style={{ color: C.navy }}>
                  Pronto, enviei pro seu WhatsApp.
                </p>
                <p className="mt-2 text-[14px] leading-relaxed" style={{ color: C.navySoft }}>
                  Seu Mapa aponta {d.estagio}. Quer saber como começar a agir no que alimenta a
                  inflamação do lipedema?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    // Clique de maior intenção do popup: leva a lead pra oferta.
                    track("mapa_popup_acessar", {
                      lead_id: sessao.leadId,
                      funil: sessao.funil ?? "plano-direto",
                      estagio: d.estagio,
                    });
                    trackMeta("ViewContent", {
                      content_name: "Mapa do Lipedema - Acessar",
                      content_category: "popup_mapa",
                    });
                    if (onVerFases) onVerFases();
                    else onClose();
                  }}
                  className="mt-5 w-full rounded-full px-6 py-4 text-[16px] font-semibold"
                  style={{ background: C.gold, color: "#fff" }}
                >
                  Acessar
                </button>
                <p className="mt-3 text-[12px]" style={{ color: C.navySoft }}>
                  7 dias de garantia. Não serviu, você me chama e eu devolvo.
                </p>

              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-7">
                <label
                  htmlFor="mapa-telefone"
                  className="block text-[15px] font-semibold"
                  style={{ color: C.navy }}
                >
                  Para onde eu envio seu Mapa completo?
                </label>
                <input
                  id="mapa-telefone"
                  ref={inputRef}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="(11) 90000-0000"
                  value={telefone}
                  onChange={(e) => {
                    setTelefone(formatPhoneBR(e.target.value));
                    setErro(null);
                  }}
                  className="mt-3 w-full rounded-2xl border px-4 py-4 text-[16px] outline-none"
                  style={{ borderColor: erro ? "#B4453C" : C.line, background: "#fff", color: C.navy }}
                />
                {erro && (
                  <p className="mt-2 text-[13px]" style={{ color: "#B4453C" }}>
                    {erro}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={enviando}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-[16px] font-semibold disabled:opacity-70"
                  style={{ background: C.gold, color: "#fff" }}
                >
                  {enviando && <Loader2 className="h-5 w-5 animate-spin" />}
                  {enviando ? "Enviando…" : erro ? "Tentar de novo" : "Receber meu Mapa no WhatsApp"}
                </button>
                <p className="mt-3 text-[12px] leading-relaxed" style={{ color: C.navySoft }}>
                  Você recebe o acesso à plataforma para ler seu Mapa completo. É gratuito e não tem
                  cobrança nenhuma nessa etapa.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
