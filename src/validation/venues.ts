import type {
  ConfidenceState,
  MeasurementConfidence,
  MeasurementStatus,
  SourceRef,
  SourceAssetAvailabilityState,
  SourceAssetControllingStatus,
  SourceAssetManifest,
  SourceAssetManifestEntry,
  SourceAssetType,
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
const measurementStatuses: MeasurementStatus[] = ['VERIFIED', 'REFERENCE', 'ESTIMATE', 'MISSING', 'CONFLICT'];
const measurementConfidences: MeasurementConfidence[] = ['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'];
const sourceAssetAvailabilityStates: SourceAssetAvailabilityState[] = ['AVAILABLE_LOCAL', 'AVAILABLE_EXTERNAL', 'REQUESTED', 'MISSING', 'SUPERSEDED', 'NOT_REQUIRED'];
const sourceAssetControllingStatuses: SourceAssetControllingStatus[] = ['CONTROLLING', 'REFERENCE', 'SUPERSEDED', 'NOT_REQUIRED'];
const sourceAssetTypes: SourceAssetType[] = ['VENUE_PRODUCTION_GUIDE', 'VENUE_TECH_PACK', 'VENUE_MANUAL', 'VENUE_SOURCE_PACKET', 'CAD', 'RIGGING_PLOT'];
const unavailableSourceStates = new Set<SourceAssetAvailabilityState>(['MISSING', 'REQUESTED']);

export type { SourceAssetManifest };

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

function sourceAssetNeedsFile(entry: SourceAssetManifestEntry): boolean {
  return entry.availabilityState === 'AVAILABLE_LOCAL';
}

function isSourcedConfidence(confidence: ConfidenceState): boolean {
  return confidence === 'VERIFIED' || confidence === 'CALIBRATED PLANNING';
}

function validateSourceRef(path: string, source: SourceRef | undefined, errors: ValidationIssue[], manifestByFile?: Map<string, SourceAssetManifestEntry>) {
  if (!source) {
    errors.push(issue(path, 'source reference is required'));
    return;
  }
  if (!isNonEmpty(source.file)) errors.push(issue(`${path}.file`, 'source file is required'));
  if (!isNonEmpty(source.section)) errors.push(issue(`${path}.section`, 'source section is required'));
  if (!confidenceStates.includes(source.confidence)) errors.push(issue(`${path}.confidence`, `invalid confidence "${source.confidence}"`));
  if (!isNonEmpty(source.authority)) errors.push(issue(`${path}.authority`, 'source authority is required'));

  const manifestEntry = manifestByFile?.get(source.file);
  if (manifestEntry && unavailableSourceStates.has(manifestEntry.availabilityState) && isSourcedConfidence(source.confidence)) {
    errors.push(issue(`${path}.confidence`, `source confidence "${source.confidence}" is unsupported while manifest state is ${manifestEntry.availabilityState}`));
  }
}

function validateGeometry(path: string, geometry: VenueGeometry, provenance: VenueGeometryProvenance | undefined, errors: ValidationIssue[], manifestByFile?: Map<string, SourceAssetManifestEntry>) {
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
    if ((sourced.status === 'MISSING' || sourced.status === 'CONFLICT') && !isNonEmpty(sourced.note)) errors.push(issue(`${fieldPath}.provenance.note`, `${sourced.status.toLowerCase()} measurements require an explanatory note`));
    const manifestEntry = sourced.source ? manifestByFile?.get(sourced.source.file) : undefined;
    if (manifestEntry && unavailableSourceStates.has(manifestEntry.availabilityState) && (sourced.status === 'VERIFIED' || sourced.status === 'REFERENCE')) {
      errors.push(issue(`${fieldPath}.provenance.status`, `measurement status "${sourced.status}" is unsupported while manifest state is ${manifestEntry.availabilityState}`));
    }
    if (sourced.status === 'VERIFIED' && sourced.confidence !== 'HIGH') errors.push(issue(`${fieldPath}.provenance.confidence`, 'verified measurements must use HIGH confidence'));
    validateSourceRef(`${fieldPath}.provenance.source`, sourced.source, errors, manifestByFile);
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

function validateVenue(path: string, venue: VenueTwin, errors: ValidationIssue[], manifestByFile?: Map<string, SourceAssetManifestEntry>) {
  if (!isNonEmpty(venue.slug)) errors.push(issue(`${path}.slug`, 'venue slug is required'));
  if (!isNonEmpty(venue.name)) errors.push(issue(`${path}.name`, 'venue name is required'));
  if (!isNonEmpty(venue.city)) errors.push(issue(`${path}.city`, 'venue city is required'));
  if (!isNonEmpty(venue.state)) errors.push(issue(`${path}.state`, 'venue state/market is required'));
  if (!sourceStatuses.includes(venue.sourceStatus)) errors.push(issue(`${path}.sourceStatus`, `invalid source status "${venue.sourceStatus}"`));
  if (!confidenceStates.includes(venue.riggingConfidence)) errors.push(issue(`${path}.riggingConfidence`, `invalid rigging confidence "${venue.riggingConfidence}"`));
  if (!confidenceStates.includes(venue.logisticsConfidence)) errors.push(issue(`${path}.logisticsConfidence`, `invalid logistics confidence "${venue.logisticsConfidence}"`));
  if (!Number.isInteger(venue.pmOpen) || venue.pmOpen < 0) errors.push(issue(`${path}.pmOpen`, 'PM open count must be a non-negative integer'));
  if (!Number.isInteger(venue.tmOpen) || venue.tmOpen < 0) errors.push(issue(`${path}.tmOpen`, 'TM open count must be a non-negative integer'));

  validateGeometry(`${path}.geometry`, venue.geometry, venue.geometryProvenance, errors, manifestByFile);

  const ids = new Set<string>();
  for (const [index, record] of venue.objects.entries()) {
    const recordPath = `${path}.objects[${index}]`;
    if (!isNonEmpty(record.id)) errors.push(issue(`${recordPath}.id`, 'object id is required'));
    if (ids.has(record.id)) errors.push(issue(`${recordPath}.id`, `duplicate object/zone id "${record.id}"`));
    ids.add(record.id);
    if (!isNonEmpty(record.label)) errors.push(issue(`${recordPath}.label`, 'object label is required'));
    validateSourceRef(`${recordPath}.source`, record.source, errors, manifestByFile);
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
    validateSourceRef(`${zonePath}.source`, zone.source, errors, manifestByFile);
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

function validateVanAndelHeightConflict(venues: VenueTwin[], errors: ValidationIssue[]) {
  const vanAndel = venues.find((venue) => venue.slug === 'van-andel-arena');
  if (!vanAndel) return;
  if (vanAndel.sourceStatus !== 'CONFLICT') errors.push(issue('venues.van-andel-arena.sourceStatus', 'Van Andel height conflict must keep sourceStatus CONFLICT until resolved'));
  if (vanAndel.riggingConfidence !== 'CONFLICT') errors.push(issue('venues.van-andel-arena.riggingConfidence', 'Van Andel height conflict must keep riggingConfidence CONFLICT until resolved'));

  const lowSteel = vanAndel.geometryProvenance.lowSteelFt;
  if (vanAndel.geometry.lowSteelFt !== undefined && lowSteel?.status !== 'CONFLICT') {
    errors.push(issue('venues.van-andel-arena.geometry.lowSteelFt.provenance.status', 'Van Andel low steel cannot be rendered as trusted geometry while the grid-height conflict is unresolved'));
  }

  const gridPlane = vanAndel.objects.find((record) => record.id === 'grid-plane');
  if (gridPlane?.source.confidence !== 'CONFLICT') errors.push(issue('venues.van-andel-arena.objects.grid-plane.source.confidence', 'Van Andel grid-plane source must expose the unresolved height conflict'));
  if (!gridPlane?.source.originalValue?.includes('84 ft 7 in') || !gridPlane.source.originalValue.includes('86 ft')) {
    errors.push(issue('venues.van-andel-arena.objects.grid-plane.source.originalValue', 'Van Andel grid-plane must preserve both unresolved height references'));
  }
}

function validateSourceAssetManifest(options: VenueValidationOptions, venuesBySlug: Map<string, VenueTwin>, result: ValidationResult): Map<string, SourceAssetManifestEntry> {
  const manifestByFile = new Map((options.sourceAssetManifest?.assets ?? []).map((entry) => [entry.filename, entry]));
  if (!options.sourceAssetManifest) return manifestByFile;

  const ids = new Set<string>();
  const files = new Set<string>();
  for (const [index, entry] of options.sourceAssetManifest.assets.entries()) {
    const path = `sourceAssets.assets[${index}]`;
    if (!isNonEmpty(entry.id)) result.errors.push(issue(`${path}.id`, 'source asset id is required'));
    if (entry.id && ids.has(entry.id)) result.errors.push(issue(`${path}.id`, `duplicate source asset id "${entry.id}"`));
    ids.add(entry.id);
    if (!isNonEmpty(entry.filename)) result.errors.push(issue(`${path}.filename`, 'expected source filename is required'));
    if (entry.filename && files.has(entry.filename)) result.errors.push(issue(`${path}.filename`, `duplicate source asset filename "${entry.filename}"`));
    files.add(entry.filename);
    if (!isNonEmpty(entry.venueSlug)) result.errors.push(issue(`${path}.venueSlug`, 'venue slug is required'));
    if (!sourceAssetTypes.includes(entry.sourceType)) result.errors.push(issue(`${path}.sourceType`, `invalid source type "${entry.sourceType}"`));
    if (!sourceAssetAvailabilityStates.includes(entry.availabilityState)) result.errors.push(issue(`${path}.availabilityState`, `invalid source availability "${entry.availabilityState}"`));
    if (!sourceAssetControllingStatuses.includes(entry.controllingStatus)) result.errors.push(issue(`${path}.controllingStatus`, `invalid controlling status "${entry.controllingStatus}"`));
    if (!Array.isArray(entry.referencedBy) || entry.referencedBy.length === 0) result.errors.push(issue(`${path}.referencedBy`, 'referencedBy must list at least one venue slug'));
    if (!isNonEmpty(entry.notes)) result.errors.push(issue(`${path}.notes`, 'source asset notes are required'));
    if (!Array.isArray(entry.knownConflictFlags)) result.errors.push(issue(`${path}.knownConflictFlags`, 'knownConflictFlags must be an array'));

    const venue = venuesBySlug.get(entry.venueSlug);
    if (!venue) result.errors.push(issue(`${path}.venueSlug`, `source asset references unknown venue "${entry.venueSlug}"`));
    if (venue && !entry.referencedBy.includes(venue.slug)) result.errors.push(issue(`${path}.referencedBy`, `referencedBy must include venue slug "${venue.slug}"`));
    for (const slug of entry.referencedBy) {
      if (!venuesBySlug.has(slug)) result.errors.push(issue(`${path}.referencedBy`, `source asset references unknown venue "${slug}"`));
    }

    if (sourceAssetNeedsFile(entry) && !options.existingSourceFiles?.has(entry.filename)) {
      result.errors.push(issue(`${path}.availabilityState`, 'AVAILABLE_LOCAL sources must be present under source-assets/files'));
    }
    if (options.existingSourceFiles?.has(entry.filename) && entry.availabilityState !== 'AVAILABLE_LOCAL') {
      result.warnings.push(issue(`sourceAssets.${entry.filename}`, `source file exists under source-assets/files but manifest state is ${entry.availabilityState}`));
    }
    if (entry.controllingStatus === 'CONTROLLING' && unavailableSourceStates.has(entry.availabilityState)) {
      result.errors.push(issue(`${path}.controllingStatus`, 'missing or requested source assets cannot be marked CONTROLLING'));
    }
    if (entry.knownConflictFlags.some((flag) => !isNonEmpty(flag))) {
      result.errors.push(issue(`${path}.knownConflictFlags`, 'conflict flags cannot be blank'));
    }
    if (entry.knownConflictFlags.includes('STALE_SOURCE') && venue?.sourceStatus !== 'STALE') {
      result.errors.push(issue(`${path}.knownConflictFlags`, 'STALE_SOURCE flag requires venue sourceStatus STALE'));
    }
    if (entry.knownConflictFlags.some((flag) => flag.startsWith('UNRESOLVED_')) && venue?.sourceStatus !== 'CONFLICT') {
      result.errors.push(issue(`${path}.knownConflictFlags`, 'unresolved source conflict flag requires venue sourceStatus CONFLICT'));
    }
  }

  return manifestByFile;
}

function validateSourceAssets(sourceFiles: Set<string>, venuesBySlug: Map<string, VenueTwin>, options: VenueValidationOptions, result: ValidationResult, manifestByFile: Map<string, SourceAssetManifestEntry>) {
  for (const file of sourceFiles) {
    const manifestEntry = manifestByFile.get(file);
    if (!manifestEntry) {
      result.errors.push(issue(`sourceAssets.${file}`, 'referenced source asset is missing from source-assets/manifest.json'));
      continue;
    }
    const venue = venuesBySlug.get(manifestEntry.venueSlug);
    if (venue?.sourceStatus === 'READY' && unavailableSourceStates.has(manifestEntry.availabilityState)) {
      result.errors.push(issue(`sourceAssets.${file}`, `venue sourceStatus READY conflicts with manifest state ${manifestEntry.availabilityState}`));
    }
    if (!options.existingSourceFiles?.has(file)) {
      result.warnings.push(issue(`sourceAssets.${file}`, `source asset is not committed under source-assets/files; manifest availability is ${manifestEntry.availabilityState}`));
    }
  }
}

export function validateVenues(venues: VenueTwin[], options: VenueValidationOptions = {}): ValidationResult {
  const result = emptyResult();
  const slugs = new Set<string>();
  const sourceFiles = new Set<string>();
  const venuesBySlug = new Map(venues.map((venue) => [venue.slug, venue]));
  const manifestByFile = validateSourceAssetManifest(options, venuesBySlug, result);

  for (const [index, venue] of venues.entries()) {
    const path = `venues[${index}]`;
    if (slugs.has(venue.slug)) result.errors.push(issue(`${path}.slug`, `duplicate venue slug "${venue.slug}"`));
    slugs.add(venue.slug);
    validateVenue(path, venue, result.errors, manifestByFile);
    collectSourceFiles(venue, sourceFiles);
  }

  validateSpectrumDistinctions(venues, result.errors);
  validateVanAndelHeightConflict(venues, result.errors);
  validateSourceAssets(sourceFiles, venuesBySlug, options, result, manifestByFile);

  return result;
}
