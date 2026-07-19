import type { TourPackage } from '../../data/types';
import { DRT_GEOMETRY_EVIDENCE } from './geometryEvidence';
import type { CanonicalDrtGeometry, CanonicalDrtObject, DrtRenderPart, UnresolvedDrtElement } from './schema';

export const DRT_SEED_VERSION = 'drt-canonical-2026-07-17.1';

export const canonicalDrtPackage: TourPackage = {
  id: 'drt-current-working',
  revision: DRT_SEED_VERSION,
  name: 'DRT production package',
  deckWidthFt: 78,
  deckDepthFt: 42,
  deckHeightFt: 5.5,
  prowBaseFt: 50,
  prowVertexDepthFt: 25,
  prowHeightFt: 35 + 4 / 12,
  centerThrustWidthFt: 6,
  centerThrustLengthFt: 42,
  sideThrustWidthFt: 5,
  sideThrustLengthFt: 32,
  bStageDiameterFt: 26,
  bStageLocalZFt: 76,
};

const stageCenterZFt = -canonicalDrtPackage.bStageLocalZFt;
const upstageEdgeZFt = stageCenterZFt - canonicalDrtPackage.deckDepthFt / 2;
const monolithHalfBaseFt = canonicalDrtPackage.prowBaseFt / 2;
const monolithFaceLengthFt = Math.hypot(monolithHalfBaseFt, canonicalDrtPackage.prowVertexDepthFt);
const monolithFaceAngleDeg = Math.atan2(monolithHalfBaseFt, canonicalDrtPackage.prowVertexDepthFt) * 180 / Math.PI;
const monolithCenterZFt = upstageEdgeZFt + canonicalDrtPackage.prowVertexDepthFt / 2;
const sideThrustCenterZFt = stageCenterZFt + 35.9;
const sideThrustRotationDeg = 0.649 * 180 / Math.PI;

function sourceLabel(decisionId: string): string {
  return DRT_GEOMETRY_EVIDENCE[decisionId].sourceLabel;
}

const monolithParts: DrtRenderPart[] = [
  {
    id: 'drt-monolith-face-sl',
    label: 'Monolith face SL',
    shape: 'box',
    dimensions: { widthFt: 0.5, depthFt: monolithFaceLengthFt, heightFt: canonicalDrtPackage.prowHeightFt },
    relativePosition: { xFt: -monolithHalfBaseFt / 2, yFt: 0, zFt: 0 },
    rotationYDeg: monolithFaceAngleDeg,
    status: 'AUTHORED',
  },
  {
    id: 'drt-monolith-face-sr',
    label: 'Monolith face SR',
    shape: 'box',
    dimensions: { widthFt: 0.5, depthFt: monolithFaceLengthFt, heightFt: canonicalDrtPackage.prowHeightFt },
    relativePosition: { xFt: monolithHalfBaseFt / 2, yFt: 0, zFt: 0 },
    rotationYDeg: -monolithFaceAngleDeg,
    status: 'AUTHORED',
  },
];

const bStageParts: DrtRenderPart[] = [
  {
    id: 'drt-b-stage-deck',
    label: 'B stage deck',
    shape: 'cylinder',
    dimensions: { widthFt: canonicalDrtPackage.bStageDiameterFt, depthFt: canonicalDrtPackage.bStageDiameterFt, heightFt: canonicalDrtPackage.deckHeightFt },
    relativePosition: { xFt: 0, yFt: 0, zFt: 0 },
    rotationYDeg: 0,
    status: 'AUTHORED',
  },
  {
    id: 'drt-b-stage-tail',
    label: 'B stage tail / reference only',
    shape: 'box',
    dimensions: { widthFt: 5.2, depthFt: 17, heightFt: canonicalDrtPackage.deckHeightFt },
    relativePosition: { xFt: 11.5, yFt: 0, zFt: 13 },
    rotationYDeg: 45,
    status: 'REFERENCE',
  },
];

const authoredObjects: CanonicalDrtObject[] = [
  {
    id: 'drt-main-stage',
    definitionId: 'drt-main-stage',
    label: 'DRT main stage',
    category: 'Main stage',
    shape: 'box',
    dimensions: { widthFt: canonicalDrtPackage.deckWidthFt, depthFt: canonicalDrtPackage.deckDepthFt, heightFt: canonicalDrtPackage.deckHeightFt },
    dimensionStatus: 'REFERENCE',
    position: { xFt: 0, yFt: canonicalDrtPackage.deckHeightFt / 2, zFt: stageCenterZFt },
    rotationYDeg: 0,
    anchor: 'ABSOLUTE_SHOW_COORDINATE',
    status: 'AUTHORED',
    placementStatus: 'AUTHORED',
    designDecisionId: 'DRT-AUTH-DECK-2026-07-17',
    sourceLabel: sourceLabel('DRT-AUTH-DECK-2026-07-17'),
    color: '#183247',
    snapBehavior: 'GRID_LOCKED',
    notes: ['Planning geometry only. Structural approval and load capacity remain outside this model.'],
  },
  {
    id: 'drt-monolith',
    definitionId: 'drt-monolith',
    label: 'DRT two-face monolith',
    category: 'Scenic elements',
    shape: 'monolith',
    dimensions: { widthFt: canonicalDrtPackage.prowBaseFt, depthFt: canonicalDrtPackage.prowVertexDepthFt, heightFt: canonicalDrtPackage.prowHeightFt },
    dimensionStatus: 'REFERENCE',
    position: { xFt: 0, yFt: canonicalDrtPackage.deckHeightFt + canonicalDrtPackage.prowHeightFt / 2, zFt: monolithCenterZFt },
    rotationYDeg: 0,
    anchor: 'MAIN_STAGE',
    status: 'AUTHORED',
    placementStatus: 'AUTHORED',
    designDecisionId: 'DRT-AUTH-MONOLITH-2026-07-17',
    sourceLabel: sourceLabel('DRT-AUTH-MONOLITH-2026-07-17'),
    color: '#d8c99e',
    snapBehavior: 'GRID_LOCKED',
    notes: ['Two diagonal faces meet at the downstage vertex. No reverse-stacked second monolith is filed as controlling geometry.'],
    renderParts: monolithParts,
  },
  {
    id: 'drt-center-thrust',
    definitionId: 'drt-center-thrust',
    label: 'DRT center thrust',
    category: 'Thrusts',
    shape: 'box',
    dimensions: { widthFt: canonicalDrtPackage.centerThrustWidthFt, depthFt: canonicalDrtPackage.centerThrustLengthFt, heightFt: canonicalDrtPackage.deckHeightFt },
    dimensionStatus: 'REFERENCE',
    position: { xFt: 0, yFt: canonicalDrtPackage.deckHeightFt / 2, zFt: stageCenterZFt + canonicalDrtPackage.deckDepthFt / 2 + canonicalDrtPackage.centerThrustLengthFt / 2 },
    rotationYDeg: 0,
    anchor: 'MAIN_STAGE',
    status: 'AUTHORED',
    placementStatus: 'AUTHORED',
    designDecisionId: 'DRT-AUTH-THRUSTS-2026-07-17',
    sourceLabel: sourceLabel('DRT-AUTH-THRUSTS-2026-07-17'),
    color: '#c57932',
    snapBehavior: 'GRID_LOCKED',
    notes: [],
  },
  ...([-1, 1] as const).map((side): CanonicalDrtObject => ({
    id: side === -1 ? 'drt-side-thrust-sl' : 'drt-side-thrust-sr',
    definitionId: 'drt-side-thrust',
    label: side === -1 ? 'DRT side thrust SL' : 'DRT side thrust SR',
    category: 'Thrusts',
    shape: 'box',
    dimensions: { widthFt: canonicalDrtPackage.sideThrustWidthFt, depthFt: canonicalDrtPackage.sideThrustLengthFt, heightFt: canonicalDrtPackage.deckHeightFt },
    dimensionStatus: 'REFERENCE',
    position: { xFt: side * 23.8, yFt: canonicalDrtPackage.deckHeightFt / 2, zFt: sideThrustCenterZFt },
    rotationYDeg: side * sideThrustRotationDeg,
    anchor: 'MAIN_STAGE',
    status: 'AUTHORED',
    placementStatus: 'AUTHORED',
    designDecisionId: 'DRT-AUTH-THRUSTS-2026-07-17',
    sourceLabel: sourceLabel('DRT-AUTH-THRUSTS-2026-07-17'),
    color: '#8f552b',
    snapBehavior: 'GRID_LOCKED',
    notes: ['Labeled 5 ft by 32 ft dimensions control; the filed scale mismatch remains unresolved.'],
  })),
  {
    id: 'drt-b-stage',
    definitionId: 'drt-b-stage',
    label: 'DRT B stage',
    category: 'B stage',
    shape: 'b-stage',
    dimensions: { widthFt: canonicalDrtPackage.bStageDiameterFt, depthFt: canonicalDrtPackage.bStageDiameterFt, heightFt: canonicalDrtPackage.deckHeightFt },
    dimensionStatus: 'REFERENCE',
    position: { xFt: 0, yFt: canonicalDrtPackage.deckHeightFt / 2, zFt: 0 },
    rotationYDeg: 0,
    anchor: 'VENUE_CENTER',
    status: 'AUTHORED',
    placementStatus: 'REFERENCE',
    designDecisionId: 'DRT-AUTH-B-STAGE-2026-07-17',
    sourceLabel: sourceLabel('DRT-AUTH-B-STAGE-2026-07-17'),
    color: '#c88a3d',
    snapBehavior: 'VENUE_CENTER_LOCKED',
    notes: ['The circular deck is authored. The tail is visibly labeled reference-only.'],
    renderParts: bStageParts,
  },
];

const lowFogObjects: CanonicalDrtObject[] = [-18, -6, 6, 18].map((xFt, index) => ({
  id: `drt-low-fog-${index + 1}`,
  definitionId: 'low-fog-machine',
  label: `DRT low-fog unit ${index + 1}`,
  category: 'Low fog',
  shape: 'fog',
  dimensions: { widthFt: 2, depthFt: 2, heightFt: 2 },
  dimensionStatus: 'ESTIMATE',
  position: { xFt, yFt: 1, zFt: stageCenterZFt - 9 },
  rotationYDeg: 0,
  anchor: 'MAIN_STAGE',
  status: 'REFERENCE',
  placementStatus: 'UNRESOLVED',
  designDecisionId: 'DRT-SEED-LOW-FOG-COUNT-4',
  sourceLabel: sourceLabel('DRT-SEED-LOW-FOG-COUNT-4'),
  color: '#72a6ad',
  snapBehavior: 'GRID_LOCKED',
  notes: ['Count is controlled at four. Exact operating placement is unresolved and shown as a planning reference.'],
  atmosphere: { enabled: true, output: 0.45, directionDeg: 0, coverageRadiusFt: 18, groupId: 'drt-atmospherics' },
}));

const unresolved: UnresolvedDrtElement[] = [
  ['drt-ramps-unresolved', 'Touring ramps', 'Stairs'],
  ['drt-scrim-unresolved', 'Scrim / fabric plane', 'Scrims'],
  ['drt-projector-unresolved', 'Under-surface projector', 'Projection surfaces'],
  ['drt-foh-unresolved', 'Touring FOH', 'FOH'],
  ['drt-barricade-unresolved', 'Barricade reference', 'Barricade'],
  ['drt-hazers-unresolved', 'Hazer units', 'Hazers'],
].map(([id, label, category]) => ({
  id,
  label,
  category,
  status: 'UNRESOLVED',
  designDecisionId: 'DRT-UNRESOLVED-LAYOUT-2026-07-18',
  note: 'Not rendered because this repository does not contain controlling dimensions or placement relationships.',
})) as UnresolvedDrtElement[];

export const canonicalDrtGeometry: CanonicalDrtGeometry = {
  schemaVersion: 1,
  seedVersion: DRT_SEED_VERSION,
  coordinateConvention: 'X stage-left/right, Y elevation, Z upstage/downstage; venue center is 0/0.',
  objects: [...authoredObjects, ...lowFogObjects],
  unresolved,
};

export const canonicalDrtDerived = {
  stageCenterZFt,
  upstageEdgeZFt,
  downstageEdgeZFt: stageCenterZFt + canonicalDrtPackage.deckDepthFt / 2,
  monolithHalfBaseFt,
  monolithFaceLengthFt,
  monolithFaceAngleRad: monolithFaceAngleDeg * Math.PI / 180,
  monolithCenterZFt,
  bStageCenterZFt: 0,
  sideThrusts: canonicalDrtGeometry.objects
    .filter((object) => object.definitionId === 'drt-side-thrust')
    .map((object, index) => ({ side: (index === 0 ? -1 : 1) as -1 | 1, xFt: object.position.xFt, zFt: object.position.zFt, rotationYRad: object.rotationYDeg * Math.PI / 180 })),
} as const;
