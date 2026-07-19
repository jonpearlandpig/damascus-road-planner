import type { SceneObjectRecord, SourceRef, VenueTwin } from '../data/types';
import { buildAllDrtFitChecks } from '../data/drtFitChecks';
import type { ScenePosition } from '../planner/types';
import type { SourcedGeometryEvidence, SourcedGeometryValue, VenueNativeGeometry } from './types';
import { venueNativeTwinForSlug } from './records';

function sourceRefFromEvidence(evidence: SourcedGeometryEvidence | undefined, fallback: string): SourceRef {
  return {
    file: evidence?.sourceTitle ?? fallback,
    section: evidence?.section ?? 'Generated venue-native twin',
    page: evidence ? String(evidence.page) : undefined,
    revision: 'Venue source review',
    originalValue: evidence?.excerpt ?? fallback,
    confidence: 'CALIBRATED PLANNING',
    authority: 'VENUE ISSUED',
  };
}

function firstEvidence(value?: SourcedGeometryValue): SourcedGeometryEvidence | undefined {
  return value?.evidence[0];
}

export function nativeRecordForElement(twin: VenueNativeGeometry, elementId: string): SceneObjectRecord | undefined {
  if (elementId === 'venue-native-floor' && twin.floor?.boundary) {
    return {
      id: elementId,
      label: 'Venue-native floor boundary',
      category: 'overview',
      dimensions: `${twin.floor.width?.value ?? 'TBD'} ft x ${twin.floor.length?.value ?? 'TBD'} ft`,
      status: twin.floor.renderState,
      notes: twin.floor.boundary.derivationRule,
      source: sourceRefFromEvidence(firstEvidence(twin.floor.width), 'Generated venue-native floor'),
    };
  }
  if (elementId === 'venue-native-rigging' && twin.rigging) {
    return {
      id: elementId,
      label: 'Venue-native rigging reference',
      category: 'rigging',
      value: twin.rigging.lowSteel ? `${twin.rigging.lowSteel.value} ${twin.rigging.lowSteel.normalizedUnit}` : 'No low-steel value',
      status: twin.rigging.renderState,
      notes: twin.rigging.gridBoundary?.derivationRule ?? 'Approved height value without source-backed grid footprint.',
      source: sourceRefFromEvidence(firstEvidence(twin.rigging.lowSteel ?? twin.rigging.highSteel), 'Generated venue-native rigging'),
    };
  }
  if (elementId === 'venue-native-centerhung' && twin.obstructions?.centerHung) {
    return {
      id: elementId,
      label: 'Venue-native center-hung reference',
      category: 'rigging',
      value: twin.obstructions.scoreboardLowPoint ? `${twin.obstructions.scoreboardLowPoint.value} ${twin.obstructions.scoreboardLowPoint.normalizedUnit}` : 'Partial center-hung geometry',
      status: twin.obstructions.centerHung.renderState,
      notes: twin.obstructions.centerHung.derivationRule,
      source: sourceRefFromEvidence(firstEvidence(twin.obstructions.scoreboardLowPoint), 'Generated center-hung geometry'),
    };
  }
  if (elementId === 'venue-native-fit') {
    return {
      id: elementId,
      label: 'DRT planning fit overlay',
      category: 'production',
      status: twin.drtFit.status,
      notes: [...twin.drtFit.blockers, ...twin.drtFit.warnings].join(' '),
      source: sourceRefFromEvidence(undefined, 'Generated DRT fit check'),
    };
  }
  return undefined;
}

export function bStagePlacementForVenue(venue: VenueTwin): { position: ScenePosition; status: 'REFERENCE' | 'MISSING' | 'CONFLICT'; label: string; note: string } {
  const twin = venueNativeTwinForSlug(venue.slug);
  if (!twin) return { position: { xFt: 0, yFt: 0, zFt: 0 }, status: 'MISSING', label: 'No generated venue twin', note: 'B-stage is using planner origin because no generated venue twin exists.' };
  if (twin.diagnostics.conflictCount > 0) {
    return { position: { xFt: twin.coordinateSystem.originPoint.xFt, yFt: 0, zFt: twin.coordinateSystem.originPoint.zFt }, status: 'CONFLICT', label: twin.coordinateSystem.originLabel, note: 'B-stage placement is blocked by an open venue source conflict.' };
  }
  if (twin.coordinateSystem.originMethod === 'DERIVED_FLOOR_CENTER') {
    return {
      position: { xFt: twin.coordinateSystem.originPoint.xFt, yFt: 0, zFt: twin.coordinateSystem.originPoint.zFt },
      status: 'REFERENCE',
      label: 'Derived floor center',
      note: 'B-stage is centered on the derived approved floor center, not a verified center-court point.',
    };
  }
  return { position: { xFt: 0, yFt: 0, zFt: 0 }, status: 'MISSING', label: 'Reference origin only', note: 'B-stage placement has no venue-native center evidence.' };
}

export function floorBoundsForVenue(venue: VenueTwin): { widthFt: number; lengthFt: number; source: 'VENUE_TWIN' | 'SEED_FALLBACK' } {
  const twin = venueNativeTwinForSlug(venue.slug);
  const width = twin?.floor?.width?.value;
  const length = twin?.floor?.length?.value;
  if (twin && typeof width === 'number' && typeof length === 'number' && twin.readiness !== 'BLOCKED') {
    return { widthFt: width, lengthFt: length, source: 'VENUE_TWIN' };
  }
  return { widthFt: venue.geometry.floorWidthFt, lengthFt: venue.geometry.floorLengthFt, source: 'SEED_FALLBACK' };
}

export function fitCheckForTwin(twin: VenueNativeGeometry) {
  return buildAllDrtFitChecks().find((check) => check.venueSlug === twin.venueSlug);
}
