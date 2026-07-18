# Source Assets

Venue PDFs, CAD, rigging documents, and source packets are intentionally not fabricated in this repo.

Use `source-assets/manifest.json` to declare every expected source filename referenced by authored venue data. If a source document is available locally for validation or review, place it under `source-assets/files/`; that directory is ignored by git so private or licensed documents are not published accidentally.

Validation reports referenced files that are not present under `source-assets/files/` as warnings when the manifest explains their status.
