# Venue-native twin status

Generated from checked-in source-review records and deterministic venue-native twin records.

Summary: 11 twins; 3 ready / 1 partial / 7 blocked; 42 approved measurements used; 24 derived geometry records; 1 open conflict(s); health score 34.

| Venue | Readiness | Floor geometry | Rigging geometry | Center-hung geometry | Stage reference | Origin | Approved facts | Derived geometry | Missing critical facts | Conflicts | DRT fit | Rendering |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| bok-center | BLOCKED | Missing | low 90 / high TBD / no grid boundary | 46.67 x 37 / low 75 / APPROVED | UNKNOWN / MISSING | REFERENCE_ORIGIN_WITH_WARNING / Reference origin only | 6 | 2 | floorWidthFt, floorLengthFt, nativeFloorBoundary, nativeRiggingCad | 0 | BLOCKED | BLOCKED_NO_SHELL |
| gainbridge-fieldhouse | BLOCKED | Missing | Missing | TBD x TBD / low 110 / REFERENCE_ONLY | Missing | REFERENCE_ORIGIN_WITH_WARNING / Reference origin only | 1 | 0 | floorWidthFt, floorLengthFt, nativeFloorBoundary, nativeRiggingCad | 0 | BLOCKED | BLOCKED_NO_SHELL |
| van-andel-arena | BLOCKED | 85 x 200 ft / REFERENCE_ONLY | low TBD / high 98 / grid boundary | TBD x TBD / low 65 / REFERENCE_ONLY | UPSTAGE / REFERENCE_ONLY | DERIVED_FLOOR_CENTER / Derived event-floor center | 8 | 5 | approvedLowSteelFt, nativeRiggingCad | 1 | BLOCKED | PARTIAL_RENDER |
| giant-center | PARTIAL | 85 x 200 ft / DERIVED | low 88 / high TBD / no grid boundary | Missing | UPSTAGE / DERIVED | DERIVED_FLOOR_CENTER / Derived event-floor center | 5 | 4 | centerhungOrObstructionProfile, nativeRiggingCad | 0 | PASS_WITH_WARNINGS | PARTIAL_RENDER |
| spectrum-center | READY | 85 x 200 ft / DERIVED | low 107 / high 130 / no grid boundary | Missing | UPSTAGE / DERIVED | DERIVED_FLOOR_CENTER / Derived event-floor center | 4 | 3 | nativeCad, nativeRiggingCad | 0 | PASS_WITH_WARNINGS | READY_TO_RENDER |
| target-center | BLOCKED | Missing | low 100 / high TBD / no grid boundary | Missing | Missing | REFERENCE_ORIGIN_WITH_WARNING / Reference origin only | 1 | 0 | floorWidthFt, floorLengthFt, nativeFloorBoundary, centerhungBottomFt, nativeRiggingCad | 0 | BLOCKED | BLOCKED_NO_SHELL |
| t-mobile-center | READY | 85 x 235 ft / DERIVED | low 98 / high TBD / no grid boundary | 32 x 32 / low 76 / APPROVED | UPSTAGE / DERIVED | DERIVED_FLOOR_CENTER / Derived event-floor center | 5 | 4 | currentIssueDate, nativeRiggingCad | 0 | PASS_WITH_WARNINGS | READY_TO_RENDER |
| desert-diamond-arena | BLOCKED | Missing | low 100 / high TBD / no grid boundary | TBD x TBD / low 58 / REFERENCE_ONLY | UNKNOWN / MISSING | REFERENCE_ORIGIN_WITH_WARNING / Reference origin only | 4 | 1 | currentRevision, floorWidthFt, floorLengthFt, nativeFloorBoundary, nativeRiggingCad | 0 | BLOCKED | BLOCKED_NO_SHELL |
| red-rocks | BLOCKED | Missing | Missing | Missing | Missing | REFERENCE_ORIGIN_WITH_WARNING / Reference origin only | 0 | 0 | currentRevision, venueNativeStageBoundary, riggingOrOverheadLimits, accessPathDimensions | 0 | BLOCKED | BLOCKED_NO_SHELL |
| heb-center | READY | 85 x 250 ft / DERIVED | low 50 / high TBD / no grid boundary | Missing | UPSTAGE / DERIVED | DERIVED_FLOOR_CENTER / Derived event-floor center | 5 | 4 | nativeCad, nativeRiggingCad | 0 | PASS_WITH_WARNINGS | READY_TO_RENDER |
| dickies-arena | BLOCKED | Missing | Missing | TBD x TBD / low 80 / REFERENCE_ONLY | UNKNOWN / MISSING | REFERENCE_ORIGIN_WITH_WARNING / Reference origin only | 3 | 1 | floorWidthFt, floorLengthFt, nativeFloorBoundary, lowSteelFt | 0 | BLOCKED | BLOCKED_NO_SHELL |

## Limitations

- Venue-native geometry is source-review geometry, not venue CAD.
- Derived centers are not labeled as verified center-court points.
- Blocked records cannot contribute controlling fit geometry.
- Fit status is planning fit only, not structural, rigging, egress, installation, or life-safety approval.
