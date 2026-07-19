import type { MeasurementStatus } from '../../data/types';
import type {
  PlannerObjectCategory,
  PlannerObjectShape,
  SceneDimensions,
  ScenePosition,
  SnapBehavior,
} from '../../planner/types';

export const DRT_GEOMETRY_STATUSES = ['APPROVED', 'AUTHORED', 'REFERENCE', 'UNRESOLVED'] as const;
export type DrtGeometryStatus = (typeof DRT_GEOMETRY_STATUSES)[number];

export type DrtAnchor = 'VENUE_CENTER' | 'MAIN_STAGE' | 'ABSOLUTE_SHOW_COORDINATE';

export interface DrtRenderPart {
  id: string;
  label: string;
  shape: 'box' | 'cylinder';
  dimensions: SceneDimensions;
  relativePosition: ScenePosition;
  rotationYDeg: number;
  status: DrtGeometryStatus;
}

export interface CanonicalDrtObject {
  id: string;
  definitionId: string;
  label: string;
  category: PlannerObjectCategory;
  shape: PlannerObjectShape;
  dimensions: SceneDimensions;
  dimensionStatus: MeasurementStatus;
  position: ScenePosition;
  rotationYDeg: number;
  anchor: DrtAnchor;
  status: DrtGeometryStatus;
  placementStatus: DrtGeometryStatus;
  designDecisionId: string;
  sourceLabel: string;
  color: string;
  snapBehavior: SnapBehavior;
  notes: string[];
  renderParts?: DrtRenderPart[];
  atmosphere?: {
    enabled: boolean;
    output: number;
    directionDeg: number;
    coverageRadiusFt: number;
    groupId: string;
  };
}

export interface UnresolvedDrtElement {
  id: string;
  label: string;
  category: PlannerObjectCategory;
  status: 'UNRESOLVED';
  designDecisionId: string;
  note: string;
}

export interface CanonicalDrtGeometry {
  schemaVersion: number;
  seedVersion: string;
  coordinateConvention: string;
  objects: CanonicalDrtObject[];
  unresolved: UnresolvedDrtElement[];
}
