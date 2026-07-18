import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { venues } from '../src/data/venues';
import { validateVenues, type SourceAssetManifest } from '../src/validation/venues';

const root = process.cwd();
const manifestPath = join(root, 'source-assets', 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as SourceAssetManifest;
const existingSourceFiles = new Set(
  manifest.assets
    .map((asset) => asset.filename)
    .filter((filename) => existsSync(join(root, 'source-assets', 'files', filename))),
);
const result = validateVenues(venues, { sourceAssetManifest: manifest, existingSourceFiles });

for (const warning of result.warnings) console.log(`venue warning: ${warning.path}: ${warning.message}`);
for (const error of result.errors) console.error(`venue error: ${error.path}: ${error.message}`);

if (result.errors.length > 0) {
  console.error(`Venue validation failed with ${result.errors.length} error(s) and ${result.warnings.length} warning(s).`);
  process.exit(1);
}

console.log(`Venue validation passed with ${result.warnings.length} warning(s).`);
