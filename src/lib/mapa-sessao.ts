// Ponte entre o quiz e a landing /plano.
//
// O resultado do Mapa é gerado no quiz (submitMapa) e precisa sobreviver a uma
// navegação de rota. Usamos sessionStorage em vez de estado do router porque:
//  - o router é reidratado no SSR e o estado de navegação se perde num refresh;
//  - a lead pode recarregar /plano e o popup ainda precisa existir;
//  - some sozinho ao fechar a aba, então não vaza entre sessões.

import type { Diagnostico } from "./mapa.functions";

const KEY = "zl:mapa-resultado";

export type MapaSessao = {
  leadId: string | null;
  nome: string;
  /** Telefone já normalizado (55DDDNNNNNNNN) quando o quiz conseguiu validar. */
  telefone: string;
  diagnostico: Diagnostico;
  criadoEm: number;
};

const isBrowser = typeof window !== "undefined";

export function salvarMapaSessao(data: Omit<MapaSessao, "criadoEm">): void {
  if (!isBrowser) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...data, criadoEm: Date.now() }));
  } catch {
    /* modo privado / storage cheio: a landing simplesmente não abre o popup */
  }
}

export function lerMapaSessao(): MapaSessao | null {
  if (!isBrowser) return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MapaSessao;
    if (!parsed?.diagnostico) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Marca que o WhatsApp já foi capturado, para o popup não voltar a pedir. */
export function marcarMapaEnviado(telefone: string): void {
  const atual = lerMapaSessao();
  if (!atual) return;
  salvarMapaSessao({ ...atual, telefone });
  if (!isBrowser) return;
  try {
    sessionStorage.setItem("zl:mapa-enviado", "1");
  } catch {
    /* ignore */
  }
}

export function mapaJaEnviado(): boolean {
  if (!isBrowser) return false;
  try {
    return sessionStorage.getItem("zl:mapa-enviado") === "1";
  } catch {
    return false;
  }
}
