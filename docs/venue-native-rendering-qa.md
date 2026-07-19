# Venue-native rendering QA

Branch: `codex/venue-native-rendering-v1`

## Generated records

- Venue-native twins: 11
- READY: 3
- PARTIAL: 1
- BLOCKED: 7
- Approved measurements used by twins: 42
- Derived geometry records: 24
- Approximate geometry records: 0
- Open conflicts: 1
- Health score: 34

## Bundle sizes

| Chunk | Before | After | Delta |
| --- | ---: | ---: | ---: |
| CSS | 28.49 kB | 30.05 kB | +1.56 kB |
| VenueScene | 8.06 kB | 12.37 kB | +4.31 kB |
| VenueWorkspace | 45.13 kB | 52.37 kB | +7.24 kB |
| Main index | 381.83 kB | 441.26 kB | +59.43 kB |
| Venue scene vendor | 1048.56 kB | 1048.56 kB | +0.00 kB |

Vite still warns that the venue-scene vendor chunk is larger than 500 kB. That warning existed before this work and remains unchanged.

## QA coverage

- Spectrum Center: READY native twin renders source-backed floor, low/high steel facts, DRT fit overlay, and floor evidence links.
- GIANT Center: PARTIAL native twin renders floor/reference geometry with partial readiness.
- Red Rocks: BLOCKED native twin shows `BLOCKED_NO_SHELL` and no source-backed floor shell.
- Van Andel Arena: BLOCKED native twin shows conflict/fit-blocked state and excludes conflicted low-steel facts from controlling geometry.
- Comparison route: shows venue-native floor width, floor length, floor area, origin quality, low/high steel, center-hung low point, grid size, stage orientation, DRT fit, readiness, missing fields, and conflicts.
- Mobile routes: dashboard, comparison, and Spectrum workspace were checked for horizontal document overflow.

## Verification

| Command | Result |
| --- | --- |
| `npm ci` | Pass, with Node engine warning because repo requires Node 22.x and shell is Node 24.15.0 |
| `npm run generate:venue-twins` | Pass, wrote 11 records |
| `npm run report:venue-twins` | Pass, wrote status reports for 11 venues |
| `npm run report:venue-reviews` | Pass, wrote review reports for 11 reviewed venue PDFs |
| `npm run fit-check:drt` | Pass, wrote fit reports for 11 reviewed venues |
| `npm run report:tour-sources` | Pass, wrote 19-show source reports |
| `npm run review:venue-sources` | Pass, 11 reviewed PDFs, 90 approved facts, 7 blocked DRT fit checks |
| `npm run validate:venue-reviews` | Pass, 11 reviewed PDFs, 90 approved facts, 7 blocked DRT fit checks |
| `npm run validate:venue-twins` | Pass, 11 generated records |
| `npm run validate:tour-sources` | Pass, 19 shows, 11 logical sources |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm run validate` | Pass, with existing 11 external-source warnings |
| `npm run test:run` | Pass, 8 files and 61 tests |
| `npm run test:planner` | Pass, 1 file and 9 tests |
| `npm run build` | Pass, with existing large vendor chunk warning |
| `npm run check` | Pass, with existing 11 external-source warnings and large vendor chunk warning |
| `npm run test:e2e` | Pass, 9 Playwright tests |
| `npm run audit` | Pass, 0 vulnerabilities |
| `git diff --check` | Pass |

## Limitations

- Venue-native geometry is generated from approved source-review facts, not native venue CAD.
- Derived floor centers are not verified center-court points.
- BLOCKED venues do not contribute controlling fit geometry.
- DRT fit is planning fit only and is not structural, rigging, egress, installation, or life-safety approval.

## Next milestone

File or extract native CAD/rigging sources for BLOCKED and PARTIAL venues, then promote only source-backed geometry into controlling READY records.
