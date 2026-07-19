import { drtPackage } from '../src/data/venues';
import { plannerObjectDefinitions } from '../src/planner/objectLibrary';
import { buildDrtScene } from '../src/production/drt/buildDrtScene';
import { canonicalDrtGeometry, canonicalDrtPackage } from '../src/production/drt/canonicalGeometry';
import { validateDrtGeometry } from '../src/production/drt/validateDrtGeometry';

const result = validateDrtGeometry();
const integrationErrors: string[] = [];
const builtScene = buildDrtScene({
  bStagePosition: { xFt: 0, yFt: 0, zFt: 0 },
  bStagePlacementStatus: 'REFERENCE',
  bStageNotes: [],
});
const canonicalDefinitionIds = new Set(canonicalDrtGeometry.objects.map((object) => object.definitionId));
const libraryDefinitionIds = new Set(plannerObjectDefinitions
  .filter((definition) => definition.geometryClass === 'DRT_TOURING_PRODUCTION')
  .map((definition) => definition.id));

if (drtPackage !== canonicalDrtPackage) integrationErrors.push('The exported DRT package is not the canonical module instance.');
if (builtScene.length !== canonicalDrtGeometry.objects.length) integrationErrors.push('Rendered DRT scene object count does not match the canonical module.');
if (builtScene.some((object) => object.canonicalGeometryId !== object.id)) integrationErrors.push('A rendered DRT object does not retain its canonical stable id.');
if (builtScene.some((object) => object.geometryClass !== 'DRT_TOURING_PRODUCTION' || !object.locked || !object.editable)) integrationErrors.push('Rendered DRT objects must be touring-production, editable only after unlock, and locked by default.');
if ([...canonicalDefinitionIds].some((id) => !libraryDefinitionIds.has(id)) || [...libraryDefinitionIds].some((id) => !canonicalDefinitionIds.has(id))) {
  integrationErrors.push('The production library DRT definitions do not originate exactly from the canonical module.');
}

for (const warning of result.warnings) console.warn(`DRT geometry warning: ${warning}`);
if (!result.valid || integrationErrors.length) {
  for (const error of [...result.errors, ...integrationErrors]) console.error(`DRT geometry error: ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Canonical DRT geometry ${canonicalDrtGeometry.seedVersion} passed for ${canonicalDrtGeometry.objects.length} object(s), with ${canonicalDrtGeometry.unresolved.length} unresolved element(s) excluded.`);
}
