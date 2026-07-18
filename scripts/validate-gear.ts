import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateGearPack } from '../src/validation/gear';
import { mergeResults } from '../src/validation/issues';

const root = process.cwd();
const gearDir = join(root, 'gear-packs');
const schema = JSON.parse(readFileSync(join(gearDir, 'schema.json'), 'utf8')) as object;
const packFiles = readdirSync(gearDir)
  .filter((file) => file.endsWith('.json') && file !== 'schema.json')
  .sort();

const result = mergeResults(
  ...packFiles.map((file) => validateGearPack(JSON.parse(readFileSync(join(gearDir, file), 'utf8')), schema, `gear-packs/${file}`)),
);

for (const warning of result.warnings) console.log(`gear warning: ${warning.path}: ${warning.message}`);
for (const error of result.errors) console.error(`gear error: ${error.path}: ${error.message}`);

if (result.errors.length > 0) {
  console.error(`Gear-pack validation failed with ${result.errors.length} error(s).`);
  process.exit(1);
}

console.log(`Gear-pack validation passed for ${packFiles.length} file(s).`);
