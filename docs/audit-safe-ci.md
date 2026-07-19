# Audit-Safe CI Baseline

## Runtime

The supported runtime is Node 22. Use `.nvmrc` locally and `npm ci` for deterministic dependency installation from `package-lock.json`.

## Local quality gate

Run the full non-interactive gate with:

```bash
npm run check
```

That runs typecheck, lint, venue validation, gear-pack validation, Vitest, and the production build. Run `npm run audit` separately to check production dependency vulnerabilities from the committed lockfile.

## Venue validation

`npm run validate:venues` validates route and seed data for unique slugs, non-empty markets, valid source/confidence states, non-negative renderer-required dimensions, field-level geometry provenance, source reference structure, duplicate object/zone ids, placeholder estimate handling, Spectrum Center provenance distinctions, and declared source assets.

Missing source PDFs/CAD are warnings when declared in `source-assets/manifest.json`; missing manifest entries are errors.

## Gear validation

`npm run validate:gear` validates every `gear-packs/*.json` file except `schema.json` against `gear-packs/schema.json`, then checks department-specific id prefixes and duplicate item ids.

## Source assets

Controlled source documents belong outside git unless explicitly cleared for this repo. Declare expected filenames in `source-assets/manifest.json`. Local source files can be placed in `source-assets/files/`, which is ignored by git.

## Bundle note

Before this baseline, the lazy route chunk `VenueWorkspace-D7wkMXPh.js` was `1,050.94 kB` minified. The workspace shell now lazy-loads the 3D scene, reducing `VenueWorkspace-GnXM7Kz0.js` to `11.23 kB`.

The Three/R3F scene remains large as `VenueScene-DsY-tGfr.js` at `1,040.75 kB`, so Vite still reports a chunk warning. That warning is documented rather than hidden because further reduction would require deeper 3D dependency strategy work.
