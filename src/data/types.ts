export type ConfidenceState =
  | 'VERIFIED'
  | 'CALIBRATED PLANNING'
  | 'APPROXIMATE PLANNING'
  | 'UNVERIFIED'
  | 'CONFLICT'
  | 'ENGINEERING CONFIRMATION REQUIRED';

export type AuthorityState =
  | 'VENUE ISSUED'
  | 'TOUR ISSUED'
  | 'MANAGEMENT CONFIRMED'
  | 'DEPARTMENT CONFIRMED'
  | 'PRIOR SHOW REFERENCE'
  | 'PUBLIC SOURCE'
  | 'INFERRED';

export type LayerKey =
  | 'overview'
  | 'production'
  | 'rigging'
  | 'backstage'
  | 'logistics'
  | 'audience'
  | 'seating'
  | 'safety'
  | 'sources'
  | 'issues';

export interface SourceRef {
  file: string;
  section: string;
  page?: string;
  revision?: string;
  originalValue?: string;
  confidence: ConfidenceState;
  authority: AuthorityState;
}

export interface SceneObjectRecord {
  id: string;
  label: string;
  category: LayerKey;
  dimensions?: string;
  value?: string;
  notes?: string;
  owner?: string;
  status?: string;
  nextAction?: string;
  source: SourceRef;
}

export interface VenueGeometry {
  floorWidthFt: number;
  floorLengthFt: number;
  lowSteelFt?: number;
  highSteelFt?: number;
  gridWidthFt?: number;
  gridDepthFt?: number;
  centerhungBottomFt?: number;
  centerhungDiameterFt?: number;
  dockCount?: number;
  pushDistanceFt?: number;
  stageEndOpeningWidthFt?: number;
  stageEndOpeningHeightFt?: number;
  endStageRiggingLb?: number;
  centerStageRiggingLb?: number;
  totalGridRiggingLb?: number;
  houseStageWidthFt?: number;
  houseStageDepthFt?: number;
  houseStageMinHeightFt?: number;
  houseStageMaxHeightFt?: number;
  egressClearanceFt?: number;
}

export interface OperationalZone {
  id: string;
  label: string;
  kind: 'dock' | 'parking' | 'boh' | 'power' | 'egress' | 'curtain' | 'obstruction';
  xFt: number;
  zFt: number;
  widthFt: number;
  depthFt: number;
  heightFt?: number;
  layer: LayerKey;
  source: SourceRef;
}

export interface VenueTwin {
  slug: string;
  name: string;
  city: string;
  state: string;
  showDate: string;
  sourceScore: number;
  sourceYear: string;
  sourceFile: string;
  fidelity: 'L0 SOURCE' | 'L1 CALIBRATED 2D' | 'L2 OPERATIONAL 3D' | 'L3 PRODUCTION FIT' | 'L4 RECONCILED';
  sourceStatus: 'READY' | 'MISSING' | 'STALE' | 'CONFLICT';
  cadStatus: 'NONE' | 'REQUESTED' | 'AVAILABLE';
  riggingConfidence: ConfidenceState;
  logisticsConfidence: ConfidenceState;
  pmOpen: number;
  tmOpen: number;
  geometry: VenueGeometry;
  zones: OperationalZone[];
  objects: SceneObjectRecord[];
  keyStrength: string;
  missingInputs: string[];
  detailed: boolean;
}

export interface TourPackage {
  id: string;
  revision: string;
  name: string;
  deckWidthFt: number;
  deckDepthFt: number;
  deckHeightFt: number;
  prowBaseFt: number;
  prowVertexDepthFt: number;
  prowHeightFt: number;
  centerThrustWidthFt: number;
  centerThrustLengthFt: number;
  sideThrustWidthFt: number;
  sideThrustLengthFt: number;
  bStageDiameterFt: number;
  bStageLocalZFt: number;
}
