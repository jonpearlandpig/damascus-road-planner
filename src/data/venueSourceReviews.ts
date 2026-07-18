import bokCenter from '../../source-assets/reviews/bok-center.review.json';
import desertDiamondArena from '../../source-assets/reviews/desert-diamond-arena.review.json';
import dickiesArena from '../../source-assets/reviews/dickies-arena.review.json';
import gainbridgeFieldhouse from '../../source-assets/reviews/gainbridge-fieldhouse.review.json';
import giantCenter from '../../source-assets/reviews/giant-center.review.json';
import hebCenter from '../../source-assets/reviews/heb-center.review.json';
import redRocks from '../../source-assets/reviews/red-rocks.review.json';
import spectrumCenter from '../../source-assets/reviews/spectrum-center.review.json';
import tMobileCenter from '../../source-assets/reviews/t-mobile-center.review.json';
import targetCenter from '../../source-assets/reviews/target-center.review.json';
import vanAndelArena from '../../source-assets/reviews/van-andel-arena.review.json';
import type { MeasurementConfidence, MeasurementStatus, MeasurementUnit, VenueGeometry } from './types';

export type VenueSourceReviewState = 'APPROVED' | 'CONFLICT' | 'EXTRACTED' | 'NOT_APPLICABLE' | 'REJECTED';
export type VenueSourceReviewReadiness = 'READY' | 'PARTIAL' | 'BLOCKED';
export type DocumentSectionState = 'FOUND' | 'MISSING' | 'NOT_APPLICABLE';
export type EvidenceExtractionMethod = 'TEXT' | 'OCR' | 'DIAGRAM' | 'TABLE' | 'MANUAL';
export type VenueFactCategory = 'floor' | 'loading' | 'overheadObstruction' | 'roofRigging' | 'safety' | 'stage' | 'venueIdentity';
export type VenueFactUnit = MeasurementUnit | 'text';
export type VenueFactNormalizedValue = number | null;

export interface VenueFactEvidence {
  sourceId: string;
  page: number;
  section: string;
  excerpt: string;
  extractionMethod: EvidenceExtractionMethod;
}

export interface VenueMeasurementFact {
  id: string;
  field: string;
  label: string;
  category: VenueFactCategory;
  originalValue: string;
  originalUnit: VenueFactUnit;
  normalizedValue: VenueFactNormalizedValue;
  normalizedUnit: VenueFactUnit;
  conversionMethod: string;
  roundingPrecision: string;
  reviewState: VenueSourceReviewState;
  measurementStatus: MeasurementStatus;
  confidence: MeasurementConfidence;
  evidence: VenueFactEvidence[];
  supersedes?: string[];
  rejectedReason?: string;
}

export interface VenueSourceConflict {
  id: string;
  field: string;
  summary: string;
  candidateFactIds: string[];
  status: 'OPEN' | 'RESOLVED';
  resolutionAction: string;
}

export interface VenueSourceDocumentSections {
  coverTitlePage: DocumentSectionState;
  revisionOrIssueDate: DocumentSectionState;
  tableOfContents: DocumentSectionState;
  floorPlans: DocumentSectionState;
  riggingInformation: DocumentSectionState;
  roofOrSteelDiagrams: DocumentSectionState;
  seatingConfigurations: DocumentSectionState;
  loadingInformation: DocumentSectionState;
  stageOrEndStageInformation: DocumentSectionState;
  productionRestrictions: DocumentSectionState;
}

export interface VenueSourceReviewRecord {
  schemaVersion: 1;
  venueSlug: string;
  sourceIdsReviewed: string[];
  reviewDate: string;
  sourceRevision: string;
  pageCount: number;
  pageCountSource: string;
  documentSections: VenueSourceDocumentSections;
  extractedFacts: VenueMeasurementFact[];
  approvedFactIds: string[];
  conflicts: VenueSourceConflict[];
  rejectedInterpretations: string[];
  missingRequiredGeometry: string[];
  modelReadiness: VenueSourceReviewReadiness;
  reviewerNotes: string[];
  validationStatus: 'PASS' | 'FAIL';
}

export interface VenueNativeGeometry {
  venueSlug: string;
  readiness: VenueSourceReviewReadiness;
  sourceFactIds: Partial<Record<keyof VenueGeometry | string, string>>;
  geometry: Partial<VenueGeometry>;
  missingRequiredGeometry: string[];
  conflicts: VenueSourceConflict[];
}

export interface VenueSourceReviewRow {
  venueSlug: string;
  sourceIds: string[];
  sourceRevision: string;
  pageCount: number;
  pageCountSource: string;
  approvedFacts: number;
  rejectedFacts: number;
  conflicts: number;
  missingRequiredGeometry: string[];
  modelReadiness: VenueSourceReviewReadiness;
  strongestApprovedFields: string[];
}

const rawVenueReviews = [
  bokCenter,
  gainbridgeFieldhouse,
  vanAndelArena,
  giantCenter,
  spectrumCenter,
  targetCenter,
  tMobileCenter,
  desertDiamondArena,
  redRocks,
  hebCenter,
  dickiesArena,
] as VenueSourceReviewRecord[];

export const allVenueSourceReviews = rawVenueReviews;

export const venueSourceReviewMap = Object.fromEntries(allVenueSourceReviews.map((review) => [review.venueSlug, review])) as Record<string, VenueSourceReviewRecord>;

export function sourceReviewForVenue(venueSlug: string): VenueSourceReviewRecord | undefined {
  return venueSourceReviewMap[venueSlug];
}

export function approvedFactsForVenue(venueSlug: string): VenueMeasurementFact[] {
  const review = sourceReviewForVenue(venueSlug);
  if (!review) return [];
  const approvedIds = new Set(review.approvedFactIds);
  return review.extractedFacts.filter((fact) => approvedIds.has(fact.id));
}

export function approvedFactByField(review: VenueSourceReviewRecord, field: string): VenueMeasurementFact | undefined {
  const approvedIds = new Set(review.approvedFactIds);
  return review.extractedFacts.find((fact) => fact.field === field && approvedIds.has(fact.id) && fact.reviewState === 'APPROVED');
}

export function approvedNumericValue(review: VenueSourceReviewRecord, field: string): number | undefined {
  const fact = approvedFactByField(review, field);
  return typeof fact?.normalizedValue === 'number' ? fact.normalizedValue : undefined;
}

function assignNumericGeometryField(geometry: Partial<VenueGeometry>, factIds: Partial<Record<keyof VenueGeometry | string, string>>, review: VenueSourceReviewRecord, field: keyof VenueGeometry) {
  const fact = approvedFactByField(review, field);
  if (typeof fact?.normalizedValue !== 'number') return;
  geometry[field] = fact.normalizedValue;
  factIds[field] = fact.id;
}

export function buildVenueNativeGeometry(review: VenueSourceReviewRecord): VenueNativeGeometry {
  const geometry: Partial<VenueGeometry> = {};
  const sourceFactIds: Partial<Record<keyof VenueGeometry | string, string>> = {};
  const fields: Array<keyof VenueGeometry> = [
    'floorWidthFt',
    'floorLengthFt',
    'lowSteelFt',
    'highSteelFt',
    'gridWidthFt',
    'gridDepthFt',
    'centerhungBottomFt',
    'centerhungDiameterFt',
    'dockCount',
    'pushDistanceFt',
    'stageEndOpeningWidthFt',
    'stageEndOpeningHeightFt',
    'endStageRiggingLb',
    'centerStageRiggingLb',
    'totalGridRiggingLb',
    'houseStageWidthFt',
    'houseStageDepthFt',
    'houseStageMinHeightFt',
    'houseStageMaxHeightFt',
    'egressClearanceFt',
  ];
  for (const field of fields) assignNumericGeometryField(geometry, sourceFactIds, review, field);

  return {
    venueSlug: review.venueSlug,
    readiness: review.modelReadiness,
    sourceFactIds,
    geometry,
    missingRequiredGeometry: review.missingRequiredGeometry,
    conflicts: review.conflicts,
  };
}

export function buildVenueSourceReviewRows(): VenueSourceReviewRow[] {
  return allVenueSourceReviews.map((review) => ({
    venueSlug: review.venueSlug,
    sourceIds: review.sourceIdsReviewed,
    sourceRevision: review.sourceRevision,
    pageCount: review.pageCount,
    pageCountSource: review.pageCountSource,
    approvedFacts: review.approvedFactIds.length,
    rejectedFacts: review.rejectedInterpretations.length,
    conflicts: review.conflicts.filter((conflict) => conflict.status === 'OPEN').length,
    missingRequiredGeometry: review.missingRequiredGeometry,
    modelReadiness: review.modelReadiness,
    strongestApprovedFields: review.approvedFactIds
      .map((factId) => review.extractedFacts.find((fact) => fact.id === factId)?.field)
      .filter((field): field is string => Boolean(field))
      .slice(0, 6),
  }));
}

export function venueSourceReviewSummary() {
  const rows = buildVenueSourceReviewRows();
  return {
    venueReviews: rows.length,
    ready: rows.filter((row) => row.modelReadiness === 'READY').length,
    partial: rows.filter((row) => row.modelReadiness === 'PARTIAL').length,
    blocked: rows.filter((row) => row.modelReadiness === 'BLOCKED').length,
    approvedFacts: rows.reduce((total, row) => total + row.approvedFacts, 0),
    rejectedFacts: rows.reduce((total, row) => total + row.rejectedFacts, 0),
    openConflicts: rows.reduce((total, row) => total + row.conflicts, 0),
    pageCount: rows.reduce((total, row) => total + row.pageCount, 0),
  };
}

