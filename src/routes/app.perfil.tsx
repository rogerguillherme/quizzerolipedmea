import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Bell, CreditCard, LogOut, User, ShieldCheck, RefreshCw } from "lucide-react";
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

  function sair() {
    localStorage.removeItem("zl:app");
    localStorage.removeItem("zl:quiz");
    navigate({ to: "/" });
  }

  return (
    <div className="px-5 pt-4">
      <div className="flex items-center gap-2">
        <Link
          to="/app"
          className="grid size-9 place-items-center rounded-xl text-primary hover:bg-accent"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <p className="font-bold text-primary">Perfil</p>
      </div>

      <div className="card-clinical mt-5 flex items-center gap-4 p-5">
        <div className="grid size-14 place-items-center rounded-2xl bg-sapphire-100 text-sapphire-800">
          <User className="size-6" />
        </div>
        <div>
          <p className="text-lg font-extrabold text-primary">{app.nome || "Sua conta"}</p>
          <p className="text-xs text-muted-foreground">{app.telefone || "sem telefone cadastrado"}</p>
        </div>
      </div>

      {/* Notification preferences */}
      <div className="card-clinical mt-5 p-5">
        <div className="flex items-center gap-2 text-sapphire-600">
          <Bell className="size-4" />
          <p className="text-xs font-bold uppercase tracking-wide">Notificações</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          O canal principal é o WhatsApp. Aqui no app avisamos só o essencial —
          nada de “abra o app” sem motivo.
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
          <p className="text-xs font-semibold text-primary">Formato dos avisos</p>
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

      <div className="mt-4 space-y-3">
        <Row icon={<CreditCard className="size-4" />} title="Histórico de pagamento" desc="Desafio, bônus e futuros upgrades" />
        <Row icon={<ShieldCheck className="size-4" />} title="Termos e privacidade" desc="Como cuidamos dos seus dados" />
        <Link
          to="/app/reembolso"
          className="card-clinical flex w-full items-center gap-3 p-4 text-left"
        >
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sapphire-100 text-sapphire-800">
            <RefreshCw className="size-4" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-primary">Pedir reembolso</p>
            <p className="text-xs text-muted-foreground">Sob a garantia dos 7 dias</p>
          </div>
        </Link>
      </div>

      <button
        onClick={sair}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-4 text-base font-bold text-destructive"
      >
        <LogOut className="size-4" /> Sair
      </button>

      <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
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
    <button className="card-clinical flex w-full items-center gap-3 p-4 text-left">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sapphire-100 text-sapphire-800">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-primary">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
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
        <p className="text-sm font-semibold text-primary">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <span
        className={[
          "relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-coral" : "bg-sapphire-100",
        ].join(" ")}
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
      className={[
        "rounded-xl border-2 p-3 text-left transition-all",
        active ? "border-primary bg-sapphire-100" : "border-border bg-card",
      ].join(" ")}
    >
      <p className="text-sm font-bold text-primary">{title}</p>
      <p className="text-[11px] text-muted-foreground">{desc}</p>
    </button>
  );
}
