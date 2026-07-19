import { deriveDrtProductionGeometry } from '../geometry/drt';
import { drtPackage } from './helpers';
import {
  allVenueSourceReviews,
  approvedFactByField,
  approvedNumericValue,
  buildVenueNativeGeometry,
  type VenueSourceReviewRecord,
} from './venueSourceReviews';

export type DrtFitStatus = 'PASS' | 'PASS_WITH_WARNINGS' | 'BLOCKED' | 'UNRESOLVED';

export interface DrtFitCheck {
  venueSlug: string;
  status: DrtFitStatus;
  modelReadiness: VenueSourceReviewRecord['modelReadiness'];
  requiredWidthFt: number;
  requiredLengthFt: number;
  floorWidthFt: number | null;
  floorLengthFt: number | null;
  minSideClearanceFt: number | null;
  upstageClearanceFt: number | null;
  downstageClearanceFt: number | null;
  overheadClearanceFt: number | null;
  checkedFactIds: string[];
  warnings: string[];
  blockers: string[];
}

const requiredDrt = deriveDrtProductionGeometry(drtPackage);
const requiredWidthFt = drtPackage.deckWidthFt;
const requiredLengthFt = Math.abs(requiredDrt.upstageEdgeZFt) + drtPackage.bStageDiameterFt / 2;
const requiredTrimFt = drtPackage.deckHeightFt + drtPackage.prowHeightFt;

function fmt(value: number): number {
  return Number(value.toFixed(2));
}

function sourceFactId(review: VenueSourceReviewRecord, field: string): string | undefined {
  return approvedFactByField(review, field)?.id;
}

export function buildDrtFitCheck(review: VenueSourceReviewRecord): DrtFitCheck {
  const nativeGeometry = buildVenueNativeGeometry(review);
  const floorWidthFt = approvedNumericValue(review, 'floorWidthFt') ?? null;
  const floorLengthFt = approvedNumericValue(review, 'floorLengthFt') ?? null;
  const lowSteelFt = approvedNumericValue(review, 'lowSteelFt') ?? null;
  const centerhungBottomFt = approvedNumericValue(review, 'centerhungBottomFt') ?? null;
  const centerhungRetraction = Boolean(approvedFactByField(review, 'centerhungRetraction'));
  const blockers: string[] = [];
  const warnings: string[] = [];
  const checkedFactIds = [
    sourceFactId(review, 'floorWidthFt'),
    sourceFactId(review, 'floorLengthFt'),
    sourceFactId(review, 'lowSteelFt'),
    sourceFactId(review, 'centerhungBottomFt'),
    sourceFactId(review, 'centerhungRetraction'),
  ].filter((id): id is string => Boolean(id));

  if (review.conflicts.some((conflict) => conflict.status === 'OPEN')) {
    blockers.push('Open source conflict prevents venue-native fit approval.');
  }
  if (review.modelReadiness === 'BLOCKED') {
    blockers.push('Venue source review is blocked.');
  }
  if (floorWidthFt === null || floorLengthFt === null) {
    blockers.push('Approved floor width and length are required.');
  }
  if (review.venueSlug === 'red-rocks') {
    blockers.push('Venue requires an amphitheatre-native stage boundary instead of arena defaults.');
  }

  const minSideClearanceFt = floorWidthFt === null ? null : fmt(floorWidthFt / 2 - requiredWidthFt / 2);
  const upstageClearanceFt = floorLengthFt === null ? null : fmt(floorLengthFt / 2 - Math.abs(requiredDrt.upstageEdgeZFt));
  const downstageClearanceFt = floorLengthFt === null ? null : fmt(floorLengthFt / 2 - drtPackage.bStageDiameterFt / 2);
  const overheadReference = lowSteelFt ?? (centerhungRetraction ? null : centerhungBottomFt);
  const overheadClearanceFt = overheadReference === null ? null : fmt(overheadReference - requiredTrimFt);

  if (minSideClearanceFt !== null && minSideClearanceFt < 0) blockers.push('Main deck exceeds approved floor width.');
  if (upstageClearanceFt !== null && upstageClearanceFt < 0) blockers.push('Main deck upstage edge exceeds approved floor length.');
  if (downstageClearanceFt !== null && downstageClearanceFt < 0) blockers.push('B-stage edge exceeds approved floor length.');
  if (overheadClearanceFt !== null && overheadClearanceFt < 0) blockers.push('DRT vertical scenic height exceeds approved overhead reference.');

  if (minSideClearanceFt !== null && minSideClearanceFt >= 0 && minSideClearanceFt < 5) {
    warnings.push(`Only ${minSideClearanceFt} ft remains per side against the approved floor width.`);
  }
  if (!nativeGeometry.sourceFactIds.lowSteelFt && !nativeGeometry.sourceFactIds.centerhungBottomFt && !centerhungRetraction) {
    warnings.push('No approved low-steel, centerhung trim, or retraction clearance fact is available.');
  }
  if (review.missingRequiredGeometry.some((field) => /cad/i.test(field))) {
    warnings.push('Native CAD/rigging files remain requested before final operations.');
  }
  if (review.sourceRevision.includes('2017') || review.sourceRevision.includes('2023') || review.sourceRevision.includes('Undated')) {
    warnings.push('Source is stale or undated; keep final engineering confirmation open.');
  }

  return {
    venueSlug: review.venueSlug,
    status: blockers.length > 0 ? 'BLOCKED' : warnings.length > 0 ? 'PASS_WITH_WARNINGS' : 'PASS',
    modelReadiness: review.modelReadiness,
    requiredWidthFt,
    requiredLengthFt: fmt(requiredLengthFt),
    floorWidthFt,
    floorLengthFt,
    minSideClearanceFt,
    upstageClearanceFt,
    downstageClearanceFt,
    overheadClearanceFt,
    checkedFactIds,
    warnings,
    blockers,
  };
}

export function buildAllDrtFitChecks(): DrtFitCheck[] {
  return allVenueSourceReviews.map((review) => buildDrtFitCheck(review));
}

export function drtFitCheckSummary(checks = buildAllDrtFitChecks()) {
  return {
    venuesChecked: checks.length,
    pass: checks.filter((check) => check.status === 'PASS').length,
    passWithWarnings: checks.filter((check) => check.status === 'PASS_WITH_WARNINGS').length,
    blocked: checks.filter((check) => check.status === 'BLOCKED').length,
    unresolved: checks.filter((check) => check.status === 'UNRESOLVED').length,
  };
}

