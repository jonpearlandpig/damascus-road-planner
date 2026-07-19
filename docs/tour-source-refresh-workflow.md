# Tour source refresh workflow

The checked-in source inventory is deterministic and offline:

- Snapshot: `source-assets/drive-inventory/jq-spring-2027-source-snapshot.json`
- Markdown matrix: `docs/19-show-source-completion-matrix.md`
- JSON matrix: `docs/19-show-source-completion-matrix.json`

Refresh process for a connected Codex session:

1. Open the connected Google Drive folder `JQ Spring 2027 Arena Tour — TELAadvance`.
2. Open `03 SHOW FILES — By Date + Venue`.
3. For each of the 19 route-position show folders, open `01 SOURCE DOCUMENTS — Venue · Rider · Contracts` when present.
4. List all direct children and nested venue, CAD, rigging, reference, archive, and superseded folders.
5. Record stable Drive IDs, exact titles, MIME types, sizes, created/modified timestamps, source-folder IDs, duplicate locations, authority role, availability, and review state.
6. Update `source-assets/drive-inventory/jq-spring-2027-source-snapshot.json`.
7. Run:

```sh
npm run inventory:tour-sources
npm run report:tour-sources
npm run validate:tour-sources
```

The npm commands do not call Google Drive. They validate and report from the checked-in snapshot so CI remains deterministic and does not depend on Drive authentication.

