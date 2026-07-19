import type { MeasurementStatus } from '../../data/types';
import type { PlacedObject, ScenePosition } from '../../planner/types';
import { canonicalDrtGeometry } from './canonicalGeometry';

export interface DrtSceneBuildOptions {
  bStagePosition: ScenePosition;
  bStagePlacementStatus: MeasurementStatus;
  bStageNotes: string[];
}

export function buildDrtScene(options: DrtSceneBuildOptions): PlacedObject[] {
  return canonicalDrtGeometry.objects.map((object) => {
    const isBStage = object.id === 'drt-b-stage';
    return {
      id: object.id,
      definitionId: object.definitionId,
      canonicalGeometryId: object.id,
      geometryClass: 'DRT_TOURING_PRODUCTION',
      geometryStatus: object.status,
      placementStatus: object.placementStatus,
      designDecisionId: object.designDecisionId,
      editable: true,
      label: object.label,
      category: object.category,
      dimensions: object.dimensions,
      dimensionStatus: isBStage ? options.bStagePlacementStatus : object.dimensionStatus,
      weightStatus: 'TBD',
      position: isBStage ? { ...options.bStagePosition, yFt: object.position.yFt } : object.position,
      rotationYDeg: object.rotationYDeg,
      visible: true,
      locked: true,
      atmosphere: object.atmosphere,
      color: object.color,
      shape: object.shape,
      snapBehavior: object.snapBehavior,
      sourceLabel: object.sourceLabel,
      planningOnly: true,
      warnings: [...object.notes, ...(isBStage ? options.bStageNotes : [])],
    } satisfies PlacedObject;
  });
}
