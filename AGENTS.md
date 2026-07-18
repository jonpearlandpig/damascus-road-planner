# AGENTS.md ADDITIONS — damascus-road-planner
Append to the repo's agent rules file (create AGENTS.md if absent; AGENTS.md defers to it).
BCR ruling stands: this repo is current TELA code authority — no second competing TELA repo.

## Engine / Data model
- App code = ENGINE (the licensable planner/ShowMaster product).
- `venues/` = DATA — the sellable venue information database. A venue renders only what
  its filed sources support; missing is acceptable, wrong is not. Venue identity
  authority is TELAvenue Master.
- `gear-packs/` = DATA — canonical dept JSONs (this repo hosts the canonical copy;
  stage-builder syncs from here). Schema in gear-packs/_SCHEMA.md.

## Anonymization (licensing-readiness, HARD)
No band/tour/artist/manager/vendor/quote names anywhere in this repo — venue seeds,
gear packs, comments, commit messages, test fixtures included. Comparable data is
labeled "T.I." (TELA Intelligence). True-source crosswalk lives ONLY in the Notion AKB.

## Session discipline
- One job per session; work on `agent/<topic>` branches; CI (build+lint) must pass
  before merge to main. Codex reviews diffs/PRs; Codex builds. Never both on
  one branch simultaneously.
- Geometry authority: BCR ruling > Rev B artifact > any code. Derived numbers are
  computed with asserts, never hand-typed. Every value carries VERIFIED/ESTIMATE/TBD.
- Sessions that change state log one entry to the DRT Build Control Room, newest on top.

## Rider gate (unchanged)
No rider generation before route lock + design lock + a scale-verified weights path.
