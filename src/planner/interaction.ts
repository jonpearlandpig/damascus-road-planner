import type { GeometryClass, PlacedObject, PlannerTool, ScenePosition } from './types';

export const POINTER_CLICK_THRESHOLD_PX = 5;

export type TransformHandleKind = 'MOVE_X' | 'MOVE_Z' | 'ROTATE_Y';
export type TransformEndReason = 'COMMIT' | 'ESCAPE' | 'POINTER_CANCEL' | 'FOCUS_LOST';

export interface PointerIntent {
  pointerId: number;
  startX: number;
  startY: number;
  maxDistancePx: number;
  targetId?: string;
}

export interface TransformSnapshot {
  objectId: string;
  position: ScenePosition;
  rotationYDeg: number;
}

export function beginPointerIntent(pointerId: number, clientX: number, clientY: number, targetId?: string): PointerIntent {
  return { pointerId, startX: clientX, startY: clientY, maxDistancePx: 0, targetId };
}

export function updatePointerIntent(intent: PointerIntent, clientX: number, clientY: number): PointerIntent {
  const distance = Math.hypot(clientX - intent.startX, clientY - intent.startY);
  return distance > intent.maxDistancePx ? { ...intent, maxDistancePx: distance } : intent;
}

export function isClickIntent(intent: PointerIntent, thresholdPx = POINTER_CLICK_THRESHOLD_PX): boolean {
  return intent.maxDistancePx <= thresholdPx;
}

export function isVenueGeometryClass(geometryClass: GeometryClass): boolean {
  return geometryClass === 'VENUE_NATIVE' || geometryClass === 'HOUSE_REFERENCE';
}

export function canStartTransform(
  tool: PlannerTool,
  selectedObjectId: string | undefined,
  object: Pick<PlacedObject, 'id' | 'locked' | 'editable' | 'geometryClass'>,
  handle: TransformHandleKind,
): boolean {
  if (object.id !== selectedObjectId || object.locked || !object.editable || isVenueGeometryClass(object.geometryClass)) return false;
  if (tool === 'MOVE') return handle === 'MOVE_X' || handle === 'MOVE_Z';
  if (tool === 'ROTATE') return handle === 'ROTATE_Y';
  return false;
}

export function transformResult(snapshot: TransformSnapshot, reason: TransformEndReason, draft: TransformSnapshot): TransformSnapshot {
  return reason === 'COMMIT' ? draft : snapshot;
}
