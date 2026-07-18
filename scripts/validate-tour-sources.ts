import { venues } from '../src/data/venues';
import { tourSourceSnapshot } from '../src/data/tourSources';
import { validateTourSourceInventory } from '../src/validation/tourSources';
import { checkTourSourceReports } from './tour-source-report';

const result = validateTourSourceInventory(tourSourceSnapshot, venues);
const reportErrors = checkTourSourceReports();

for (const warning of result.warnings) console.log(`tour source warning: ${warning.path}: ${warning.message}`);
for (const error of result.errors) console.error(`tour source error: ${error.path}: ${error.message}`);
for (const error of reportErrors) console.error(`tour source error: reports: ${error}`);

if (result.errors.length > 0 || reportErrors.length > 0) {
  console.error(`Tour source validation failed with ${result.errors.length + reportErrors.length} error(s) and ${result.warnings.length} warning(s).`);
  process.exit(1);
}

console.log(`Tour source validation passed for ${tourSourceSnapshot.shows.length} show(s), ${tourSourceSnapshot.sources.length} logical source(s).`);

