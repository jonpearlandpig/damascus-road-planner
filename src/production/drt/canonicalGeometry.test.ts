import { describe, expect, it } from 'vitest';
import { buildDrtScene } from './buildDrtScene';
import { canonicalDrtDerived, canonicalDrtGeometry, canonicalDrtPackage, DRT_SEED_VERSION } from './canonicalGeometry';
import { buildDrtPlanModel } from './planModel';
import { validateDrtGeometry } from './validateDrtGeometry';

const sceneObjects = buildDrtScene({
  bStagePosition: { xFt: 0, yFt: 0, zFt: 0 },
  bStagePlacementStatus: 'REFERENCE',
  bStageNotes: ['Venue-center reference'],
});

describe('canonical DRT production geometry', () => {
  it('has one valid seed with stable, duplicate-free ids', () => {
    const result = validateDrtGeometry();
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
    expect(canonicalDrtGeometry.seedVersion).toBe(DRT_SEED_VERSION);
    expect(new Set(canonicalDrtGeometry.objects.map((object) => object.id)).size).toBe(canonicalDrtGeometry.objects.length);
  });

  it('detects a duplicate canonical stage definition', () => {
    const duplicate = {
      ...canonicalDrtGeometry,
      objects: [...canonicalDrtGeometry.objects, canonicalDrtGeometry.objects[0]],
    };
    expect(validateDrtGeometry(duplicate).errors).toContain('Duplicate DRT object id: drt-main-stage');
  });

  it('controls the main stage and two-face monolith relationships', () => {
    const stage = canonicalDrtGeometry.objects.find((object) => object.id === 'drt-main-stage');
    const monolith = canonicalDrtGeometry.objects.find((object) => object.id === 'drt-monolith');
    expect(stage?.dimensions).toEqual({ widthFt: 78, depthFt: 42, heightFt: 5.5 });
    expect(stage?.position.yFt).toBe(2.75);
    expect(monolith?.renderParts).toHaveLength(2);
    expect(monolith?.dimensions).toEqual({ widthFt: 50, depthFt: 25, heightFt: 35 + 4 / 12 });
    expect(canonicalDrtDerived.upstageEdgeZFt).toBe(-97);
    expect(canonicalDrtDerived.monolithFaceLengthFt).toBeCloseTo(Math.hypot(25, 25));
  });

  it('keeps thrust dimensions, rotations, and symmetry canonical', () => {
    const center = canonicalDrtGeometry.objects.find((object) => object.id === 'drt-center-thrust');
    const sides = canonicalDrtGeometry.objects.filter((object) => object.definitionId === 'drt-side-thrust');
    expect(center?.dimensions).toMatchObject({ widthFt: 6, depthFt: 42 });
    expect(sides).toHaveLength(2);
    expect(sides[0].position.xFt).toBe(-sides[1].position.xFt);
    expect(sides[0].position.zFt).toBe(sides[1].position.zFt);
    expect(sides[0].rotationYDeg).toBe(-sides[1].rotationYDeg);
    expect(sides[0].dimensions).toMatchObject({ widthFt: 5, depthFt: 32 });
  });

  it('anchors the B stage at venue center and preserves its reference-only tail', () => {
    const bStage = canonicalDrtGeometry.objects.find((object) => object.id === 'drt-b-stage');
    expect(bStage?.anchor).toBe('VENUE_CENTER');
    expect(bStage?.dimensions.widthFt).toBe(26);
    expect(bStage?.renderParts?.find((part) => part.id === 'drt-b-stage-tail')?.status).toBe('REFERENCE');
    expect(sceneObjects.find((object) => object.id === 'drt-b-stage')?.position).toMatchObject({ xFt: 0, zFt: 0 });
  });

  it('includes exactly four locked low-fog references without approving their placement', () => {
    const fog = sceneObjects.filter((object) => object.category === 'Low fog');
    expect(fog).toHaveLength(4);
    expect(fog.every((object) => object.locked)).toBe(true);
    expect(fog.every((object) => object.placementStatus === 'UNRESOLVED')).toBe(true);
  });

  it('excludes unresolved ramps, scrim, projector, FOH, barricade, and hazers from rendered geometry', () => {
    const renderedIds = new Set(canonicalDrtGeometry.objects.map((object) => object.id));
    expect(canonicalDrtGeometry.unresolved).toHaveLength(6);
    expect(canonicalDrtGeometry.unresolved.every((object) => !renderedIds.has(object.id))).toBe(true);
  });

  it('builds deterministic plan dimensions from the same canonical objects', () => {
    const plan = buildDrtPlanModel(sceneObjects);
    expect(plan.seedVersion).toBe(DRT_SEED_VERSION);
    expect(plan.labels.find((label) => label.id === 'main-stage')?.value).toBe('78 ft × 42 ft × 5.5 ft');
    expect(plan.labels.find((label) => label.id === 'stage-to-b-stage')?.value).toBe('76 ft');
    expect(plan.overallFootprint.widthFt).toBeGreaterThanOrEqual(canonicalDrtPackage.deckWidthFt);
    expect(plan.overallFootprint.depthFt).toBeGreaterThan(100);
  });
});
