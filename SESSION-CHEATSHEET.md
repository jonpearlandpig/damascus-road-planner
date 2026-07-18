# SESSION CHEAT SHEET — Claude Code + Codex · DRT Products
Print/pin this. One job per session. Every session ends with a commit.

## Start any session
    cd <repo folder>
    claude
It reads CLAUDE.md automatically. First words to it: state the ONE job.

## Stage Builder — new client project
Say: "New project from master template: client ACME, project Riverfest.
Create projects/ACME-Riverfest/, file ACME-Riverfest-RevA.html, set title block.
Attach gear packs: lighting, audio, sfx. Commit and tag stagebuilder/ACME-Riverfest-RevA."

## Stage Builder — edit existing
Say: "Open projects/ACME-Riverfest. Bump to RevB (copy RevA, do not touch it).
Change deck to 60x40. Commit and tag RevB."

## Stage Builder — issue to client
Say: "Export locked build of ACME-Riverfest-RevB to dist/. Verify data-locked=1.
Give me the file + SHA-256." Then YOU upload to hosting (human step), Claude verifies readback.

## Planner — venue or gear work
Say: "Branch agent/gear-packs. Add these OWNED items to gear-packs/audio.json
(T.I. source only, no reference names). Run build+lint. Open PR."
Then in Codex: "Review the open PR on damascus-road-planner for anonymization rule
violations and schema compliance."

## Golden rules
1. Saving = committing. No commit, no save.
2. New Rev for every change; never edit a superseded Rev; tags = catalog.
3. Editable masters never go anywhere public. Locked exports only.
4. No band/tour/manager/vendor names in any repo — "T.I." only.
5. State changes get one BCR entry in Notion, newest on top.
