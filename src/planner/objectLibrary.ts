import { drtPackage } from '../data/venues';
import { deriveDrtProductionGeometry } from '../geometry/drt';
import { gearDefinitions } from './gearAdapter';
import type { ObjectDefinition, PlannerObjectCategory, SceneDimensions } from './types';

const planningWarning = 'Planning-only visualization envelope. Confirm dimensions, weight, rigging, life-safety and venue approval before use.';

function dims(widthFt: number, depthFt: number, heightFt: number): SceneDimensions {
  return { widthFt, depthFt, heightFt };
}

function definition(
  id: string,
  label: string,
  category: PlannerObjectCategory,
  dimensionsFt: SceneDimensions,
  color: string,
  shape: ObjectDefinition['shape'] = 'box',
  options: Partial<ObjectDefinition> = {},
): ObjectDefinition {
  return {
    id,
    label,
    category,
    dimensionsFt,
    color,
    shape,
    manufacturer: options.manufacturer,
    model: options.model,
    dimensionStatus: options.dimensionStatus ?? 'ESTIMATE',
    weightLb: options.weightLb,
    weightStatus: options.weightStatus ?? 'TBD',
    mountingType: options.mountingType ?? 'planning-only',
    sourceLabel: options.sourceLabel ?? 'T.I. planning library',
    gearPackRef: options.gearPackRef,
    snapBehavior: options.snapBehavior ?? 'GRID_LOCKED',
    allowedParentTypes: options.allowedParentTypes ?? [],
    planningOnly: options.planningOnly ?? true,
    warning: options.warning ?? planningWarning,
  };
}

const drt = deriveDrtProductionGeometry(drtPackage);

export const plannerObjectDefinitions: ObjectDefinition[] = [
  definition('drt-main-stage', 'DRT main stage', 'Main stage', dims(drtPackage.deckWidthFt, drtPackage.deckDepthFt, drtPackage.deckHeightFt), '#1c2f3f', 'box', {
    dimensionStatus: 'REFERENCE',
    mountingType: 'floor',
    sourceLabel: 'DRT authored production geometry',
    planningOnly: true,
    warning: 'Planning geometry only. Does not establish structural approval or load capacity.',
  }),
  definition('drt-center-thrust', 'DRT center thrust', 'Thrusts', dims(drtPackage.centerThrustWidthFt, drtPackage.centerThrustLengthFt, drtPackage.deckHeightFt), '#a96d33', 'box', {
    dimensionStatus: 'REFERENCE',
    mountingType: 'floor',
    sourceLabel: 'DRT authored production geometry',
  }),
  definition('drt-side-thrust', 'DRT side thrust', 'Thrusts', dims(drtPackage.sideThrustWidthFt, drtPackage.sideThrustLengthFt, drtPackage.deckHeightFt), '#81522c', 'box', {
    dimensionStatus: 'REFERENCE',
    mountingType: 'floor',
    sourceLabel: 'DRT authored production geometry',
    warning: 'AKB dimensions are retained; unresolved master-scale mismatch remains a planning warning.',
  }),
  definition('drt-b-stage', 'DRT B stage', 'B stage', dims(drtPackage.bStageDiameterFt, drtPackage.bStageDiameterFt, drtPackage.deckHeightFt), '#c28542', 'cylinder', {
    dimensionStatus: 'REFERENCE',
    mountingType: 'floor',
    sourceLabel: 'DRT authored production geometry',
    snapBehavior: 'VENUE_CENTER_LOCKED',
  }),
  definition('drt-monolith', 'DRT monolith / prow volume', 'Scenic elements', dims(drtPackage.prowBaseFt, drtPackage.prowVertexDepthFt, drtPackage.prowHeightFt), '#d7c8a5', 'screen', {
    dimensionStatus: 'REFERENCE',
    mountingType: 'floor',
    sourceLabel: 'DRT authored production geometry',
  }),
  definition('stage-deck-4x8', '4 ft x 8 ft stage deck', 'Stage decks', dims(4, 8, 1), '#273f4e'),
  definition('riser-8x8', '8 ft x 8 ft riser', 'Risers', dims(8, 8, 2), '#394f58'),
  definition('stairs-4x8', 'Stage stair unit', 'Stairs', dims(4, 8, 3), '#6e604b'),
  definition('barricade-8ft', '8 ft barricade run', 'Barricade', dims(8, 2, 4), '#56616a'),
  definition('foh-16x12', 'FOH mix position', 'FOH', dims(16, 12, 4), '#3a5866'),
  definition('delay-tower', 'Delay tower', 'Delay towers', dims(8, 8, 24), '#4b565f'),
  definition('camera-platform', 'Camera platform', 'Camera platforms', dims(8, 8, 3), '#495f65'),
  definition('straight-truss-40', '40 ft straight truss', 'Truss', dims(40, 2, 2), '#697b82', 'truss', {
    mountingType: 'hanging',
    allowedParentTypes: [],
    warning: 'Planning-only truss representation. No load approval or rigging capacity is implied.',
  }),
  definition('curved-truss', 'Curved truss segment', 'Truss', dims(30, 4, 2), '#76878b', 'truss', {
    mountingType: 'hanging',
    warning: 'Planning-only curved truss representation. Confirm engineered geometry and loads.',
  }),
  definition('circular-truss', 'Circular truss', 'Truss', dims(30, 30, 2), '#849095', 'truss', {
    mountingType: 'hanging',
    warning: 'Planning-only circular truss representation. Confirm engineered geometry and loads.',
  }),
  definition('ground-truss', 'Ground-supported truss', 'Truss', dims(24, 4, 16), '#707f76', 'truss', {
    mountingType: 'ground-supported',
    warning: 'Planning-only ground support. Confirm base plates, ballast, engineering, and venue approval.',
  }),
  definition('motor-half-ton', 'Planning motor point', 'Motors', dims(1, 1, 1), '#8b6c44', 'cylinder', {
    mountingType: 'hanging',
    warning: 'Planning-only motor marker. No capacity, load path, or approval is implied.',
  }),
  definition('moving-fixture', 'Moving fixture', 'Lighting fixtures', dims(1.5, 1.5, 2.5), '#f2c65f', 'fixture', {
    mountingType: 'truss-mounted',
    allowedParentTypes: ['Truss'],
    warning: 'Visualization control only. This does not replace a lighting console or engineered hang approval.',
  }),
  definition('video-wall-16x9', '16 ft x 9 ft video wall', 'Video walls', dims(16, 1, 9), '#253b56', 'screen'),
  definition('projection-surface', 'Projection surface', 'Projection surfaces', dims(20, 1, 12), '#d8d2c4', 'screen'),
  definition('scrim-20x16', '20 ft x 16 ft scrim', 'Scrims', dims(20, 1, 16), '#b9b2ad', 'screen'),
  definition('soft-good-40x24', 'Soft goods run', 'Soft goods', dims(40, 1, 24), '#34343b', 'screen'),
  definition('audio-array', 'Audio array', 'Audio arrays', dims(4, 3, 16), '#2f3f4a', 'box'),
  definition('sub-stack', 'Sub stack', 'Subs', dims(6, 4, 3), '#27343b', 'box'),
  definition('monitor-world', 'Monitor world', 'Monitor world', dims(12, 10, 4), '#384c46', 'box'),
  definition('backline-riser', 'Backline position', 'Backline', dims(10, 8, 3), '#5c5347', 'box'),
  definition('low-fog-machine', 'Low fog unit', 'Low fog', dims(2, 2, 2), '#7ca4aa', 'fog', {
    mountingType: 'floor',
    warning: 'Low fog planning preview only. Confirm ventilation, fire/life-safety, and venue approval.',
  }),
  definition('hazer-unit', 'Hazer unit', 'Hazers', dims(2, 2, 2), '#9ba8a3', 'fog', {
    mountingType: 'floor',
    warning: 'Haze planning preview only. Confirm fire/life-safety, detector isolation process, and venue approval.',
  }),
  definition('scenic-element', 'Scenic element', 'Scenic elements', dims(8, 4, 10), '#8a6e50', 'box'),
  definition('custom-object', 'Utility / custom object', 'Utility or custom object', dims(10, 10, 4), '#66757d', 'box'),
];

export const allObjectDefinitions = [...plannerObjectDefinitions, ...gearDefinitions()];
export const objectDefinitionById = new Map(allObjectDefinitions.map((item) => [item.id, item]));

export function getObjectDefinition(id: string): ObjectDefinition | undefined {
  return objectDefinitionById.get(id);
}

export function definitionsForCategory(category: PlannerObjectCategory): ObjectDefinition[] {
  return allObjectDefinitions.filter((definitionItem) => definitionItem.category === category);
}

export function defaultPositionForDefinition(definitionItem: ObjectDefinition) {
  if (definitionItem.id === 'drt-main-stage') return { xFt: 0, yFt: drtPackage.deckHeightFt / 2, zFt: drt.stageCenterZFt };
  if (definitionItem.id === 'drt-center-thrust') {
    return { xFt: 0, yFt: drtPackage.deckHeightFt / 2, zFt: drt.stageCenterZFt + drtPackage.deckDepthFt / 2 + drtPackage.centerThrustLengthFt / 2 };
  }
  if (definitionItem.id === 'drt-b-stage') return { xFt: 0, yFt: drtPackage.deckHeightFt / 2, zFt: 0 };
  if (definitionItem.id === 'drt-monolith') return { xFt: 0, yFt: drtPackage.deckHeightFt + drtPackage.prowHeightFt / 2, zFt: drt.prowMidZFt };
  if (definitionItem.category === 'Truss') return { xFt: 0, yFt: 24, zFt: drt.stageCenterZFt };
  if (definitionItem.category === 'Lighting fixtures') return { xFt: 0, yFt: 22, zFt: drt.stageCenterZFt };
  if (definitionItem.category === 'FOH') return { xFt: 0, yFt: 2, zFt: 56 };
  return { xFt: 0, yFt: Math.max(0, definitionItem.dimensionsFt.heightFt / 2), zFt: 0 };
}
