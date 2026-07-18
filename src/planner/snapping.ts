import type { SceneDimensions, ScenePosition } from './types';

export const snapIntervalsFt = [1, 0.5, 0.25] as const;
export const rotationIncrementsDeg = [1, 5, 15, 45, 90] as const;

export interface FloorBounds {
  widthFt: number;
  lengthFt: number;
}

export function snapValue(value: number, intervalFt: number): number {
  if (intervalFt <= 0) return value;
  const snapped = Math.round(value / intervalFt) * intervalFt;
  return Object.is(snapped, -0) ? 0 : Number(snapped.toFixed(4));
}

export function snapPosition(position: ScenePosition, intervalFt: number): ScenePosition {
  return {
    xFt: snapValue(position.xFt, intervalFt),
    yFt: snapValue(position.yFt, intervalFt),
    zFt: snapValue(position.zFt, intervalFt),
  };
}

export function clampValue(value: number, min: number, max: number): number {
  if (min > max) return (min + max) / 2;
  return Math.min(max, Math.max(min, value));
}

export function constrainToFloor(position: ScenePosition, dimensions: SceneDimensions, floor: FloorBounds): ScenePosition {
  const halfFloorWidth = floor.widthFt / 2;
  const halfFloorLength = floor.lengthFt / 2;
  const halfObjectWidth = dimensions.widthFt / 2;
  const halfObjectDepth = dimensions.depthFt / 2;
  return {
    xFt: clampValue(position.xFt, -halfFloorWidth + halfObjectWidth, halfFloorWidth - halfObjectWidth),
    yFt: Math.max(0, position.yFt),
    zFt: clampValue(position.zFt, -halfFloorLength + halfObjectDepth, halfFloorLength - halfObjectDepth),
  };
}

export function snapAndConstrain(position: ScenePosition, dimensions: SceneDimensions, floor: FloorBounds, intervalFt: number): ScenePosition {
  return constrainToFloor(snapPosition(position, intervalFt), dimensions, floor);
}

export function normalizeRotationDeg(value: number): number {
  const normalized = ((value % 360) + 360) % 360;
  return Number(normalized.toFixed(4));
}

export function snapRotationDeg(value: number, incrementDeg: number): number {
  if (incrementDeg <= 0) return normalizeRotationDeg(value);
  return normalizeRotationDeg(Math.round(value / incrementDeg) * incrementDeg);
}

export function isSupportedSnapInterval(value: number): boolean {
  return snapIntervalsFt.some((interval) => interval === value);
}

export function isSupportedRotationIncrement(value: number): boolean {
  return rotationIncrementsDeg.some((increment) => increment === value);
}
