# Planner Coordinate And Safety Model

Updated: 2026-07-18

## Coordinate Convention

The planner uses feet as the authoring unit.

- Origin: venue room center / center-court reference when available.
- X: stage left / stage right. Negative X is stage left. Positive X is stage right.
- Y: elevation above the venue floor.
- Z: upstage / downstage room depth. Negative Z is upstage. Positive Z is downstage toward the audience.

The persistent floor grid is centered on the venue origin. Major grid lines are 5 ft. Minor grid lines are 1 ft. Active snap can be 1 ft, 6 in, or 3 in. Scene objects are snapped and constrained through `src/planner/snapping.ts`.

## Source And Geometry Boundaries

Venue seeds remain the source-backed venue data authority. Editable show scene state lives separately in `PlannerScene`.

The venue adapter maps current seeds into structured geometry without inventing unsupported values:

- Available geometry keeps its existing field-level `VERIFIED`, `REFERENCE`, `ESTIMATE`, `MISSING`, or `CONFLICT` status.
- Missing theatre, PAC, auditorium, amphitheatre, seating, pit, balcony, vomitory, and overhang values remain missing unless a filed seed supports them.
- B-stage center placement uses the venue origin and carries the venue-center status. It is `REFERENCE` for current source-backed arena records, `ESTIMATE` for missing-source seeds, and `CONFLICT` for unresolved conflict venues.

## Ingestion Records

`src/planner/venueAdapter.ts` creates ingestion records for the filed source asset and the existing structured seed. `src/planner/ingestion.ts` validates the workflow.

Supported categories:

- Venue tech-pack PDF
- Rigging plot PDF
- CAD or DWG reference
- Seating or floor plan
- Stage specification
- Venue production notes
- Existing structured venue seed
- External source reference

A measurement can become `VERIFIED` only when the mapping is approved and attached to a controlling source. Missing or conflicted mappings require notes.

## Editable Scene State

`PlannerScene` records:

- Schema version
- Venue slug
- Source reconciliation version
- Gear-pack references
- Grid, snap, rotation, camera state
- Placed objects
- Saved measurements
- Saved views
- Revision snapshots
- Created and modified timestamps

All direct manipulation, form controls, and deterministic commands route through the same reducer in `src/planner/store.ts`.

## Safety Warnings

This planner is for production planning and advance coordination only.

- It is not a substitute for licensed structural engineering.
- Rigging loads and capacities require venue and engineer approval.
- CAD and tech-pack measurements must be confirmed against current venue documents.
- Visualization does not constitute approval for installation.
- Weight and load fields remain planning-only unless verified engineering data exists.

## Performance Notes

The 3D scene remains lazy-loaded. The editor UI adds a separate planner store chunk, while Three/R3F remain isolated in the `venue-scene-vendor` chunk. Atmosphere previews use simple translucent coverage discs instead of fluid simulation.
