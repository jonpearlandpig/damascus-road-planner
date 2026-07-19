import type { VenueTwin } from '../data/types';
import { applyPlannerAction, type PlannerAction, type PlannerActionResult } from './store';
import type { PlannerScene } from './types';

export interface PlannerHistory {
  past: PlannerScene[];
  present: PlannerScene;
  future: PlannerScene[];
}

export interface PlannerHistoryResult {
  history: PlannerHistory;
  result: PlannerActionResult;
}

const passiveActions = new Set<PlannerAction['type']>(['selectObject']);

export function createPlannerHistory(scene: PlannerScene): PlannerHistory {
  return { past: [], present: scene, future: [] };
}

export function applyHistoryAction(history: PlannerHistory, venue: VenueTwin, action: PlannerAction): PlannerHistoryResult {
  const result = applyPlannerAction(history.present, venue, action);
  if (result.rejected || result.scene === history.present) return { history, result };
  if (passiveActions.has(action.type)) return { history: { ...history, present: result.scene }, result };
  return {
    history: {
      past: [...history.past, history.present],
      present: result.scene,
      future: [],
    },
    result,
  };
}

export function undoHistory(history: PlannerHistory): PlannerHistory {
  const previous = history.past.at(-1);
  if (!previous) return history;
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redoHistory(history: PlannerHistory): PlannerHistory {
  const next = history.future[0];
  if (!next) return history;
  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1),
  };
}
