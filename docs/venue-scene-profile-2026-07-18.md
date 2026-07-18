# VenueScene Bundle Profile - 2026-07-18

Branch: `codex/source-reconciliation-visual-qa`

Command: `npm run build`

## Baseline

Baseline from `codex/audit-safe-ci`:

- `VenueWorkspace`: 11.23 kB, gzip 3.76 kB
- `VenueScene`: 1,040.75 kB, gzip 288.59 kB

The isolated scene chunk was dominated by Three.js, React Three Fiber, Drei helpers, and text/control dependencies.

## Current Result

After profiling and a low-risk vendor split:

- `VenueWorkspace-B9iA0Jut.js`: 12.15 kB, gzip 4.09 kB
- `VenueScene-CAk9zKgs.js`: 6.41 kB, gzip 2.02 kB
- `venue-scene-vendor-CfsUZO8t.js`: 1,046.18 kB, gzip 291.32 kB
- `index-0uVs3QNl.js`: 254.35 kB, gzip 79.98 kB

`build.modulePreload` is disabled so the scene vendor chunk is not preloaded from `index.html`. The vendor code is fetched when the lazy scene path is reached.

## Dependency Notes

`npm ls three @react-three/fiber @react-three/drei` shows one primary `three@0.185.1` tree used by the app. `@react-three/drei` also carries an unused nested `stats-gl` dependency with `three@0.170.0`, but the production vendor chunk did not show `stats-gl` as a bundled contributor.

Observed package footprint:

- `three`: about 25 MB installed package footprint
- `three-stdlib`: about 29 MB installed package footprint
- `@react-three/fiber`: about 2.2 MB installed package footprint
- `@react-three/drei`: about 3.0 MB installed package footprint
- `troika-three-text`: about 0.8 MB installed package footprint
- `camera-controls`: about 0.4 MB installed package footprint

## Changes Attempted

- Added manual chunking for `three` and `@react-three/*` modules into `venue-scene-vendor`.
- Disabled module preloads to avoid eager fetch of the 3D vendor chunk from the entry HTML.
- Kept scene behavior intact. No dependency swaps, renderer rewrites, or aggressive per-helper chunking.

## Recommendation

Do not split deeper right now. The largest payload is stable 3D vendor code, and further splitting Drei or Three internals would add cache and waterfall risk for little user-visible benefit. The next meaningful reduction would come from replacing specific Drei helpers or moving optional helpers behind user interaction after measuring an actual route-load bottleneck.
