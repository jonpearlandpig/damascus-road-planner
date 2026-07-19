import { describe, expect, it } from 'vitest';
import { drtPackage } from '../data/venues';
import { assertDrtPackageInvariants, deriveDrtProductionGeometry } from './drt';

describe('DRT production geometry invariants', () => {
  it('keeps the controlling authored production dimensions intact', () => {
    expect(() => assertDrtPackageInvariants(drtPackage)).not.toThrow();
    expect(drtPackage.deckWidthFt).toBe(78);
    expect(drtPackage.deckDepthFt).toBe(42);
    expect(drtPackage.deckHeightFt).toBe(5.5);
    expect(drtPackage.prowBaseFt).toBe(50);
    expect(drtPackage.prowVertexDepthFt).toBe(25);
    expect(drtPackage.sideThrustWidthFt).toBe(5);
    expect(drtPackage.sideThrustLengthFt).toBe(32);
    expect(drtPackage.bStageDiameterFt).toBe(26);
  });

  it('derives symmetric thrust and prow relationships from controlling values', () => {
    const geometry = deriveDrtProductionGeometry(drtPackage);

    expect(geometry.stageCenterZFt).toBe(-76);
    expect(geometry.bStageCenterZFt).toBe(0);
    expect(geometry.prowHalfBaseFt).toBe(25);
    expect(geometry.prowFaceLengthFt).toBeCloseTo(Math.hypot(25, 25));
    expect(geometry.sideThrusts).toHaveLength(2);
    expect(geometry.sideThrusts[0].xFt).toBe(-geometry.sideThrusts[1].xFt);
    expect(geometry.sideThrusts[0].zFt).toBe(geometry.sideThrusts[1].zFt);
    expect(geometry.sideThrusts[0].rotationYRad).toBe(-geometry.sideThrusts[1].rotationYRad);
  });

  it('rejects non-positive critical dimensions', () => {
    expect(() => assertDrtPackageInvariants({ ...drtPackage, deckWidthFt: 0 })).toThrow(/deckWidthFt/);
  });
});
