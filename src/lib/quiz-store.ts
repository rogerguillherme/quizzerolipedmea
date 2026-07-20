// Simple localStorage-backed store for the Mapa do Lipedema quiz + user progress.
// Keeps the UI wiring self-contained until edge functions are connected.

export type QuizAnswers = {
  nome?: string;
  tempoSintomas?: string;
  tentouDietaExercicio?: string;
  regioes?: string[];
  hormonal?: string;
  familia?: string;
  impactoEmocional?: string;
  dorNivel?: number;
};

const KEY = "zl:quiz";
const APP_KEY = "zl:app";

export type AppState = {
  nome?: string;
  telefone?: string;
  desafioAtivo?: boolean;
  diaAtual?: number; // 1..7
  streak?: number;
  concluidos?: Record<number, string[]>; // day -> mission ids
  pagoBump?: boolean;
};

const isBrowser = typeof window !== "undefined";

export function getQuiz(): QuizAnswers {
  if (!isBrowser) return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function setQuiz(patch: Partial<QuizAnswers>) {
  if (!isBrowser) return;
  const next = { ...getQuiz(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function getApp(): AppState {
  if (!isBrowser) return {};
  try {
    return JSON.parse(localStorage.getItem(APP_KEY) || "{}");
  } catch {
    return {};
  }
}

export function setApp(patch: Partial<AppState>) {
  if (!isBrowser) return;
  const next = { ...getApp(), ...patch };
  localStorage.setItem(APP_KEY, JSON.stringify(next));
}
