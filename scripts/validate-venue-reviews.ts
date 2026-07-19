import { buildAllDrtFitChecks } from '../src/data/drtFitChecks';
import { venueSourceReviewSummary } from '../src/data/venueSourceReviews';
import { validateVenueSourceReviews } from '../src/validation/venueSourceReviews';
import { checkDrtFitCheckReports } from './drt-fit-check';
import { checkVenueReviewReports } from './venue-review-report';

const result = validateVenueSourceReviews();
const reviewReportErrors = checkVenueReviewReports();
const fitReportErrors = checkDrtFitCheckReports();

for (const warning of result.warnings) console.log(`venue review warning: ${warning.path}: ${warning.message}`);
for (const error of result.errors) console.error(`venue review error: ${error.path}: ${error.message}`);
for (const error of reviewReportErrors) console.error(`venue review error: reports: ${error}`);
for (const error of fitReportErrors) console.error(`venue review error: fit-check reports: ${error}`);

const errorCount = result.errors.length + reviewReportErrors.length + fitReportErrors.length;
if (errorCount > 0) {
  console.error(`Venue review validation failed with ${errorCount} error(s) and ${result.warnings.length} warning(s).`);
  process.exit(1);
}

const summary = venueSourceReviewSummary();
const blockedFitChecks = buildAllDrtFitChecks().filter((check) => check.status === 'BLOCKED').length;
console.log(`Venue review validation passed for ${summary.venueReviews} reviewed PDF(s), ${summary.approvedFacts} approved fact(s), ${blockedFitChecks} blocked DRT fit check(s).`);

