import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { allVenueSourceReviews, approvedFactByField, buildVenueNativeGeometry, type VenueMeasurementFact, type VenueSourceReviewRecord } from '../data/venueSourceReviews';
import { tourSourceSnapshot } from '../data/tourSources';
import { venues } from '../data/venues';
import { emptyResult, type ValidationResult } from './issues';

const expectedReviewSourceIds = new Set(tourSourceSnapshot.sources.map((source) => source.sourceId));
const expectedVenueSlugs = new Set(tourSourceSnapshot.sources.map((source) => source.venueSlug));
const allowedReadiness = new Set(['READY', 'PARTIAL', 'BLOCKED']);
const allowedFactStates = new Set(['APPROVED', 'CONFLICT', 'EXTRACTED', 'NOT_APPLICABLE', 'REJECTED']);
const allowedStatuses = new Set(['VERIFIED', 'REFERENCE', 'ESTIMATE', 'MISSING', 'CONFLICT']);
const staleRevisionPattern = /2017|2023|undated/i;

function addError(result: ValidationResult, path: string, message: string) {
  result.errors.push({ path, message });
}

function addWarning(result: ValidationResult, path: string, message: string) {
  result.warnings.push({ path, message });
}

function currentEnoughForVerified(review: VenueSourceReviewRecord): boolean {
  return /2024|2025|2026/.test(review.sourceRevision) && !staleRevisionPattern.test(review.sourceRevision);
}

function factHasOpenConflict(review: VenueSourceReviewRecord, fact: VenueMeasurementFact): boolean {
  return review.conflicts.some((conflict) => conflict.status === 'OPEN' && conflict.candidateFactIds.includes(fact.id));
}

function validateFact(result: ValidationResult, review: VenueSourceReviewRecord, fact: VenueMeasurementFact) {
  const factPath = `reviews.${review.venueSlug}.facts.${fact.id}`;
  if (!allowedFactStates.has(fact.reviewState)) addError(result, `${factPath}.reviewState`, `invalid review state "${fact.reviewState}"`);
  if (!allowedStatuses.has(fact.measurementStatus)) addError(result, `${factPath}.measurementStatus`, `invalid measurement status "${fact.measurementStatus}"`);
  if (fact.evidence.length === 0) addError(result, `${factPath}.evidence`, 'fact must keep at least one source evidence citation');

  for (const evidence of fact.evidence) {
    if (!review.sourceIdsReviewed.includes(evidence.sourceId)) addError(result, `${factPath}.evidence.sourceId`, `unknown source id "${evidence.sourceId}"`);
    if (!Number.isInteger(evidence.page) || evidence.page < 1 || evidence.page > review.pageCount) {
      addError(result, `${factPath}.evidence.page`, `page ${evidence.page} is outside 1-${review.pageCount}`);
    }
    if (evidence.excerpt.trim().length < 8) addError(result, `${factPath}.evidence.excerpt`, 'evidence excerpt is too short to audit');
  }

  if (fact.reviewState === 'APPROVED' && fact.measurementStatus === 'MISSING') {
    addError(result, `${factPath}.measurementStatus`, 'approved facts cannot be missing measurements');
  }
  if (fact.reviewState === 'CONFLICT' && fact.measurementStatus !== 'CONFLICT') {
    addError(result, `${factPath}.measurementStatus`, 'conflicted facts must keep CONFLICT measurement status');
  }
  if (fact.measurementStatus === 'VERIFIED') {
    if (fact.reviewState !== 'APPROVED') addError(result, `${factPath}.measurementStatus`, 'VERIFIED requires APPROVED review state');
    if (factHasOpenConflict(review, fact)) addError(result, `${factPath}.measurementStatus`, 'VERIFIED cannot be used on open-conflict facts');
    if (!currentEnoughForVerified(review)) addError(result, `${factPath}.measurementStatus`, 'VERIFIED requires a current enough source revision');
  }
}

export function validateVenueSourceReviews(root = process.cwd()): ValidationResult {
  const result = emptyResult();
  const slugs = new Set<string>();
  const reviewedSourceIds = new Set<string>();
  const reviewsDir = join(root, 'source-assets', 'reviews');

  if (!existsSync(reviewsDir)) addError(result, 'source-assets/reviews', 'review directory is missing');
  const reviewFiles = existsSync(reviewsDir) ? readdirSync(reviewsDir).filter((filename) => filename.endsWith('.review.json')) : [];
  if (reviewFiles.length !== 11) addError(result, 'source-assets/reviews', 'exactly 11 venue review JSON files are required');
  if (allVenueSourceReviews.length !== 11) addError(result, 'reviews', 'exactly 11 imported venue reviews are required');

  for (const review of allVenueSourceReviews) {
    const reviewPath = `reviews.${review.venueSlug}`;
    if (review.schemaVersion !== 1) addError(result, `${reviewPath}.schemaVersion`, 'schemaVersion must be 1');
    if (slugs.has(review.venueSlug)) addError(result, `${reviewPath}.venueSlug`, `duplicate venue slug "${review.venueSlug}"`);
    slugs.add(review.venueSlug);
    if (!expectedVenueSlugs.has(review.venueSlug)) addError(result, `${reviewPath}.venueSlug`, 'review venue slug is not in the registered source snapshot');
    if (!allowedReadiness.has(review.modelReadiness)) addError(result, `${reviewPath}.modelReadiness`, `invalid model readiness "${review.modelReadiness}"`);
    if (!Number.isInteger(review.pageCount) || review.pageCount < 1) addError(result, `${reviewPath}.pageCount`, 'pageCount must be a positive integer');
    if (review.sourceIdsReviewed.length !== 1) addWarning(result, `${reviewPath}.sourceIdsReviewed`, 'expected one controlling registered PDF for this review');

    for (const sourceId of review.sourceIdsReviewed) {
      reviewedSourceIds.add(sourceId);
      if (!expectedReviewSourceIds.has(sourceId)) addError(result, `${reviewPath}.sourceIdsReviewed`, `source id "${sourceId}" is not registered`);
    }

    const factIds = new Set<string>();
    for (const fact of review.extractedFacts) {
      if (factIds.has(fact.id)) addError(result, `${reviewPath}.facts`, `duplicate fact id "${fact.id}"`);
      factIds.add(fact.id);
      validateFact(result, review, fact);
    }

    for (const factId of review.approvedFactIds) {
      const fact = review.extractedFacts.find((candidate) => candidate.id === factId);
      if (!fact) {
        addError(result, `${reviewPath}.approvedFactIds`, `approved fact "${factId}" is missing`);
      } else if (fact.reviewState !== 'APPROVED') {
        addError(result, `${reviewPath}.approvedFactIds`, `approved fact "${factId}" has state ${fact.reviewState}`);
      }
    }

    for (const factId of review.rejectedInterpretations) {
      const fact = review.extractedFacts.find((candidate) => candidate.id === factId);
      if (!fact) addError(result, `${reviewPath}.rejectedInterpretations`, `rejected fact "${factId}" is missing`);
      if (fact?.reviewState !== 'REJECTED') addError(result, `${reviewPath}.rejectedInterpretations`, `rejected fact "${factId}" has state ${fact?.reviewState}`);
      if (review.approvedFactIds.includes(factId)) addError(result, `${reviewPath}.rejectedInterpretations`, `rejected fact "${factId}" cannot also be approved`);
    }

    for (const conflict of review.conflicts) {
      for (const factId of conflict.candidateFactIds) {
        const fact = review.extractedFacts.find((candidate) => candidate.id === factId);
        if (!fact) addError(result, `${reviewPath}.conflicts.${conflict.id}`, `conflict candidate "${factId}" is missing`);
        if (review.approvedFactIds.includes(factId)) addError(result, `${reviewPath}.conflicts.${conflict.id}`, `conflict candidate "${factId}" cannot be approved`);
      }
    }

    const nativeGeometry = buildVenueNativeGeometry(review);
    if (review.modelReadiness === 'READY') {
      const hasFloor = Boolean(nativeGeometry.geometry.floorWidthFt && nativeGeometry.geometry.floorLengthFt);
      const hasOverhead = Boolean(nativeGeometry.geometry.lowSteelFt || nativeGeometry.geometry.centerhungBottomFt || approvedFactByField(review, 'centerhungRetraction'));
      if (!hasFloor) addError(result, `${reviewPath}.modelReadiness`, 'READY requires approved floor width and length');
      if (!hasOverhead) addError(result, `${reviewPath}.modelReadiness`, 'READY requires approved overhead or low-steel data');
      if (review.conflicts.some((conflict) => conflict.status === 'OPEN')) addError(result, `${reviewPath}.modelReadiness`, 'READY cannot have open conflicts');
    }
    if (review.missingRequiredGeometry.some((field) => field.toLowerCase().includes('floor')) && review.modelReadiness === 'READY') {
      addError(result, `${reviewPath}.missingRequiredGeometry`, 'READY reviews cannot mark floor geometry as missing');
    }
  }

  for (const expectedSourceId of expectedReviewSourceIds) {
    if (!reviewedSourceIds.has(expectedSourceId)) addError(result, 'reviews.sourceIdsReviewed', `registered source "${expectedSourceId}" has no review`);
  }

  for (const venue of venues) {
    if (!venue.approvedReviewFactIds) continue;
    const review = allVenueSourceReviews.find((candidate) => candidate.venueSlug === venue.slug);
    if (!review) {
      addError(result, `venues.${venue.slug}.approvedReviewFactIds`, 'venue links review facts but has no source review record');
      continue;
    }
    for (const [field, factId] of Object.entries(venue.approvedReviewFactIds)) {
      if (!factId) continue;
      const fact = review.extractedFacts.find((candidate) => candidate.id === factId);
      if (!fact) {
        addError(result, `venues.${venue.slug}.approvedReviewFactIds.${field}`, `linked fact "${factId}" is missing`);
      } else if (!review.approvedFactIds.includes(factId) || fact.reviewState !== 'APPROVED') {
        addError(result, `venues.${venue.slug}.approvedReviewFactIds.${field}`, `linked fact "${factId}" is not approved`);
      }
    }
  }

  return result;
}
