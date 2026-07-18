import type { VenueGeometry, VenueTwin } from '../types';
import { baseObjects, geometryProvenance, venueSource } from '../helpers';

const dickiesGeometry: VenueGeometry = { floorWidthFt: 85, floorLengthFt: 200, centerhungBottomFt: 80, centerhungDiameterFt: 54, dockCount: 5, pushDistanceFt: 175, stageEndOpeningWidthFt: 18.5, stageEndOpeningHeightFt: 36, endStageRiggingLb: 200000, houseStageWidthFt: 80, houseStageDepthFt: 40, houseStageMinHeightFt: 4, houseStageMaxHeightFt: 6 };
const vanAndelGeometry: VenueGeometry = { floorWidthFt: 85, floorLengthFt: 200, lowSteelFt: 65 + 8 / 12, highSteelFt: 98, gridWidthFt: 99, gridDepthFt: 52, centerhungBottomFt: 65, dockCount: 5, endStageRiggingLb: 100000, totalGridRiggingLb: 290000, houseStageWidthFt: 60, houseStageDepthFt: 40, houseStageMaxHeightFt: 6 };

export const waveOneA: VenueTwin[] = [
  {
    slug: 'dickies-arena', name: 'Dickies Arena', city: 'Fort Worth', state: 'TX', showDate: '2027-05-08',
    sourceScore: 70, sourceYear: 'Revised 2026', sourceFile: 'dickies_arena_fort_worth_tx.pdf', fidelity: 'L0 SOURCE', sourceStatus: 'READY', cadStatus: 'REQUESTED',
    riggingConfidence: 'ENGINEERING CONFIRMATION REQUIRED', logisticsConfidence: 'CALIBRATED PLANNING', pmOpen: 5, tmOpen: 3,
    keyStrength: 'Strong building dimensions, backstage program, loading and detailed rigging diagrams.',
    missingInputs: ['Low-steel/grid trim', 'Exact push confirmation', 'SPL and curfew limits'], detailed: true,
    geometry: dickiesGeometry,
    geometryProvenance: geometryProvenance(dickiesGeometry, 'REFERENCE', 'MEDIUM', venueSource('dickies_arena_fort_worth_tx.pdf', 'Venue geometry seed', 'Revised 2026', 'Authored source-backed geometry', 'CALIBRATED PLANNING'), 'Source-backed planning geometry; confirm before final operations.'),
    zones: [
      { id: 'dickies-docks', label: 'Main event loading docks', kind: 'dock', xFt: -30, zFt: -94, widthFt: 34, depthFt: 18, layer: 'logistics', source: venueSource('dickies_arena_fort_worth_tx.pdf', 'Loading Docks', 'Revised 2026', 'Five event-use docks') },
      { id: 'dickies-east-docks', label: 'East open-air docks', kind: 'dock', xFt: 32, zFt: -92, widthFt: 22, depthFt: 18, layer: 'logistics', source: venueSource('dickies_arena_fort_worth_tx.pdf', 'Loading Docks', 'Revised 2026', 'Two open-air docks and ramp') },
      { id: 'dickies-boh', label: 'Performer / locker-room complex', kind: 'boh', xFt: 26, zFt: -68, widthFt: 30, depthFt: 30, heightFt: 12, layer: 'backstage', source: venueSource('dickies_arena_fort_worth_tx.pdf', 'Backstage & Locker Rooms', 'Revised 2026', 'Performer, locker, hospitality and office spaces') },
    ],
    objects: baseObjects('dickies_arena_fort_worth_tx.pdf', 'Revised 2026', '85′ × 200′ planning floor', 'Audio ring at 80′ AFF', '89′ max / 80′ concert trim'),
  },
  {
    slug: 'van-andel-arena', name: 'Van Andel Arena', city: 'Grand Rapids', state: 'MI', showDate: '2027-04-11',
    sourceScore: 70, sourceYear: 'January 1, 2026', sourceFile: 'van_andel_arena_grand_rapids_mi.pdf', fidelity: 'L0 SOURCE', sourceStatus: 'CONFLICT', cadStatus: 'REQUESTED',
    riggingConfidence: 'CONFLICT', logisticsConfidence: 'VERIFIED', pmOpen: 6, tmOpen: 3,
    keyStrength: 'Best measured floor/grid, dock, parking, seating and backstage source in the wave.',
    missingInputs: ['Resolve 84′-7″ vs 86′ grid height conflict', 'Native rigging CAD', 'Current seating manifest'], detailed: true,
    geometry: vanAndelGeometry,
    geometryProvenance: geometryProvenance(vanAndelGeometry, 'REFERENCE', 'LOW', venueSource('van_andel_arena_grand_rapids_mi.pdf', 'Venue geometry seed', '01.01.2026', 'Authored source-backed geometry with unresolved grid-height conflict', 'CONFLICT'), 'Source-backed planning geometry includes an authored height conflict; resolve before final operations.'),
    zones: [
      { id: 'vaa-docks', label: 'Five loading docks', kind: 'dock', xFt: -30, zFt: -94, widthFt: 38, depthFt: 18, layer: 'logistics', source: venueSource('van_andel_arena_grand_rapids_mi.pdf', 'Loading Dock', '01.01.2026', 'Five docks; Dock 5 door 20′ × 18′') },
      { id: 'vaa-horseshoe', label: 'Secure horseshoe parking', kind: 'parking', xFt: 30, zFt: -96, widthFt: 35, depthFt: 20, layer: 'logistics', source: venueSource('van_andel_arena_grand_rapids_mi.pdf', 'Tour Parking', '01.01.2026', 'Secure gated horseshoe lot') },
      { id: 'vaa-pa-left', label: 'House PA obstruction HL', kind: 'obstruction', xFt: -22, zFt: -5, widthFt: 6, depthFt: 12, heightFt: 20, layer: 'rigging', source: venueSource('van_andel_arena_grand_rapids_mi.pdf', 'Rigging', '01.01.2026', 'House PA obstruction 22′ off center') },
      { id: 'vaa-pa-right', label: 'House PA obstruction HR', kind: 'obstruction', xFt: 22, zFt: -5, widthFt: 6, depthFt: 12, heightFt: 20, layer: 'rigging', source: venueSource('van_andel_arena_grand_rapids_mi.pdf', 'Rigging', '01.01.2026', 'House PA obstruction 22′ off center') },
    ],
    objects: baseObjects('van_andel_arena_grand_rapids_mi.pdf', '01.01.2026', '85′ × 200′', '84′-7″ / 86′ source conflict', '65′ at highest trim', 'CONFLICT'),
  },
];
