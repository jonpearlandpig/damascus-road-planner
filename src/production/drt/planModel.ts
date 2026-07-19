import type { PlacedObject, SceneDimensions } from '../../planner/types';
import { canonicalDrtGeometry, canonicalDrtPackage } from './canonicalGeometry';

export interface DrtPlanModel {
  seedVersion: string;
  labels: Array<{ id: string; label: string; value: string }>;
  overallFootprint: { widthFt: number; depthFt: number; minXFt: number; maxXFt: number; minZFt: number; maxZFt: number };
  unresolved: typeof canonicalDrtGeometry.unresolved;
}

function rotatedHalfExtents(object: PlacedObject): { x: number; z: number } {
  return halfExtents(object.dimensions, object.rotationYDeg);
}

function halfExtents(dimensions: SceneDimensions, rotationYDeg: number): { x: number; z: number } {
  const angle = rotationYDeg * Math.PI / 180;
  const halfWidth = dimensions.widthFt / 2;
  const halfDepth = dimensions.depthFt / 2;
  return {
    x: Math.abs(Math.cos(angle)) * halfWidth + Math.abs(Math.sin(angle)) * halfDepth,
    z: Math.abs(Math.sin(angle)) * halfWidth + Math.abs(Math.cos(angle)) * halfDepth,
  };
}

export function buildDrtPlanModel(objects: PlacedObject[]): DrtPlanModel {
  const production = objects.filter((object) => object.geometryClass === 'DRT_TOURING_PRODUCTION' && object.visible);
  const bounds = production.reduce((current, object) => {
    const extents = rotatedHalfExtents(object);
    let next = {
      minXFt: Math.min(current.minXFt, object.position.xFt - extents.x),
      maxXFt: Math.max(current.maxXFt, object.position.xFt + extents.x),
      minZFt: Math.min(current.minZFt, object.position.zFt - extents.z),
      maxZFt: Math.max(current.maxZFt, object.position.zFt + extents.z),
    };
    const canonical = canonicalDrtGeometry.objects.find((item) => item.id === object.canonicalGeometryId);
    const parentAngle = object.rotationYDeg * Math.PI / 180;
    for (const part of canonical?.renderParts ?? []) {
      const relativeX = part.relativePosition.xFt * Math.cos(parentAngle) - part.relativePosition.zFt * Math.sin(parentAngle);
      const relativeZ = part.relativePosition.xFt * Math.sin(parentAngle) + part.relativePosition.zFt * Math.cos(parentAngle);
      const partX = object.position.xFt + relativeX;
      const partZ = object.position.zFt + relativeZ;
      const partExtents = halfExtents(part.dimensions, object.rotationYDeg + part.rotationYDeg);
      next = {
        minXFt: Math.min(next.minXFt, partX - partExtents.x),
        maxXFt: Math.max(next.maxXFt, partX + partExtents.x),
        minZFt: Math.min(next.minZFt, partZ - partExtents.z),
        maxZFt: Math.max(next.maxZFt, partZ + partExtents.z),
      };
    }
    return next;
  }, { minXFt: Infinity, maxXFt: -Infinity, minZFt: Infinity, maxZFt: -Infinity });

  return {
    seedVersion: canonicalDrtGeometry.seedVersion,
    labels: [
      { id: 'main-stage', label: 'Main stage', value: `${canonicalDrtPackage.deckWidthFt} ft × ${canonicalDrtPackage.deckDepthFt} ft × ${canonicalDrtPackage.deckHeightFt} ft` },
      { id: 'center-thrust', label: 'Center thrust', value: `${canonicalDrtPackage.centerThrustWidthFt} ft × ${canonicalDrtPackage.centerThrustLengthFt} ft` },
      { id: 'side-thrusts', label: 'Side thrusts', value: `${canonicalDrtPackage.sideThrustWidthFt} ft × ${canonicalDrtPackage.sideThrustLengthFt} ft` },
      { id: 'b-stage', label: 'B stage', value: `${canonicalDrtPackage.bStageDiameterFt} ft diameter` },
      { id: 'stage-to-b-stage', label: 'Main-stage center to B-stage center', value: `${canonicalDrtPackage.bStageLocalZFt} ft` },
      { id: 'monolith', label: 'Monolith footprint', value: `${canonicalDrtPackage.prowBaseFt} ft base × ${canonicalDrtPackage.prowVertexDepthFt} ft vertex depth` },
    ],
    overallFootprint: {
      ...bounds,
      widthFt: bounds.maxXFt - bounds.minXFt,
      depthFt: bounds.maxZFt - bounds.minZFt,
    },
    unresolved: canonicalDrtGeometry.unresolved,
  };
}
