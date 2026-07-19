import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildVenueSourceReviewRows, venueSourceReviewSummary } from '../src/data/venueSourceReviews';
import { buildCompletionMatrix, tourSourceSnapshot } from '../src/data/tourSources';

const reviewJsonPath = join(process.cwd(), 'docs', 'venue-source-review-report.json');
const reviewMarkdownPath = join(process.cwd(), 'docs', 'venue-source-review-report.md');
const missingJsonPath = join(process.cwd(), 'docs', 'missing-venue-source-actions.json');
const missingMarkdownPath = join(process.cwd(), 'docs', 'missing-venue-source-actions.md');

const reviewColumns = [
  'Venue',
  'Source IDs',
  'Revision',
  'Pages',
  'Readiness',
  'Approved facts',
  'Rejected',
  'Conflicts',
  'Missing geometry',
  'Strong fields',
];

function escapeCell(value: unknown): string {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function displaySlug(slug: string): string {
  return slug.split('-').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ');
}

export function buildVenueSourceReviewReport() {
  const rows = buildVenueSourceReviewRows();
  return {
    schemaVersion: 1,
    generatedAt: tourSourceSnapshot.generatedAt,
    generatedFrom: [
      'checked-in Drive source snapshot',
      'source-assets/reviews/*.review.json',
    ],
    summary: venueSourceReviewSummary(),
    rows,
  };
}

export function serializeVenueSourceReviewJson(): string {
  return `${JSON.stringify(buildVenueSourceReviewReport(), null, 2)}\n`;
}

export function serializeVenueSourceReviewMarkdown(): string {
  const report = buildVenueSourceReviewReport();
  const lines = [
    '# Venue source review report',
    '',
    `Generated from checked-in source inventory and venue review records at \`${report.generatedAt}\`.`,
    '',
    `Summary: ${report.summary.venueReviews} reviewed venue PDFs; ${report.summary.approvedFacts} approved facts; ${report.summary.rejectedFacts} rejected interpretations; ${report.summary.openConflicts} open conflict(s); readiness ${report.summary.ready} ready / ${report.summary.partial} partial / ${report.summary.blocked} blocked.`,
    '',
    `| ${reviewColumns.join(' | ')} |`,
    `| ${reviewColumns.map(() => '---').join(' | ')} |`,
    ...report.rows.map((row) => `| ${[
      displaySlug(row.venueSlug),
      row.sourceIds.join(', '),
      row.sourceRevision,
      `${row.pageCount} (${row.pageCountSource})`,
      row.modelReadiness,
      row.approvedFacts,
      row.rejectedFacts,
      row.conflicts,
      row.missingRequiredGeometry.join(', ') || 'None',
      row.strongestApprovedFields.join(', ') || 'None',
    ].map(escapeCell).join(' | ')} |`),
    '',
    '## Review rules',
    '',
    '- Approved measurements require page-level evidence from a registered source ID.',
    '- Rejected interpretations are excluded from venue-native geometry.',
    '- Open conflicts block model readiness until the controlling value is resolved.',
    '- Placeholder seed dimensions stay estimate-only when the PDF text does not support them.',
    '- Raw PDFs remain controlled Drive assets and are not copied into git.',
    '',
  ];
  return lines.join('\n');
}

export function buildMissingVenueSourceActions() {
  const rows = buildCompletionMatrix(tourSourceSnapshot)
    .filter((row) => row.sourceFolderFound === 'No' || row.overallSourceStatus === 'TBD')
    .map((row) => ({
      routePosition: row.routePosition,
      date: row.date,
      market: row.market,
      venue: row.venue,
      venueSlug: row.venueSlug,
      sourceFolderFound: row.sourceFolderFound,
      overallSourceStatus: row.overallSourceStatus,
      priority: row.overallSourceStatus === 'TBD' ? 'P0' : 'P1',
      requestedDocuments: row.overallSourceStatus === 'TBD'
        ? ['Venue identity authority', 'current venue technical packet once venue is assigned', 'floor plan', 'rigging or overhead limits']
        : ['current venue technical packet', 'floor or seating plan', 'rigging plot or overhead limits', 'native CAD if available'],
      publicTemporaryAcceptable: row.overallSourceStatus !== 'TBD',
      action: row.missingAction,
    }));

  return {
    schemaVersion: 1,
    generatedAt: tourSourceSnapshot.generatedAt,
    generatedFrom: 'checked-in Drive source snapshot',
    summary: {
      actions: rows.length,
      venueTbd: rows.filter((row) => row.overallSourceStatus === 'TBD').length,
      missingSourceFolders: rows.filter((row) => row.sourceFolderFound === 'No').length,
    },
    rows,
  };
}

export function serializeMissingActionsJson(): string {
  return `${JSON.stringify(buildMissingVenueSourceActions(), null, 2)}\n`;
}

export function serializeMissingActionsMarkdown(): string {
  const report = buildMissingVenueSourceActions();
  const lines = [
    '# Missing venue source actions',
    '',
    `Generated from \`${report.generatedFrom}\` at \`${report.generatedAt}\`.`,
    '',
    `Summary: ${report.summary.actions} action rows; ${report.summary.missingSourceFolders} missing source folders; ${report.summary.venueTbd} venue-TBD row.`,
    '',
    '| Route | Date | Market | Venue | Priority | Requested documents | Public temporary source | Action |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...report.rows.map((row) => `| ${[
      row.routePosition,
      row.date,
      row.market,
      row.venue,
      row.priority,
      row.requestedDocuments.join(', '),
      row.publicTemporaryAcceptable ? 'Yes' : 'No',
      row.action,
    ].map(escapeCell).join(' | ')} |`),
    '',
  ];
  return lines.join('\n');
}

export function writeVenueReviewReports() {
  writeFileSync(reviewJsonPath, serializeVenueSourceReviewJson());
  writeFileSync(reviewMarkdownPath, serializeVenueSourceReviewMarkdown());
  writeFileSync(missingJsonPath, serializeMissingActionsJson());
  writeFileSync(missingMarkdownPath, serializeMissingActionsMarkdown());
}

export function checkVenueReviewReports(): string[] {
  const expected = [
    [reviewJsonPath, serializeVenueSourceReviewJson()],
    [reviewMarkdownPath, serializeVenueSourceReviewMarkdown()],
    [missingJsonPath, serializeMissingActionsJson()],
    [missingMarkdownPath, serializeMissingActionsMarkdown()],
  ] as const;
  return expected.flatMap(([path, content]) => {
    if (!existsSync(path)) return [`Missing ${path}`];
    return readFileSync(path, 'utf8') === content ? [] : [`Stale ${path}`];
  });
}

const isCli = process.argv[1] === fileURLToPath(import.meta.url);

if (isCli && process.argv.includes('--check')) {
  const errors = checkVenueReviewReports();
  if (errors.length) {
    for (const error of errors) console.error(error);
    console.error('Run npm run report:venue-reviews.');
    process.exit(1);
  }
  console.log('Venue source review reports are current.');
} else if (isCli) {
  writeVenueReviewReports();
  const summary = buildVenueSourceReviewReport().summary;
  console.log(`Wrote venue source review reports for ${summary.venueReviews} reviewed venue PDF(s).`);
}
