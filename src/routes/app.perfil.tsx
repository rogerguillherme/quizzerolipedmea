import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bell, CreditCard, LogOut, User, ShieldCheck } from "lucide-react";
import { getApp } from "../lib/quiz-store";

export const Route = createFileRoute("/app/perfil")({
  component: Perfil,
});

function Perfil() {
  const app = getApp();
  const navigate = useNavigate();

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

      <div className="mt-5 space-y-3">
        <Row icon={<Bell className="size-4" />} title="Notificações" desc="Avisos ao longo do dia ou resumo único" />
        <Row icon={<CreditCard className="size-4" />} title="Histórico de pagamento" desc="Desafio, bônus e futuros upgrades" />
        <Row icon={<ShieldCheck className="size-4" />} title="Termos e privacidade" desc="Como cuidamos dos seus dados" />
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
