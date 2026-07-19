import type { MeasurementAnnotation, MeasurementPoint, PlacedObject, SceneDimensions, ScenePosition } from './types';

export interface MeasurementFrame {
  floorWidthFt: number;
  floorLengthFt: number;
  roomCenter: ScenePosition;
  venueCenterlineXFt: number;
  stageCenterlineXFt: number;
  upstageEdgeZFt: number;
  downstageEdgeZFt: number;
}

export interface MeasurementResult {
  totalFt: number;
  xDeltaFt: number;
  yDeltaFt: number;
  zDeltaFt: number;
}

export interface ObjectMeasurementReadout {
  distanceFromRoomCenterFt: number;
  distanceFromVenueCenterlineFt: number;
  distanceFromStageCenterlineFt: number;
  distanceFromUpstageEdgeFt: number;
  distanceFromDownstageEdgeFt: number;
  nearestFloorBoundaryFt: number;
}

export function distanceBetweenPoints(start: MeasurementPoint, end: MeasurementPoint): MeasurementResult {
  const xDeltaFt = end.xFt - start.xFt;
  const yDeltaFt = end.yFt - start.yFt;
  const zDeltaFt = end.zFt - start.zFt;
  return {
    totalFt: Math.hypot(xDeltaFt, yDeltaFt, zDeltaFt),
    xDeltaFt,
    yDeltaFt,
    zDeltaFt,
  };
}

export function planDistance(start: MeasurementPoint, end: MeasurementPoint): number {
  return Math.hypot(end.xFt - start.xFt, end.zFt - start.zFt);
}

export function nearestFloorBoundaryDistance(position: ScenePosition, dimensions: SceneDimensions, frame: MeasurementFrame): number {
  const halfFloorWidth = frame.floorWidthFt / 2;
  const halfFloorLength = frame.floorLengthFt / 2;
  const halfWidth = dimensions.widthFt / 2;
  const halfDepth = dimensions.depthFt / 2;
  const left = position.xFt - halfWidth + halfFloorWidth;
  const right = halfFloorWidth - (position.xFt + halfWidth);
  const upstage = position.zFt - halfDepth + halfFloorLength;
  const downstage = halfFloorLength - (position.zFt + halfDepth);
  return Math.min(left, right, upstage, downstage);
}

export function objectMeasurementReadout(object: PlacedObject, frame: MeasurementFrame): ObjectMeasurementReadout {
  return {
    distanceFromRoomCenterFt: Math.hypot(object.position.xFt - frame.roomCenter.xFt, object.position.zFt - frame.roomCenter.zFt),
    distanceFromVenueCenterlineFt: Math.abs(object.position.xFt - frame.venueCenterlineXFt),
    distanceFromStageCenterlineFt: Math.abs(object.position.xFt - frame.stageCenterlineXFt),
    distanceFromUpstageEdgeFt: Math.abs(object.position.zFt - frame.upstageEdgeZFt),
    distanceFromDownstageEdgeFt: Math.abs(object.position.zFt - frame.downstageEdgeZFt),
    nearestFloorBoundaryFt: nearestFloorBoundaryDistance(object.position, object.dimensions, frame),
  };
}

export function createMeasurementAnnotation(name: string, start: MeasurementPoint, end: MeasurementPoint, timestamp: string): MeasurementAnnotation {
  return {
    id: `measurement-${timestamp.replaceAll(/[^0-9a-z]/gi, '')}`,
    name,
    start,
    end,
    createdAt: timestamp,
  };
}

export function formatFeetDecimal(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return '-';
  return `${Number(value.toFixed(2))} ft`;
}
