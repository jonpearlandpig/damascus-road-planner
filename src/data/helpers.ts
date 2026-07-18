import type {
  ConfidenceState,
  MeasurementConfidence,
  MeasurementStatus,
  MeasurementUnit,
  SceneObjectRecord,
  SourceRef,
  TourPackage,
  VenueGeometry,
  VenueGeometryProvenance,
  VenueTwin,
} from './types';
import { assertDrtPackageInvariants } from '../geometry/drt';

export const tourSource: SourceRef = {
  file: 'JQ 2026 — AKB / Damascus Road MASTER editable Rev D',
  section: 'Verified Facts + current design master',
  revision: 'Working geometry — 2026-07-17',
  originalValue: '78′ × 42′ deck; 35′-4″ prow; 26′ B-stage',
  confidence: 'CALIBRATED PLANNING',
  authority: 'MANAGEMENT CONFIRMED',
};

export function venueSource(file: string, section: string, revision: string, value: string, confidence: ConfidenceState = 'VERIFIED'): SourceRef {
  return { file, section, revision, originalValue: value, confidence, authority: 'VENUE ISSUED' };
}

export const drtPackage: TourPackage = {
  id: 'drt-current-working', revision: 'AKB working geometry — 2026-07-17', name: 'Damascus Road Tour Production Package',
  deckWidthFt: 78, deckDepthFt: 42, deckHeightFt: 5.5,
  prowBaseFt: 50, prowVertexDepthFt: 25, prowHeightFt: 35 + 4 / 12,
  centerThrustWidthFt: 6, centerThrustLengthFt: 42,
  sideThrustWidthFt: 5, sideThrustLengthFt: 32,
  bStageDiameterFt: 26, bStageLocalZFt: 76,
};
assertDrtPackageInvariants(drtPackage);

function unitForGeometryField(field: keyof VenueGeometry): MeasurementUnit {
  if (field.endsWith('Lb')) return 'lb';
  if (field === 'dockCount') return 'count';
  return 'ft';
}

export function geometryProvenance(
  geometry: VenueGeometry,
  status: MeasurementStatus,
  confidence: MeasurementConfidence,
  source?: SourceRef,
  note?: string,
): VenueGeometryProvenance {
  return Object.fromEntries(
    Object.entries(geometry).map(([field, value]) => [
      field,
      { value, unit: unitForGeometryField(field as keyof VenueGeometry), status, confidence, source, note },
    ]),
  ) as VenueGeometryProvenance;
}

export function baseObjects(
  file: string,
  revision: string,
  floor: string,
  grid: string,
  scoreboard: string,
  gridConfidence: ConfidenceState = 'ENGINEERING CONFIRMATION REQUIRED',
  floorConfidence: ConfidenceState = 'CALIBRATED PLANNING',
  scoreboardConfidence: ConfidenceState = 'ENGINEERING CONFIRMATION REQUIRED',
): SceneObjectRecord[] {
  return [
    { id: 'venue-floor', label: 'Arena event floor', category: 'overview', value: floor, source: venueSource(file, 'Arena floor / venue diagrams', revision, floor, floorConfidence) },
    { id: 'center-court', label: 'True center court', category: 'overview', value: 'Venue anchor', notes: 'B-stage default center is locked to this venue anchor.', source: venueSource(file, 'Arena plan', revision, 'Court center', floorConfidence) },
    { id: 'grid-plane', label: 'Rigging / low-steel reference', category: 'rigging', value: grid, source: venueSource(file, 'Rigging information', revision, grid, gridConfidence) },
    { id: 'scoreboard', label: 'Centerhung / overhead obstruction', category: 'rigging', value: scoreboard, source: venueSource(file, 'Centerhung / scoreboard', revision, scoreboard, scoreboardConfidence) },
    { id: 'drt-stage', label: 'DRT main stage', category: 'production', dimensions: '78′ × 42′ × 5′-6″', source: tourSource },
    { id: 'drt-bstage', label: 'DRT B-stage', category: 'production', dimensions: '26′ diameter', notes: 'Default center is true center court. Current master includes a Q-tail design element; final fabrication geometry remains design-controlled.', source: tourSource },
  ];
}

export function placeholder(slug: string, name: string, city: string, state: string, date: string, score: number, sourceStatus: VenueTwin['sourceStatus'], expectedSourceFile?: string): VenueTwin {
  const geometry: VenueGeometry = { floorWidthFt: 85, floorLengthFt: 200 };
  const hasExpectedSource = Boolean(expectedSourceFile) || sourceStatus !== 'MISSING';
  const sourceFile = hasExpectedSource ? (expectedSourceFile ?? `${slug}.pdf`) : 'No source filed';
  const source = venueSource(
    sourceFile,
    'Placeholder planning envelope',
    hasExpectedSource ? 'Expected source inventory pending content audit' : 'No source filed',
    '85′ × 200′ planning envelope',
    'UNVERIFIED',
  );
  const sourceYear = sourceStatus === 'MISSING' ? (hasExpectedSource ? 'Source requested' : 'No source') : 'PDF source';
  return {
    slug, name, city, state, showDate: date, sourceScore: score,
    sourceYear, sourceFile,
    fidelity: 'L0 SOURCE', sourceStatus, cadStatus: 'NONE', riggingConfidence: 'UNVERIFIED', logisticsConfidence: 'UNVERIFIED',
    pmOpen: sourceStatus === 'MISSING' ? 8 : 5, tmOpen: sourceStatus === 'MISSING' ? 5 : 3,
    geometry,
    geometryProvenance: geometryProvenance(geometry, 'ESTIMATE', 'LOW', source, 'Placeholder planning envelope only; not a verified venue measurement.'),
    zones: [], objects: [],
    keyStrength: sourceStatus === 'MISSING' ? (hasExpectedSource ? 'Declared source package not located; source package required.' : 'Source package required.') : 'PDF source inventory complete; planning envelope remains estimated pending content audit.',
    missingInputs: ['Venue tech pack', 'Floor/seating plan', 'Rigging plot or CAD'], detailed: false,
  };
}
