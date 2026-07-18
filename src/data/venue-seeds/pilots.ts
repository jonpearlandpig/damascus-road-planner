import type { VenueGeometry, VenueGeometryProvenance, VenueTwin } from '../types';
import { baseObjects, geometryProvenance, venueSource } from '../helpers';

const spectrumGuide = 'spectrum_center_charlotte_nc.pdf';
const spectrumGeometry: VenueGeometry = { floorWidthFt: 85, floorLengthFt: 200, lowSteelFt: 107, highSteelFt: 130, centerhungBottomFt: 75, dockCount: 4, endStageRiggingLb: 150000, egressClearanceFt: 5 };
const bokGeometry: VenueGeometry = { floorWidthFt: 85, floorLengthFt: 200, lowSteelFt: 90, centerhungBottomFt: 75, centerhungDiameterFt: 46.67, dockCount: 3, endStageRiggingLb: 150000, centerStageRiggingLb: 120000, houseStageWidthFt: 56, houseStageDepthFt: 80 };
const bokFloorEstimateSource = venueSource('bok_center_tulsa_ok.pdf', 'Reviewed source gaps', 'Undated production manual', '85 x 200 seed not supported by reviewed PDF text', 'UNVERIFIED');
const bokApprovedSource = venueSource('bok_center_tulsa_ok.pdf', 'Venue source review', 'Undated production manual', 'Approved page-level reference facts', 'CALIBRATED PLANNING');
const bokGeometryProvenance: VenueGeometryProvenance = {
  floorWidthFt: { value: 85, unit: 'ft', status: 'ESTIMATE', confidence: 'LOW', source: bokFloorEstimateSource, note: 'Rejected by venue review as an unsupported seed envelope.' },
  floorLengthFt: { value: 200, unit: 'ft', status: 'ESTIMATE', confidence: 'LOW', source: bokFloorEstimateSource, note: 'Rejected by venue review as an unsupported seed envelope.' },
  lowSteelFt: { value: 90, unit: 'ft', status: 'REFERENCE', confidence: 'HIGH', source: bokApprovedSource, note: 'Approved by fact bok-low-steel-90.' },
  centerhungBottomFt: { value: 75, unit: 'ft', status: 'REFERENCE', confidence: 'HIGH', source: bokApprovedSource, note: 'Approved by fact bok-scoreboard-bottom-75.' },
  centerhungDiameterFt: { value: 46.67, unit: 'ft', status: 'REFERENCE', confidence: 'MEDIUM', source: bokApprovedSource, note: 'Width-only scoreboard bay dimension; north-south depth is 37 ft in the review record.' },
  dockCount: { value: 3, unit: 'count', status: 'REFERENCE', confidence: 'HIGH', source: bokApprovedSource, note: 'Approved by fact bok-production-docks-3.' },
  endStageRiggingLb: { value: 150000, unit: 'lb', status: 'REFERENCE', confidence: 'HIGH', source: bokApprovedSource, note: 'Approved by fact bok-end-stage-rigging-150000.' },
  centerStageRiggingLb: { value: 120000, unit: 'lb', status: 'REFERENCE', confidence: 'HIGH', source: bokApprovedSource, note: 'Approved by fact bok-center-stage-rigging-120000.' },
  houseStageWidthFt: { value: 56, unit: 'ft', status: 'REFERENCE', confidence: 'HIGH', source: bokApprovedSource, note: 'Approved by fact bok-house-stage-max-width-56.' },
  houseStageDepthFt: { value: 80, unit: 'ft', status: 'REFERENCE', confidence: 'HIGH', source: bokApprovedSource, note: 'Approved by fact bok-house-stage-max-depth-80.' },
};

export const pilotVenues: VenueTwin[] = [
  {
    slug: 'spectrum-center', name: 'Spectrum Center', city: 'Charlotte', state: 'NC', showDate: '2027-04-17',
    sourceScore: 66, sourceYear: '2025 production guide', sourceFile: spectrumGuide,
    fidelity: 'L1 CALIBRATED 2D', sourceStatus: 'READY', cadStatus: 'REQUESTED',
    riggingConfidence: 'ENGINEERING CONFIRMATION REQUIRED', logisticsConfidence: 'CALIBRATED PLANNING', pmOpen: 8, tmOpen: 4,
    keyStrength: 'Active calibrated overlay with venue diagrams, production and rigging sections.',
    missingInputs: ['Native floor/bowl CAD', 'Native rigging CAD', 'Current seating manifest'], detailed: true,
    geometry: spectrumGeometry,
    geometryProvenance: geometryProvenance(spectrumGeometry, 'REFERENCE', 'MEDIUM', venueSource(spectrumGuide, 'Venue geometry seed', '2025 Production Guide', 'Authored source-backed geometry', 'CALIBRATED PLANNING'), 'Source-backed planning geometry; confirm before final operations.'),
    approvedReviewFactIds: {
      floorWidthFt: 'spectrum-floor-width-85',
      floorLengthFt: 'spectrum-floor-length-200',
      lowSteelFt: 'spectrum-low-steel-107',
      highSteelFt: 'spectrum-high-steel-130',
      dockCount: 'spectrum-truck-positions-4',
      endStageRiggingLb: 'spectrum-end-stage-rigging-150000',
      egressClearanceFt: 'spectrum-egress-5',
    },
    zones: [
      { id: 'spectrum-dock', label: 'Loading dock / Caldwell St.', kind: 'dock', xFt: -34, zFt: -93, widthFt: 18, depthFt: 22, layer: 'logistics', source: venueSource(spectrumGuide, 'Location / loading dock', '2025 Production Guide', 'Loading dock on Caldwell Street') },
      { id: 'spectrum-boh', label: 'Back-of-house planning zone', kind: 'boh', xFt: 24, zFt: -91, widthFt: 24, depthFt: 26, heightFt: 10, layer: 'backstage', source: venueSource(spectrumGuide, 'Spectrum Center diagrams', '2025 Production Guide', 'Plan-derived BOH zone', 'CALIBRATED PLANNING') },
      { id: 'spectrum-egress-l', label: 'House-left fire aisle', kind: 'egress', xFt: -40, zFt: -64, widthFt: 5, depthFt: 55, layer: 'safety', source: venueSource(spectrumGuide, 'Production information', '2025 Production Guide', '5′ planning fire aisle', 'CALIBRATED PLANNING') },
      { id: 'spectrum-egress-r', label: 'House-right fire aisle', kind: 'egress', xFt: 40, zFt: -64, widthFt: 5, depthFt: 55, layer: 'safety', source: venueSource(spectrumGuide, 'Production information', '2025 Production Guide', '5′ planning fire aisle', 'CALIBRATED PLANNING') },
    ],
    objects: baseObjects(spectrumGuide, '2025 Production Guide', '85′ × 200′', '107′ AFF', 'Planning obstruction'),
  },
  {
    slug: 'bok-center', name: 'BOK Center', city: 'Tulsa', state: 'OK', showDate: '2027-04-08',
    sourceScore: 58, sourceYear: 'Undated manual', sourceFile: 'bok_center_tulsa_ok.pdf', fidelity: 'L0 SOURCE', sourceStatus: 'READY', cadStatus: 'REQUESTED',
    riggingConfidence: 'ENGINEERING CONFIRMATION REQUIRED', logisticsConfidence: 'APPROXIMATE PLANNING', pmOpen: 10, tmOpen: 5,
    keyStrength: 'Operationally strong manual with rooms, power, scoreboard and grid limits.',
    missingInputs: ['Approved floor width/length', 'Native floor/bowl CAD', 'Rigging CAD', 'Current seating manifest'], detailed: true,
    geometry: bokGeometry,
    geometryProvenance: bokGeometryProvenance,
    approvedReviewFactIds: {
      lowSteelFt: 'bok-low-steel-90',
      centerhungBottomFt: 'bok-scoreboard-bottom-75',
      centerhungDiameterFt: 'bok-scoreboard-width-46-67',
      dockCount: 'bok-production-docks-3',
      endStageRiggingLb: 'bok-end-stage-rigging-150000',
      centerStageRiggingLb: 'bok-center-stage-rigging-120000',
      houseStageWidthFt: 'bok-house-stage-max-width-56',
      houseStageDepthFt: 'bok-house-stage-max-depth-80',
    },
    zones: [
      { id: 'bok-dock', label: 'Freight / load-in zone', kind: 'dock', xFt: -32, zFt: -92, widthFt: 22, depthFt: 20, layer: 'logistics', source: venueSource('bok_center_tulsa_ok.pdf', 'Freight elevators / loading', 'Production Manual', 'Two freight elevators', 'APPROXIMATE PLANNING') },
      { id: 'bok-catering', label: 'Catering + dining', kind: 'boh', xFt: 28, zFt: -90, widthFt: 24, depthFt: 20, heightFt: 10, layer: 'backstage', source: venueSource('bok_center_tulsa_ok.pdf', 'Catering', 'Production Manual', 'Catering room seats 45') },
    ],
    objects: baseObjects('bok_center_tulsa_ok.pdf', 'Production Manual', 'Planning 85′ × 200′', '90′ AFF', '46′-8″ × 37′; 75′ bottom'),
  },
];
