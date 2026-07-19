import type { MeasurementConfidence, MeasurementStatus } from '../data/types';

export type VenueTwinReadiness = 'READY' | 'PARTIAL' | 'BLOCKED';
export type CoordinateOrigin = 'ROOM_CENTER' | 'CENTER_COURT' | 'STAGE_CENTER' | 'REFERENCE_ORIGIN';
export type OriginMethod =
  | 'APPROVED_CENTER_COURT'
  | 'APPROVED_ROOM_CENTER'
  | 'APPROVED_EVENT_FLOOR_CENTER'
  | 'DERIVED_FLOOR_CENTER'
  | 'REFERENCE_ORIGIN_WITH_WARNING';
export type GeometryExactness = 'EXACT' | 'DERIVED' | 'APPROXIMATE' | 'REFERENCE_ONLY';
export type GeometryRenderState = 'APPROVED' | 'DERIVED' | 'REFERENCE_ONLY' | 'APPROXIMATE' | 'CONFLICT' | 'MISSING';
export type Direction = 'UPSTAGE' | 'DOWNSTAGE' | 'STAGE_LEFT' | 'STAGE_RIGHT' | 'UNKNOWN';
export type GeometryLayerKey =
  | 'floor'
  | 'centerlines'
  | 'stageReference'
  | 'riggingGrid'
  | 'centerHung'
  | 'obstructions'
  | 'loading'
  | 'referenceGeometry'
  | 'drtProduction'
  | 'fitOverlay';

export interface Point2D {
  xFt: number;
  zFt: number;
}

export interface Point3D extends Point2D {
  yFt: number;
}

export interface Line2D {
  id: string;
  start: Point2D;
  end: Point2D;
  derivationRule: string;
  exactness: GeometryExactness;
  approvedMeasurementIds: string[];
  participatesInFitCheck: boolean;
}

export interface Polygon2D {
  id: string;
  points: Point2D[];
  derivationRule: string;
  exactness: GeometryExactness;
  renderState: GeometryRenderState;
  approvedMeasurementIds: string[];
  participatesInFitCheck: boolean;
}

export interface SourcedGeometryEvidence {
  measurementId: string;
  sourceId: string;
  sourceTitle: string;
  driveUrl: string;
  page: number;
  section: string;
  excerpt: string;
  reviewState: string;
}

export interface SourcedGeometryValue {
  value: number | string | null;
  originalValue: string;
  originalUnit: string;
  normalizedUnit: string;
  measurementId: string;
  sourceId: string;
  evidencePage: number;
  status: MeasurementStatus;
  confidence: MeasurementConfidence;
  exactness: GeometryExactness;
  derivationRule: string;
  participatesInFitCheck: boolean;
  evidence: SourcedGeometryEvidence[];
}

export interface BoxGeometry {
  id: string;
  center: Point3D;
  dimensions: {
    widthFt?: SourcedGeometryValue;
    depthFt?: SourcedGeometryValue;
    heightFt?: SourcedGeometryValue;
  };
  footprint?: Polygon2D;
  lowPoint?: SourcedGeometryValue;
  renderState: GeometryRenderState;
  exactness: GeometryExactness;
  approvedMeasurementIds: string[];
  participatesInFitCheck: boolean;
  derivationRule: string;
}

export interface VenueObstruction {
  id: string;
  label: string;
  geometry: BoxGeometry;
  renderState: GeometryRenderState;
}

export interface VenueNativeGeometry {
  schemaVersion: 1;
  venueSlug: string;
  readiness: VenueTwinReadiness;
  coordinateSystem: {
    origin: CoordinateOrigin;
    originMethod: OriginMethod;
    originLabel: string;
    originPoint: Point2D;
    xAxis: 'STAGE_LEFT_TO_STAGE_RIGHT';
    yAxis: 'ELEVATION';
    zAxis: 'UPSTAGE_TO_DOWNSTAGE';
    unit: 'ft';
    evidenceMeasurementIds: string[];
    warning?: string;
  };
  floor?: {
    boundary?: Polygon2D;
    width?: SourcedGeometryValue;
    length?: SourcedGeometryValue;
    center?: Point2D;
    orientationDeg?: number;
    renderState: GeometryRenderState;
  };
  rigging?: {
    gridBoundary?: Polygon2D;
    lowSteel?: SourcedGeometryValue;
    highSteel?: SourcedGeometryValue;
    roofHeight?: SourcedGeometryValue;
    noRigZones: Polygon2D[];
    renderState: GeometryRenderState;
  };
  obstructions?: {
    centerHung?: BoxGeometry;
    scoreboardLowPoint?: SourcedGeometryValue;
    fixedObstructions: VenueObstruction[];
    renderState: GeometryRenderState;
  };
  stageReference?: {
    endStageDirection?: Direction;
    stageCenterline?: Line2D;
    maximumStageBounds?: Polygon2D;
    renderState: GeometryRenderState;
    warning?: string;
  };
  loading?: {
    dockDirection?: Direction;
    primaryAccessPoint?: Point2D;
    renderState: GeometryRenderState;
    warning?: string;
  };
  evidence: {
    approvedMeasurementIds: string[];
    derivedGeometryIds: string[];
    approximateGeometryIds: string[];
    sourceIds: string[];
    sourceTitles: string[];
  };
  diagnostics: {
    approvedMeasurementCount: number;
    derivedGeometryCount: number;
    approximateGeometryCount: number;
    conflictCount: number;
    missingCriticalFields: string[];
    blockers: string[];
    warnings: string[];
    renderingStatus: 'READY_TO_RENDER' | 'PARTIAL_RENDER' | 'BLOCKED_NO_SHELL';
  };
  drtFit: {
    status: 'PASS' | 'PASS_WITH_WARNINGS' | 'BLOCKED' | 'UNRESOLVED';
    checkedFactIds: string[];
    blockers: string[];
    warnings: string[];
  };
  generation: {
    generatorSchemaVersion: 1;
    sourceReviewDate: string;
    sourceRevision: string;
    reviewChecksum: string;
  };
}

