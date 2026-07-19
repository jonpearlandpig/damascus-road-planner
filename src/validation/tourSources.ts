import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { VenueTwin } from '../data/types';
import {
  buildCompletionMatrix,
  canonicalVenueSlug,
  selectControllingSource,
  sourcesForShow,
  type SourceAvailability,
  type TourSourceSnapshot,
} from '../data/tourSources';
import { emptyResult, type ValidationResult } from './issues';

const routePositions = Array.from({ length: 19 }, (_, index) => index + 1);
const invalidControllingAvailability = new Set<SourceAvailability>(['MISSING', 'DUPLICATE', 'SUPERSEDED']);
const allowedShowStatuses = new Set(['Complete', 'Partial', 'Blocked', 'TBD']);

function addError(result: ValidationResult, path: string, message: string) {
  result.errors.push({ path, message });
}

function hasDriveId(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{12,}$/.test(value);
}

export function validateTourSourceInventory(snapshot: TourSourceSnapshot, venues: VenueTwin[], root = process.cwd()): ValidationResult {
  const result = emptyResult();
  const venueSlugs = new Set(venues.map((venue) => venue.slug));
  const showIds = new Set<string>();
  const sourceIds = new Set<string>();
  const sourceById = new Map(snapshot.sources.map((source) => [source.sourceId, source]));
  const positions = new Set<number>();

  if (snapshot.schemaVersion !== 2) addError(result, 'schemaVersion', 'tour source snapshot schemaVersion must be 2');
  if (snapshot.shows.length !== 19) addError(result, 'shows', 'tour source snapshot must contain exactly 19 route entries');

  for (const show of snapshot.shows) {
    const showPath = `shows.${show.showId}`;
    if (showIds.has(show.showId)) addError(result, `${showPath}.showId`, `duplicate show id "${show.showId}"`);
    showIds.add(show.showId);

    if (!routePositions.includes(show.routePosition)) addError(result, `${showPath}.routePosition`, 'route position must be 1-19');
    if (positions.has(show.routePosition)) addError(result, `${showPath}.routePosition`, `duplicate route position ${show.routePosition}`);
    positions.add(show.routePosition);

    if (!allowedShowStatuses.has(show.overallSourceStatus)) addError(result, `${showPath}.overallSourceStatus`, `invalid status "${show.overallSourceStatus}"`);
    if (!hasDriveId(show.showFolderId)) addError(result, `${showPath}.showFolderId`, 'show folder must have a stable Drive ID');
    if (show.sourceFolderStatus === 'FOUND' && !hasDriveId(show.sourceFolderId)) addError(result, `${showPath}.sourceFolderId`, 'found source folders must have a stable Drive ID');
    if (show.sourceFolderStatus === 'MISSING' && show.sourceFolderId) addError(result, `${showPath}.sourceFolderId`, 'missing source folders cannot keep a sourceFolderId');

    if (show.venueTbd) {
      if (show.venueSlug !== null) addError(result, `${showPath}.venueSlug`, 'venue-TBD entries must not claim a venue slug');
      if (show.venueModelReadiness === 'Ready') addError(result, `${showPath}.venueModelReadiness`, 'venue-TBD entries cannot be model-ready');
    } else if (!show.venueSlug || !venueSlugs.has(show.venueSlug)) {
      addError(result, `${showPath}.venueSlug`, `confirmed show must link to a venue seed: "${show.venueSlug ?? 'null'}"`);
    }

    for (const sourceId of show.sourceIds) {
      const source = sourceById.get(sourceId);
      if (!source) {
        addError(result, `${showPath}.sourceIds`, `show references missing source "${sourceId}"`);
        continue;
      }
      if (source.showId !== show.showId) addError(result, `${showPath}.sourceIds`, `source "${sourceId}" points at show "${source.showId}"`);
      if (source.venueSlug !== show.venueSlug) addError(result, `${showPath}.sourceIds`, `source "${sourceId}" venue slug does not match the show`);
    }

    const sources = sourcesForShow(snapshot, show);
    const controlling = selectControllingSource(sources);
    if (show.overallSourceStatus === 'Complete' && !controlling) addError(result, `${showPath}.controllingSourceId`, 'complete shows must identify a valid controlling source');
    if (show.controllingSourceId && !sourceById.has(show.controllingSourceId)) addError(result, `${showPath}.controllingSourceId`, 'controlling source id is not registered');
    if (show.venueModelReadiness === 'Ready' && (show.conflicts.length > 0 || show.coverage.techPack === 'Missing' || !controlling)) {
      addError(result, `${showPath}.venueModelReadiness`, 'model-ready shows require a controlling source, filed tech pack, and no conflicts');
    }
  }

  for (const position of routePositions) {
    if (!positions.has(position)) addError(result, 'shows.routePosition', `missing route position ${position}`);
  }

  for (const source of snapshot.sources) {
    const sourcePath = `sources.${source.sourceId}`;
    if (sourceIds.has(source.sourceId)) addError(result, `${sourcePath}.sourceId`, `duplicate source id "${source.sourceId}"`);
    sourceIds.add(source.sourceId);
    if (!showIds.has(source.showId)) addError(result, `${sourcePath}.showId`, `source references missing show "${source.showId}"`);
    if (!venueSlugs.has(source.venueSlug)) addError(result, `${sourcePath}.venueSlug`, `source references missing venue "${source.venueSlug}"`);
    if (canonicalVenueSlug(source.venueSlug) !== source.venueSlug) addError(result, `${sourcePath}.venueSlug`, `source must use canonical slug "${canonicalVenueSlug(source.venueSlug)}"`);
    if (source.availability === 'AVAILABLE_DRIVE' && !hasDriveId(source.driveFileId)) addError(result, `${sourcePath}.driveFileId`, 'Drive sources must have stable Drive IDs');
    if (source.repositoryPath && !existsSync(join(root, source.repositoryPath))) addError(result, `${sourcePath}.repositoryPath`, `repository source path does not exist: ${source.repositoryPath}`);
    if (source.authority === 'CONTROLLING' && invalidControllingAvailability.has(source.availability)) {
      addError(result, `${sourcePath}.authority`, `controlling sources cannot have availability ${source.availability}`);
    }

    const duplicateIds = new Set<string>();
    for (const duplicate of source.duplicateLocations) {
      if (duplicateIds.has(duplicate.driveFileId)) addError(result, `${sourcePath}.duplicateLocations`, `duplicate Drive file id "${duplicate.driveFileId}"`);
      duplicateIds.add(duplicate.driveFileId);
      if (duplicate.availability !== 'DUPLICATE') addError(result, `${sourcePath}.duplicateLocations`, 'duplicate locations must use DUPLICATE availability');
      if (!hasDriveId(duplicate.driveFileId)) addError(result, `${sourcePath}.duplicateLocations`, 'duplicate locations must keep stable Drive IDs');
    }
  }

  const matrix = buildCompletionMatrix(snapshot);
  if (matrix.length !== snapshot.shows.length) addError(result, 'matrix', 'matrix row count must match show count');

  return result;
}

