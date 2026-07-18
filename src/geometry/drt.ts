import type { TourPackage } from '../data/types';

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

  invariant(pkg.deckWidthFt === 78, 'main deck width remains 78 ft');
  invariant(pkg.deckDepthFt === 42, 'main deck depth remains 42 ft');
  invariant(pkg.deckHeightFt === 5.5, 'main deck height remains 5 ft 6 in');
  invariant(pkg.prowBaseFt === 50, 'prow base remains 50 ft');
  invariant(pkg.prowVertexDepthFt === 25, 'prow vertex depth remains 25 ft');
  invariant(pkg.centerThrustWidthFt === 6, 'center thrust width remains 6 ft');
  invariant(pkg.centerThrustLengthFt === 42, 'center thrust length remains 42 ft');
  invariant(pkg.sideThrustWidthFt === 5, 'side thrust width remains 5 ft');
  invariant(pkg.sideThrustLengthFt === 32, 'side thrust length remains 32 ft');
  invariant(pkg.bStageDiameterFt === 26, 'B-stage diameter remains 26 ft');
}

export function deriveDrtProductionGeometry(pkg: TourPackage): DerivedDrtGeometry {
  assertDrtPackageInvariants(pkg);

  const stageCenterZFt = -pkg.bStageLocalZFt;
  const upstageEdgeZFt = stageCenterZFt - pkg.deckDepthFt / 2;
  const prowHalfBaseFt = pkg.prowBaseFt / 2;
  const prowFaceLengthFt = Math.hypot(prowHalfBaseFt, pkg.prowVertexDepthFt);
  const prowFaceAngleRad = Math.atan2(prowHalfBaseFt, pkg.prowVertexDepthFt);
  const prowMidZFt = upstageEdgeZFt + pkg.prowVertexDepthFt / 2;
  const sideThrustZFt = stageCenterZFt + 35.9;

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
      { side: -1, xFt: -23.8, zFt: sideThrustZFt, rotationYRad: -0.649 },
      { side: 1, xFt: 23.8, zFt: sideThrustZFt, rotationYRad: 0.649 },
    ],
  };
}
