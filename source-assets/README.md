# Source Assets

Venue PDFs, CAD, rigging documents, and source packets are intentionally not fabricated in this repo.

Use `source-assets/manifest.json` to declare every expected source filename referenced by authored venue data. If a source document is available locally for validation or review, place it under `source-assets/files/`; that directory is ignored by git so private or licensed documents are not published accidentally.

Availability states are machine-checked:

- `AVAILABLE_LOCAL`: exact expected file is present under ignored `source-assets/files/`.
- `AVAILABLE_EXTERNAL`: controlled source was located outside the repo or in connected project materials, and must not be committed.
- `REQUESTED`: source has been requested but was not available for this reconciliation pass.
- `MISSING`: declared source was not found in the repo, ignored local source folder, mounted workspace, or known controlled-source folders.
- `SUPERSEDED`: source-like material exists but is not the controlling source for the current venue seed.
- `NOT_REQUIRED`: manifest entry is intentionally retained for lineage but is not needed by active venue data.

Validation reports referenced files that are not present under `source-assets/files/` as warnings when the manifest explains their availability state. Missing or requested source files cannot support `VERIFIED` or `REFERENCE` venue measurements.
