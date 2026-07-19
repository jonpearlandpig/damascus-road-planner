import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ConfidenceState, MeasurementConfidence, MeasurementStatus, MeasurementUnit, SourceAssetAvailabilityState, SourceAssetControllingStatus } from '../src/data/types';
import { getSourceAsset, sourceAssetManifest } from '../src/data/sourceAssets';
import { venues } from '../src/data/venues';

const reportPath = join(process.cwd(), 'docs', 'source-reconciliation.json');
const reportDate = '2026-07-18';

interface ReconciliationRow {
  venue: string;
  venueSlug: string;
  category: 'geometry' | 'zone' | 'object';
  field: string;
  currentValue: string;
  provenanceStatus: MeasurementStatus | ConfidenceState;
  confidence: MeasurementConfidence | ConfidenceState;
  sourceId: string | null;
  sourceFile: string;
  sourceAvailability: SourceAssetAvailabilityState | 'NOT_DECLARED';
  controllingStatus: SourceAssetControllingStatus | 'NOT_DECLARED';
  note: string;
}

function formatValue(value: number, unit: MeasurementUnit): string {
  if (unit === 'count') return String(value);
  if (unit === 'lb') return `${new Intl.NumberFormat('en-US').format(value)} lb`;
  return `${Number.isInteger(value) ? value : Number(value.toFixed(2))} ft`;
}

function toAscii(value: string): string {
  return value
    .replaceAll('\u2032', ' ft')
    .replaceAll('\u2033', ' in')
    .replaceAll('\u00d7', 'x')
    .replaceAll('\u2014', '-');
}

function reportSourceFile(sourceFile: string): string {
  return sourceFile.includes('AKB') ? 'T.I. design authority' : toAscii(sourceFile);
}

function sourceNote(sourceFile: string, baseNote?: string): string {
  const asset = getSourceAsset(sourceFile);
  const notes = [];
  if (baseNote) notes.push(baseNote);
  if (!asset) notes.push('Source file is not declared in source-assets/manifest.json.');
  if (asset?.availabilityState === 'MISSING' || asset?.availabilityState === 'REQUESTED') notes.push(`Source availability is ${asset.availabilityState}.`);
  if (asset?.knownConflictFlags.length) notes.push(`Flags: ${asset.knownConflictFlags.join(', ')}.`);
  return toAscii(notes.join(' '));
}

function sourceFields(sourceFile: string) {
  const asset = getSourceAsset(sourceFile);
  return {
    sourceId: asset?.id ?? null,
    sourceAvailability: asset?.availabilityState ?? 'NOT_DECLARED',
    controllingStatus: asset?.controllingStatus ?? 'NOT_DECLARED',
  };
}

const rows: ReconciliationRow[] = [];

for (const venue of venues) {
  for (const [field, measurement] of Object.entries(venue.geometryProvenance)) {
    if (!measurement) continue;
    const sourceFile = measurement.source?.file ?? venue.sourceFile;
    rows.push({
      venue: venue.name,
      venueSlug: venue.slug,
      category: 'geometry',
      field,
      currentValue: formatValue(measurement.value, measurement.unit),
      provenanceStatus: measurement.status,
      confidence: measurement.confidence,
      sourceFile: reportSourceFile(sourceFile),
      ...sourceFields(sourceFile),
      note: sourceNote(sourceFile, measurement.note),
    });
  }

  for (const zone of venue.zones) {
    rows.push({
      venue: venue.name,
      venueSlug: venue.slug,
      category: 'zone',
      field: `${zone.id}.positionAndEnvelope`,
      currentValue: `x ${zone.xFt} ft, z ${zone.zFt} ft, ${zone.widthFt} ft x ${zone.depthFt} ft${zone.heightFt ? ` x ${zone.heightFt} ft` : ''}`,
      provenanceStatus: zone.source.confidence,
      confidence: zone.source.confidence,
      sourceFile: reportSourceFile(zone.source.file),
      ...sourceFields(zone.source.file),
      note: sourceNote(zone.source.file, zone.source.originalValue),
    });
  }

  for (const record of venue.objects) {
    const value = record.dimensions ?? record.value ?? record.notes ?? 'Object reference';
    rows.push({
      venue: venue.name,
      venueSlug: venue.slug,
      category: 'object',
      field: record.id,
      currentValue: toAscii(value),
      provenanceStatus: record.source.confidence,
      confidence: record.source.confidence,
      sourceFile: reportSourceFile(record.source.file),
      ...sourceFields(record.source.file),
      note: sourceNote(record.source.file, record.source.originalValue),
    });
  }
}

const report = {
  generatedBy: 'scripts/reconcile-sources.ts',
  generatedAt: reportDate,
  summary: {
    venueCount: venues.length,
    sourceAssetCount: sourceAssetManifest.assets.length,
    reconciliationRowCount: rows.length,
    missingSourceAssets: sourceAssetManifest.assets.filter((asset) => asset.availabilityState === 'MISSING').map((asset) => asset.filename),
    unavailableSourceRows: rows.filter((row) => row.sourceAvailability === 'MISSING' || row.sourceAvailability === 'REQUESTED').length,
    conflictedRows: rows.filter((row) => row.provenanceStatus === 'CONFLICT' || row.note.includes('UNRESOLVED_')).length,
  },
  sourceAssets: sourceAssetManifest.assets,
  rows,
};

const serialized = `${JSON.stringify(report, null, 2)}\n`;

if (process.argv.includes('--check')) {
  if (!existsSync(reportPath)) {
    console.error(`Missing reconciliation report at ${reportPath}. Run npm run reconcile:sources.`);
    process.exit(1);
  }
  const current = readFileSync(reportPath, 'utf8');
  if (current !== serialized) {
    console.error(`Source reconciliation report is stale. Run npm run reconcile:sources.`);
    process.exit(1);
  }
  console.log(`Source reconciliation report is current with ${rows.length} row(s).`);
} else {
  writeFileSync(reportPath, serialized);
  console.log(`Wrote ${reportPath} with ${rows.length} row(s).`);
}
