import { describe, expect, it } from 'vitest';
import { buildAllDrtFitChecks } from '../data/drtFitChecks';
import {
  allVenueSourceReviews,
  approvedFactByField,
  buildVenueNativeGeometry,
  sourceReviewForVenue,
  type VenueSourceReviewRecord,
} from '../data/venueSourceReviews';
import { venueMap } from '../data/venues';
import { validateVenueSourceReviews } from './venueSourceReviews';

function cloneReview(review: VenueSourceReviewRecord): VenueSourceReviewRecord {
  return JSON.parse(JSON.stringify(review)) as VenueSourceReviewRecord;
}

describe('venue source review validation', () => {
  it('accepts the checked-in venue source review records', () => {
    const result = validateVenueSourceReviews();

    expect(result.errors).toEqual([]);
  });

  it('tracks exactly the 11 registered venue PDFs', () => {
    expect(allVenueSourceReviews).toHaveLength(11);
    expect(allVenueSourceReviews.map((review) => review.sourceIdsReviewed)).toEqual(expect.arrayContaining([
      ['bok-center-production-manual-undated'],
      ['gainbridge-fieldhouse-tech-pack-2026'],
      ['van-andel-arena-source-2026'],
      ['giant-center-source-pack'],
      ['spectrum-center-production-guide-2025'],
      ['target-center-source-pack'],
      ['t-mobile-center-source-pack'],
      ['desert-diamond-arena-tech-pack-2023'],
      ['red-rocks-amphitheatre-guide-2017'],
      ['heb-center-technical-manual-2024'],
      ['dickies-arena-tech-pack-2026'],
    ]));
  });

  it('requires page-level evidence to stay within each PDF page count', () => {
    for (const review of allVenueSourceReviews) {
      expect(review.pageCount).toBeGreaterThan(0);
      for (const fact of review.extractedFacts) {
        expect(fact.evidence.length).toBeGreaterThan(0);
        for (const evidence of fact.evidence) {
          expect(evidence.page).toBeGreaterThanOrEqual(1);
          expect(evidence.page).toBeLessThanOrEqual(review.pageCount);
          expect(review.sourceIdsReviewed).toContain(evidence.sourceId);
        }
      }
    }
  });

  it('keeps rejected seed dimensions out of approved venue-native geometry', () => {
    const blockedSlugs = ['bok-center', 'gainbridge-fieldhouse', 'target-center', 'desert-diamond-arena', 'dickies-arena'];

    for (const slug of blockedSlugs) {
      const review = sourceReviewForVenue(slug);
      if (!review) throw new Error(`expected review ${slug}`);
      expect(review.rejectedInterpretations.some((factId) => factId.includes('floor-envelope'))).toBe(true);
      expect(buildVenueNativeGeometry(review).geometry.floorWidthFt).not.toBeDefined();
      expect(review.modelReadiness).toBe('BLOCKED');
    }
  });

  it('preserves Van Andel low-steel conflict while allowing distinct grid references', () => {
    const review = sourceReviewForVenue('van-andel-arena');
    if (!review) throw new Error('expected Van Andel review');

    expect(review.modelReadiness).toBe('BLOCKED');
    expect(review.conflicts[0]?.candidateFactIds).toEqual([
      'vaa-low-steel-rigging-page-65-67',
      'vaa-low-steel-dimensions-page-63',
    ]);
    expect(approvedFactByField(review, 'lowSteelFt')).toBeUndefined();
    expect(approvedFactByField(review, 'suspendedGridHeightFt')?.normalizedValue).toBe(84.58);
    expect(approvedFactByField(review, 'gridHeightFt')?.normalizedValue).toBe(86);
  });

  it('requires current approved evidence before a fact can be VERIFIED', () => {
    const review = cloneReview(sourceReviewForVenue('red-rocks')!);
    review.extractedFacts[0] = {
      ...review.extractedFacts[0]!,
      measurementStatus: 'VERIFIED',
    };

    const originalReviews = allVenueSourceReviews.splice(0, allVenueSourceReviews.length, review);
    try {
      const result = validateVenueSourceReviews();
      expect(result.errors).toEqual(expect.arrayContaining([
        expect.objectContaining({ path: expect.stringContaining('redrocks-open-air-amphitheatre.measurementStatus') }),
      ]));
    } finally {
      allVenueSourceReviews.splice(0, allVenueSourceReviews.length, ...originalReviews);
    }
  });

  it('blocks DRT fit checks when source-backed floor dimensions are missing or conflicted', () => {
    const checks = buildAllDrtFitChecks();

    expect(checks.find((check) => check.venueSlug === 'spectrum-center')?.status).toBe('PASS_WITH_WARNINGS');
    expect(checks.find((check) => check.venueSlug === 'heb-center')?.status).toBe('PASS_WITH_WARNINGS');
    expect(checks.find((check) => check.venueSlug === 'bok-center')?.blockers).toContain('Approved floor width and length are required.');
    expect(checks.find((check) => check.venueSlug === 'van-andel-arena')?.blockers).toContain('Open source conflict prevents venue-native fit approval.');
    expect(checks.find((check) => check.venueSlug === 'red-rocks')?.blockers).toContain('Venue requires an amphitheatre-native stage boundary instead of arena defaults.');
  });

  it('keeps ready reviews tied to approved source fact IDs', () => {
    for (const slug of ['spectrum-center', 't-mobile-center', 'heb-center']) {
      const review = sourceReviewForVenue(slug);
      if (!review) throw new Error(`expected review ${slug}`);
      const nativeGeometry = buildVenueNativeGeometry(review);

      expect(review.modelReadiness).toBe('READY');
      expect(nativeGeometry.sourceFactIds.floorWidthFt).toBeDefined();
      expect(nativeGeometry.sourceFactIds.floorLengthFt).toBeDefined();
      expect(nativeGeometry.sourceFactIds.lowSteelFt || nativeGeometry.sourceFactIds.centerhungBottomFt || approvedFactByField(review, 'centerhungRetraction')).toBeTruthy();
    }
  });

  it('keeps detailed venue seed review links pointed at approved facts', () => {
    const linkedSeeds = ['bok-center', 'spectrum-center', 'van-andel-arena', 't-mobile-center', 'heb-center', 'desert-diamond-arena', 'dickies-arena'];

    for (const slug of linkedSeeds) {
      const review = sourceReviewForVenue(slug);
      if (!review) throw new Error(`expected review ${slug}`);
      const linkedFactIds = Object.values(venueMap[slug]!.approvedReviewFactIds ?? {});

      expect(linkedFactIds.length).toBeGreaterThan(0);
      for (const factId of linkedFactIds) expect(review.approvedFactIds).toContain(factId);
    }
  });
});
