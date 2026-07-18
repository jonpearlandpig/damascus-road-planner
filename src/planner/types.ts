import type { MeasurementStatus, SourceAssetAvailabilityState, SourceAssetControllingStatus, SourceAssetType, VenueTwin } from '../data/types';

export const PLANNER_SCHEMA_VERSION = 1;
export const SOURCE_RECONCILIATION_VERSION = '2026-07-18';

export const COORDINATE_CONVENTION = {
  x: 'X is stage left / stage right in feet; negative is stage left, positive is stage right.',
  y: 'Y is elevation in feet above the venue floor.',
  z: 'Z is upstage / downstage room depth in feet; negative is upstage, positive is downstage toward the audience.',
  origin: 'The origin is the venue room center / center-court reference when available.',
} as const;

export const venueTypes = ['Arena', 'Theatre', 'Performing Arts Center', 'Auditorium', 'Amphitheatre', 'Other'] as const;
export type VenueType = (typeof venueTypes)[number];

export const sourceCategories = [
  'VENUE_TECH_PACK_PDF',
  'RIGGING_PLOT_PDF',
  'CAD_OR_DWG_REFERENCE',
  'SEATING_OR_FLOOR_PLAN',
  'STAGE_SPECIFICATION',
  'VENUE_PRODUCTION_NOTES',
  'STRUCTURED_VENUE_SEED',
  'EXTERNAL_SOURCE_REFERENCE',
] as const;
export type IngestionSourceCategory = (typeof sourceCategories)[number];

export const ingestionRoles = ['CONTROLLING', 'REFERENCE', 'SUPERSEDED', 'MISSING', 'UNRESOLVED'] as const;
export type IngestionSourceRole = (typeof ingestionRoles)[number];

export const approvalStates = ['PENDING_REVIEW', 'APPROVED', 'REJECTED'] as const;
export type IngestionApprovalState = (typeof approvalStates)[number];

export interface IngestionMeasurementMapping {
  field: string;
  extractedValue?: number;
  unit: 'ft' | 'lb' | 'count' | 'deg';
  status: MeasurementStatus;
  approvalState: IngestionApprovalState;
  note: string;
}

export interface IngestionConflictRecord {
  id: string;
  field: string;
  sourceIds: string[];
  status: 'OPEN' | 'RESOLVED';
  note: string;
}

export interface VenueIngestionRecord {
  id: string;
  venueSlug: string;
  label: string;
  category: IngestionSourceCategory;
  filename?: string;
  externalReference?: string;
  revision?: string;
  issuedAt?: string;
  registeredAt: string;
  role: IngestionSourceRole;
  sourceType?: SourceAssetType;
  availabilityState?: SourceAssetAvailabilityState;
  controllingStatus?: SourceAssetControllingStatus;
  approvalState: IngestionApprovalState;
  mappings: IngestionMeasurementMapping[];
  conflicts: IngestionConflictRecord[];
  notes: string;
}

export interface ScenePosition {
  xFt: number;
  yFt: number;
  zFt: number;
}

export interface SceneDimensions {
  widthFt: number;
  depthFt: number;
  heightFt: number;
}

export const plannerObjectCategories = [
  'Stage decks',
  'Main stage',
  'Thrusts',
  'B stage',
  'Risers',
  'Stairs',
  'Barricade',
  'FOH',
  'Delay towers',
  'Camera platforms',
  'Truss',
  'Motors',
  'Lighting fixtures',
  'Video walls',
  'Projection surfaces',
  'Scrims',
  'Soft goods',
  'Audio arrays',
  'Subs',
  'Monitor world',
  'Backline',
  'Low fog',
  'Hazers',
  'Scenic elements',
  'Utility or custom object',
] as const;
export type PlannerObjectCategory = (typeof plannerObjectCategories)[number];

export type PlannerObjectShape = 'box' | 'cylinder' | 'truss' | 'fixture' | 'fog' | 'screen';
export type SnapBehavior = 'GRID_LOCKED' | 'TRUSS_LOCKED' | 'VENUE_CENTER_LOCKED';
export type MountingType = 'floor' | 'ground-supported' | 'hanging' | 'truss-mounted' | 'planning-only' | 'custom';

export interface GearPackReference {
  packId: string;
  department: string;
  itemId: string;
  itemLabel: string;
  quantityAvailable: number;
  overrideAllowed?: boolean;
}

export interface ObjectDefinition {
  id: string;
  label: string;
  category: PlannerObjectCategory;
  manufacturer?: string;
  model?: string;
  dimensionsFt: SceneDimensions;
  dimensionStatus: MeasurementStatus;
  weightLb?: number;
  weightStatus: MeasurementStatus | 'TBD';
  mountingType: MountingType;
  sourceLabel: string;
  gearPackRef?: GearPackReference;
  color: string;
  shape: PlannerObjectShape;
  snapBehavior: SnapBehavior;
  allowedParentTypes: PlannerObjectCategory[];
  planningOnly: boolean;
  warning?: string;
}

export interface TrussState {
  kind: 'straight' | 'curved' | 'circular' | 'ground-supported' | 'hanging' | 'custom';
  lengthFt: number;
  radiusFt?: number;
}

export interface FixtureState {
  positionAlongTrussFt?: number;
  hangOrientationDeg: number;
  panDeg: number;
  tiltDeg: number;
  focusTarget?: ScenePosition;
}

export interface LightingState {
  intensity: number;
  panDeg: number;
  tiltDeg: number;
  focusTarget?: ScenePosition;
  zoomDeg?: number;
  color: string;
  colorTemperatureK?: number;
  shutterOpen: boolean;
  movementPreview: boolean;
}

export interface AtmosphereState {
  enabled: boolean;
  output: number;
  directionDeg: number;
  coverageRadiusFt: number;
  groupId?: string;
}

export interface PlacedObject {
  id: string;
  definitionId: string;
  label: string;
  category: PlannerObjectCategory;
  dimensions: SceneDimensions;
  dimensionStatus: MeasurementStatus;
  weightLb?: number;
  weightStatus: MeasurementStatus | 'TBD';
  position: ScenePosition;
  rotationYDeg: number;
  visible: boolean;
  locked: boolean;
  groupId?: string;
  parentId?: string;
  gearPackRef?: GearPackReference;
  truss?: TrussState;
  fixture?: FixtureState;
  lighting?: LightingState;
  atmosphere?: AtmosphereState;
  color: string;
  shape: PlannerObjectShape;
  snapBehavior: SnapBehavior;
  sourceLabel: string;
  planningOnly: boolean;
  warnings: string[];
}

export type PlannerViewMode =
  | 'PLAN'
  | 'FRONT_CENTER_AUDIENCE'
  | 'STAGE_TO_AUDIENCE'
  | 'STAGE_LEFT'
  | 'STAGE_RIGHT'
  | 'REAR_OF_HOUSE'
  | 'LOWER_BOWL'
  | 'UPPER_BOWL'
  | 'FREE_ORBIT'
  | 'ORBIT_360';

export type CameraProjection = 'PERSPECTIVE' | 'ORTHOGRAPHIC';

export interface CameraSnapshot {
  id: string;
  name: string;
  mode: PlannerViewMode;
  projection: CameraProjection;
  position: ScenePosition;
  target: ScenePosition;
  createdAt: string;
}

export interface MeasurementPoint {
  xFt: number;
  yFt: number;
  zFt: number;
}

export interface MeasurementAnnotation {
  id: string;
  name: string;
  start: MeasurementPoint;
  end: MeasurementPoint;
  createdAt: string;
}

export interface ActiveMeasurement {
  start?: MeasurementPoint;
  end?: MeasurementPoint;
}

export interface SceneRevision {
  id: string;
  number: number;
  note: string;
  timestamp: string;
  snapshot: PlannerSceneSnapshot;
}

export interface PlannerSceneSnapshot {
  name: string;
  grid: PlannerGridState;
  camera: PlannerCameraState;
  objects: PlacedObject[];
  measurements: MeasurementAnnotation[];
  savedViews: CameraSnapshot[];
}

export interface PlannerGridState {
  visible: boolean;
  majorFt: number;
  minorFt: number;
  snapFt: number;
  rotationIncrementDeg: number;
}

export interface PlannerCameraState {
  mode: PlannerViewMode;
  projection: CameraProjection;
  activeSavedViewId?: string;
}

export interface PlannerScene {
  schemaVersion: typeof PLANNER_SCHEMA_VERSION;
  id: string;
  name: string;
  venueSlug: string;
  sourceReconciliationVersion: string;
  gearPackReferences: string[];
  createdAt: string;
  modifiedAt: string;
  selectedObjectId?: string;
  grid: PlannerGridState;
  camera: PlannerCameraState;
  objects: PlacedObject[];
  activeMeasurement?: ActiveMeasurement;
  measurements: MeasurementAnnotation[];
  savedViews: CameraSnapshot[];
  revisions: SceneRevision[];
  warningLog: string[];
}

export interface VenueBrowserRow {
  slug: string;
  name: string;
  city: string;
  state: string;
  venueType: VenueType;
  sourceReadiness: string;
  modelReadiness: string;
  floorDimensions: string;
  riggingGrid: string;
  warnings: string[];
  canOpen: boolean;
  venue: VenueTwin;
}
