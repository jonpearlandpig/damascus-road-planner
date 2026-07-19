import type { VenueTwin } from '../data/types';
import { canPlaceGear } from './gearAdapter';
import { createMeasurementAnnotation } from './measurements';
import { defaultPositionForDefinition, getObjectDefinition } from './objectLibrary';
import { objectFromDefinition, snapshotScene } from './sceneSchema';
import { snapAndConstrain, snapPosition, snapRotationDeg } from './snapping';
import type {
  AtmosphereState,
  CameraSnapshot,
  FixtureState,
  LightingState,
  PlannerCameraState,
  PlannerGridState,
  PlannerScene,
  PlannerViewMode,
  ScenePosition,
} from './types';

export type PlannerAction =
  | { type: 'selectObject'; id?: string }
  | { type: 'setGrid'; grid: Partial<PlannerGridState> }
  | { type: 'addObject'; definitionId: string; position?: Partial<ScenePosition>; allowGearOverride?: boolean; parentId?: string }
  | { type: 'moveObject'; id: string; position: Partial<ScenePosition> }
  | { type: 'rotateObject'; id: string; rotationYDeg: number; incrementDeg?: number }
  | { type: 'duplicateObject'; id: string }
  | { type: 'deleteObject'; id: string }
  | { type: 'lockObject'; id: string; locked: boolean }
  | { type: 'renameObject'; id: string; label: string }
  | { type: 'toggleObjectVisibility'; id: string; visible: boolean }
  | { type: 'groupObjects'; ids: string[]; groupId: string }
  | { type: 'ungroupObjects'; ids: string[] }
  | { type: 'attachToTruss'; fixtureId: string; trussId: string; positionAlongTrussFt?: number }
  | { type: 'detachFromTruss'; fixtureId: string }
  | { type: 'distributeEvenly'; parentId: string; childIds: string[] }
  | { type: 'updateLighting'; id: string; lighting: Partial<LightingState> }
  | { type: 'updateAtmosphere'; id: string; atmosphere: Partial<AtmosphereState> }
  | { type: 'updateFixture'; id: string; fixture: Partial<FixtureState> }
  | { type: 'setMeasurementPoint'; point: 'start' | 'end'; position: ScenePosition }
  | { type: 'clearMeasurement' }
  | { type: 'saveMeasurement'; name: string }
  | { type: 'renameMeasurement'; id: string; name: string }
  | { type: 'deleteMeasurement'; id: string }
  | { type: 'setCamera'; camera: Partial<PlannerCameraState> }
  | { type: 'saveCameraView'; name: string; mode?: PlannerViewMode }
  | { type: 'renameCameraView'; id: string; name: string }
  | { type: 'deleteCameraView'; id: string }
  | { type: 'restoreCameraView'; id: string }
  | { type: 'recordRevision'; note: string }
  | { type: 'restoreRevision'; id: string }
  | { type: 'replaceScene'; scene: PlannerScene };

export interface PlannerActionResult {
  scene: PlannerScene;
  rejected?: boolean;
  message?: string;
}

function timestamp(): string {
  return new Date().toISOString();
}

function touch(scene: PlannerScene): PlannerScene {
  return { ...scene, modifiedAt: timestamp() };
}

function generateObjectId(scene: PlannerScene, seed: string): string {
  const base = seed.replaceAll(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-|-$/g, '') || 'object';
  let index = scene.objects.length + 1;
  let id = `${base}-${index}`;
  const ids = new Set(scene.objects.map((object) => object.id));
  while (ids.has(id)) {
    index += 1;
    id = `${base}-${index}`;
  }
  return id;
}

function floorBounds(venue: VenueTwin) {
  return { widthFt: venue.geometry.floorWidthFt, lengthFt: venue.geometry.floorLengthFt };
}

function updateObject(scene: PlannerScene, id: string, updater: (object: typeof scene.objects[number]) => typeof scene.objects[number]): PlannerScene {
  return touch({
    ...scene,
    objects: scene.objects.map((object) => object.id === id ? updater(object) : object),
  });
}

function selectedOrFirst(scene: PlannerScene, id: string): string | undefined {
  return scene.objects.some((object) => object.id === id) ? id : scene.objects[0]?.id;
}

export function applyPlannerAction(scene: PlannerScene, venue: VenueTwin, action: PlannerAction): PlannerActionResult {
  switch (action.type) {
    case 'selectObject':
      return { scene: { ...scene, selectedObjectId: action.id } };
    case 'setGrid':
      return { scene: touch({ ...scene, grid: { ...scene.grid, ...action.grid } }) };
    case 'addObject': {
      const definition = getObjectDefinition(action.definitionId);
      if (!definition) return { scene, rejected: true, message: `Object definition ${action.definitionId} is not available.` };
      if (definition.gearPackRef) {
        const allocation = canPlaceGear(scene, definition.gearPackRef, action.allowGearOverride ?? false);
        if (!allocation.allowed) return { scene, rejected: true, message: allocation.warning };
      }
      const defaultPosition = defaultPositionForDefinition(definition);
      const position = snapAndConstrain(
        { ...defaultPosition, ...action.position },
        definition.dimensionsFt,
        floorBounds(venue),
        scene.grid.snapFt,
      );
      const id = generateObjectId(scene, definition.id);
      const object = objectFromDefinition(definition, id, position, 0, action.allowGearOverride ? ['Planning override exceeds filed gear-pack quantity.'] : []);
      const insertedObject = object.geometryClass === 'DRT_TOURING_PRODUCTION'
        ? {
          ...object,
          geometryClass: 'PLANNING_SCENE' as const,
          placementStatus: 'UNRESOLVED' as const,
          designDecisionId: undefined,
          warnings: [...object.warnings, 'Copied from the DRT library into the planning scene; this instance is not canonical production geometry.'],
        }
        : object;
      const nextObject = action.parentId ? { ...insertedObject, parentId: action.parentId } : insertedObject;
      return {
        scene: touch({
          ...scene,
          selectedObjectId: id,
          objects: [...scene.objects, nextObject],
        }),
      };
    }
    case 'moveObject': {
      const object = scene.objects.find((item) => item.id === action.id);
      if (!object) return { scene, rejected: true, message: `Object ${action.id} is not in the scene.` };
      if (!object.editable || object.geometryClass === 'VENUE_NATIVE' || object.geometryClass === 'HOUSE_REFERENCE') return { scene, rejected: true, message: `${object.label} is fixed reference geometry.` };
      if (object.locked) return { scene, rejected: true, message: `${object.label} is locked.` };
      const position = snapAndConstrain({ ...object.position, ...action.position }, object.dimensions, floorBounds(venue), scene.grid.snapFt);
      return { scene: updateObject(scene, action.id, (item) => ({ ...item, position })) };
    }
    case 'rotateObject': {
      const object = scene.objects.find((item) => item.id === action.id);
      if (!object) return { scene, rejected: true, message: `Object ${action.id} is not in the scene.` };
      if (!object.editable || object.geometryClass === 'VENUE_NATIVE' || object.geometryClass === 'HOUSE_REFERENCE') return { scene, rejected: true, message: `${object.label} is fixed reference geometry.` };
      if (object.locked) return { scene, rejected: true, message: `${object.label} is locked.` };
      const rotationYDeg = snapRotationDeg(action.rotationYDeg, action.incrementDeg ?? scene.grid.rotationIncrementDeg);
      return { scene: updateObject(scene, action.id, (item) => ({ ...item, rotationYDeg })) };
    }
    case 'duplicateObject': {
      const object = scene.objects.find((item) => item.id === action.id);
      if (!object) return { scene, rejected: true, message: `Object ${action.id} is not in the scene.` };
      const id = generateObjectId(scene, `${object.id}-copy`);
      const position = snapAndConstrain({ ...object.position, xFt: object.position.xFt + scene.grid.majorFt, zFt: object.position.zFt + scene.grid.majorFt }, object.dimensions, floorBounds(venue), scene.grid.snapFt);
      return {
        scene: touch({
          ...scene,
          selectedObjectId: id,
          objects: [...scene.objects, {
            ...object,
            id,
            canonicalGeometryId: undefined,
            geometryClass: 'PLANNING_SCENE',
            placementStatus: 'UNRESOLVED',
            designDecisionId: undefined,
            label: `${object.label} copy`,
            position,
            locked: false,
            parentId: undefined,
            warnings: [...object.warnings, 'Copied into the planning scene; this instance is not canonical production geometry.'],
          }],
        }),
      };
    }
    case 'deleteObject': {
      const object = scene.objects.find((item) => item.id === action.id);
      if (!object) return { scene, rejected: true, message: `Object ${action.id} is not in the scene.` };
      if (!object.editable || object.geometryClass === 'VENUE_NATIVE' || object.geometryClass === 'HOUSE_REFERENCE') return { scene, rejected: true, message: `${object.label} is fixed reference geometry.` };
      if (object.locked) return { scene, rejected: true, message: `${object.label} is locked.` };
      const childIds = new Set(scene.objects.filter((item) => item.parentId === action.id).map((item) => item.id));
      const objects = scene.objects.filter((item) => item.id !== action.id && !childIds.has(item.id));
      return { scene: touch({ ...scene, selectedObjectId: selectedOrFirst({ ...scene, objects }, scene.selectedObjectId ?? ''), objects }) };
    }
    case 'lockObject': {
      const object = scene.objects.find((item) => item.id === action.id);
      if (!object) return { scene, rejected: true, message: `Object ${action.id} is not in the scene.` };
      if (!object.editable || object.geometryClass === 'VENUE_NATIVE' || object.geometryClass === 'HOUSE_REFERENCE') return { scene, rejected: true, message: `${object.label} is always locked.` };
      return { scene: updateObject(scene, action.id, (item) => ({ ...item, locked: action.locked })) };
    }
    case 'renameObject':
      return { scene: updateObject(scene, action.id, (object) => ({ ...object, label: action.label.trim() || object.label })) };
    case 'toggleObjectVisibility':
      return { scene: updateObject(scene, action.id, (object) => ({ ...object, visible: action.visible })) };
    case 'groupObjects':
      return {
        scene: touch({
          ...scene,
          objects: scene.objects.map((object) => action.ids.includes(object.id) ? { ...object, groupId: action.groupId } : object),
        }),
      };
    case 'ungroupObjects':
      return {
        scene: touch({
          ...scene,
          objects: scene.objects.map((object) => action.ids.includes(object.id) ? { ...object, groupId: undefined } : object),
        }),
      };
    case 'attachToTruss': {
      const fixture = scene.objects.find((item) => item.id === action.fixtureId);
      const truss = scene.objects.find((item) => item.id === action.trussId && item.category === 'Truss');
      if (!fixture || !truss) return { scene, rejected: true, message: 'Fixture and truss are required for attachment.' };
      if (fixture.locked) return { scene, rejected: true, message: `${fixture.label} is locked.` };
      const positionAlongTrussFt = action.positionAlongTrussFt ?? 0;
      const position = snapPosition({
        xFt: truss.position.xFt + positionAlongTrussFt,
        yFt: truss.position.yFt - truss.dimensions.heightFt / 2 - fixture.dimensions.heightFt / 2,
        zFt: truss.position.zFt,
      }, scene.grid.snapFt);
      return {
        scene: updateObject(scene, fixture.id, (object) => ({
          ...object,
          parentId: truss.id,
          position,
          snapBehavior: 'TRUSS_LOCKED',
          fixture: { hangOrientationDeg: 0, panDeg: object.lighting?.panDeg ?? 0, tiltDeg: object.lighting?.tiltDeg ?? -35, positionAlongTrussFt },
        })),
      };
    }
    case 'detachFromTruss':
      return { scene: updateObject(scene, action.fixtureId, (object) => ({ ...object, parentId: undefined, snapBehavior: 'GRID_LOCKED', fixture: undefined })) };
    case 'distributeEvenly': {
      const parent = scene.objects.find((object) => object.id === action.parentId);
      if (!parent) return { scene, rejected: true, message: 'Parent truss is required.' };
      const count = action.childIds.length;
      if (count === 0) return { scene, rejected: true, message: 'At least one child object is required.' };
      const start = -parent.dimensions.widthFt / 2;
      const step = count === 1 ? 0 : parent.dimensions.widthFt / (count - 1);
      return {
        scene: touch({
          ...scene,
          objects: scene.objects.map((object) => {
            const index = action.childIds.indexOf(object.id);
            if (index === -1 || object.locked) return object;
            const positionAlongTrussFt = start + step * index;
            return {
              ...object,
              parentId: parent.id,
              position: snapPosition({
                xFt: parent.position.xFt + positionAlongTrussFt,
                yFt: parent.position.yFt - parent.dimensions.heightFt / 2 - object.dimensions.heightFt / 2,
                zFt: parent.position.zFt,
              }, scene.grid.snapFt),
              fixture: { ...(object.fixture ?? { hangOrientationDeg: 0, panDeg: 0, tiltDeg: -35 }), positionAlongTrussFt },
            };
          }),
        }),
      };
    }
    case 'updateLighting':
      return { scene: updateObject(scene, action.id, (object) => ({ ...object, lighting: { ...(object.lighting ?? { intensity: 1, panDeg: 0, tiltDeg: 0, color: '#ffffff', shutterOpen: true, movementPreview: false }), ...action.lighting } })) };
    case 'updateAtmosphere':
      return { scene: updateObject(scene, action.id, (object) => ({ ...object, atmosphere: { ...(object.atmosphere ?? { enabled: true, output: 0, directionDeg: 0, coverageRadiusFt: 12 }), ...action.atmosphere } })) };
    case 'updateFixture':
      return { scene: updateObject(scene, action.id, (object) => ({ ...object, fixture: { ...(object.fixture ?? { hangOrientationDeg: 0, panDeg: 0, tiltDeg: -35 }), ...action.fixture } })) };
    case 'setMeasurementPoint':
      return {
        scene: touch({
          ...scene,
          activeMeasurement: { ...(scene.activeMeasurement ?? {}), [action.point]: snapPosition(action.position, scene.grid.snapFt) },
        }),
      };
    case 'clearMeasurement':
      return { scene: touch({ ...scene, activeMeasurement: undefined }) };
    case 'saveMeasurement': {
      const start = scene.activeMeasurement?.start;
      const end = scene.activeMeasurement?.end;
      if (!start || !end) return { scene, rejected: true, message: 'Measurement start and end are required.' };
      const createdAt = timestamp();
      return {
        scene: touch({
          ...scene,
          measurements: [...scene.measurements, createMeasurementAnnotation(action.name.trim() || `Measurement ${scene.measurements.length + 1}`, start, end, createdAt)],
        }),
      };
    }
    case 'renameMeasurement':
      return { scene: touch({ ...scene, measurements: scene.measurements.map((measurement) => measurement.id === action.id ? { ...measurement, name: action.name.trim() || measurement.name } : measurement) }) };
    case 'deleteMeasurement':
      return { scene: touch({ ...scene, measurements: scene.measurements.filter((measurement) => measurement.id !== action.id) }) };
    case 'setCamera':
      return { scene: touch({ ...scene, camera: { ...scene.camera, ...action.camera } }) };
    case 'saveCameraView': {
      const createdAt = timestamp();
      const mode = action.mode ?? scene.camera.mode;
      const view: CameraSnapshot = {
        id: `view-${createdAt.replaceAll(/[^0-9a-z]/gi, '')}`,
        name: action.name.trim() || `View ${scene.savedViews.length + 1}`,
        mode,
        projection: scene.camera.projection,
        position: cameraPositionForMode(mode, venue),
        target: { xFt: 0, yFt: 6, zFt: 0 },
        createdAt,
      };
      return { scene: touch({ ...scene, camera: { ...scene.camera, activeSavedViewId: view.id }, savedViews: [...scene.savedViews, view] }) };
    }
    case 'renameCameraView':
      return { scene: touch({ ...scene, savedViews: scene.savedViews.map((view) => view.id === action.id ? { ...view, name: action.name.trim() || view.name } : view) }) };
    case 'deleteCameraView':
      return { scene: touch({ ...scene, savedViews: scene.savedViews.filter((view) => view.id !== action.id), camera: scene.camera.activeSavedViewId === action.id ? { ...scene.camera, activeSavedViewId: undefined } : scene.camera }) };
    case 'restoreCameraView': {
      const view = scene.savedViews.find((item) => item.id === action.id);
      if (!view) return { scene, rejected: true, message: 'Saved view is not available.' };
      return { scene: touch({ ...scene, camera: { mode: view.mode, projection: view.projection, activeSavedViewId: view.id } }) };
    }
    case 'recordRevision': {
      const revision = {
        id: `revision-${scene.revisions.length + 1}-${Date.now()}`,
        number: scene.revisions.length + 1,
        note: action.note.trim() || `Revision ${scene.revisions.length + 1}`,
        timestamp: timestamp(),
        snapshot: snapshotScene(scene),
      };
      return { scene: touch({ ...scene, revisions: [...scene.revisions, revision] }) };
    }
    case 'restoreRevision': {
      const revision = scene.revisions.find((item) => item.id === action.id);
      if (!revision) return { scene, rejected: true, message: 'Revision is not available.' };
      return {
        scene: touch({
          ...scene,
          name: revision.snapshot.name,
          grid: revision.snapshot.grid,
          camera: revision.snapshot.camera,
          objects: revision.snapshot.objects,
          measurements: revision.snapshot.measurements,
          savedViews: revision.snapshot.savedViews,
        }),
      };
    }
    case 'replaceScene':
      return { scene: touch(action.scene) };
    default:
      return { scene };
  }
}

export function cameraPositionForMode(mode: PlannerViewMode, venue: VenueTwin): ScenePosition {
  const halfLength = venue.geometry.floorLengthFt / 2;
  const halfWidth = venue.geometry.floorWidthFt / 2;
  switch (mode) {
    case 'PLAN':
      return { xFt: 0, yFt: Math.max(120, venue.geometry.floorLengthFt), zFt: 0 };
    case 'FRONT_CENTER_AUDIENCE':
      return { xFt: 0, yFt: 24, zFt: halfLength };
    case 'STAGE_TO_AUDIENCE':
      return { xFt: 0, yFt: 18, zFt: -halfLength + 24 };
    case 'STAGE_LEFT':
      return { xFt: -halfWidth - 30, yFt: 28, zFt: -20 };
    case 'STAGE_RIGHT':
      return { xFt: halfWidth + 30, yFt: 28, zFt: -20 };
    case 'REAR_OF_HOUSE':
      return { xFt: 0, yFt: 28, zFt: -halfLength - 30 };
    case 'LOWER_BOWL':
      return { xFt: -halfWidth - 20, yFt: 38, zFt: 34 };
    case 'UPPER_BOWL':
      return { xFt: halfWidth + 35, yFt: 80, zFt: 58 };
    case 'ORBIT_360':
    case 'FREE_ORBIT':
      return { xFt: 115, yFt: 95, zFt: 135 };
    default:
      return { xFt: 115, yFt: 95, zFt: 135 };
  }
}
