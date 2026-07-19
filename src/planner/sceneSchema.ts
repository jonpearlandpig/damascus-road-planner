import { drtPackage } from '../data/venues';
import type { VenueTwin } from '../data/types';
import { deriveDrtProductionGeometry } from '../geometry/drt';
import { gearPackReferences } from './gearAdapter';
import { getObjectDefinition, plannerObjectDefinitions } from './objectLibrary';
import { snapAndConstrain } from './snapping';
import { bStageCenterPlacementStatus } from './venueAdapter';
import { bStagePlacementForVenue, floorBoundsForVenue } from '../venue-twins/adapters';
import { PLANNER_SCHEMA_VERSION, SOURCE_RECONCILIATION_VERSION, type ObjectDefinition, type PlacedObject, type PlannerScene, type PlannerSceneSnapshot, type ScenePosition } from './types';

function nowIso(): string {
  return new Date().toISOString();
}

export function objectFromDefinition(definition: ObjectDefinition, id: string, position: ScenePosition, rotationYDeg = 0, warnings: string[] = []): PlacedObject {
  const lighting = definition.category === 'Lighting fixtures'
    ? { intensity: 0.8, panDeg: 0, tiltDeg: -35, color: '#f7d36b', shutterOpen: true, movementPreview: false }
    : undefined;
  const atmosphere = definition.category === 'Low fog' || definition.category === 'Hazers'
    ? { enabled: true, output: 0.45, directionDeg: 0, coverageRadiusFt: definition.category === 'Low fog' ? 18 : 28, groupId: 'atmospherics-default' }
    : undefined;
  const truss = definition.category === 'Truss'
    ? { kind: definition.id.includes('curved') ? 'curved' as const : definition.id.includes('circular') ? 'circular' as const : definition.id.includes('ground') ? 'ground-supported' as const : 'straight' as const, lengthFt: definition.dimensionsFt.widthFt }
    : undefined;

  return {
    id,
    definitionId: definition.id,
    label: definition.label,
    category: definition.category,
    dimensions: definition.dimensionsFt,
    dimensionStatus: definition.dimensionStatus,
    weightLb: definition.weightLb,
    weightStatus: definition.weightStatus,
    position,
    rotationYDeg,
    visible: true,
    locked: false,
    gearPackRef: definition.gearPackRef,
    truss,
    lighting,
    atmosphere,
    color: definition.color,
    shape: definition.shape,
    snapBehavior: definition.snapBehavior,
    sourceLabel: definition.sourceLabel,
    planningOnly: definition.planningOnly,
    warnings: [definition.warning, ...warnings].filter(Boolean) as string[],
  };
}

function createSeedObject(definitionId: string, id: string, position: ScenePosition, rotationYDeg = 0, warnings: string[] = []): PlacedObject {
  const definition = getObjectDefinition(definitionId);
  if (!definition) throw new Error(`Missing planner object definition: ${definitionId}`);
  return objectFromDefinition(definition, id, position, rotationYDeg, warnings);
}

export function snapshotScene(scene: PlannerScene): PlannerSceneSnapshot {
  return {
    name: scene.name,
    grid: scene.grid,
    camera: scene.camera,
    objects: scene.objects,
    measurements: scene.measurements,
    savedViews: scene.savedViews,
  };
}

export function createInitialPlannerScene(venue: VenueTwin): PlannerScene {
  const timestamp = nowIso();
  const drt = deriveDrtProductionGeometry(drtPackage);
  const bStageStatus = bStageCenterPlacementStatus(venue);
  const bStagePlacement = bStagePlacementForVenue(venue);
  const venueFloorBounds = floorBoundsForVenue(venue);
  const baseObjects: PlacedObject[] = [
    createSeedObject('drt-main-stage', 'drt-main-stage', { xFt: 0, yFt: drtPackage.deckHeightFt / 2, zFt: drt.stageCenterZFt }),
    createSeedObject('drt-center-thrust', 'drt-center-thrust', {
      xFt: 0,
      yFt: drtPackage.deckHeightFt / 2,
      zFt: drt.stageCenterZFt + drtPackage.deckDepthFt / 2 + drtPackage.centerThrustLengthFt / 2,
    }),
    createSeedObject('drt-side-thrust', 'drt-side-thrust-sl', {
      xFt: drt.sideThrusts[0].xFt,
      yFt: drtPackage.deckHeightFt / 2,
      zFt: drt.sideThrusts[0].zFt,
    }, drt.sideThrusts[0].rotationYRad * 180 / Math.PI),
    createSeedObject('drt-side-thrust', 'drt-side-thrust-sr', {
      xFt: drt.sideThrusts[1].xFt,
      yFt: drtPackage.deckHeightFt / 2,
      zFt: drt.sideThrusts[1].zFt,
    }, drt.sideThrusts[1].rotationYRad * 180 / Math.PI),
    createSeedObject('drt-b-stage', 'drt-b-stage', { ...bStagePlacement.position, yFt: drtPackage.deckHeightFt / 2 }, 0, [bStageStatus.note, bStagePlacement.note]),
    createSeedObject('drt-monolith', 'drt-monolith', {
      xFt: 0,
      yFt: drtPackage.deckHeightFt + drtPackage.prowHeightFt / 2,
      zFt: drt.prowMidZFt,
    }),
  ];

  const lowFogDefinition = getObjectDefinition('low-fog-machine');
  if (!lowFogDefinition) throw new Error('Missing low-fog definition');
  const lowFogXs = [-18, -6, 6, 18];
  for (const [index, xFt] of lowFogXs.entries()) {
    baseObjects.push(objectFromDefinition(lowFogDefinition, `drt-low-fog-${index + 1}`, { xFt, yFt: lowFogDefinition.dimensionsFt.heightFt / 2, zFt: drt.stageCenterZFt - 9 }, 0, [
      'Default DRT seed includes four low fog units as planning-only atmosphere objects.',
    ]));
  }

  const snappedObjects = baseObjects.map((object) => ({
    ...object,
    position: snapAndConstrain(object.position, object.dimensions, { widthFt: venueFloorBounds.widthFt, lengthFt: venueFloorBounds.lengthFt }, 1),
  }));

  return {
    schemaVersion: PLANNER_SCHEMA_VERSION,
    id: `${venue.slug}-planner-scene`,
    name: `${venue.name} DRT planning scene`,
    venueSlug: venue.slug,
    sourceReconciliationVersion: SOURCE_RECONCILIATION_VERSION,
    gearPackReferences: gearPackReferences(),
    createdAt: timestamp,
    modifiedAt: timestamp,
    selectedObjectId: 'drt-b-stage',
    grid: { visible: true, majorFt: 5, minorFt: 1, snapFt: 1, rotationIncrementDeg: 15 },
    camera: { mode: 'FREE_ORBIT', projection: 'PERSPECTIVE' },
    objects: snappedObjects,
    measurements: [],
    savedViews: [],
    revisions: [],
    warningLog: [
      'Planning model only. Rigging loads and capacities require venue and licensed engineering approval.',
      `Venue boundary source for initial DRT placement: ${venueFloorBounds.source}.`,
      ...snappedObjects.flatMap((object) => object.warnings),
    ],
  };
}

export function validatePlannerScene(value: unknown): { valid: boolean; scene?: PlannerScene; errors: string[] } {
  const errors: string[] = [];
  if (!value || typeof value !== 'object') return { valid: false, errors: ['Scene import must be an object.'] };
  const scene = value as PlannerScene;
  if (scene.schemaVersion !== PLANNER_SCHEMA_VERSION) errors.push(`Unsupported scene schema version ${String(scene.schemaVersion)}.`);
  if (!scene.id || !scene.venueSlug) errors.push('Scene id and venue slug are required.');
  if (!Array.isArray(scene.objects)) errors.push('Scene objects array is required.');
  for (const [index, object] of (scene.objects ?? []).entries()) {
    if (!object.id || !object.definitionId) errors.push(`Object ${index} is missing id or definition id.`);
    if (!plannerObjectDefinitions.some((definition) => definition.id === object.definitionId) && !object.gearPackRef) {
      errors.push(`Object ${object.id} references an unknown definition.`);
    }
    if (object.dimensionStatus === 'VERIFIED') errors.push(`Object ${object.id} cannot import as verified show geometry.`);
  }
  return { valid: errors.length === 0, scene: errors.length === 0 ? scene : undefined, errors };
}
