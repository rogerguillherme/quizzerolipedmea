import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Bell, CreditCard, LogOut, User, ShieldCheck, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getApp } from "../lib/quiz-store";
import { getNotifPrefs, setNotifPrefs, type NotifPrefs } from "../lib/analytics";

export const Route = createFileRoute("/app/perfil")({
  component: Perfil,
});

function Perfil() {
  const app = getApp();
  const navigate = useNavigate();
  const [prefs, setPrefsState] = useState<NotifPrefs>({});

  useEffect(() => {
    setPrefsState({
      lembreteMissao: true,
      liberouDerma: true,
      reagendamento: true,
      modo: "distribuido",
      ...getNotifPrefs(),
    });
  }, []);

  function update(patch: Partial<NotifPrefs>) {
    const next = { ...prefs, ...patch };
    setPrefsState(next);
    setNotifPrefs(patch);
  }

  async function sair() {
    localStorage.removeItem("zl:app");
    localStorage.removeItem("zl:quiz");
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="px-5 pt-4">
      <div className="flex items-center gap-2">
        <Link
          to="/app"
          className="grid size-9 place-items-center rounded-full"
          style={{
            border: "1px solid rgba(216,198,160,0.6)",
            background: "rgba(255,253,247,0.85)",
            color: "#16324F",
          }}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <p
          className="italic"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 500,
            color: "#16324F",
            fontSize: "1.05rem",
          }}
        >
          Perfil
        </p>
      </div>

      <div
        className="mt-5 flex items-center gap-4 rounded-3xl p-5"
        style={{
          background: "rgba(255,253,247,0.92)",
          border: "1px solid rgba(216,198,160,0.55)",
          boxShadow: "0 12px 24px -20px rgba(22,50,79,0.3)",
        }}
      >
        <span
          className="grid size-14 place-items-center rounded-2xl"
          style={{
            background: "linear-gradient(180deg, #2C5578, #16324F)",
            color: "#F5EFE1",
          }}
        >
          <User className="size-6" />
        </span>
        <div>
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 500,
              fontSize: "1.2rem",
              color: "#16324F",
              lineHeight: 1.15,
            }}
          >
            {app.nome || "Sua conta"}
          </p>
          <p className="mt-0.5 text-[12px]" style={{ color: "#2F3128" }}>
            {app.telefone || "sem telefone cadastrado"}
          </p>
        </div>
      </div>

      <div
        className="mt-5 rounded-3xl p-5"
        style={{
          background: "rgba(255,253,247,0.92)",
          border: "1px solid rgba(216,198,160,0.55)",
        }}
      >
        <div className="flex items-center gap-2">
          <Bell className="size-3.5" style={{ color: "#AF7F35" }} />
          <span
            className="text-[10px] font-semibold uppercase"
            style={{ letterSpacing: "0.24em", color: "#AF7F35" }}
          >
            Notificações
          </span>
        </div>
        <p className="mt-2 text-[12px]" style={{ color: "#2F3128", lineHeight: 1.5 }}>
          O canal principal é o WhatsApp. Aqui no app avisamos só o essencial —
          nada de "abra o app" sem motivo.
        </p>

        <div className="mt-4 space-y-3">
          <Toggle
            label="Lembrar de completar a missão do dia"
            desc="Só se você não tiver aberto o WhatsApp naquele dia."
            checked={!!prefs.lembreteMissao}
            onChange={(v) => update({ lembreteMissao: v })}
          />
          <Toggle
            label="Aviso quando o Método Derma abrir"
            desc="Convite para avaliação, uma vez só."
            checked={!!prefs.liberouDerma}
            onChange={(v) => update({ liberouDerma: v })}
          />
          <Toggle
            label="Lembrete de reagendamento"
            desc="Se você pediu um dia extra, avisamos quando retomar."
            checked={!!prefs.reagendamento}
            onChange={(v) => update({ reagendamento: v })}
          />
        </div>

        <div className="mt-5">
          <p className="text-[12px] font-semibold" style={{ color: "#16324F" }}>
            Formato dos avisos
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <ModeButton
              active={prefs.modo === "distribuido"}
              onClick={() => update({ modo: "distribuido" })}
              title="Distribuídos"
              desc="Ao longo do dia"
            />
            <ModeButton
              active={prefs.modo === "resumo"}
              onClick={() => update({ modo: "resumo" })}
              title="Resumo único"
              desc="Uma vez por dia"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <Row icon={<CreditCard className="size-4" />} title="Histórico de pagamento" desc="Desafio, bônus e futuros upgrades" />
        <Row icon={<ShieldCheck className="size-4" />} title="Termos e privacidade" desc="Como cuidamos dos seus dados" />
        <Link
          to="/app/reembolso"
          className="flex w-full items-center gap-3 rounded-2xl p-4"
          style={{
            background: "rgba(255,253,247,0.92)",
            border: "1px solid rgba(216,198,160,0.55)",
          }}
        >
          <span
            className="grid size-10 shrink-0 place-items-center rounded-full"
            style={{
              background: "rgba(175,127,53,0.1)",
              border: "1px solid rgba(175,127,53,0.35)",
              color: "#AF7F35",
            }}
          >
            <RefreshCw className="size-4" />
          </span>
          <div className="flex-1">
            <p className="text-[14px] font-semibold" style={{ color: "#16324F" }}>
              Pedir reembolso
            </p>
            <p className="text-[11.5px]" style={{ color: "#2F3128" }}>
              Sob a garantia dos 7 dias
            </p>
          </div>
        </Link>
      </div>

      <button
        onClick={sair}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-full px-5 py-4 text-[14.5px] font-semibold"
        style={{
          background: "rgba(255,253,247,0.9)",
          border: "1px solid rgba(216,198,160,0.6)",
          color: "#B23A48",
        }}
      >
        <LogOut className="size-4" /> Sair
      </button>

      <p
        className="mt-6 text-center text-[11px] leading-relaxed"
        style={{ color: "#2F3128" }}
      >
        Conteúdo educacional de estilo de vida. Não substitui avaliação médica.
      </p>
    </div>
  );
}

function Row({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      className="flex w-full items-center gap-3 rounded-2xl p-4 text-left"
      style={{
        background: "rgba(255,253,247,0.92)",
        border: "1px solid rgba(216,198,160,0.55)",
      }}
    >
      <span
        className="grid size-10 shrink-0 place-items-center rounded-full"
        style={{
          background: "rgba(175,127,53,0.1)",
          border: "1px solid rgba(175,127,53,0.35)",
          color: "#AF7F35",
        }}
      >
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-[14px] font-semibold" style={{ color: "#16324F" }}>
          {title}
        </p>
        <p className="text-[11.5px]" style={{ color: "#2F3128" }}>
          {desc}
        </p>
      </div>
    </button>
  );
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 text-left"
    >
      <div className="flex-1">
        <p className="text-[13px] font-semibold" style={{ color: "#16324F" }}>
          {label}
        </p>
        <p className="text-[11.5px]" style={{ color: "#2F3128", lineHeight: 1.45 }}>
          {desc}
        </p>
      </div>
      <span
        className="relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors"
        style={{
          background: checked ? "#AF7F35" : "rgba(216,198,160,0.5)",
        }}
      >
        <span
          className={[
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
            checked ? "left-5" : "left-0.5",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

function ModeButton({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl p-3 text-left transition-all"
      style={{
        background: active ? "rgba(217,169,75,0.12)" : "rgba(255,253,247,0.9)",
        border: `1px solid ${active ? "rgba(175,127,53,0.55)" : "rgba(216,198,160,0.55)"}`,
      }}
    >
      <p className="text-[13px] font-semibold" style={{ color: "#16324F" }}>
        {title}
      </p>
      <p className="text-[11px]" style={{ color: "#2F3128" }}>
        {desc}
      </p>
    </button>
  );
}
