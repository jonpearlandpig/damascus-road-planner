# Editor Interaction And DRT Geometry Authority

Updated: 2026-07-18

## Authority

`src/production/drt/canonicalGeometry.ts` is the only active touring-production geometry definition. It is identified by `drt-canonical-2026-07-17.1`. The planner seed, object library, 2D plan, 3D renderer, persisted scene migration, and deterministic validator all derive from it.

Repository-controlled T.I. design records support this canonical set:

- Main deck: 78 ft by 42 ft at 5 ft 6 in elevation.
- Two-face monolith: 50 ft upstage base, 25 ft downstage vertex depth, 35 ft 4 in above the deck.
- Center thrust: 6 ft by 42 ft.
- Side thrusts: two 5 ft by 32 ft mirrored elements at the filed lateral, downstage, and rotation relationships. The filed scale mismatch remains explicitly unresolved; labeled dimensions control.
- B-stage: 26 ft diameter, anchored to venue center. The carried Q-tail is `REFERENCE`, not `AUTHORED` or `APPROVED`.
- Low fog: count fixed at four. Exact unit placement is `UNRESOLVED` and is presented only as planning-reference placement.

The following are excluded from canonical rendered geometry because the repository does not contain controlling dimensions or placement relationships: touring ramps, scrim or fabric plane, under-surface projector, touring FOH, barricade reference, and hazer units. They remain enumerated in the plan warning summary and validator instead of receiving guessed coordinates.

## Derived Relationships

Stage center, stage edges, monolith face length/angle, monolith center, thrust centers, B-stage distance, and overall plan footprint are computed from the canonical values. Validation asserts symmetry, positive dimensions, stable unique IDs, evidence/design-decision links, the two monolith faces, the venue-center B-stage anchor, four low-fog units, and exclusion of unresolved objects.

Run:

```sh
npm run validate:drt-geometry
```

## Pointer Contract

Camera navigation and object transforms have separate owners. Objects do not have full-mesh drag behavior. A transform can start only when the selected object is editable and unlocked, the explicit tool matches the visible handle, and the handle captures the pointer.

Selection uses a 5-pixel click threshold and commits on pointer-up. Camera gestures never dispatch scene movement. Transform pointer-move events update only a local draft; the store receives one snapped move or rotation action on completion. Escape, pointer cancel, lost capture, and focus loss restore the starting transform.

## Plan Before Perspective

The `PLAN` view is a deterministic SVG using the same persisted canonical objects as 3D. It includes the venue boundary and origin, centerlines, stage-end orientation, production footprints, supported dimensions, overall footprint, object labels, reference status, and the unresolved/excluded list. Perspective rendering is presentation of that model, not a second geometry authority.

## Scene And Import Rules

- Venue-native and house-reference geometry are fixed and cannot be imported as editable scene objects.
- Canonical touring objects begin locked and retain stable IDs.
- Copying or adding an object creates `PLANNING_SCENE` geometry rather than another canonical definition.
- Scenes persist the DRT seed version.
- Schema 1 scenes refresh canonical touring objects and preserve noncanonical user objects.
- Unsupported current schema/seed combinations are rejected with an explicit error.
