# DRT venue fit checks

Generated from checked-in venue review records at `2026-07-18T00:00:00.000Z`.

Package: 78 ft deck width; 42 ft deck depth; 42 ft center thrust; 26 ft B-stage; B-stage local Z 76 ft.

Summary: 11 reviewed venues; 0 pass; 4 pass with warnings; 7 blocked; 0 unresolved.

| Venue | Status | Review readiness | Floor | Side clearance | Upstage clearance | Downstage clearance | Overhead clearance | Evidence facts | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| bok-center | BLOCKED | BLOCKED | Missing | n/a | n/a | n/a | 49.17 | bok-low-steel-90, bok-scoreboard-bottom-75 | Venue source review is blocked.; Approved floor width and length are required.; Native CAD/rigging files remain requested before final operations.; Source is stale or undated; keep final engineering confirmation open. |
| gainbridge-fieldhouse | BLOCKED | BLOCKED | Missing | n/a | n/a | n/a | 69.17 | gainbridge-scoreboard-bottom-110 | Venue source review is blocked.; Approved floor width and length are required.; Native CAD/rigging files remain requested before final operations.; Source is stale or undated; keep final engineering confirmation open. |
| van-andel-arena | BLOCKED | BLOCKED | 85 x 200 ft | 3.5 | 3 | 87 | 24.17 | vaa-floor-width-85, vaa-floor-length-200, vaa-scoreboard-bottom-65 | Open source conflict prevents venue-native fit approval.; Venue source review is blocked.; Only 3.5 ft remains per side against the approved floor width.; Native CAD/rigging files remain requested before final operations. |
| giant-center | PASS_WITH_WARNINGS | PARTIAL | 85 x 200 ft | 3.5 | 3 | 87 | 47.17 | giant-floor-width-85, giant-floor-length-200, giant-low-steel-88 | Only 3.5 ft remains per side against the approved floor width.; Native CAD/rigging files remain requested before final operations. |
| spectrum-center | PASS_WITH_WARNINGS | READY | 85 x 200 ft | 3.5 | 3 | 87 | 66.17 | spectrum-floor-width-85, spectrum-floor-length-200, spectrum-low-steel-107 | Only 3.5 ft remains per side against the approved floor width.; Native CAD/rigging files remain requested before final operations. |
| target-center | BLOCKED | BLOCKED | Missing | n/a | n/a | n/a | 59.17 | target-open-steel-100 | Venue source review is blocked.; Approved floor width and length are required.; Native CAD/rigging files remain requested before final operations.; Source is stale or undated; keep final engineering confirmation open. |
| t-mobile-center | PASS_WITH_WARNINGS | READY | 85 x 235 ft | 3.5 | 20.5 | 104.5 | 57.17 | tmobile-floor-width-85, tmobile-floor-length-235, tmobile-low-steel-98, tmobile-scoreboard-bottom-76 | Only 3.5 ft remains per side against the approved floor width.; Native CAD/rigging files remain requested before final operations. |
| desert-diamond-arena | BLOCKED | BLOCKED | Missing | n/a | n/a | n/a | 59.17 | dda-low-steel-100, dda-scoreboard-bottom-58 | Venue source review is blocked.; Approved floor width and length are required.; Native CAD/rigging files remain requested before final operations.; Source is stale or undated; keep final engineering confirmation open. |
| red-rocks | BLOCKED | BLOCKED | Missing | n/a | n/a | n/a | n/a | None | Venue source review is blocked.; Approved floor width and length are required.; Venue requires an amphitheatre-native stage boundary instead of arena defaults.; No approved low-steel, centerhung trim, or retraction clearance fact is available.; Source is stale or undated; keep final engineering confirmation open. |
| heb-center | PASS_WITH_WARNINGS | READY | 85 x 250 ft | 3.5 | 28 | 112 | 9.17 | heb-end-stage-floor-width-85, heb-end-stage-floor-length-250, heb-low-steel-50, heb-scoreboard-clearance-retracts | Only 3.5 ft remains per side against the approved floor width.; Native CAD/rigging files remain requested before final operations. |
| dickies-arena | BLOCKED | BLOCKED | Missing | n/a | n/a | n/a | 39.17 | dickies-scoreboard-concert-trim-80 | Venue source review is blocked.; Approved floor width and length are required. |

## Fit rules

- DRT geometry is derived from `src/geometry/drt.ts`; dimensions are not hand-typed into reports.
- A fit check is blocked when approved venue-native floor width/length are missing.
- Open measurement conflicts block fit approval even when other measurements exist.
- Passing with warnings keeps native CAD, stale-source, and tight-clearance follow-ups visible.
