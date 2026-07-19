import { validatePlannerScene } from './sceneSchema';
import type { PlannerScene } from './types';

const storagePrefix = 'drt-planner-scene:';
const autosavePrefix = 'drt-planner-autosave:';

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function keyForScene(sceneId: string): string {
  return `${storagePrefix}${sceneId}`;
}

function autosaveKey(venueSlug: string): string {
  return `${autosavePrefix}${venueSlug}`;
}

export function saveSceneLocal(scene: PlannerScene): void {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(keyForScene(scene.id), JSON.stringify(scene));
}

export function autosaveSceneLocal(scene: PlannerScene): void {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(autosaveKey(scene.venueSlug), JSON.stringify(scene));
}

export function loadSceneLocal(sceneId: string): PlannerScene | undefined {
  if (!canUseLocalStorage()) return undefined;
  const raw = window.localStorage.getItem(keyForScene(sceneId));
  if (!raw) return undefined;
  return importSceneJson(raw).scene;
}

export function loadAutosaveLocal(venueSlug: string): PlannerScene | undefined {
  if (!canUseLocalStorage()) return undefined;
  const raw = window.localStorage.getItem(autosaveKey(venueSlug));
  if (!raw) return undefined;
  return importSceneJson(raw).scene;
}

export function listSavedSceneIds(): string[] {
  if (!canUseLocalStorage()) return [];
  return Object.keys(window.localStorage)
    .filter((key) => key.startsWith(storagePrefix))
    .map((key) => key.slice(storagePrefix.length))
    .sort();
}

export function duplicateScene(scene: PlannerScene, name: string): PlannerScene {
  const timestamp = new Date().toISOString();
  return {
    ...scene,
    id: `${scene.id}-copy-${timestamp.replaceAll(/[^0-9a-z]/gi, '')}`,
    name: name.trim() || `${scene.name} copy`,
    createdAt: timestamp,
    modifiedAt: timestamp,
  };
}

export function exportSceneJson(scene: PlannerScene): string {
  return JSON.stringify(scene, null, 2);
}

export function importSceneJson(raw: string): { scene?: PlannerScene; errors: string[] } {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = validatePlannerScene(parsed);
    return { scene: result.scene, errors: result.errors };
  } catch (error) {
    return { errors: [error instanceof Error ? error.message : 'Scene JSON could not be parsed.'] };
  }
}
