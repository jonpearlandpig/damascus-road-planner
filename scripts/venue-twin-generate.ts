import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allVenueSourceReviews, type VenueSourceReviewRecord } from '../src/data/venueSourceReviews';
import { buildVenueNativeTwin } from '../src/venue-twins/buildVenueTwin';
import { validateVenueNativeTwin } from '../src/venue-twins/validation';

const outputDir = join(process.cwd(), 'source-assets', 'venue-twins');

const reviewFilenames: Record<string, string> = {
  'bok-center': 'bok-center.review.json',
  'gainbridge-fieldhouse': 'gainbridge-fieldhouse.review.json',
  'van-andel-arena': 'van-andel-arena.review.json',
  'giant-center': 'giant-center.review.json',
  'spectrum-center': 'spectrum-center.review.json',
  'target-center': 'target-center.review.json',
  't-mobile-center': 't-mobile-center.review.json',
  'desert-diamond-arena': 'desert-diamond-arena.review.json',
  'red-rocks': 'red-rocks.review.json',
  'heb-center': 'heb-center.review.json',
  'dickies-arena': 'dickies-arena.review.json',
};

function reviewChecksum(review: VenueSourceReviewRecord): string {
  const filename = reviewFilenames[review.venueSlug];
  const sourcePath = filename ? join(process.cwd(), 'source-assets', 'reviews', filename) : undefined;
  const raw = sourcePath && existsSync(sourcePath) ? readFileSync(sourcePath, 'utf8') : JSON.stringify(review);
  return createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

export function buildVenueTwinRecords() {
  return allVenueSourceReviews.map((review) => buildVenueNativeTwin(review, reviewChecksum(review)));
}

export function serializeTwinRecord(review: VenueSourceReviewRecord): string {
  return `${JSON.stringify(buildVenueNativeTwin(review, reviewChecksum(review)), null, 2)}\n`;
}

export function writeVenueTwinRecords() {
  mkdirSync(outputDir, { recursive: true });
  for (const review of allVenueSourceReviews) {
    const twin = buildVenueNativeTwin(review, reviewChecksum(review));
    const errors = validateVenueNativeTwin(twin, review);
    if (errors.length) throw new Error(errors.join('\n'));
    writeFileSync(join(outputDir, `${review.venueSlug}.twin.json`), `${JSON.stringify(twin, null, 2)}\n`);
  }
}

export function checkVenueTwinRecords(): string[] {
  const errors: string[] = [];
  for (const review of allVenueSourceReviews) {
    const path = join(outputDir, `${review.venueSlug}.twin.json`);
    const expected = serializeTwinRecord(review);
    if (!existsSync(path)) errors.push(`Missing ${path}`);
    else if (readFileSync(path, 'utf8') !== expected) errors.push(`Stale ${path}`);
  }
  return errors;
}

const isCli = process.argv[1] === fileURLToPath(import.meta.url);

if (isCli && process.argv.includes('--check')) {
  const errors = checkVenueTwinRecords();
  if (errors.length) {
    for (const error of errors) console.error(error);
    console.error('Run npm run generate:venue-twins.');
    process.exit(1);
  }
  console.log(`Venue twin records are current for ${allVenueSourceReviews.length} reviewed venue(s).`);
} else if (isCli) {
  writeVenueTwinRecords();
  console.log(`Wrote ${allVenueSourceReviews.length} venue-native twin record(s).`);
}

