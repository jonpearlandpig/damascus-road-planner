# Damascus Road Planner

Interactive venue digital-twin planning application for the Spring 2027 Damascus Road Tour.

## Current scope

- 19-stop route control room
- Interactive, source-backed venue workspaces for Spectrum Center, BOK Center, Dickies Arena, Van Andel Arena, H-E-B Center, T-Mobile Center, and Desert Diamond Arena
- Independent DRT production package with center-court B-stage anchoring
- Confidence, authority, revision, source-lineage, PM/TM action, and comparison interfaces
- Desktop-first workspace with mobile inspection mode

## Development

Supported runtime: Node 22 (`.nvmrc`).

```bash
npm ci
npm run dev
npm run typecheck
npm run lint
npm run validate
npm run test:run
npm run build
npm run audit
npm run check
```

`npm run check` is the local non-interactive quality gate used by CI: typecheck, lint, venue validation, gear-pack validation, tests, and production build.

## Source assets

Venue source PDFs and CAD files are tracked by filename in `source-assets/manifest.json`. Do not fabricate or commit placeholder source documents. If controlled source files are available locally, place them under `source-assets/files/`; that directory is ignored by git.

## Trust boundary

This application is for production planning and advance coordination only. It does not replace venue-issued rigging approval, structural engineering, fire marshal, life safety, seating manifest, ADA review, or department-head signoff.
