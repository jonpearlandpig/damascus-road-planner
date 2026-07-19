# Venue source review report

Generated from checked-in source inventory and venue review records at `2026-07-18T00:00:00.000Z`.

Summary: 11 reviewed venue PDFs; 90 approved facts; 6 rejected interpretations; 1 open conflict(s); readiness 3 ready / 1 partial / 7 blocked.

| Venue | Source IDs | Revision | Pages | Readiness | Approved facts | Rejected | Conflicts | Missing geometry | Strong fields |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Bok Center | bok-center-production-manual-undated | Undated production manual | 11 (PDF_PAGE_TREE) | BLOCKED | 9 | 1 | 0 | floorWidthFt, floorLengthFt, nativeFloorBoundary, nativeRiggingCad | lowSteelFt, centerhungBottomFt, centerhungWidthFt, centerhungDepthFt, endStageRiggingLb, centerStageRiggingLb |
| Gainbridge Fieldhouse | gainbridge-fieldhouse-tech-pack-2026 | Snapshot metadata: Updated 2026-01-09; PDF title text: Updated 23 August 2023 | 7 (PDF_PAGE_TREE) | BLOCKED | 5 | 1 | 0 | floorWidthFt, floorLengthFt, nativeFloorBoundary, nativeRiggingCad | roofHeightUpstageFt, roofHeightCenterFt, totalGridRiggingLb, centerhungBottomFt, dockCount |
| Van Andel Arena | van-andel-arena-source-2026 | 01.01.2026 | 27 (PDF_SECTION_MARKERS) | BLOCKED | 11 | 0 | 1 | approvedLowSteelFt, nativeRiggingCad | floorWidthFt, floorLengthFt, highSteelFt, suspendedGridHeightFt, gridHeightFt, gridWidthFt |
| Giant Center | giant-center-source-pack | Source packet registered without visible revision date | 2 (CONNECTOR_TEXT_SEGMENT_ESTIMATE) | PARTIAL | 8 | 0 | 0 | centerhungOrObstructionProfile, nativeRiggingCad | floorWidthFt, floorLengthFt, lowSteelFt, pointLoadLb, houseStageWidthFt, houseStageDepthFt |
| Spectrum Center | spectrum-center-production-guide-2025 | 2025 Production Guide | 28 (TABLE_OF_CONTENTS) | READY | 11 | 0 | 0 | nativeCad, nativeRiggingCad | floorWidthFt, floorLengthFt, lowSteelFt, highSteelFt, endStageRiggingLb, pointLoadLb |
| Target Center | target-center-source-pack | 2023 Technical Packet | 8 (PDF_PAGE_TREE) | BLOCKED | 7 | 1 | 0 | floorWidthFt, floorLengthFt, nativeFloorBoundary, centerhungBottomFt, nativeRiggingCad | lowSteelFt, endStageRiggingLb, dockCount, houseStageMinHeightFt, houseStageMaxHeightFt, centerhungHeightFt |
| T Mobile Center | t-mobile-center-source-pack | Technical information packet; visible issue date not found | 11 (PDF_PAGE_TREE) | READY | 10 | 0 | 0 | currentIssueDate, nativeRiggingCad | floorWidthFt, floorLengthFt, lowSteelFt, endStageRiggingLb, centerStageRiggingLb, totalGridRiggingLb |
| Desert Diamond Arena | desert-diamond-arena-tech-pack-2023 | May 2023 | 17 (TABLE_OF_CONTENTS) | BLOCKED | 8 | 1 | 0 | currentRevision, floorWidthFt, floorLengthFt, nativeFloorBoundary, nativeRiggingCad | lowSteelFt, endStageRiggingLb, centerStageRiggingLb, centerhungBottomFt, dockCount, pushDistanceFt |
| Red Rocks | red-rocks-amphitheatre-guide-2017 | Rev. 3/15/2017 | 37 (TABLE_OF_CONTENTS) | BLOCKED | 2 | 1 | 0 | currentRevision, venueNativeStageBoundary, riggingOrOverheadLimits, accessPathDimensions | venueType, loadingInformation |
| Heb Center | heb-center-technical-manual-2024 | 2024 Technical Manual | 24 (CONNECTOR_TEXT_SEGMENT_ESTIMATE) | READY | 9 | 0 | 0 | nativeCad, nativeRiggingCad | floorWidthFt, floorLengthFt, lowSteelFt, endStageRiggingLb, centerStageRiggingLb, centerhungRetraction |
| Dickies Arena | dickies-arena-tech-pack-2026 | Revised 2026 | 34 (CONNECTOR_TEXT_SEGMENT_ESTIMATE) | BLOCKED | 10 | 1 | 0 | floorWidthFt, floorLengthFt, nativeFloorBoundary, lowSteelFt | buildingLengthFt, buildingWidthFt, dockCount, pushDistanceFt, stageEndOpeningWidthFt, stageEndOpeningHeightFt |

## Review rules

- Approved measurements require page-level evidence from a registered source ID.
- Rejected interpretations are excluded from venue-native geometry.
- Open conflicts block model readiness until the controlling value is resolved.
- Placeholder seed dimensions stay estimate-only when the PDF text does not support them.
- Raw PDFs remain controlled Drive assets and are not copied into git.
