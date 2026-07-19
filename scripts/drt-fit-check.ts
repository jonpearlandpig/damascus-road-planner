import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAllDrtFitChecks, drtFitCheckSummary, type DrtFitCheck } from '../src/data/drtFitChecks';
import { tourSourceSnapshot } from '../src/data/tourSources';
import { drtPackage } from '../src/data/venues';

const jsonPath = join(process.cwd(), 'docs', 'drt-venue-fit-checks.json');
const markdownPath = join(process.cwd(), 'docs', 'drt-venue-fit-checks.md');

function escapeCell(value: unknown): string {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function serializeWarnings(check: DrtFitCheck): string {
  return [...check.blockers, ...check.warnings].join('; ') || 'None';
}

export function buildDrtFitCheckReport() {
  const checks = buildAllDrtFitChecks();
  return {
    schemaVersion: 1,
    generatedAt: tourSourceSnapshot.generatedAt,
    generatedFrom: ['source-assets/reviews/*.review.json', 'src/data/helpers.ts', 'src/geometry/drt.ts'],
    package: {
      id: drtPackage.id,
      revision: drtPackage.revision,
      deckWidthFt: drtPackage.deckWidthFt,
      deckDepthFt: drtPackage.deckDepthFt,
      centerThrustLengthFt: drtPackage.centerThrustLengthFt,
      sideThrustLengthFt: drtPackage.sideThrustLengthFt,
      bStageDiameterFt: drtPackage.bStageDiameterFt,
      bStageLocalZFt: drtPackage.bStageLocalZFt,
    },
    summary: drtFitCheckSummary(checks),
    checks,
  };
}

export function serializeDrtFitCheckJson(): string {
  return `${JSON.stringify(buildDrtFitCheckReport(), null, 2)}\n`;
}

export function serializeDrtFitCheckMarkdown(): string {
  const report = buildDrtFitCheckReport();
  const lines = [
    '# DRT venue fit checks',
    '',
    `Generated from checked-in venue review records at \`${report.generatedAt}\`.`,
    '',
    `Package: ${report.package.deckWidthFt} ft deck width; ${report.package.deckDepthFt} ft deck depth; ${report.package.centerThrustLengthFt} ft center thrust; ${report.package.bStageDiameterFt} ft B-stage; B-stage local Z ${report.package.bStageLocalZFt} ft.`,
    '',
    `Summary: ${report.summary.venuesChecked} reviewed venues; ${report.summary.pass} pass; ${report.summary.passWithWarnings} pass with warnings; ${report.summary.blocked} blocked; ${report.summary.unresolved} unresolved.`,
    '',
    '| Venue | Status | Review readiness | Floor | Side clearance | Upstage clearance | Downstage clearance | Overhead clearance | Evidence facts | Notes |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...report.checks.map((check) => `| ${[
      check.venueSlug,
      check.status,
      check.modelReadiness,
      check.floorWidthFt && check.floorLengthFt ? `${check.floorWidthFt} x ${check.floorLengthFt} ft` : 'Missing',
      check.minSideClearanceFt ?? 'n/a',
      check.upstageClearanceFt ?? 'n/a',
      check.downstageClearanceFt ?? 'n/a',
      check.overheadClearanceFt ?? 'n/a',
      check.checkedFactIds.join(', ') || 'None',
      serializeWarnings(check),
    ].map(escapeCell).join(' | ')} |`),
    '',
    '## Fit rules',
    '',
    '- DRT geometry is derived from `src/geometry/drt.ts`; dimensions are not hand-typed into reports.',
    '- A fit check is blocked when approved venue-native floor width/length are missing.',
    '- Open measurement conflicts block fit approval even when other measurements exist.',
    '- Passing with warnings keeps native CAD, stale-source, and tight-clearance follow-ups visible.',
    '',
  ];
  return lines.join('\n');
}

export function writeDrtFitCheckReports() {
  writeFileSync(jsonPath, serializeDrtFitCheckJson());
  writeFileSync(markdownPath, serializeDrtFitCheckMarkdown());
}

export function checkDrtFitCheckReports(): string[] {
  const expected = [
    [jsonPath, serializeDrtFitCheckJson()],
    [markdownPath, serializeDrtFitCheckMarkdown()],
  ] as const;
  return expected.flatMap(([path, content]) => {
    if (!existsSync(path)) return [`Missing ${path}`];
    return readFileSync(path, 'utf8') === content ? [] : [`Stale ${path}`];
  });
}

const isCli = process.argv[1] === fileURLToPath(import.meta.url);

if (isCli && process.argv.includes('--check')) {
  const errors = checkDrtFitCheckReports();
  if (errors.length) {
    for (const error of errors) console.error(error);
    console.error('Run npm run fit-check:drt.');
    process.exit(1);
  }
  console.log('DRT venue fit check reports are current.');
} else if (isCli) {
  writeDrtFitCheckReports();
  const summary = buildDrtFitCheckReport().summary;
  console.log(`Wrote DRT fit check reports for ${summary.venuesChecked} reviewed venue(s).`);
}

