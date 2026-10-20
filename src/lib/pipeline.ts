import type { StageValue } from "./constants";

/**
 * Allowed moves in the unified hiring pipeline (JobInteraction.stage).
 * Employer-side moves and worker-side moves are separate so each side can
 * only do what it should.
 */
const EMPLOYER_MOVES: Record<StageValue, StageValue[]> = {
  INITIATED: ["SHORTLISTED", "REJECTED"],
  SHORTLISTED: ["OFFERED", "REJECTED"],
  OFFERED: ["JOINED", "REJECTED"],
  JOINED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

const TERMINAL: StageValue[] = ["JOINED", "REJECTED", "WITHDRAWN"];

export function canEmployerMove(from: StageValue, to: StageValue): boolean {
  return EMPLOYER_MOVES[from].includes(to);
}

export function canWorkerWithdraw(from: StageValue): boolean {
  return !TERMINAL.includes(from);
}

export function isTerminal(stage: StageValue): boolean {
  return TERMINAL.includes(stage);
}

export function employerNextStages(from: StageValue): StageValue[] {
  return EMPLOYER_MOVES[from];
}
