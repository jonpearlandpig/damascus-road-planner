// Typed data contracts for the DRT Venue Twin.
// Three top-level models: VenueTwin, TourPackage, ShowPlacement.

export type Confidence =
  | "VERIFIED"
  | "CALIBRATED_PLANNING"
  | "APPROXIMATE_PLANNING"
  | "UNVERIFIED"
  | "CONFLICT"
  | "ENGINEERING_CONFIRMATION_REQUIRED";

export type Authority =
  | "VENUE_ISSUED"
  | "TOUR_ISSUED"
  | "MANAGEMENT_CONFIRMED"
  | "DEPARTMENT_CONFIRMED"
  | "PRIOR_SHOW_REFERENCE"
  | "PUBLIC_SOURCE"
  | "INFERRED";

export interface SourceCitation {
  id: string;
  fileName: string;
  pageOrSheet?: string;
  originalText?: string;
  revision?: string;
  date?: string;
  authority: Authority;
  confidence: Confidence;
  notes?: string;
}

export type SceneObjectKind =
  // Venue
  | "venue-floor"
  | "bowl-mass"
  | "grid-plane"
  | "scoreboard"
  | "dock-zone"
  | "boh-zone"
  | "court-marker"
  | "stage-boundary"
  // Tour package
  | "main-deck"
  | "monolith"
  | "center-thrust"
  | "side-thrust"
  | "b-stage"
  | "band-riser";

export type LayerId =
  | "venue-shell"
  | "venue-bowl"
  | "venue-rigging"
  | "venue-ops"
  | "tour-deck"
  | "tour-monolith"
  | "tour-thrusts"
  | "tour-bstage"
  | "tour-band"
  | "annotations";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Simplified primitive geometry. All units in meters. */
export type Geometry =
  | { type: "box"; size: Vec3 }
  | { type: "cylinder"; radius: number; height: number }
  | { type: "plane"; size: { w: number; d: number } }
  | { type: "prism"; base: number; depth: number; height: number } // triangular prism (monolith/prow)
  | { type: "marker"; radius: number };

export interface SceneObject {
  id: string;
  kind: SceneObjectKind;
  label: string;
  layer: LayerId;
  origin: "venue" | "tour" | "placement";
  position: Vec3;             // meters, in scene origin
  rotationY?: number;         // radians
  geometry: Geometry;
  color?: string;             // token name only (semantic), see SceneObjectRenderer
  confidence: Confidence;
  authority: Authority;
  sourceIds: string[];
  owner?: string;
  contact?: string;
  status?: string;
  nextAction?: string;
  notes?: string;
  dims?: string;              // pre-formatted human dims
}

export interface VenueTwin {
  id: string;
  name: string;
  city: string;
  revision: string;
  floor: { widthFt: number; depthFt: number };
  lowSteelFt: number;
  highSteelFt: number;
  riggingCapLb: number;
  markedSpanMaxLb: number;
  maxLoadAngleDeg: number;
  disclaimer: string;
  sources: SourceCitation[];
  objects: SceneObject[]; // venue-authored objects only
}

export interface TourPackage {
  id: string;
  name: string;
  revision: string;
  bandSize: number;
  disclaimer: string;
  sources: SourceCitation[];
  objects: SceneObject[]; // tour-authored objects, positions in package-local frame
}

export interface ShowPlacement {
  id: string;
  venueId: string;
  packageId: string;
  revision: string;
  // Show origin offset from venue center, in meters
  showOrigin: Vec3;
  showRotationY: number;
  notes: string;
  adaptations: Adaptation[];
  conflicts: Conflict[];
  actions: PlacementAction[];
  sources: SourceCitation[];
}

export interface Adaptation {
  id: string;
  title: string;
  detail: string;
  sourceIds: string[];
}

export interface Conflict {
  id: string;
  title: string;
  severity: "info" | "warn" | "block";
  detail: string;
  sourceIds: string[];
}

export interface PlacementAction {
  id: string;
  title: string;
  owner: "PM" | "TM" | "PROD" | "RIGGING" | "VENUE";
  due?: string;
  status: "open" | "in-progress" | "done";
}

export type ModelFidelity = "SEED" | "PILOT" | "CALIBRATED" | "APPROVED";
export type RiggingStatus = "NOT_STARTED" | "IN_REVIEW" | "CONFIRMED" | "BLOCKED";
export type LogisticsStatus = "PENDING" | "SCHEDULED" | "CONFIRMED";

export interface TourShow {
  id: string;
  city: string;
  venueName: string;
  venueSlug?: string;   // if a workspace exists
  date: string;         // ISO
  fidelity: ModelFidelity;
  sourceScore: number;  // 0..100
  riggingStatus: RiggingStatus;
  logisticsStatus: LogisticsStatus;
  pmAction?: string;
  tmAction?: string;
  lastRevision: string;
}
