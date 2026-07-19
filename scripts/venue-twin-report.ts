import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { venueNativeTwins } from '../src/venue-twins/records';
import { venueTwinHealthScore, venueTwinOriginSummary } from '../src/venue-twins/readiness';
import type { VenueNativeGeometry } from '../src/venue-twins/types';

const jsonPath = join(process.cwd(), 'docs', 'venue-native-twin-status.json');
const markdownPath = join(process.cwd(), 'docs', 'venue-native-twin-status.md');

function escapeCell(value: unknown): string {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function floorStatus(twin: VenueNativeGeometry): string {
  if (!twin.floor?.boundary) return 'Missing';
  return `${twin.floor.width?.value ?? 'TBD'} x ${twin.floor.length?.value ?? 'TBD'} ft / ${twin.floor.renderState}`;
}

function riggingStatus(twin: VenueNativeGeometry): string {
  const low = twin.rigging?.lowSteel?.value;
  const high = twin.rigging?.highSteel?.value;
  const grid = twin.rigging?.gridBoundary ? 'grid boundary' : 'no grid boundary';
  if (!low && !high && !twin.rigging?.gridBoundary) return 'Missing';
  return `low ${low ?? 'TBD'} / high ${high ?? 'TBD'} / ${grid}`;
}

function centerHungStatus(twin: VenueNativeGeometry): string {
  const centerHung = twin.obstructions?.centerHung;
  if (!centerHung) return 'Missing';
  const width = centerHung.dimensions.widthFt?.value ?? 'TBD';
  const depth = centerHung.dimensions.depthFt?.value ?? 'TBD';
  const low = centerHung.lowPoint?.value ?? 'TBD';
  return `${width} x ${depth} / low ${low} / ${centerHung.renderState}`;
}

function stageStatus(twin: VenueNativeGeometry): string {
  return twin.stageReference?.endStageDirection ? `${twin.stageReference.endStageDirection} / ${twin.stageReference.renderState}` : 'Missing';
}

export function buildVenueTwinStatusReport() {
  const rows = venueNativeTwins.map((twin) => ({
    venueSlug: twin.venueSlug,
    readiness: twin.readiness,
    floorGeometry: floorStatus(twin),
    riggingGeometry: riggingStatus(twin),
    centerHungGeometry: centerHungStatus(twin),
    stageReference: stageStatus(twin),
    origin: `${twin.coordinateSystem.originMethod} / ${twin.coordinateSystem.originLabel}`,
    approvedFactsUsed: twin.evidence.approvedMeasurementIds,
    derivedFactsUsed: twin.evidence.derivedGeometryIds,
    approximateGeometry: twin.evidence.approximateGeometryIds,
    missingCriticalFacts: twin.diagnostics.missingCriticalFields,
    conflicts: twin.diagnostics.conflictCount,
    drtFitStatus: twin.drtFit.status,
    renderingStatus: twin.diagnostics.renderingStatus,
  }));
  return {
    schemaVersion: 1,
    generatedFrom: ['source-assets/venue-twins/*.twin.json', 'source-assets/reviews/*.review.json'],
    summary: {
      venueTwins: venueNativeTwins.length,
      ready: venueNativeTwins.filter((twin) => twin.readiness === 'READY').length,
      partial: venueNativeTwins.filter((twin) => twin.readiness === 'PARTIAL').length,
      blocked: venueNativeTwins.filter((twin) => twin.readiness === 'BLOCKED').length,
      approvedMeasurementsUsed: venueNativeTwins.reduce((total, twin) => total + twin.evidence.approvedMeasurementIds.length, 0),
      derivedGeometryUsed: venueNativeTwins.reduce((total, twin) => total + twin.evidence.derivedGeometryIds.length, 0),
      approximateGeometryUsed: venueNativeTwins.reduce((total, twin) => total + twin.evidence.approximateGeometryIds.length, 0),
      openConflicts: venueNativeTwins.reduce((total, twin) => total + twin.diagnostics.conflictCount, 0),
      healthScore: venueTwinHealthScore(venueNativeTwins),
      originMethods: venueTwinOriginSummary(venueNativeTwins),
    },
    rows,
  };
}

export function serializeVenueTwinStatusJson(): string {
  return `${JSON.stringify(buildVenueTwinStatusReport(), null, 2)}\n`;
}

export function serializeVenueTwinStatusMarkdown(): string {
  const report = buildVenueTwinStatusReport();
  const lines = [
    '# Venue-native twin status',
    '',
    'Generated from checked-in source-review records and deterministic venue-native twin records.',
    '',
    `Summary: ${report.summary.venueTwins} twins; ${report.summary.ready} ready / ${report.summary.partial} partial / ${report.summary.blocked} blocked; ${report.summary.approvedMeasurementsUsed} approved measurements used; ${report.summary.derivedGeometryUsed} derived geometry records; ${report.summary.openConflicts} open conflict(s); health score ${report.summary.healthScore}.`,
    '',
    '| Venue | Readiness | Floor geometry | Rigging geometry | Center-hung geometry | Stage reference | Origin | Approved facts | Derived geometry | Missing critical facts | Conflicts | DRT fit | Rendering |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...report.rows.map((row) => `| ${[
      row.venueSlug,
      row.readiness,
      row.floorGeometry,
      row.riggingGeometry,
      row.centerHungGeometry,
      row.stageReference,
      row.origin,
      row.approvedFactsUsed.length,
      row.derivedFactsUsed.length,
      row.missingCriticalFacts.join(', ') || 'None',
      row.conflicts,
      row.drtFitStatus,
      row.renderingStatus,
    ].map(escapeCell).join(' | ')} |`),
    '',
    '## Limitations',
    '',
    '- Venue-native geometry is source-review geometry, not venue CAD.',
    '- Derived centers are not labeled as verified center-court points.',
    '- Blocked records cannot contribute controlling fit geometry.',
    '- Fit status is planning fit only, not structural, rigging, egress, installation, or life-safety approval.',
    '',
  ];
  return lines.join('\n');
}

export function writeVenueTwinStatusReports() {
  writeFileSync(jsonPath, serializeVenueTwinStatusJson());
  writeFileSync(markdownPath, serializeVenueTwinStatusMarkdown());
}

export function checkVenueTwinStatusReports(): string[] {
  const checks = [
    [jsonPath, serializeVenueTwinStatusJson()],
    [markdownPath, serializeVenueTwinStatusMarkdown()],
  ] as const;
  return checks.flatMap(([path, expected]) => {
    if (!existsSync(path)) return [`Missing ${path}`];
    return readFileSync(path, 'utf8') === expected ? [] : [`Stale ${path}`];
  });
}

const isCli = process.argv[1] === fileURLToPath(import.meta.url);

if (isCli && process.argv.includes('--check')) {
  const errors = checkVenueTwinStatusReports();
  if (errors.length) {
    for (const error of errors) console.error(error);
    console.error('Run npm run report:venue-twins.');
    process.exit(1);
  }
  console.log('Venue twin status reports are current.');
} else if (isCli) {
  writeVenueTwinStatusReports();
  const summary = buildVenueTwinStatusReport().summary;
  console.log(`Wrote venue-native twin status reports for ${summary.venueTwins} venue(s).`);
}
