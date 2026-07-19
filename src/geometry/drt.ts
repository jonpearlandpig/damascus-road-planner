import type { TourPackage } from '../data/types';
import { canonicalDrtDerived, canonicalDrtPackage } from '../production/drt/canonicalGeometry';

export interface DerivedDrtGeometry {
  stageCenterZFt: number;
  deckHeightFt: number;
  upstageEdgeZFt: number;
  prowHalfBaseFt: number;
  prowFaceLengthFt: number;
  prowFaceAngleRad: number;
  prowMidZFt: number;
  bStageCenterZFt: number;
  sideThrusts: Array<{ side: -1 | 1; xFt: number; zFt: number; rotationYRad: number }>;
}

function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`DRT geometry invariant failed: ${message}`);
}

export function assertDrtPackageInvariants(pkg: TourPackage): void {
  const positiveFields: Array<keyof TourPackage> = [
    'deckWidthFt',
    'deckDepthFt',
    'deckHeightFt',
    'prowBaseFt',
    'prowVertexDepthFt',
    'prowHeightFt',
    'centerThrustWidthFt',
    'centerThrustLengthFt',
    'sideThrustWidthFt',
    'sideThrustLengthFt',
    'bStageDiameterFt',
    'bStageLocalZFt',
  ];

  for (const field of positiveFields) {
    invariant(typeof pkg[field] === 'number' && pkg[field] > 0, `${field} must be a positive number`);
  }

  invariant(pkg.deckWidthFt === canonicalDrtPackage.deckWidthFt, 'main deck width matches the canonical module');
  invariant(pkg.deckDepthFt === canonicalDrtPackage.deckDepthFt, 'main deck depth matches the canonical module');
  invariant(pkg.deckHeightFt === canonicalDrtPackage.deckHeightFt, 'main deck height matches the canonical module');
  invariant(pkg.prowBaseFt === canonicalDrtPackage.prowBaseFt, 'monolith base matches the canonical module');
  invariant(pkg.prowVertexDepthFt === canonicalDrtPackage.prowVertexDepthFt, 'monolith vertex depth matches the canonical module');
  invariant(pkg.centerThrustWidthFt === canonicalDrtPackage.centerThrustWidthFt, 'center thrust width matches the canonical module');
  invariant(pkg.centerThrustLengthFt === canonicalDrtPackage.centerThrustLengthFt, 'center thrust length matches the canonical module');
  invariant(pkg.sideThrustWidthFt === canonicalDrtPackage.sideThrustWidthFt, 'side thrust width matches the canonical module');
  invariant(pkg.sideThrustLengthFt === canonicalDrtPackage.sideThrustLengthFt, 'side thrust length matches the canonical module');
  invariant(pkg.bStageDiameterFt === canonicalDrtPackage.bStageDiameterFt, 'B-stage diameter matches the canonical module');
}

export function deriveDrtProductionGeometry(pkg: TourPackage): DerivedDrtGeometry {
  assertDrtPackageInvariants(pkg);

  const stageCenterZFt = -pkg.bStageLocalZFt;
  const upstageEdgeZFt = stageCenterZFt - pkg.deckDepthFt / 2;
  const prowHalfBaseFt = pkg.prowBaseFt / 2;
  const prowFaceLengthFt = Math.hypot(prowHalfBaseFt, pkg.prowVertexDepthFt);
  const prowFaceAngleRad = Math.atan2(prowHalfBaseFt, pkg.prowVertexDepthFt);
  const prowMidZFt = upstageEdgeZFt + pkg.prowVertexDepthFt / 2;
  const sideThrustZFt = canonicalDrtDerived.sideThrusts[0].zFt;

  invariant(stageCenterZFt < 0, 'main stage remains upstage of center court');
  invariant(sideThrustZFt < 0, 'side thrust centers remain upstage of center court');
  invariant(Math.abs(sideThrustZFt) < pkg.bStageLocalZFt, 'side thrusts remain between main deck and center court');
  invariant(prowFaceLengthFt > pkg.prowVertexDepthFt, 'prow diagonal faces exceed vertex depth');

  return {
    stageCenterZFt,
    deckHeightFt: pkg.deckHeightFt,
    upstageEdgeZFt,
    prowHalfBaseFt,
    prowFaceLengthFt,
    prowFaceAngleRad,
    prowMidZFt,
    bStageCenterZFt: 0,
    sideThrusts: [
      ...canonicalDrtDerived.sideThrusts,
    ],
  };
}
