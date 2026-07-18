import type { VenueTwin } from '../data/types';
import { applyPlannerAction, type PlannerActionResult } from './store';
import type { PlannerScene, ScenePosition } from './types';

export type PlannerCommand =
  | { kind: 'ADD_OBJECT'; definitionId: string; position?: Partial<ScenePosition> }
  | { kind: 'MOVE_OBJECT'; objectId: string; position: Partial<ScenePosition> }
  | { kind: 'ROTATE_OBJECT'; objectId: string; rotationYDeg: number }
  | { kind: 'DUPLICATE_OBJECT'; objectId: string }
  | { kind: 'DELETE_OBJECT'; objectId: string }
  | { kind: 'LOCK_OBJECT'; objectId: string; locked: boolean }
  | { kind: 'SET_PROPERTY'; objectId: string; property: 'label' | 'visible'; value: string | boolean }
  | { kind: 'ATTACH_TO_TRUSS'; fixtureId: string; trussId: string; positionAlongTrussFt?: number }
  | { kind: 'DISTRIBUTE_EVENLY'; parentId: string; childIds: string[] }
  | { kind: 'CENTER_IN_VENUE'; objectId: string }
  | { kind: 'CENTER_ON_STAGE'; objectId: string };

export function dispatchPlannerCommand(scene: PlannerScene, venue: VenueTwin, command: PlannerCommand): PlannerActionResult {
  switch (command.kind) {
    case 'ADD_OBJECT':
      return applyPlannerAction(scene, venue, { type: 'addObject', definitionId: command.definitionId, position: command.position });
    case 'MOVE_OBJECT':
      return applyPlannerAction(scene, venue, { type: 'moveObject', id: command.objectId, position: command.position });
    case 'ROTATE_OBJECT':
      return applyPlannerAction(scene, venue, { type: 'rotateObject', id: command.objectId, rotationYDeg: command.rotationYDeg });
    case 'DUPLICATE_OBJECT':
      return applyPlannerAction(scene, venue, { type: 'duplicateObject', id: command.objectId });
    case 'DELETE_OBJECT':
      return applyPlannerAction(scene, venue, { type: 'deleteObject', id: command.objectId });
    case 'LOCK_OBJECT':
      return applyPlannerAction(scene, venue, { type: 'lockObject', id: command.objectId, locked: command.locked });
    case 'SET_PROPERTY':
      if (command.property === 'label' && typeof command.value === 'string') {
        return applyPlannerAction(scene, venue, { type: 'renameObject', id: command.objectId, label: command.value });
      }
      if (command.property === 'visible' && typeof command.value === 'boolean') {
        return applyPlannerAction(scene, venue, { type: 'toggleObjectVisibility', id: command.objectId, visible: command.value });
      }
      return { scene, rejected: true, message: 'Unsupported property command.' };
    case 'ATTACH_TO_TRUSS':
      return applyPlannerAction(scene, venue, { type: 'attachToTruss', fixtureId: command.fixtureId, trussId: command.trussId, positionAlongTrussFt: command.positionAlongTrussFt });
    case 'DISTRIBUTE_EVENLY':
      return applyPlannerAction(scene, venue, { type: 'distributeEvenly', parentId: command.parentId, childIds: command.childIds });
    case 'CENTER_IN_VENUE':
      return applyPlannerAction(scene, venue, { type: 'moveObject', id: command.objectId, position: { xFt: 0, zFt: 0 } });
    case 'CENTER_ON_STAGE': {
      const stage = scene.objects.find((object) => object.id === 'drt-main-stage' || object.category === 'Main stage');
      return applyPlannerAction(scene, venue, { type: 'moveObject', id: command.objectId, position: { xFt: 0, zFt: stage?.position.zFt ?? 0 } });
    }
    default:
      return { scene, rejected: true, message: 'Unsupported command.' };
  }
}

export function parsePlannerCommand(input: string, selectedObjectId?: string): PlannerCommand | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = JSON.parse(trimmed) as PlannerCommand;
    if (parsed && typeof parsed === 'object' && 'kind' in parsed) return parsed;
  } catch {
    // Falls through to the compact deterministic grammar.
  }

  const parts = trimmed.split(/\s+/);
  const [verb, first, second, third] = parts;
  const target = first ?? selectedObjectId;
  if (!verb) return undefined;
  if (verb === 'add' && first) return { kind: 'ADD_OBJECT', definitionId: first };
  if (verb === 'move' && target && second && third) return { kind: 'MOVE_OBJECT', objectId: target, position: { xFt: Number(second), zFt: Number(third) } };
  if (verb === 'rotate' && target && second) return { kind: 'ROTATE_OBJECT', objectId: target, rotationYDeg: Number(second) };
  if (verb === 'duplicate' && target) return { kind: 'DUPLICATE_OBJECT', objectId: target };
  if (verb === 'delete' && target) return { kind: 'DELETE_OBJECT', objectId: target };
  if (verb === 'lock' && target) return { kind: 'LOCK_OBJECT', objectId: target, locked: true };
  if (verb === 'unlock' && target) return { kind: 'LOCK_OBJECT', objectId: target, locked: false };
  if (verb === 'center' && first === 'venue' && (second ?? selectedObjectId)) return { kind: 'CENTER_IN_VENUE', objectId: second ?? selectedObjectId! };
  if (verb === 'center' && first === 'stage' && (second ?? selectedObjectId)) return { kind: 'CENTER_ON_STAGE', objectId: second ?? selectedObjectId! };
  if (verb === 'attach' && first && second) return { kind: 'ATTACH_TO_TRUSS', fixtureId: first, trussId: second, positionAlongTrussFt: third ? Number(third) : undefined };
  if (verb === 'distribute' && first && second) return { kind: 'DISTRIBUTE_EVENLY', parentId: first, childIds: parts.slice(2) };
  return undefined;
}
