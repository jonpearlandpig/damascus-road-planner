# Gear Pack Schema — TELAadvance (Canonical)
One JSON file per department. Both products (Stage Builder projects + Planner/rider) read from here.

## Anonymization rule (HARD)
No band, tour, artist, manager, vendor, venue-contract, or quote-document names anywhere in
these files or this repo. Source lineage uses "T.I." (TELA Intelligence) only. The crosswalk
from a T.I. line to its true source lives ONLY in the Notion AKB (Sources & Rev Control).
If a reference name appears in a gear file, that is a defect — remove it and log to the BCR.

## Item fields
- id          : "LX-0001" style — dept prefix + 4 digits, never reused
- item        : manufacturer/model or generic description (mfr/model OK; tours/people NOT OK)
- qty         : integer
- status      : OWNED | CANDIDATE | RENTAL-TBD
- weight_lbs  : number or "TBD" — stays TBD until scale-verified (rider gate)
- power       : string or "TBD"
- source      : always "T.I."
- notes       : free text, same anonymization rule applies

## Dept prefixes
LX lighting · AU audio · VD video · FX sfx · DK decking · CM cameras · RG rigging

## Fact-state rule
Derived totals are computed by script with asserts, never hand-typed. Weights remain TBD
until scale-verified; no rider issue before the weights path exists.
