import { buildDrtFitCheck } from '../data/drtFitChecks';
import type { VenueMeasurementFact, VenueSourceReviewRecord } from '../data/venueSourceReviews';
import { validatePolygon } from './geometryRules';
import type { BoxGeometry, Polygon2D, SourcedGeometryValue, VenueNativeGeometry } from './types';

function approvedFacts(review: VenueSourceReviewRecord): Map<string, VenueMeasurementFact> {
  return new Map(review.extractedFacts.filter((fact) => review.approvedFactIds.includes(fact.id) && fact.reviewState === 'APPROVED').map((fact) => [fact.id, fact]));
}

function conflictedFactIds(review: VenueSourceReviewRecord): Set<string> {
  return new Set(review.conflicts.flatMap((conflict) => conflict.status === 'OPEN' ? conflict.candidateFactIds : []));
}

function sourcedValues(twin: VenueNativeGeometry): SourcedGeometryValue[] {
  return [
    twin.floor?.width,
    twin.floor?.length,
    twin.rigging?.lowSteel,
    twin.rigging?.highSteel,
    twin.rigging?.roofHeight,
    twin.obstructions?.scoreboardLowPoint,
    twin.obstructions?.centerHung?.lowPoint,
    twin.obstructions?.centerHung?.dimensions.widthFt,
    twin.obstructions?.centerHung?.dimensions.depthFt,
    twin.obstructions?.centerHung?.dimensions.heightFt,
  ].filter((value): value is SourcedGeometryValue => Boolean(value));
}

function polygons(twin: VenueNativeGeometry): Polygon2D[] {
  return [
    twin.floor?.boundary,
    twin.rigging?.gridBoundary,
    ...(twin.rigging?.noRigZones ?? []),
    twin.obstructions?.centerHung?.footprint,
    ...(twin.obstructions?.fixedObstructions.map((obstruction) => obstruction.geometry.footprint).filter((polygon): polygon is Polygon2D => Boolean(polygon)) ?? []),
    twin.stageReference?.maximumStageBounds,
  ].filter((polygon): polygon is Polygon2D => Boolean(polygon));
}

function boxes(twin: VenueNativeGeometry): BoxGeometry[] {
  return [
    twin.obstructions?.centerHung,
    ...(twin.obstructions?.fixedObstructions.map((obstruction) => obstruction.geometry) ?? []),
  ].filter((box): box is BoxGeometry => Boolean(box));
}

function geometryParticipatesInFit(twin: VenueNativeGeometry): boolean {
  if (twin.floor?.boundary?.participatesInFitCheck) return true;
  if (twin.rigging?.gridBoundary?.participatesInFitCheck) return true;
  if (twin.obstructions?.centerHung?.participatesInFitCheck) return true;
  if (twin.stageReference?.stageCenterline?.participatesInFitCheck) return true;
  return sourcedValues(twin).some((value) => value.participatesInFitCheck);
}

export function validateVenueNativeTwin(twin: VenueNativeGeometry, review: VenueSourceReviewRecord): string[] {
  const errors: string[] = [];
  const approved = approvedFacts(review);
  const conflicts = conflictedFactIds(review);

  if (twin.schemaVersion !== 1) errors.push(`${twin.venueSlug}: schemaVersion must be 1`);
  if (twin.venueSlug !== review.venueSlug) errors.push(`${twin.venueSlug}: twin slug does not match review slug ${review.venueSlug}`);
  if (twin.readiness !== review.modelReadiness) errors.push(`${twin.venueSlug}: readiness ${twin.readiness} does not match review readiness ${review.modelReadiness}`);

  for (const value of sourcedValues(twin)) {
    const fact = approved.get(value.measurementId);
    if (!fact) errors.push(`${twin.venueSlug}: sourced value ${value.measurementId} is not approved`);
    if (conflicts.has(value.measurementId)) errors.push(`${twin.venueSlug}: conflicted value ${value.measurementId} appears in geometry`);
    for (const evidence of value.evidence) {
      if (evidence.page < 1 || evidence.page > review.pageCount) errors.push(`${twin.venueSlug}: evidence page ${evidence.page} is outside 1-${review.pageCount}`);
      if (evidence.sourceId !== value.sourceId) errors.push(`${twin.venueSlug}: evidence source mismatch for ${value.measurementId}`);
    }
    if (value.status === 'MISSING' && value.value === 0) errors.push(`${twin.venueSlug}: missing value ${value.measurementId} was zero-filled`);
  }

  for (const polygon of polygons(twin)) {
    errors.push(...validatePolygon(polygon).map((error) => `${twin.venueSlug}: ${error}`));
    for (const measurementId of polygon.approvedMeasurementIds) {
      if (!approved.has(measurementId)) errors.push(`${twin.venueSlug}: polygon ${polygon.id} references unapproved measurement ${measurementId}`);
      if (conflicts.has(measurementId)) errors.push(`${twin.venueSlug}: polygon ${polygon.id} references conflicted measurement ${measurementId}`);
    }
  }

  for (const box of boxes(twin)) {
    const hasFootprint = Boolean(box.footprint);
    const hasWidth = Boolean(box.dimensions.widthFt);
    const hasDepth = Boolean(box.dimensions.depthFt);
    if (hasFootprint && (!hasWidth || !hasDepth)) errors.push(`${twin.venueSlug}: ${box.id} has unsupported center-hung footprint axes`);
  }

  if (twin.readiness === 'BLOCKED' && geometryParticipatesInFit(twin)) {
    errors.push(`${twin.venueSlug}: blocked venues cannot contribute controlling fit geometry`);
  }
  if (twin.coordinateSystem.originMethod === 'REFERENCE_ORIGIN_WITH_WARNING' && !twin.coordinateSystem.warning) {
    errors.push(`${twin.venueSlug}: unavailable origin needs a warning`);
  }
  if (twin.coordinateSystem.originMethod === 'DERIVED_FLOOR_CENTER' && !twin.coordinateSystem.warning?.includes('not a verified center-court')) {
    errors.push(`${twin.venueSlug}: derived floor center must not be labeled as verified center court`);
  }
  if (twin.drtFit.status !== buildDrtFitCheck(review).status) {
    errors.push(`${twin.venueSlug}: DRT fit status is out of sync with deterministic fit check`);
  }

  return errors;
}

export function validateVenueNativeTwins(twins: VenueNativeGeometry[], reviews: VenueSourceReviewRecord[]): string[] {
  const errors: string[] = [];
  const twinBySlug = new Map(twins.map((twin) => [twin.venueSlug, twin]));
  for (const review of reviews) {
    const twin = twinBySlug.get(review.venueSlug);
    if (!twin) {
      errors.push(`${review.venueSlug}: missing generated venue twin`);
      continue;
    }
    errors.push(...validateVenueNativeTwin(twin, review));
  }
  for (const twin of twins) {
    if (!reviews.some((review) => review.venueSlug === twin.venueSlug)) errors.push(`${twin.venueSlug}: generated twin has no source review`);
  }
  return errors;
}

