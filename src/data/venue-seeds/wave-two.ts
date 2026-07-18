import type { VenueGeometry, VenueTwin } from '../types';
import { baseObjects, geometryProvenance, venueSource } from '../helpers';

const hebGeometry: VenueGeometry = { floorWidthFt: 85, floorLengthFt: 250, lowSteelFt: 50, centerhungBottomFt: 51, dockCount: 1, endStageRiggingLb: 150000, centerStageRiggingLb: 125000, houseStageWidthFt: 60, houseStageDepthFt: 48, houseStageMinHeightFt: 4, houseStageMaxHeightFt: 6.5 };
const tMobileGeometry: VenueGeometry = { floorWidthFt: 85, floorLengthFt: 235, lowSteelFt: 98, centerhungBottomFt: 76, centerhungDiameterFt: 32, dockCount: 6, pushDistanceFt: 200, endStageRiggingLb: 150000, centerStageRiggingLb: 124000, totalGridRiggingLb: 450000, houseStageWidthFt: 72, houseStageDepthFt: 60, houseStageMinHeightFt: 4, houseStageMaxHeightFt: 6.5 };
const desertDiamondGeometry: VenueGeometry = { floorWidthFt: 85, floorLengthFt: 200, lowSteelFt: 100, centerhungBottomFt: 58, centerhungDiameterFt: 32, dockCount: 5, pushDistanceFt: 70, endStageRiggingLb: 125000, centerStageRiggingLb: 90000, houseStageWidthFt: 60, houseStageDepthFt: 48, houseStageMinHeightFt: 4, houseStageMaxHeightFt: 6, egressClearanceFt: 7.5 };
const tMobileFile = 't_mobile_center_kansas_city_mo.pdf';
const tMobileRegisteredSource = venueSource(tMobileFile, 'Venue source review', 'Technical information source registered', 'Approved page-level reference facts', 'CALIBRATED PLANNING');

export const waveOneB: VenueTwin[] = [
  {
    slug: 'heb-center', name: 'H-E-B Center at Cedar Park', city: 'Cedar Park', state: 'TX', showDate: '2027-05-07',
    sourceScore: 68, sourceYear: '2024', sourceFile: 'heb_center_cedar_park_tx.pdf', fidelity: 'L0 SOURCE', sourceStatus: 'READY', cadStatus: 'REQUESTED',
    riggingConfidence: 'ENGINEERING CONFIRMATION REQUIRED', logisticsConfidence: 'APPROXIMATE PLANNING', pmOpen: 7, tmOpen: 3,
    keyStrength: 'Rich appendices for BOH, anchors, rigging steel, stage, power and communication.',
    missingInputs: ['Exact dock-to-stage push', 'Separate current rigging pack', 'Native venue CAD'], detailed: true,
    geometry: hebGeometry,
    geometryProvenance: geometryProvenance(hebGeometry, 'REFERENCE', 'MEDIUM', venueSource('heb_center_cedar_park_tx.pdf', 'Venue geometry seed', '2024', 'Authored source-backed geometry', 'CALIBRATED PLANNING'), 'Source-backed planning geometry; confirm before final operations.'),
    approvedReviewFactIds: {
      floorWidthFt: 'heb-end-stage-floor-width-85',
      floorLengthFt: 'heb-end-stage-floor-length-250',
      lowSteelFt: 'heb-low-steel-50',
      endStageRiggingLb: 'heb-end-stage-rigging-150000',
      centerStageRiggingLb: 'heb-center-stage-rigging-125000',
      houseStageWidthFt: 'heb-house-stage-width-60',
      houseStageDepthFt: 'heb-house-stage-depth-48',
    },
    zones: [
      { id: 'heb-west-dock', label: 'West loading dock', kind: 'dock', xFt: -34, zFt: -116, widthFt: 25, depthFt: 22, layer: 'logistics', source: venueSource('heb_center_cedar_park_tx.pdf', 'Loading Dock', '2024', 'West-side loading dock') },
      { id: 'heb-fire-lane', label: 'Required dock fire lane', kind: 'egress', xFt: 0, zFt: -121, widthFt: 14, depthFt: 35, layer: 'safety', source: venueSource('heb_center_cedar_park_tx.pdf', 'Loading Dock', '2024', 'Vehicles must fit within red fire lane') },
      { id: 'heb-south-parking', label: 'South-lot overflow', kind: 'parking', xFt: 31, zFt: -116, widthFt: 34, depthFt: 22, layer: 'logistics', source: venueSource('heb_center_cedar_park_tx.pdf', 'Loading Dock', '2024', 'Additional parking along south curb') },
      { id: 'heb-power-left', label: 'Stage-left show power', kind: 'power', xFt: -36, zFt: -82, widthFt: 7, depthFt: 7, layer: 'production', source: venueSource('heb_center_cedar_park_tx.pdf', 'Electrical Power', '2024', 'Main power approx. 50′ from end stage') },
      { id: 'heb-power-right', label: 'Stage-right show power', kind: 'power', xFt: 36, zFt: -82, widthFt: 7, depthFt: 7, layer: 'production', source: venueSource('heb_center_cedar_park_tx.pdf', 'Electrical Power', '2024', 'Main power approx. 50′ from end stage') },
    ],
    objects: baseObjects('heb_center_cedar_park_tx.pdf', '2024', '85′ × 250′ end-stage floor', '50′ AFF / 49′-10″ over ice', 'Retracts above steel'),
  },
  {
    slug: 't-mobile-center', name: 'T-Mobile Center', city: 'Kansas City', state: 'MO', showDate: '2027-04-25',
    sourceScore: 64, sourceYear: 'Technical information packet', sourceFile: tMobileFile, fidelity: 'L0 SOURCE', sourceStatus: 'READY', cadStatus: 'REQUESTED',
    riggingConfidence: 'ENGINEERING CONFIRMATION REQUIRED', logisticsConfidence: 'CALIBRATED PLANNING', pmOpen: 6, tmOpen: 3,
    keyStrength: 'Filed venue source now has approved floor, loading, scoreboard, and rigging-load reference facts.',
    missingInputs: ['Visible issue date', 'Native rigging CAD', 'Current seating manifest', 'Current labor rates'], detailed: true,
    geometry: tMobileGeometry,
    geometryProvenance: geometryProvenance(tMobileGeometry, 'REFERENCE', 'HIGH', tMobileRegisteredSource, 'Approved venue review facts are REFERENCE because no visible issue date was found.'),
    approvedReviewFactIds: {
      floorWidthFt: 'tmobile-floor-width-85',
      floorLengthFt: 'tmobile-floor-length-235',
      lowSteelFt: 'tmobile-low-steel-98',
      centerhungBottomFt: 'tmobile-scoreboard-bottom-76',
      centerhungDiameterFt: 'tmobile-scoreboard-top-diameter-32',
      dockCount: 'tmobile-docks-6',
      pushDistanceFt: 'tmobile-push-distance-200',
      endStageRiggingLb: 'tmobile-end-stage-rigging-150000',
      centerStageRiggingLb: 'tmobile-center-stage-rigging-124000',
      totalGridRiggingLb: 'tmobile-total-grid-rigging-450000',
    },
    zones: [
      { id: 'tmobile-docks', label: 'Six loading docks', kind: 'dock', xFt: -28, zFt: -111, widthFt: 42, depthFt: 20, layer: 'logistics', source: venueSource(tMobileFile, 'Loading Docks', 'Technical information source registered', 'Six dock levelers; 200 ft push', 'UNVERIFIED') },
      { id: 'tmobile-boh', label: 'Star rooms + production offices', kind: 'boh', xFt: 28, zFt: -102, widthFt: 34, depthFt: 32, heightFt: 12, layer: 'backstage', source: venueSource(tMobileFile, 'Dressing Rooms', 'Technical information source registered', 'Five star rooms; four production offices', 'UNVERIFIED') },
      { id: 'tmobile-shore', label: 'Dock shore / media power', kind: 'power', xFt: -34, zFt: -94, widthFt: 8, depthFt: 8, layer: 'production', source: venueSource(tMobileFile, 'Shore & Media Power', 'Technical information source registered', 'Dock power services', 'UNVERIFIED') },
    ],
    objects: baseObjects(tMobileFile, 'Technical information source registered', '85 ft x 235 ft estimate; 19,975 sq ft reference', '98 ft AFF estimate', '76 ft trim; 32 ft top / 24 ft bottom estimate', 'UNVERIFIED', 'UNVERIFIED', 'UNVERIFIED'),
  },
  {
    slug: 'desert-diamond-arena', name: 'Desert Diamond Arena', city: 'Glendale', state: 'AZ', showDate: '2027-05-01',
    sourceScore: 64, sourceYear: 'May 2023', sourceFile: 'desert_diamond_arena_glendale_az.pdf', fidelity: 'L0 SOURCE', sourceStatus: 'STALE', cadStatus: 'REQUESTED',
    riggingConfidence: 'ENGINEERING CONFIRMATION REQUIRED', logisticsConfidence: 'VERIFIED', pmOpen: 7, tmOpen: 4,
    keyStrength: 'Complete operational maps, dock/parking, rigging, rooms and curtain systems.',
    missingInputs: ['Current 2026/27 revision', 'Native arena CAD', 'Current seating manifest'], detailed: true,
    geometry: desertDiamondGeometry,
    geometryProvenance: geometryProvenance(desertDiamondGeometry, 'REFERENCE', 'LOW', venueSource('desert_diamond_arena_glendale_az.pdf', 'Venue geometry seed', 'May 2023', 'Authored source-backed geometry from stale source', 'CALIBRATED PLANNING'), 'Source-backed planning geometry from a stale source; refresh before final operations.'),
    approvedReviewFactIds: {
      lowSteelFt: 'dda-low-steel-100',
      centerhungBottomFt: 'dda-scoreboard-bottom-58',
      dockCount: 'dda-docks-5',
      pushDistanceFt: 'dda-push-distance-70',
      endStageRiggingLb: 'dda-end-stage-rigging-125000',
      centerStageRiggingLb: 'dda-center-stage-rigging-90000',
      houseStageWidthFt: 'dda-house-stage-width-60',
      houseStageDepthFt: 'dda-house-stage-depth-48',
    },
    zones: [
      { id: 'dda-docks', label: 'Recessed dock / five bays', kind: 'dock', xFt: -28, zFt: -94, widthFt: 38, depthFt: 20, layer: 'logistics', source: venueSource('desert_diamond_arena_glendale_az.pdf', 'Loading Dock Info', 'May 2023', 'Five docks plus roll-up; 70′ push') },
      { id: 'dda-lot-e', label: 'Lot E overflow', kind: 'parking', xFt: 31, zFt: -96, widthFt: 32, depthFt: 22, layer: 'logistics', source: venueSource('desert_diamond_arena_glendale_az.pdf', 'Parking', 'May 2023', 'Truck/bus overflow in Lot E') },
      { id: 'dda-egress-l', label: 'House-left egress clearance', kind: 'egress', xFt: -38.75, zFt: -60, widthFt: 7.5, depthFt: 65, layer: 'safety', source: venueSource('desert_diamond_arena_glendale_az.pdf', 'Arena Specifications', 'May 2023', '7′-6″ public egress path') },
      { id: 'dda-egress-r', label: 'House-right egress clearance', kind: 'egress', xFt: 38.75, zFt: -60, widthFt: 7.5, depthFt: 65, layer: 'safety', source: venueSource('desert_diamond_arena_glendale_az.pdf', 'Arena Specifications', 'May 2023', '7′-6″ public egress path') },
      { id: 'dda-curtain', label: '80′ half-house curtain zone', kind: 'curtain', xFt: 0, zFt: 32, widthFt: 80, depthFt: 3, heightFt: 70, layer: 'audience', source: venueSource('desert_diamond_arena_glendale_az.pdf', 'Curtain System', 'May 2023', 'Venue-owned 80′ half-house curtain') },
    ],
    objects: baseObjects('desert_diamond_arena_glendale_az.pdf', 'May 2023', '85′ × 200′ planning floor; 1,000 lb/sq ft reference', '100′ AFF; high steel prohibited', '58′ bottom at maximum trim'),
  },
];
