import type { MeasurementStatus, SourcedMeasurement, VenueGeometry, VenueTwin } from '../data/types';
import { getSourceAsset, sourceAvailabilityLabel } from '../data/sourceAssets';
import { drtPackage } from '../data/venues';
import { deriveDrtProductionGeometry } from '../geometry/drt';
import { bStagePlacementForVenue, floorBoundsForVenue } from '../venue-twins/adapters';
import type { MeasurementFrame } from './measurements';
import type { VenueBrowserRow, VenueIngestionRecord, VenueType } from './types';

export interface SourcedVenueValue<T> {
  value?: T;
  status: MeasurementStatus;
  label: string;
  note?: string;
}

export interface PlannerVenueGeometry {
  floorWidth: SourcedVenueValue<number>;
  floorLength: SourcedVenueValue<number>;
  stageEnd: SourcedVenueValue<number>;
  stageCenterline: SourcedVenueValue<number>;
  roomCenter: SourcedVenueValue<{ xFt: number; zFt: number }>;
  seatingBowlBounds: SourcedVenueValue<{ widthFt: number; depthFt: number }>;
  floorBoundary: SourcedVenueValue<{ xMinFt: number; xMaxFt: number; zMinFt: number; zMaxFt: number }>;
  lowSteel: SourcedVenueValue<number>;
  highSteel: SourcedVenueValue<number>;
  riggingGridBounds: SourcedVenueValue<{ widthFt: number; depthFt: number }>;
  centerhungObstruction: SourcedVenueValue<{ bottomFt?: number; diameterFt?: number }>;
  vomitories: SourcedVenueValue<Array<{ xFt: number; zFt: number }>>;
  loadingDockOrientation: SourcedVenueValue<string>;
  houseStageDimensions: SourcedVenueValue<{ widthFt?: number; depthFt?: number; minHeightFt?: number; maxHeightFt?: number }>;
  proscenium: SourcedVenueValue<{ widthFt?: number; heightFt?: number }>;
  stageDepth: SourcedVenueValue<number>;
  gridHeight: SourcedVenueValue<number>;
  orchestraPit: SourcedVenueValue<string>;
  balconyOrOverhangLimits: SourcedVenueValue<string>;
  warnings: string[];
}

const missingValue = <T>(label: string, note = 'No filed source value is available.'): SourcedVenueValue<T> => ({
  status: 'MISSING',
  label,
  note,
});

function sourcedNumber(venue: VenueTwin, field: keyof VenueGeometry, label: string): SourcedVenueValue<number> {
  const value = venue.geometry[field];
  const sourced = venue.geometryProvenance[field] as SourcedMeasurement | undefined;
  if (typeof value !== 'number') return missingValue(label);
  return {
    value,
    status: sourced?.status ?? 'MISSING',
    label,
    note: sourced?.note,
  };
}

function combinedStatus(values: Array<SourcedVenueValue<unknown>>): MeasurementStatus {
  if (values.some((value) => value.status === 'CONFLICT')) return 'CONFLICT';
  if (values.some((value) => value.status === 'MISSING')) return 'MISSING';
  if (values.every((value) => value.status === 'VERIFIED')) return 'VERIFIED';
  if (values.some((value) => value.status === 'ESTIMATE')) return 'ESTIMATE';
  return 'REFERENCE';
}

function hasGeometryValue(venue: VenueTwin, field: keyof VenueGeometry): boolean {
  return typeof venue.geometry[field] === 'number';
}

export function inferVenueType(venue: VenueTwin): VenueType {
  const name = `${venue.name} ${venue.sourceFile}`.toLowerCase();
  if (name.includes('amphitheatre') || name.includes('amphitheater') || name.includes('red rocks')) return 'Amphitheatre';
  if (name.includes('performing arts') || name.includes('pac')) return 'Performing Arts Center';
  if (name.includes('theatre') || name.includes('theater')) return 'Theatre';
  if (name.includes('auditorium')) return 'Auditorium';
  if (name.includes('arena') || name.includes('center') || name.includes('coliseum') || name.includes('fieldhouse')) return 'Arena';
  return 'Other';
}

export function buildVenueIngestionRecords(venue: VenueTwin): VenueIngestionRecord[] {
  const primaryAsset = getSourceAsset(venue.sourceFile);
  const records: VenueIngestionRecord[] = [];
  if (primaryAsset) {
    records.push({
      id: primaryAsset.id,
      venueSlug: venue.slug,
      label: primaryAsset.filename,
      category: primaryAsset.sourceType === 'CAD' ? 'CAD_OR_DWG_REFERENCE' : primaryAsset.sourceType === 'RIGGING_PLOT' ? 'RIGGING_PLOT_PDF' : 'VENUE_TECH_PACK_PDF',
      filename: primaryAsset.filename,
      revision: primaryAsset.revision,
      registeredAt: '2026-07-18',
      role: primaryAsset.controllingStatus === 'CONTROLLING' ? 'CONTROLLING' : primaryAsset.availabilityState === 'MISSING' ? 'MISSING' : 'REFERENCE',
      sourceType: primaryAsset.sourceType,
      availabilityState: primaryAsset.availabilityState,
      controllingStatus: primaryAsset.controllingStatus,
      approvalState: primaryAsset.availabilityState === 'MISSING' || primaryAsset.availabilityState === 'REQUESTED' ? 'PENDING_REVIEW' : 'APPROVED',
      mappings: Object.entries(venue.geometryProvenance).map(([field, measurement]) => ({
        field,
        extractedValue: measurement?.value,
        unit: measurement?.unit ?? 'ft',
        status: measurement?.status ?? 'MISSING',
        approvalState: measurement?.status === 'VERIFIED' ? 'APPROVED' : 'PENDING_REVIEW',
        note: measurement?.note ?? 'Awaiting source approval.',
      })),
      conflicts: primaryAsset.knownConflictFlags.map((flag) => ({
        id: `${primaryAsset.id}-${flag.toLowerCase()}`,
        field: flag,
        sourceIds: [primaryAsset.id],
        status: 'OPEN',
        note: flag,
      })),
      notes: primaryAsset.notes,
    });
  }

  records.push({
    id: `${venue.slug}-structured-seed`,
    venueSlug: venue.slug,
    label: `${venue.name} structured venue seed`,
    category: 'STRUCTURED_VENUE_SEED',
    revision: venue.sourceYear,
    registeredAt: '2026-07-18',
    role: venue.sourceStatus === 'CONFLICT' ? 'UNRESOLVED' : venue.sourceStatus === 'MISSING' ? 'MISSING' : 'REFERENCE',
    approvalState: venue.sourceStatus === 'READY' || venue.sourceStatus === 'STALE' ? 'PENDING_REVIEW' : 'PENDING_REVIEW',
    mappings: Object.entries(venue.geometryProvenance).map(([field, measurement]) => ({
      field,
      extractedValue: measurement?.value,
      unit: measurement?.unit ?? 'ft',
      status: measurement?.status ?? 'MISSING',
      approvalState: measurement?.status === 'VERIFIED' ? 'APPROVED' : 'PENDING_REVIEW',
      note: measurement?.note ?? 'Structured seed keeps missing values explicit.',
    })),
    conflicts: venue.sourceStatus === 'CONFLICT'
      ? [{ id: `${venue.slug}-source-conflict`, field: 'sourceStatus', sourceIds: [venue.sourceFile], status: 'OPEN', note: venue.keyStrength }]
      : [],
    notes: 'Existing structured venue seed. It can render only sourced or explicitly estimated values.',
  });

  return records;
}

export function adaptVenueGeometry(venue: VenueTwin): PlannerVenueGeometry {
  const floorWidth = sourcedNumber(venue, 'floorWidthFt', 'Floor width');
  const floorLength = sourcedNumber(venue, 'floorLengthFt', 'Floor length');
  const floorStatus = combinedStatus([floorWidth, floorLength]);
  const warnings = [...venue.missingInputs];
  const sourceAsset = getSourceAsset(venue.sourceFile);

  if (venue.sourceStatus === 'CONFLICT') warnings.push('Venue has unresolved source conflicts.');
  if (sourceAsset?.knownConflictFlags.length) warnings.push(...sourceAsset.knownConflictFlags);
  if (sourceAsset?.availabilityState === 'MISSING' || sourceAsset?.availabilityState === 'REQUESTED') warnings.push(`${sourceAvailabilityLabel(sourceAsset.availabilityState)} source cannot verify geometry.`);

  return {
    floorWidth,
    floorLength,
    stageEnd: {
      value: -venue.geometry.floorLengthFt / 2,
      status: floorStatus,
      label: 'Stage-end venue boundary',
      note: 'Derived from sourced floor length and coordinate convention.',
    },
    stageCenterline: { value: 0, status: floorStatus, label: 'Stage centerline', note: 'Centered on room origin for the DRT seed.' },
    roomCenter: { value: { xFt: 0, zFt: 0 }, status: floorStatus, label: 'Room center / center court', note: 'Origin for planner coordinates.' },
    seatingBowlBounds: {
      value: { widthFt: venue.geometry.floorWidthFt, depthFt: venue.geometry.floorLengthFt },
      status: floorStatus,
      label: 'Seating bowl planning bounds',
      note: 'Planner envelope only until native seating or bowl CAD is filed.',
    },
    floorBoundary: {
      value: {
        xMinFt: -venue.geometry.floorWidthFt / 2,
        xMaxFt: venue.geometry.floorWidthFt / 2,
        zMinFt: -venue.geometry.floorLengthFt / 2,
        zMaxFt: venue.geometry.floorLengthFt / 2,
      },
      status: floorStatus,
      label: 'Floor boundary',
      note: 'Computed from sourced floor width and length.',
    },
    lowSteel: sourcedNumber(venue, 'lowSteelFt', 'Low steel'),
    highSteel: sourcedNumber(venue, 'highSteelFt', 'High steel'),
    riggingGridBounds: hasGeometryValue(venue, 'gridWidthFt') || hasGeometryValue(venue, 'gridDepthFt')
      ? {
        value: { widthFt: venue.geometry.gridWidthFt ?? venue.geometry.floorWidthFt, depthFt: venue.geometry.gridDepthFt ?? venue.geometry.floorLengthFt },
        status: combinedStatus([sourcedNumber(venue, 'gridWidthFt', 'Rigging grid width'), sourcedNumber(venue, 'gridDepthFt', 'Rigging grid depth')]),
        label: 'Rigging grid bounds',
        note: 'Missing axis falls back to floor envelope for visualization and remains source-labeled.',
      }
      : missingValue('Rigging grid bounds'),
    centerhungObstruction: hasGeometryValue(venue, 'centerhungBottomFt') || hasGeometryValue(venue, 'centerhungDiameterFt')
      ? {
        value: { bottomFt: venue.geometry.centerhungBottomFt, diameterFt: venue.geometry.centerhungDiameterFt },
        status: combinedStatus([sourcedNumber(venue, 'centerhungBottomFt', 'Centerhung bottom'), sourcedNumber(venue, 'centerhungDiameterFt', 'Centerhung diameter')]),
        label: 'Scoreboard / center-hung obstruction',
      }
      : missingValue('Scoreboard / center-hung obstruction'),
    vomitories: missingValue('Vomitories / major access points'),
    loadingDockOrientation: venue.zones.some((zone) => zone.kind === 'dock')
      ? { value: 'Filed dock zones', status: 'REFERENCE', label: 'Loading dock orientation', note: 'Represented by sourced loading zones.' }
      : missingValue('Loading dock orientation'),
    houseStageDimensions: hasGeometryValue(venue, 'houseStageWidthFt') || hasGeometryValue(venue, 'houseStageDepthFt')
      ? {
        value: {
          widthFt: venue.geometry.houseStageWidthFt,
          depthFt: venue.geometry.houseStageDepthFt,
          minHeightFt: venue.geometry.houseStageMinHeightFt,
          maxHeightFt: venue.geometry.houseStageMaxHeightFt,
        },
        status: combinedStatus([
          sourcedNumber(venue, 'houseStageWidthFt', 'House stage width'),
          sourcedNumber(venue, 'houseStageDepthFt', 'House stage depth'),
        ]),
        label: 'House stage dimensions',
      }
      : missingValue('House stage dimensions'),
    proscenium: hasGeometryValue(venue, 'stageEndOpeningWidthFt') || hasGeometryValue(venue, 'stageEndOpeningHeightFt')
      ? {
        value: { widthFt: venue.geometry.stageEndOpeningWidthFt, heightFt: venue.geometry.stageEndOpeningHeightFt },
        status: combinedStatus([
          sourcedNumber(venue, 'stageEndOpeningWidthFt', 'Proscenium / stage-end width'),
          sourcedNumber(venue, 'stageEndOpeningHeightFt', 'Proscenium / stage-end height'),
        ]),
        label: 'Proscenium / stage-end opening',
      }
      : missingValue('Proscenium / stage-end opening'),
    stageDepth: sourcedNumber(venue, 'houseStageDepthFt', 'Stage depth'),
    gridHeight: sourcedNumber(venue, 'lowSteelFt', 'Grid height / low steel'),
    orchestraPit: missingValue('Orchestra pit'),
    balconyOrOverhangLimits: missingValue('Balcony / overhang limits'),
    warnings,
  };
}

export function measurementFrameForVenue(venue: VenueTwin): MeasurementFrame {
  const drtGeometry = deriveDrtProductionGeometry(drtPackage);
  const bounds = floorBoundsForVenue(venue);
  return {
    floorWidthFt: bounds.widthFt,
    floorLengthFt: bounds.lengthFt,
    roomCenter: { xFt: 0, yFt: 0, zFt: 0 },
    venueCenterlineXFt: 0,
    stageCenterlineXFt: 0,
    upstageEdgeZFt: drtGeometry.upstageEdgeZFt,
    downstageEdgeZFt: drtGeometry.stageCenterZFt + drtPackage.deckDepthFt / 2,
  };
}

export function bStageCenterPlacementStatus(venue: VenueTwin): { status: MeasurementStatus; note: string } {
  const generatedPlacement = bStagePlacementForVenue(venue);
  if (generatedPlacement.status !== 'MISSING') return { status: generatedPlacement.status, note: generatedPlacement.note };
  const floorWidth = venue.geometryProvenance.floorWidthFt?.status;
  const floorLength = venue.geometryProvenance.floorLengthFt?.status;
  if (floorWidth === 'CONFLICT' || floorLength === 'CONFLICT' || venue.sourceStatus === 'CONFLICT') {
    return { status: 'CONFLICT', note: 'Venue center placement is unresolved while source conflicts remain open.' };
  }
  if (floorWidth === 'MISSING' || floorLength === 'MISSING') return { status: 'MISSING', note: 'Venue center is missing a filed floor dimension.' };
  if (floorWidth === 'ESTIMATE' || floorLength === 'ESTIMATE' || venue.sourceStatus === 'MISSING') {
    return { status: 'ESTIMATE', note: 'B stage is centered on the planning origin because verified center-court geometry is not filed.' };
  }
  if (floorWidth === 'VERIFIED' && floorLength === 'VERIFIED') return { status: 'VERIFIED', note: 'B stage is centered on verified venue center geometry.' };
  return { status: 'REFERENCE', note: 'B stage is centered on source-backed reference venue center geometry.' };
}

export function venueBrowserRows(venues: VenueTwin[]): VenueBrowserRow[] {
  return venues.map((venue) => {
    const sourceAsset = getSourceAsset(venue.sourceFile);
    const geometry = adaptVenueGeometry(venue);
    const hasRigging = geometry.lowSteel.status !== 'MISSING' || geometry.highSteel.status !== 'MISSING' || geometry.riggingGridBounds.status !== 'MISSING';
    const warnings = [
      ...geometry.warnings,
      ...Object.entries(venue.geometryProvenance)
        .filter(([, measurement]) => measurement?.status === 'MISSING' || measurement?.status === 'CONFLICT')
        .map(([field, measurement]) => `${field}: ${measurement?.status}`),
    ];
    return {
      slug: venue.slug,
      name: venue.name,
      city: venue.city,
      state: venue.state,
      venueType: inferVenueType(venue),
      sourceReadiness: `${venue.sourceStatus} / ${sourceAvailabilityLabel(sourceAsset?.availabilityState)}`,
      modelReadiness: venue.detailed ? venue.fidelity : 'L0 seed estimate',
      floorDimensions: `${venue.geometry.floorWidthFt} ft x ${venue.geometry.floorLengthFt} ft / ${combinedStatus([geometry.floorWidth, geometry.floorLength])}`,
      riggingGrid: hasRigging ? `${geometry.lowSteel.value ?? geometry.highSteel.value ?? 'TBD'} ft steel/grid / ${geometry.riggingGridBounds.status}` : 'Missing rigging grid',
      warnings: Array.from(new Set(warnings)).filter(Boolean),
      canOpen: true,
      venue,
    };
  });
}
