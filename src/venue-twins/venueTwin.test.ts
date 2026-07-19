import { describe, expect, it } from 'vitest';
import { venueMap } from '../data/venues';
import { allVenueSourceReviews } from '../data/venueSourceReviews';
import { bStagePlacementForVenue } from './adapters';
import { venueNativeComparisonFields } from './comparisonFields';
import { polygonAreaSqFt, polygonCenter, polygonDimensions, validatePolygon } from './geometryRules';
import { venueNativeTwinForSlug, venueNativeTwins } from './records';
import { validateVenueNativeTwins } from './validation';

describe('venue-native twin generation', () => {
  it('generates one deterministic twin for every reviewed venue', () => {
    expect(venueNativeTwins).toHaveLength(11);
    expect(validateVenueNativeTwins(venueNativeTwins, allVenueSourceReviews)).toEqual([]);
  });

  it('builds source-backed rectangular floor geometry from approved width and length', () => {
    const spectrum = venueNativeTwinForSlug('spectrum-center');
    if (!spectrum?.floor?.boundary) throw new Error('expected Spectrum floor boundary');
    const dimensions = polygonDimensions(spectrum.floor.boundary.points);

    expect(dimensions).toEqual({ widthFt: 85, lengthFt: 200 });
    expect(polygonAreaSqFt(spectrum.floor.boundary.points)).toBe(17000);
    expect(spectrum.floor.boundary.approvedMeasurementIds).toEqual(['spectrum-floor-width-85', 'spectrum-floor-length-200']);
  });

  it('derives floor center without claiming verified center court', () => {
    const heb = venueNativeTwinForSlug('heb-center');
    if (!heb?.floor?.boundary) throw new Error('expected HEB floor boundary');

    expect(polygonCenter(heb.floor.boundary.points)).toEqual({ xFt: 0, zFt: 0 });
    expect(heb.coordinateSystem.originMethod).toBe('DERIVED_FLOOR_CENTER');
    expect(heb.coordinateSystem.warning).toContain('not a verified center-court');
  });

  it('rejects invalid or self-intersecting polygons', () => {
    const errors = validatePolygon({
      id: 'bad-polygon',
      points: [
        { xFt: 0, zFt: 0 },
        { xFt: 10, zFt: 10 },
        { xFt: 0, zFt: 10 },
        { xFt: 10, zFt: 0 },
      ],
      derivationRule: 'test',
      exactness: 'DERIVED',
      renderState: 'DERIVED',
      approvedMeasurementIds: ['test'],
      participatesInFitCheck: false,
    });

    expect(errors).toEqual(expect.arrayContaining([expect.stringContaining('self-intersecting')]));
  });

  it('keeps missing dimensions from becoming fake floor shells', () => {
    const bok = venueNativeTwinForSlug('bok-center');

    expect(bok?.readiness).toBe('BLOCKED');
    expect(bok?.floor).toBeUndefined();
    expect(bok?.diagnostics.renderingStatus).toBe('BLOCKED_NO_SHELL');
  });

  it('excludes conflicted measurements from controlling geometry', () => {
    const vanAndel = venueNativeTwinForSlug('van-andel-arena');

    expect(vanAndel?.diagnostics.conflictCount).toBe(1);
    expect(vanAndel?.rigging?.lowSteel).toBeUndefined();
    expect(vanAndel?.evidence.approvedMeasurementIds).not.toContain('vaa-low-steel-rigging-page-65-67');
    expect(vanAndel?.evidence.approvedMeasurementIds).not.toContain('vaa-low-steel-dimensions-page-63');
    expect(vanAndel?.floor?.boundary?.participatesInFitCheck).toBe(false);
  });

  it('generates supported rigging-grid and height-only states distinctly', () => {
    const vanAndel = venueNativeTwinForSlug('van-andel-arena');
    const spectrum = venueNativeTwinForSlug('spectrum-center');

    expect(vanAndel?.rigging?.gridBoundary?.approvedMeasurementIds).toEqual(['vaa-grid-width-99', 'vaa-grid-depth-52']);
    expect(vanAndel?.rigging?.gridBoundary?.renderState).toBe('REFERENCE_ONLY');
    expect(spectrum?.rigging?.gridBoundary).toBeUndefined();
    expect(spectrum?.rigging?.lowSteel?.measurementId).toBe('spectrum-low-steel-107');
  });

  it('keeps partial center-hung geometry from fabricating unsupported axes', () => {
    const bok = venueNativeTwinForSlug('bok-center');
    const centerHung = bok?.obstructions?.centerHung;

    expect(centerHung?.dimensions.widthFt?.measurementId).toBe('bok-scoreboard-width-46-67');
    expect(centerHung?.dimensions.depthFt?.measurementId).toBe('bok-scoreboard-depth-37');
    expect(centerHung?.dimensions.heightFt).toBeUndefined();
    expect(centerHung?.derivationRule).toContain('missing axes are not fabricated');
  });

  it('keeps readiness and fit-check state synchronized with generated geometry', () => {
    expect(venueNativeTwinForSlug('spectrum-center')?.readiness).toBe('READY');
    expect(venueNativeTwinForSlug('giant-center')?.readiness).toBe('PARTIAL');
    expect(venueNativeTwinForSlug('red-rocks')?.drtFit.status).toBe('BLOCKED');
  });

  it('labels B-stage placement by available source quality', () => {
    const spectrum = venueMap['spectrum-center'];
    const redRocks = venueMap['red-rocks'];
    if (!spectrum) throw new Error('expected Spectrum comparison venue');
    if (!redRocks) throw new Error('expected Red Rocks venue');

    expect(bStagePlacementForVenue(spectrum).note).toContain('derived approved floor center');
    expect(bStagePlacementForVenue(redRocks).status).toBe('MISSING');
  });

  it('preserves evidence links on generated geometry values', () => {
    const spectrum = venueNativeTwinForSlug('spectrum-center');
    const evidence = spectrum?.floor?.width?.evidence[0];

    expect(evidence?.measurementId).toBe('spectrum-floor-width-85');
    expect(evidence?.sourceTitle).toBe('spectrum_center_charlotte_nc.pdf');
    expect(evidence?.page).toBe(16);
  });

  it('keeps venue-native comparison definitions like-for-like', () => {
    expect(venueNativeComparisonFields).toEqual(expect.arrayContaining([
      'lowSteel',
      'highSteel',
      'centerHungLowPoint',
      'gridSize',
    ]));
    expect(venueNativeComparisonFields.indexOf('lowSteel')).toBeLessThan(venueNativeComparisonFields.indexOf('highSteel'));
    expect(venueNativeComparisonFields).not.toContain('genericHeight');
  });
});
