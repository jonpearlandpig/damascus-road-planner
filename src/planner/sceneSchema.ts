import type { VenueTwin } from '../data/types';
import { buildDrtScene } from '../production/drt/buildDrtScene';
import { DRT_SEED_VERSION } from '../production/drt/canonicalGeometry';
import { gearPackReferences } from './gearAdapter';
import { plannerObjectDefinitions } from './objectLibrary';
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
    geometryClass: definition.geometryClass ?? 'PLANNING_SCENE',
    geometryStatus: definition.geometryStatus ?? 'UNRESOLVED',
    placementStatus: definition.placementStatus ?? 'UNRESOLVED',
    designDecisionId: definition.designDecisionId,
    editable: definition.editable ?? true,
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
  const bStageStatus = bStageCenterPlacementStatus(venue);
  const bStagePlacement = bStagePlacementForVenue(venue);
  const venueFloorBounds = floorBoundsForVenue(venue);
  const canonicalObjects = buildDrtScene({
    bStagePosition: bStagePlacement.position,
    bStagePlacementStatus: bStageStatus.status,
    bStageNotes: [bStageStatus.note, bStagePlacement.note],
  });

  return {
    schemaVersion: PLANNER_SCHEMA_VERSION,
    drtSeedVersion: DRT_SEED_VERSION,
    id: `${venue.slug}-planner-scene`,
    name: `${venue.name} DRT planning scene`,
    venueSlug: venue.slug,
    sourceReconciliationVersion: SOURCE_RECONCILIATION_VERSION,
    gearPackReferences: gearPackReferences(),
    createdAt: timestamp,
    modifiedAt: timestamp,
    selectedObjectId: undefined,
    grid: { visible: true, majorFt: 5, minorFt: 1, snapFt: 1, rotationIncrementDeg: 15 },
    camera: { mode: 'FREE_ORBIT', projection: 'PERSPECTIVE' },
    objects: canonicalObjects,
    measurements: [],
    savedViews: [],
    revisions: [],
    warningLog: [
      'Planning model only. Rigging loads and capacities require venue and licensed engineering approval.',
      `Venue boundary source for initial DRT placement: ${venueFloorBounds.source}.`,
      ...canonicalObjects.flatMap((object) => object.warnings),
    ],
  };
}

export function migratePlannerScene(value: unknown, venue: VenueTwin | undefined): { scene?: PlannerScene; errors: string[]; warnings: string[] } {
  if (!value || typeof value !== 'object') return { errors: ['Scene import must be an object.'], warnings: [] };
  const candidate = value as Partial<PlannerScene> & { schemaVersion?: number; objects?: Array<Partial<PlacedObject>> };
  if (candidate.schemaVersion === PLANNER_SCHEMA_VERSION) return { scene: candidate as PlannerScene, errors: [], warnings: [] };
  if (candidate.schemaVersion !== 1) return { errors: [`Unsupported scene schema version ${String(candidate.schemaVersion)}.`], warnings: [] };
  if (!venue || venue.slug !== candidate.venueSlug) return { errors: ['Version 1 scene migration requires a known matching venue.'], warnings: [] };

  const fresh = createInitialPlannerScene(venue);
  const canonicalIds = new Set(fresh.objects.map((object) => object.id));
  const migratedUserObjects = (candidate.objects ?? [])
    .filter((object): object is PlacedObject => Boolean(object.id && object.definitionId && !canonicalIds.has(object.id)))
    .map((object) => ({
      ...object,
      canonicalGeometryId: undefined,
      geometryClass: 'PLANNING_SCENE' as const,
      geometryStatus: object.dimensionStatus === 'REFERENCE' ? 'REFERENCE' as const : 'UNRESOLVED' as const,
      placementStatus: 'UNRESOLVED' as const,
      editable: true,
    }));

  return {
    scene: {
      ...fresh,
      ...candidate,
      schemaVersion: PLANNER_SCHEMA_VERSION,
      drtSeedVersion: DRT_SEED_VERSION,
      selectedObjectId: undefined,
      objects: [...fresh.objects, ...migratedUserObjects],
      modifiedAt: nowIso(),
      warningLog: [
        ...(candidate.warningLog ?? []),
        `Scene migrated from schema 1 to ${PLANNER_SCHEMA_VERSION}; canonical DRT geometry was refreshed to ${DRT_SEED_VERSION}.`,
      ],
    },
    errors: [],
    warnings: [`Migrated schema 1 scene to ${PLANNER_SCHEMA_VERSION} and refreshed the canonical DRT seed.`],
  };
}

export function validatePlannerScene(value: unknown): { valid: boolean; scene?: PlannerScene; errors: string[] } {
  const errors: string[] = [];
  if (!value || typeof value !== 'object') return { valid: false, errors: ['Scene import must be an object.'] };
  const scene = value as PlannerScene;
  if (scene.schemaVersion !== PLANNER_SCHEMA_VERSION) errors.push(`Unsupported scene schema version ${String(scene.schemaVersion)}.`);
  if (scene.drtSeedVersion !== DRT_SEED_VERSION) errors.push(`Unsupported DRT seed version ${String(scene.drtSeedVersion)}.`);
  if (!scene.id || !scene.venueSlug) errors.push('Scene id and venue slug are required.');
  if (!Array.isArray(scene.objects)) errors.push('Scene objects array is required.');
  for (const [index, object] of (scene.objects ?? []).entries()) {
    if (!object.id || !object.definitionId) errors.push(`Object ${index} is missing id or definition id.`);
    if (!plannerObjectDefinitions.some((definition) => definition.id === object.definitionId) && !object.gearPackRef) {
      errors.push(`Object ${object.id} references an unknown definition.`);
    }
    if (object.dimensionStatus === 'VERIFIED') errors.push(`Object ${object.id} cannot import as verified show geometry.`);
    if (object.geometryClass === 'VENUE_NATIVE' || object.geometryClass === 'HOUSE_REFERENCE') errors.push(`Object ${object.id} cannot import venue or house-reference geometry as editable scene state.`);
    if (object.geometryClass === 'DRT_TOURING_PRODUCTION' && !object.canonicalGeometryId) errors.push(`DRT object ${object.id} is missing its canonical geometry id.`);
  }
  return { valid: errors.length === 0, scene: errors.length === 0 ? scene : undefined, errors };
}
