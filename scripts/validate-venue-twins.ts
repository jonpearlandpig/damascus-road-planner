import { allVenueSourceReviews } from '../src/data/venueSourceReviews';
import { venueNativeTwins } from '../src/venue-twins/records';
import { validateVenueNativeTwins } from '../src/venue-twins/validation';
import { checkVenueTwinRecords } from './venue-twin-generate';
import { checkVenueTwinStatusReports } from './venue-twin-report';

const validationErrors = validateVenueNativeTwins(venueNativeTwins, allVenueSourceReviews);
const recordErrors = checkVenueTwinRecords();
const reportErrors = checkVenueTwinStatusReports();

for (const error of validationErrors) console.error(`venue twin error: ${error}`);
for (const error of recordErrors) console.error(`venue twin error: records: ${error}`);
for (const error of reportErrors) console.error(`venue twin error: reports: ${error}`);

const errorCount = validationErrors.length + recordErrors.length + reportErrors.length;
if (errorCount > 0) {
  console.error(`Venue twin validation failed with ${errorCount} error(s).`);
  process.exit(1);
}

console.log(`Venue twin validation passed for ${venueNativeTwins.length} generated twin record(s).`);

