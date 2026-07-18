import { describe, expect, it } from 'vitest';
import { venueMap } from '../data/venues';
import { dispatchPlannerCommand } from './commands';
import { createPlannerHistory, applyHistoryAction, undoHistory, redoHistory } from './history';
import { validateIngestionRecords } from './ingestion';
import { distanceBetweenPoints, nearestFloorBoundaryDistance } from './measurements';
import { importSceneJson, exportSceneJson } from './persistence';
import { createInitialPlannerScene } from './sceneSchema';
import { applyPlannerAction } from './store';
import { snapAndConstrain, snapPosition, snapRotationDeg } from './snapping';
import { bStageCenterPlacementStatus, buildVenueIngestionRecords } from './venueAdapter';

const spectrum = venueMap['spectrum-center'];
const vanAndel = venueMap['van-andel-arena'];
const tMobile = venueMap['t-mobile-center'];

describe('planner geometry, state, and command foundation', () => {
  it('snaps positions and rotations to supported planner increments', () => {
    expect(snapPosition({ xFt: 1.24, yFt: 0.49, zFt: -2.26 }, 0.5)).toEqual({ xFt: 1, yFt: 0.5, zFt: -2.5 });
    expect(snapAndConstrain({ xFt: 100, yFt: 0, zFt: 100 }, { widthFt: 10, depthFt: 10, heightFt: 4 }, { widthFt: 40, lengthFt: 40 }, 1)).toEqual({ xFt: 15, yFt: 0, zFt: 15 });
    expect(snapRotationDeg(43, 15)).toBe(45);
    expect(snapRotationDeg(-1, 90)).toBe(0);
  });

  it('calculates distance and floor-boundary measurements in feet', () => {
    expect(distanceBetweenPoints({ xFt: 0, yFt: 0, zFt: 0 }, { xFt: 3, yFt: 4, zFt: 12 }).totalFt).toBe(13);
    expect(nearestFloorBoundaryDistance({ xFt: 0, yFt: 0, zFt: 0 }, { widthFt: 10, depthFt: 20, heightFt: 4 }, { floorWidthFt: 50, floorLengthFt: 80, roomCenter: { xFt: 0, yFt: 0, zFt: 0 }, venueCenterlineXFt: 0, stageCenterlineXFt: 0, upstageEdgeZFt: -20, downstageEdgeZFt: 20 })).toBe(20);
  });

  it('places the DRT B stage at the venue center with source-state truthfulness', () => {
    const scene = createInitialPlannerScene(spectrum);
    const bStage = scene.objects.find((object) => object.id === 'drt-b-stage');
    expect(bStage?.position).toMatchObject({ xFt: 0, zFt: 0 });
    expect(bStageCenterPlacementStatus(spectrum).status).toBe('REFERENCE');
    expect(bStageCenterPlacementStatus(vanAndel).status).toBe('CONFLICT');
    expect(bStageCenterPlacementStatus(tMobile).status).toBe('REFERENCE');
  });

  it('moves, locks, duplicates, deletes, and preserves undo/redo history', () => {
    const initial = createPlannerHistory(createInitialPlannerScene(spectrum));
    const moved = applyHistoryAction(initial, spectrum, { type: 'moveObject', id: 'drt-b-stage', position: { xFt: 4.6, zFt: 5.4 } }).history;
    expect(moved.present.objects.find((object) => object.id === 'drt-b-stage')?.position).toMatchObject({ xFt: 5, zFt: 5 });
    const locked = applyHistoryAction(moved, spectrum, { type: 'lockObject', id: 'drt-b-stage', locked: true }).history;
    const rejected = applyHistoryAction(locked, spectrum, { type: 'moveObject', id: 'drt-b-stage', position: { xFt: 10 } });
    expect(rejected.result.rejected).toBe(true);
    const unlocked = applyHistoryAction(locked, spectrum, { type: 'lockObject', id: 'drt-b-stage', locked: false }).history;
    const duplicated = applyHistoryAction(unlocked, spectrum, { type: 'duplicateObject', id: 'drt-b-stage' }).history;
    expect(duplicated.present.objects).toHaveLength(unlocked.present.objects.length + 1);
    const deleted = applyHistoryAction(duplicated, spectrum, { type: 'deleteObject', id: duplicated.present.selectedObjectId! }).history;
    expect(deleted.present.objects).toHaveLength(unlocked.present.objects.length);
    expect(undoHistory(deleted).present.objects).toHaveLength(duplicated.present.objects.length);
    expect(redoHistory(undoHistory(deleted)).present.objects).toHaveLength(deleted.present.objects.length);
  });

  it('tracks gear-pack quantities and blocks silent over-allocation', () => {
    const scene = createInitialPlannerScene(spectrum);
    const first = applyPlannerAction(scene, spectrum, { type: 'addObject', definitionId: 'gear-lx-0001' }).scene;
    const second = applyPlannerAction(first, spectrum, { type: 'addObject', definitionId: 'gear-lx-0001' });
    expect(second.rejected).toBe(true);
    const override = applyPlannerAction(first, spectrum, { type: 'addObject', definitionId: 'gear-lx-0001', allowGearOverride: true });
    expect(override.rejected).toBeUndefined();
    expect(override.scene.objects.filter((object) => object.gearPackRef?.itemId === 'LX-0001')).toHaveLength(2);
  });

  it('attaches fixtures to truss and distributes children evenly', () => {
    let scene = createInitialPlannerScene(spectrum);
    scene = applyPlannerAction(scene, spectrum, { type: 'addObject', definitionId: 'straight-truss-40' }).scene;
    const trussId = scene.selectedObjectId!;
    scene = applyPlannerAction(scene, spectrum, { type: 'addObject', definitionId: 'moving-fixture' }).scene;
    const fixtureA = scene.selectedObjectId!;
    scene = applyPlannerAction(scene, spectrum, { type: 'duplicateObject', id: fixtureA }).scene;
    const fixtureB = scene.selectedObjectId!;
    scene = applyPlannerAction(scene, spectrum, { type: 'attachToTruss', fixtureId: fixtureA, trussId, positionAlongTrussFt: -10 }).scene;
    expect(scene.objects.find((object) => object.id === fixtureA)?.parentId).toBe(trussId);
    scene = applyPlannerAction(scene, spectrum, { type: 'distributeEvenly', parentId: trussId, childIds: [fixtureA, fixtureB] }).scene;
    const positions = [fixtureA, fixtureB].map((id) => scene.objects.find((object) => object.id === id)?.fixture?.positionAlongTrussFt);
    expect(positions).toEqual([-20, 20]);
  });

  it('saves, imports, records revisions, and restores snapshots', () => {
    let scene = createInitialPlannerScene(spectrum);
    scene = applyPlannerAction(scene, spectrum, { type: 'moveObject', id: 'drt-b-stage', position: { xFt: 10, zFt: 10 } }).scene;
    scene = applyPlannerAction(scene, spectrum, { type: 'recordRevision', note: 'center move' }).scene;
    scene = applyPlannerAction(scene, spectrum, { type: 'moveObject', id: 'drt-b-stage', position: { xFt: 15, zFt: 15 } }).scene;
    const restored = applyPlannerAction(scene, spectrum, { type: 'restoreRevision', id: scene.revisions[0].id }).scene;
    expect(restored.objects.find((object) => object.id === 'drt-b-stage')?.position).toMatchObject({ xFt: 10, zFt: 10 });
    const imported = importSceneJson(exportSceneJson(restored));
    expect(imported.errors).toEqual([]);
    expect(imported.scene?.schemaVersion).toBe(1);
  });

  it('dispatches deterministic commands through the same scene actions', () => {
    let scene = createInitialPlannerScene(spectrum);
    scene = dispatchPlannerCommand(scene, spectrum, { kind: 'ADD_OBJECT', definitionId: 'straight-truss-40' }).scene;
    expect(scene.objects.some((object) => object.category === 'Truss')).toBe(true);
    scene = dispatchPlannerCommand(scene, spectrum, { kind: 'MOVE_OBJECT', objectId: 'drt-b-stage', position: { xFt: 6, zFt: 6 } }).scene;
    scene = dispatchPlannerCommand(scene, spectrum, { kind: 'CENTER_IN_VENUE', objectId: 'drt-b-stage' }).scene;
    expect(scene.objects.find((object) => object.id === 'drt-b-stage')?.position).toMatchObject({ xFt: 0, zFt: 0 });
  });

  it('validates ingestion records and keeps conflicts unresolved', () => {
    const records = buildVenueIngestionRecords(vanAndel);
    const validation = validateIngestionRecords(records);
    expect(validation.errors).toEqual([]);
    expect(records.some((record) => record.role === 'UNRESOLVED' || record.conflicts.length > 0)).toBe(true);
  });
});
