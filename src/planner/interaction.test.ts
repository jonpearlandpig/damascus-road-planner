import { describe, expect, it } from 'vitest';
import {
  beginPointerIntent,
  canStartTransform,
  isClickIntent,
  transformResult,
  updatePointerIntent,
} from './interaction';
import type { PlacedObject } from './types';

function object(overrides: Partial<PlacedObject> = {}): PlacedObject {
  return {
    id: 'drt-main-stage',
    definitionId: 'drt-main-stage',
    canonicalGeometryId: 'drt-main-stage',
    geometryClass: 'DRT_TOURING_PRODUCTION',
    geometryStatus: 'AUTHORED',
    placementStatus: 'AUTHORED',
    designDecisionId: 'DRT-AUTH-DECK-2026-07-17',
    editable: true,
    label: 'DRT main stage',
    category: 'Main stage',
    dimensions: { widthFt: 78, depthFt: 42, heightFt: 5.5 },
    dimensionStatus: 'REFERENCE',
    weightStatus: 'TBD',
    position: { xFt: 0, yFt: 2.75, zFt: -76 },
    rotationYDeg: 0,
    visible: true,
    locked: false,
    color: '#123456',
    shape: 'box',
    snapBehavior: 'GRID_LOCKED',
    sourceLabel: 'T.I. design authority',
    planningOnly: true,
    warnings: [],
    ...overrides,
  };
}

describe('planner pointer ownership', () => {
  it('separates clicks from drags at a five-pixel threshold', () => {
    const pending = beginPointerIntent(1, 100, 100, 'drt-main-stage');
    expect(isClickIntent(updatePointerIntent(pending, 103, 104))).toBe(true);
    expect(isClickIntent(updatePointerIntent(pending, 106, 100))).toBe(false);
  });

  it('allows a transform only from the matching explicit tool and authorized handle', () => {
    const stage = object();
    expect(canStartTransform('SELECT', stage.id, stage, 'MOVE_X')).toBe(false);
    expect(canStartTransform('MOVE', stage.id, stage, 'ROTATE_Y')).toBe(false);
    expect(canStartTransform('MOVE', stage.id, stage, 'MOVE_X')).toBe(true);
    expect(canStartTransform('ROTATE', stage.id, stage, 'ROTATE_Y')).toBe(true);
  });

  it('rejects transforms for locked, unselected, and venue-native objects', () => {
    expect(canStartTransform('MOVE', 'drt-main-stage', object({ locked: true }), 'MOVE_X')).toBe(false);
    expect(canStartTransform('MOVE', 'another-object', object(), 'MOVE_X')).toBe(false);
    expect(canStartTransform('MOVE', 'drt-main-stage', object({ geometryClass: 'VENUE_NATIVE' }), 'MOVE_X')).toBe(false);
  });

  it.each(['ESCAPE', 'POINTER_CANCEL', 'FOCUS_LOST'] as const)('restores the starting transform on %s', (reason) => {
    const start = { objectId: 'drt-main-stage', position: { xFt: 0, yFt: 2.75, zFt: -76 }, rotationYDeg: 0 };
    const draft = { objectId: 'drt-main-stage', position: { xFt: 12, yFt: 2.75, zFt: -70 }, rotationYDeg: 30 };
    expect(transformResult(start, reason, draft)).toEqual(start);
  });

  it('returns the draft only for a committed transform', () => {
    const start = { objectId: 'drt-main-stage', position: { xFt: 0, yFt: 2.75, zFt: -76 }, rotationYDeg: 0 };
    const draft = { objectId: 'drt-main-stage', position: { xFt: 12, yFt: 2.75, zFt: -70 }, rotationYDeg: 30 };
    expect(transformResult(start, 'COMMIT', draft)).toEqual(draft);
  });
});
