import type {
  ConfidenceState,
  SourceRef,
  VenueGeometry,
  VenueGeometryProvenance,
  VenueTwin,
} from '../data/types';
import { emptyResult, type ValidationIssue, type ValidationResult } from './issues';

const sourceStatuses: Array<VenueTwin['sourceStatus']> = ['READY', 'MISSING', 'STALE', 'CONFLICT'];
const confidenceStates: ConfidenceState[] = [
  'VERIFIED',
  'CALIBRATED PLANNING',
  'APPROXIMATE PLANNING',
  'UNVERIFIED',
  'CONFLICT',
  'ENGINEERING CONFIRMATION REQUIRED',
];
const measurementStatuses = ['VERIFIED', 'REFERENCE', 'ESTIMATE', 'MISSING'];
const measurementConfidences = ['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'];

export interface SourceAssetManifestEntry {
  filename: string;
  status: 'external' | 'excluded' | 'unavailable' | 'missing';
  referencedBy: string[];
  notes: string;
}

export interface SourceAssetManifest {
  assets: SourceAssetManifestEntry[];
}

export interface VenueValidationOptions {
  sourceAssetManifest?: SourceAssetManifest;
  existingSourceFiles?: Set<string>;
}

function issue(path: string, message: string): ValidationIssue {
  return { path, message };
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateSourceRef(path: string, source: SourceRef | undefined, errors: ValidationIssue[]) {
  if (!source) {
    errors.push(issue(path, 'source reference is required'));
    return;
  }
  if (!isNonEmpty(source.file)) errors.push(issue(`${path}.file`, 'source file is required'));
  if (!isNonEmpty(source.section)) errors.push(issue(`${path}.section`, 'source section is required'));
  if (!confidenceStates.includes(source.confidence)) errors.push(issue(`${path}.confidence`, `invalid confidence "${source.confidence}"`));
  if (!isNonEmpty(source.authority)) errors.push(issue(`${path}.authority`, 'source authority is required'));
}

function validateGeometry(path: string, geometry: VenueGeometry, provenance: VenueGeometryProvenance | undefined, errors: ValidationIssue[]) {
  if (!geometry || typeof geometry !== 'object') {
    errors.push(issue(path, 'geometry object is required'));
    return;
  }

  for (const required of ['floorWidthFt', 'floorLengthFt'] as const) {
    if (typeof geometry[required] !== 'number') errors.push(issue(`${path}.${required}`, 'renderer-required dimension is missing'));
  }

  for (const [field, value] of Object.entries(geometry)) {
    const fieldPath = `${path}.${field}`;
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      errors.push(issue(fieldPath, 'dimension must be a finite number'));
      continue;
    }
    if (value < 0) errors.push(issue(fieldPath, 'dimension cannot be negative'));
    if (field === 'dockCount' && !Number.isInteger(value)) errors.push(issue(fieldPath, 'dock count must be an integer'));

    const sourced = provenance?.[field as keyof VenueGeometry];
    if (!sourced) {
      errors.push(issue(`${fieldPath}.provenance`, 'field-level measurement provenance is required'));
      continue;
    }
    if (sourced.value !== value) errors.push(issue(`${fieldPath}.provenance.value`, 'provenance value must match geometry value'));
    if (!measurementStatuses.includes(sourced.status)) errors.push(issue(`${fieldPath}.provenance.status`, `invalid measurement status "${sourced.status}"`));
    if (!measurementConfidences.includes(sourced.confidence)) errors.push(issue(`${fieldPath}.provenance.confidence`, `invalid measurement confidence "${sourced.confidence}"`));
    if (sourced.status === 'ESTIMATE' && !isNonEmpty(sourced.note)) errors.push(issue(`${fieldPath}.provenance.note`, 'estimated measurements require an explanatory note'));
    validateSourceRef(`${fieldPath}.provenance.source`, sourced.source, errors);
  }
}

function addSourceFile(file: string | undefined, files: Set<string>) {
  if (!file) return;
  if (/\.(pdf|dwg|dxf|cad|zip)$/i.test(file)) files.add(file);
}

function collectSourceFiles(venue: VenueTwin, files: Set<string>) {
  addSourceFile(venue.sourceFile, files);
  for (const record of venue.objects) addSourceFile(record.source.file, files);
  for (const zone of venue.zones) addSourceFile(zone.source.file, files);
  for (const sourced of Object.values(venue.geometryProvenance)) addSourceFile(sourced?.source?.file, files);
}

function validateVenue(path: string, venue: VenueTwin, errors: ValidationIssue[]) {
  if (!isNonEmpty(venue.slug)) errors.push(issue(`${path}.slug`, 'venue slug is required'));
  if (!isNonEmpty(venue.name)) errors.push(issue(`${path}.name`, 'venue name is required'));
  if (!isNonEmpty(venue.city)) errors.push(issue(`${path}.city`, 'venue city is required'));
  if (!isNonEmpty(venue.state)) errors.push(issue(`${path}.state`, 'venue state/market is required'));
  if (!sourceStatuses.includes(venue.sourceStatus)) errors.push(issue(`${path}.sourceStatus`, `invalid source status "${venue.sourceStatus}"`));
  if (!confidenceStates.includes(venue.riggingConfidence)) errors.push(issue(`${path}.riggingConfidence`, `invalid rigging confidence "${venue.riggingConfidence}"`));
  if (!confidenceStates.includes(venue.logisticsConfidence)) errors.push(issue(`${path}.logisticsConfidence`, `invalid logistics confidence "${venue.logisticsConfidence}"`));
  if (!Number.isInteger(venue.pmOpen) || venue.pmOpen < 0) errors.push(issue(`${path}.pmOpen`, 'PM open count must be a non-negative integer'));
  if (!Number.isInteger(venue.tmOpen) || venue.tmOpen < 0) errors.push(issue(`${path}.tmOpen`, 'TM open count must be a non-negative integer'));

  validateGeometry(`${path}.geometry`, venue.geometry, venue.geometryProvenance, errors);

  const ids = new Set<string>();
  for (const [index, record] of venue.objects.entries()) {
    const recordPath = `${path}.objects[${index}]`;
    if (!isNonEmpty(record.id)) errors.push(issue(`${recordPath}.id`, 'object id is required'));
    if (ids.has(record.id)) errors.push(issue(`${recordPath}.id`, `duplicate object/zone id "${record.id}"`));
    ids.add(record.id);
    if (!isNonEmpty(record.label)) errors.push(issue(`${recordPath}.label`, 'object label is required'));
    validateSourceRef(`${recordPath}.source`, record.source, errors);
  }

  for (const [index, zone] of venue.zones.entries()) {
    const zonePath = `${path}.zones[${index}]`;
    if (!isNonEmpty(zone.id)) errors.push(issue(`${zonePath}.id`, 'zone id is required'));
    if (ids.has(zone.id)) errors.push(issue(`${zonePath}.id`, `duplicate object/zone id "${zone.id}"`));
    ids.add(zone.id);
    if (!isNonEmpty(zone.label)) errors.push(issue(`${zonePath}.label`, 'zone label is required'));
    for (const field of ['xFt', 'zFt', 'widthFt', 'depthFt'] as const) {
      if (typeof zone[field] !== 'number' || !Number.isFinite(zone[field])) errors.push(issue(`${zonePath}.${field}`, 'zone dimension must be a finite number'));
    }
    if (zone.widthFt < 0 || zone.depthFt < 0 || (zone.heightFt ?? 0) < 0) errors.push(issue(zonePath, 'zone dimensions cannot be negative'));
    validateSourceRef(`${zonePath}.source`, zone.source, errors);
  }

  if (!venue.detailed) {
    for (const [field, sourced] of Object.entries(venue.geometryProvenance)) {
      if (sourced?.status !== 'ESTIMATE') errors.push(issue(`${path}.geometry.${field}.provenance.status`, 'placeholder geometry must be marked ESTIMATE'));
      if (sourced?.confidence !== 'LOW' && sourced?.confidence !== 'UNKNOWN') errors.push(issue(`${path}.geometry.${field}.provenance.confidence`, 'placeholder geometry must use LOW or UNKNOWN confidence'));
    }
  }
}

function validateSpectrumDistinctions(venues: VenueTwin[], errors: ValidationIssue[]) {
  const spectrum = venues.find((venue) => venue.slug === 'spectrum-center');
  if (!spectrum) {
    errors.push(issue('venues.spectrum-center', 'Spectrum Center record is required'));
    return;
  }
  if (spectrum.sourceFile !== '2025 Spectrum Center Production Guide.pdf') errors.push(issue('venues.spectrum-center.sourceFile', 'Spectrum source file label changed unexpectedly'));
  if (spectrum.sourceYear !== '2025 production guide') errors.push(issue('venues.spectrum-center.sourceYear', 'Spectrum source year label changed unexpectedly'));
  if (spectrum.riggingConfidence !== 'ENGINEERING CONFIRMATION REQUIRED') errors.push(issue('venues.spectrum-center.riggingConfidence', 'Spectrum rigging confidence distinction must remain visible'));
  if (spectrum.logisticsConfidence !== 'CALIBRATED PLANNING') errors.push(issue('venues.spectrum-center.logisticsConfidence', 'Spectrum logistics confidence distinction must remain visible'));
}

function validateSourceAssets(sourceFiles: Set<string>, options: VenueValidationOptions, result: ValidationResult) {
  const manifestByFile = new Map((options.sourceAssetManifest?.assets ?? []).map((entry) => [entry.filename, entry]));
  for (const file of sourceFiles) {
    const manifestEntry = manifestByFile.get(file);
    if (!manifestEntry) {
      result.errors.push(issue(`sourceAssets.${file}`, 'referenced source asset is missing from source-assets/manifest.json'));
      continue;
    }
    if (!options.existingSourceFiles?.has(file)) {
      result.warnings.push(issue(`sourceAssets.${file}`, `source asset is not committed under source-assets/files; manifest status is ${manifestEntry.status}`));
    }
  }
}

export function validateVenues(venues: VenueTwin[], options: VenueValidationOptions = {}): ValidationResult {
  const result = emptyResult();
  const slugs = new Set<string>();
  const sourceFiles = new Set<string>();

  for (const [index, venue] of venues.entries()) {
    const path = `venues[${index}]`;
    if (slugs.has(venue.slug)) result.errors.push(issue(`${path}.slug`, `duplicate venue slug "${venue.slug}"`));
    slugs.add(venue.slug);
    validateVenue(path, venue, result.errors);
    collectSourceFiles(venue, sourceFiles);
  }

  validateSpectrumDistinctions(venues, result.errors);
  validateSourceAssets(sourceFiles, options, result);

  return result;
}
