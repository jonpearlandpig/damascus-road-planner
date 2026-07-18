import type { ConfidenceState, SceneObjectRecord, SourceRef, TourPackage, VenueTwin } from './types';

export const tourSource: SourceRef = {
  file: 'Damascus Road Planner — stored design configuration',
  section: 'DRT production package v12',
  revision: 'Working geometry — July 17, 2026',
  originalValue: '78′ × 42′ deck; 35′-4″ prow; 26′ B-stage',
  confidence: 'CALIBRATED PLANNING',
  authority: 'TOUR ISSUED',
};

export function venueSource(file: string, section: string, revision: string, value: string, confidence: ConfidenceState = 'VERIFIED'): SourceRef {
  return { file, section, revision, originalValue: value, confidence, authority: 'VENUE ISSUED' };
}

export const drtPackage: TourPackage = {
  id: 'drt-v12', revision: 'Working v12', name: 'Damascus Road Tour Production Package',
  deckWidthFt: 78, deckDepthFt: 42, deckHeightFt: 5.5,
  prowBaseFt: 50, prowVertexDepthFt: 25, prowHeightFt: 35 + 4 / 12,
  centerThrustWidthFt: 6, centerThrustLengthFt: 42,
  sideThrustWidthFt: 5, sideThrustLengthFt: 32,
  bStageDiameterFt: 26, bStageLocalZFt: 76,
};

export function baseObjects(file: string, revision: string, floor: string, grid: string, scoreboard: string, gridConfidence: ConfidenceState = 'ENGINEERING CONFIRMATION REQUIRED'): SceneObjectRecord[] {
  return [
    { id: 'venue-floor', label: 'Arena event floor', category: 'overview', value: floor, source: venueSource(file, 'Arena floor / venue diagrams', revision, floor, 'CALIBRATED PLANNING') },
    { id: 'center-court', label: 'True center court', category: 'overview', value: 'Venue anchor', notes: 'B-stage default center is locked to this venue anchor.', source: venueSource(file, 'Arena plan', revision, 'Court center', 'CALIBRATED PLANNING') },
    { id: 'grid-plane', label: 'Rigging / low-steel reference', category: 'rigging', value: grid, source: venueSource(file, 'Rigging information', revision, grid, gridConfidence) },
    { id: 'scoreboard', label: 'Centerhung / overhead obstruction', category: 'rigging', value: scoreboard, source: venueSource(file, 'Centerhung / scoreboard', revision, scoreboard, 'ENGINEERING CONFIRMATION REQUIRED') },
    { id: 'drt-stage', label: 'DRT main stage', category: 'production', dimensions: '78′ × 42′ × 5′-6″', source: tourSource },
    { id: 'drt-bstage', label: 'DRT B-stage', category: 'production', dimensions: '26′ diameter', notes: 'Default center is true center court.', source: tourSource },
  ];
}

export function placeholder(slug: string, name: string, city: string, state: string, date: string, score: number, sourceStatus: VenueTwin['sourceStatus']): VenueTwin {
  return {
    slug, name, city, state, showDate: date, sourceScore: score,
    sourceYear: sourceStatus === 'MISSING' ? 'No source' : 'PDF source', sourceFile: sourceStatus === 'MISSING' ? 'No source filed' : `${slug}.pdf`,
    fidelity: 'L0 SOURCE', sourceStatus, cadStatus: 'NONE', riggingConfidence: 'UNVERIFIED', logisticsConfidence: 'UNVERIFIED',
    pmOpen: sourceStatus === 'MISSING' ? 8 : 5, tmOpen: sourceStatus === 'MISSING' ? 5 : 3,
    geometry: { floorWidthFt: 85, floorLengthFt: 200 }, zones: [], objects: [],
    keyStrength: sourceStatus === 'MISSING' ? 'Source package required.' : 'PDF source inventory complete; content audit pending.',
    missingInputs: ['Venue tech pack', 'Floor/seating plan', 'Rigging plot or CAD'], detailed: false,
  };
}
