import { tourSourceSnapshot } from '../data/tourSources';
import type { VenueMeasurementFact, VenueSourceReviewRecord } from '../data/venueSourceReviews';
import type { GeometryExactness, SourcedGeometryEvidence, SourcedGeometryValue } from './types';

const sourceById = new Map(tourSourceSnapshot.sources.map((source) => [source.sourceId, source]));

export function isApprovedFact(review: VenueSourceReviewRecord, fact: VenueMeasurementFact | undefined): fact is VenueMeasurementFact {
  return Boolean(fact && fact.reviewState === 'APPROVED' && review.approvedFactIds.includes(fact.id));
}

export function approvedFact(review: VenueSourceReviewRecord, field: string): VenueMeasurementFact | undefined {
  return review.extractedFacts.find((fact) => fact.field === field && isApprovedFact(review, fact));
}

export function approvedFacts(review: VenueSourceReviewRecord, fields: string[]): VenueMeasurementFact[] {
  return fields.map((field) => approvedFact(review, field)).filter((fact): fact is VenueMeasurementFact => Boolean(fact));
}

export function sourceTitle(sourceId: string): string {
  return sourceById.get(sourceId)?.title ?? sourceId;
}

export function sourceDriveUrl(sourceId: string): string {
  return sourceById.get(sourceId)?.driveUrl ?? '';
}

export function evidenceForFact(fact: VenueMeasurementFact): SourcedGeometryEvidence[] {
  return fact.evidence.map((evidence) => ({
    measurementId: fact.id,
    sourceId: evidence.sourceId,
    sourceTitle: sourceTitle(evidence.sourceId),
    driveUrl: sourceDriveUrl(evidence.sourceId),
    page: evidence.page,
    section: evidence.section,
    excerpt: evidence.excerpt,
    reviewState: fact.reviewState,
  }));
}

export function sourcedValueFromFact(
  fact: VenueMeasurementFact,
  exactness: GeometryExactness,
  derivationRule: string,
  participatesInFitCheck: boolean,
): SourcedGeometryValue {
  const firstEvidence = fact.evidence[0];
  return {
    value: fact.normalizedValue ?? fact.originalValue,
    originalValue: fact.originalValue,
    originalUnit: fact.originalUnit,
    normalizedUnit: fact.normalizedUnit,
    measurementId: fact.id,
    sourceId: firstEvidence?.sourceId ?? 'unknown-source',
    evidencePage: firstEvidence?.page ?? 1,
    status: fact.measurementStatus,
    confidence: fact.confidence,
    exactness,
    derivationRule,
    participatesInFitCheck,
    evidence: evidenceForFact(fact),
  };
}

export function numericValue(fact: VenueMeasurementFact | undefined): number | undefined {
  return typeof fact?.normalizedValue === 'number' ? fact.normalizedValue : undefined;
}

