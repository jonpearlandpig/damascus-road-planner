import { describe, expect, it } from 'vitest';
import { venues } from '../data/venues';
import { validateVenues, type SourceAssetManifest } from './venues';

const manifest: SourceAssetManifest = {
  assets: [
    '2025 Spectrum Center Production Guide.pdf',
    'bok_center_tulsa_ok.pdf',
    'dickies_arena_fort_worth_tx.pdf',
    'van_andel_arena_grand_rapids_mi.pdf',
    'heb_center_cedar_park_tx.pdf',
    't_mobile_center_kansas_city_mo.pdf',
    'desert_diamond_arena_glendale_az.pdf',
    'gainbridge-fieldhouse.pdf',
    'giant-center.pdf',
    'target-center.pdf',
    'red-rocks.pdf',
  ].map((filename) => ({ filename, status: 'external', referencedBy: [], notes: 'test manifest entry' })),
};

describe('venue validation', () => {
  it('accepts the authored venue route data with explicit source-asset warnings', () => {
    const result = validateVenues(venues, { sourceAssetManifest: manifest, existingSourceFiles: new Set() });

    expect(result.errors).toEqual([]);
    expect(result.warnings.map((warning) => warning.path)).toContain('sourceAssets.2025 Spectrum Center Production Guide.pdf');
  });

  it('rejects duplicate slugs with field-specific errors', () => {
    const result = validateVenues([...venues, { ...venues[0] }], { sourceAssetManifest: manifest, existingSourceFiles: new Set() });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: `venues[${venues.length}].slug`, message: expect.stringContaining('duplicate venue slug') }),
    ]));
  });

  it('rejects placeholder geometry that is not marked as an estimate', () => {
    const placeholder = venues.find((venue) => !venue.detailed);
    if (!placeholder) throw new Error('expected at least one placeholder venue');

    const result = validateVenues(venues.map((venue) => venue.slug === placeholder.slug ? {
        ...placeholder,
        geometryProvenance: {
          ...placeholder.geometryProvenance,
          floorWidthFt: { ...placeholder.geometryProvenance.floorWidthFt!, status: 'REFERENCE' },
        },
      } : venue), { sourceAssetManifest: manifest, existingSourceFiles: new Set() });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: expect.stringContaining('.geometry.floorWidthFt.provenance.status'), message: expect.stringContaining('placeholder geometry') }),
    ]));
  });

  it('rejects negative dimensions', () => {
    const result = validateVenues(venues.map((venue) => venue.slug === 'spectrum-center' ? {
      ...venue,
      geometry: { ...venue.geometry, floorWidthFt: -1 },
      geometryProvenance: {
        ...venue.geometryProvenance,
        floorWidthFt: { ...venue.geometryProvenance.floorWidthFt!, value: -1 },
      },
    } : venue), { sourceAssetManifest: manifest, existingSourceFiles: new Set() });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: expect.stringContaining('floorWidthFt'), message: 'dimension cannot be negative' }),
    ]));
  });

  it('rejects referenced source files missing from the manifest', () => {
    const result = validateVenues(venues, { sourceAssetManifest: { assets: [] }, existingSourceFiles: new Set() });

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'sourceAssets.2025 Spectrum Center Production Guide.pdf', message: expect.stringContaining('manifest') }),
    ]));
  });
});
