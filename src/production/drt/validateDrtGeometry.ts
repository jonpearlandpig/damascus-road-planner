import { canonicalDrtGeometry, canonicalDrtPackage } from './canonicalGeometry';
import { DRT_GEOMETRY_EVIDENCE } from './geometryEvidence';
import type { CanonicalDrtGeometry } from './schema';

export interface DrtGeometryValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateDrtGeometry(geometry: CanonicalDrtGeometry = canonicalDrtGeometry): DrtGeometryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();
  const partIds = new Set<string>();

  for (const object of geometry.objects) {
    if (ids.has(object.id)) errors.push(`Duplicate DRT object id: ${object.id}`);
    ids.add(object.id);
    for (const [field, value] of Object.entries(object.dimensions)) {
      if (!(value > 0)) errors.push(`${object.id}.${field} must be positive`);
    }
    if (!DRT_GEOMETRY_EVIDENCE[object.designDecisionId]) errors.push(`${object.id} has no evidence or authored-design id`);
    if (object.status === 'APPROVED' && DRT_GEOMETRY_EVIDENCE[object.designDecisionId]?.status !== 'APPROVED') {
      errors.push(`${object.id} is presented as approved without approved evidence`);
    }
    for (const part of object.renderParts ?? []) {
      if (ids.has(part.id) || partIds.has(part.id)) errors.push(`Duplicate DRT render-part id: ${part.id}`);
      partIds.add(part.id);
    }
    if (object.placementStatus === 'UNRESOLVED') warnings.push(`${object.id} placement remains unresolved`);
  }

  const mainStage = geometry.objects.find((object) => object.id === 'drt-main-stage');
  if (mainStage?.dimensions.widthFt !== canonicalDrtPackage.deckWidthFt || mainStage.dimensions.depthFt !== canonicalDrtPackage.deckDepthFt) {
    errors.push('Main-stage dimensions do not match the canonical package');
  }
  if (mainStage?.dimensions.heightFt !== canonicalDrtPackage.deckHeightFt) errors.push('Main-stage elevation does not match the canonical package');

  const monolith = geometry.objects.find((object) => object.id === 'drt-monolith');
  if (monolith?.renderParts?.length !== 2) errors.push('Monolith must have exactly two authored faces');
  if (monolith?.dimensions.widthFt !== canonicalDrtPackage.prowBaseFt || monolith.dimensions.depthFt !== canonicalDrtPackage.prowVertexDepthFt) {
    errors.push('Monolith footprint does not match the canonical package');
  }

  const centerThrust = geometry.objects.find((object) => object.id === 'drt-center-thrust');
  if (centerThrust?.dimensions.widthFt !== canonicalDrtPackage.centerThrustWidthFt || centerThrust.dimensions.depthFt !== canonicalDrtPackage.centerThrustLengthFt) {
    errors.push('Center-thrust dimensions do not match the canonical package');
  }
  const sideThrusts = geometry.objects.filter((object) => object.definitionId === 'drt-side-thrust');
  if (sideThrusts.length !== 2) errors.push('Exactly two side thrusts are required');
  if (sideThrusts.length === 2) {
    if (sideThrusts[0].position.xFt !== -sideThrusts[1].position.xFt || sideThrusts[0].position.zFt !== sideThrusts[1].position.zFt) errors.push('Side thrusts are not symmetric');
    if (sideThrusts[0].rotationYDeg !== -sideThrusts[1].rotationYDeg) errors.push('Side-thrust rotations are not symmetric');
  }

  const bStage = geometry.objects.find((object) => object.id === 'drt-b-stage');
  if (bStage?.anchor !== 'VENUE_CENTER' || bStage.position.xFt !== 0 || bStage.position.zFt !== 0) errors.push('B stage must use the venue-center anchor');
  if (bStage?.dimensions.widthFt !== canonicalDrtPackage.bStageDiameterFt) errors.push('B-stage diameter does not match the canonical package');

  const lowFog = geometry.objects.filter((object) => object.category === 'Low fog');
  if (lowFog.length !== 4) errors.push(`Low-fog count must equal four, received ${lowFog.length}`);

  const renderedIds = new Set(geometry.objects.map((object) => object.id));
  for (const unresolved of geometry.unresolved) {
    if (renderedIds.has(unresolved.id)) errors.push(`${unresolved.id} is unresolved and must not be rendered as canonical geometry`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function assertCanonicalDrtGeometry(): void {
  const result = validateDrtGeometry();
  if (!result.valid) throw new Error(`Canonical DRT geometry validation failed:\n${result.errors.join('\n')}`);
}
