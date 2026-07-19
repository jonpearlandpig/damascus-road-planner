import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCompletionMatrix, matrixSummary, tourSourceSnapshot, type TourSourceMatrixRow } from '../src/data/tourSources';

const jsonReportPath = join(process.cwd(), 'docs', '19-show-source-completion-matrix.json');
const markdownReportPath = join(process.cwd(), 'docs', '19-show-source-completion-matrix.md');

const columns: Array<[keyof TourSourceMatrixRow, string]> = [
  ['routePosition', 'Route position'],
  ['date', 'Date'],
  ['market', 'Market'],
  ['venue', 'Venue'],
  ['venueSlug', 'Venue slug'],
  ['showFolderFound', 'Show folder found'],
  ['sourceFolderFound', 'Source folder found'],
  ['relevantFilesFound', 'Relevant files found'],
  ['techPack', 'Tech pack'],
  ['riggingPlot', 'Rigging plot'],
  ['cadDwgDxf', 'CAD/DWG/DXF'],
  ['floorOrSeatingPlan', 'Floor or seating plan'],
  ['controllingSourceIdentified', 'Controlling source identified'],
  ['duplicateSources', 'Duplicate sources'],
  ['conflicts', 'Conflicts'],
  ['repoSourceCount', 'Repo source count'],
  ['externalDriveSourceCount', 'External Drive source count'],
  ['venueSeedExists', 'Venue seed exists'],
  ['venueSeedReconciled', 'Venue seed reconciled'],
  ['venueModelReadiness', 'Venue model readiness'],
  ['venueTwinReadiness', 'Venue twin readiness'],
  ['venueTwinRenderingStatus', 'Venue twin rendering'],
  ['missingAction', 'Missing action'],
  ['overallSourceStatus', 'Overall source status'],
];

function escapeCell(value: unknown): string {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

export function buildTourSourceReport() {
  const rows = buildCompletionMatrix(tourSourceSnapshot);
  const summary = matrixSummary(rows);
  return {
    schemaVersion: 1,
    generatedAt: tourSourceSnapshot.generatedAt,
    generatedFrom: 'source-assets/drive-inventory/jq-spring-2027-source-snapshot.json',
    tourId: tourSourceSnapshot.tourId,
    rootFolder: tourSourceSnapshot.rootFolder,
    summary,
    rows,
  };
}

export function serializeTourSourceReportJson(): string {
  return `${JSON.stringify(buildTourSourceReport(), null, 2)}\n`;
}

export function serializeTourSourceReportMarkdown(): string {
  const report = buildTourSourceReport();
  const header = columns.map(([, label]) => label);
  const divider = columns.map(() => '---');
  const lines = [
    '# 19-show source completion matrix',
    '',
    `Generated from \`${report.generatedFrom}\` at \`${report.generatedAt}\`.`,
    '',
    `Google Drive folder: [${report.rootFolder.title}](${report.rootFolder.url})`,
    '',
    `Summary: ${report.summary.showCount} shows; ${report.summary.relevantFilesFound} logical relevant files; ${report.summary.externalDriveSourceCount} controlled Drive sources; ${report.summary.repoSourceCount} repo sources; ${report.summary.duplicateSources} duplicate Drive locations; ${report.summary.conflicts} conflicted show(s).`,
    '',
    `| ${header.join(' | ')} |`,
    `| ${divider.join(' | ')} |`,
    ...report.rows.map((row) => `| ${columns.map(([key]) => escapeCell(row[key])).join(' | ')} |`),
    '',
  ];
  return lines.join('\n');
}

export function writeTourSourceReports() {
  writeFileSync(jsonReportPath, serializeTourSourceReportJson());
  writeFileSync(markdownReportPath, serializeTourSourceReportMarkdown());
}

export function checkTourSourceReports(): string[] {
  const errors: string[] = [];
  const expectedJson = serializeTourSourceReportJson();
  const expectedMarkdown = serializeTourSourceReportMarkdown();
  if (!existsSync(jsonReportPath)) {
    errors.push(`Missing ${jsonReportPath}`);
  } else if (readFileSync(jsonReportPath, 'utf8') !== expectedJson) {
    errors.push(`Stale ${jsonReportPath}`);
  }
  if (!existsSync(markdownReportPath)) {
    errors.push(`Missing ${markdownReportPath}`);
  } else if (readFileSync(markdownReportPath, 'utf8') !== expectedMarkdown) {
    errors.push(`Stale ${markdownReportPath}`);
  }
  return errors;
}

const isCli = process.argv[1] === fileURLToPath(import.meta.url);

if (isCli && process.argv.includes('--check')) {
  const errors = checkTourSourceReports();
  if (errors.length) {
    for (const error of errors) console.error(error);
    console.error('Run npm run report:tour-sources.');
    process.exit(1);
  }
  console.log('19-show source completion reports are current.');
} else if (isCli) {
  writeTourSourceReports();
  const summary = buildTourSourceReport().summary;
  console.log(`Wrote 19-show source completion reports with ${summary.showCount} row(s) and ${summary.relevantFilesFound} logical source file(s).`);
}
