import rawSnapshot from '../../source-assets/drive-inventory/jq-spring-2027-source-snapshot.json';
import { venueNativeTwinForSlug } from '../venue-twins/records';

export type SourceAvailability =
  | 'AVAILABLE_REPO'
  | 'AVAILABLE_DRIVE'
  | 'AVAILABLE_EXTERNAL'
  | 'REQUESTED'
  | 'MISSING'
  | 'SUPERSEDED'
  | 'DUPLICATE'
  | 'NOT_REQUIRED';

export type SourceAuthority = 'CONTROLLING' | 'SUPPORTING' | 'REFERENCE_ONLY' | 'SUPERSEDED' | 'UNRESOLVED';
export type SourceReviewState = 'UNREVIEWED' | 'REGISTERED' | 'EXTRACTED' | 'RECONCILED' | 'APPROVED' | 'CONFLICT';
export type SourceCoverageState = 'Available' | 'Missing';
export type TourSourceStatus = 'Complete' | 'Partial' | 'Blocked' | 'TBD';
export type VenueSeedReconciledState = 'Yes' | 'Partial' | 'No';
export type VenueModelReadiness = 'Ready' | 'Partial' | 'Blocked';
export type SourceFolderStatus = 'FOUND' | 'MISSING';

export interface DriveFolderRef {
  id: string;
  title: string;
  url: string;
}

export interface SourceCoverage {
  techPack: SourceCoverageState;
  riggingPlot: SourceCoverageState;
  cadDwgDxf: SourceCoverageState;
  floorOrSeatingPlan: SourceCoverageState;
}

export interface SourceConflict {
  id: string;
  summary: string;
  sourceIds: string[];
  status: 'OPEN' | 'RESOLVED';
}

export interface TourShowSourceInventory {
  showId: string;
  routePosition: number;
  date: string;
  market: string;
  venueName: string;
  venueSlug: string | null;
  routeLevelId?: string;
  venueTbd: boolean;
  showFolderId: string;
  showFolderTitle: string;
  showFolderUrl: string;
  sourceFolderId: string | null;
  sourceFolderTitle: string | null;
  sourceFolderUrl: string | null;
  sourceFolderStatus: SourceFolderStatus;
  sourceIds: string[];
  coverage: SourceCoverage;
  controllingSourceId: string | null;
  venueSeedExists: boolean;
  venueSeedReconciled: VenueSeedReconciledState;
  venueModelReadiness: VenueModelReadiness;
  overallSourceStatus: TourSourceStatus;
  missingAction: string;
  conflicts: SourceConflict[];
}

export interface DuplicateSourceLocation {
  driveFileId: string;
  title: string;
  driveUrl: string;
  sizeBytes: number;
  parentFolderId: string;
  availability: SourceAvailability;
  authority: SourceAuthority;
  reviewState: SourceReviewState;
  notes: string;
}

export interface TourSourceFile {
  sourceId: string;
  title: string;
  driveFileId: string;
  driveUrl: string;
  mimeType: string;
  sizeBytes: number;
  createdTime: string;
  modifiedTime: string;
  documentRevision: string | null;
  documentDate: string | null;
  showId: string;
  showFolderId: string;
  sourceFolderId: string;
  venueSlug: string;
  sourceType: string;
  fileType: string;
  availability: SourceAvailability;
  authority: SourceAuthority;
  reviewState: SourceReviewState;
  repositoryPath: string | null;
  copiedToRepo: boolean;
  parserStatus: string;
  notes: string[];
  duplicateLocations: DuplicateSourceLocation[];
}

export interface TourSourceSnapshot {
  schemaVersion: 2;
  generatedAt: string;
  tourId: string;
  sourceSystem: 'google-drive';
  rootFolder: DriveFolderRef;
  showFilesFolder: DriveFolderRef;
  notes: string[];
  shows: TourShowSourceInventory[];
  sources: TourSourceFile[];
}

export interface TourSourceMatrixRow {
  routePosition: number;
  date: string;
  market: string;
  venue: string;
  venueSlug: string;
  showFolderFound: 'Yes' | 'No';
  sourceFolderFound: 'Yes' | 'No';
  relevantFilesFound: number;
  techPack: SourceCoverageState;
  riggingPlot: SourceCoverageState;
  cadDwgDxf: SourceCoverageState;
  floorOrSeatingPlan: SourceCoverageState;
  controllingSourceIdentified: 'Yes' | 'No' | 'Unresolved';
  duplicateSources: number;
  conflicts: string;
  repoSourceCount: number;
  externalDriveSourceCount: number;
  venueSeedExists: 'Yes' | 'No';
  venueSeedReconciled: VenueSeedReconciledState;
  venueModelReadiness: VenueModelReadiness;
  venueTwinReadiness: string;
  venueTwinRenderingStatus: string;
  missingAction: string;
  overallSourceStatus: TourSourceStatus;
  controllingSourceTitle: string;
}

const badControllingAvailability = new Set<SourceAvailability>(['MISSING', 'DUPLICATE', 'SUPERSEDED']);

export const tourSourceSnapshot = rawSnapshot as TourSourceSnapshot;

export const slugAliases: Record<string, string> = {
  'h-e-b-center': 'heb-center',
  'heb-center': 'heb-center',
  'giant-center-hershey': 'giant-center',
  't-mobile': 't-mobile-center',
  'spectrum': 'spectrum-center',
  'red-rocks-amphitheatre': 'red-rocks',
  'la-contingency': 'los-angeles-contingency',
};

export function canonicalVenueSlug(slug: string): string {
  return slugAliases[slug] ?? slug;
}

export function sourcesForShow(snapshot: TourSourceSnapshot, show: TourShowSourceInventory): TourSourceFile[] {
  const byId = new Map(snapshot.sources.map((source) => [source.sourceId, source]));
  return show.sourceIds.map((sourceId) => byId.get(sourceId)).filter((source): source is TourSourceFile => Boolean(source));
}

export function selectControllingSource(sources: TourSourceFile[]): TourSourceFile | undefined {
  return sources.find((source) => source.authority === 'CONTROLLING' && !badControllingAvailability.has(source.availability));
}

export function duplicateLocationCount(sources: TourSourceFile[]): number {
  return sources.reduce((total, source) => total + source.duplicateLocations.length, 0);
}

export function buildCompletionMatrix(snapshot: TourSourceSnapshot = tourSourceSnapshot): TourSourceMatrixRow[] {
  return [...snapshot.shows]
    .sort((left, right) => left.routePosition - right.routePosition)
    .map((show) => {
      const sources = sourcesForShow(snapshot, show);
      const controlling = show.controllingSourceId ? sources.find((source) => source.sourceId === show.controllingSourceId) : undefined;
      const validControlling = controlling && controlling.authority === 'CONTROLLING' && !badControllingAvailability.has(controlling.availability);
      const unresolved = sources.length > 0 && !validControlling;
      const conflicts = show.conflicts.map((conflict) => conflict.summary).join('; ');
      const twin = show.venueSlug ? venueNativeTwinForSlug(show.venueSlug) : undefined;

      return {
        routePosition: show.routePosition,
        date: show.date,
        market: show.market,
        venue: show.venueName,
        venueSlug: show.venueSlug ?? show.routeLevelId ?? 'VENUE_TBD',
        showFolderFound: show.showFolderId ? 'Yes' : 'No',
        sourceFolderFound: show.sourceFolderStatus === 'FOUND' ? 'Yes' : 'No',
        relevantFilesFound: sources.length,
        techPack: show.coverage.techPack,
        riggingPlot: show.coverage.riggingPlot,
        cadDwgDxf: show.coverage.cadDwgDxf,
        floorOrSeatingPlan: show.coverage.floorOrSeatingPlan,
        controllingSourceIdentified: validControlling ? 'Yes' : unresolved ? 'Unresolved' : 'No',
        duplicateSources: duplicateLocationCount(sources),
        conflicts: show.conflicts.length ? `${show.conflicts.length}: ${conflicts}` : '0',
        repoSourceCount: sources.filter((source) => source.availability === 'AVAILABLE_REPO' || source.repositoryPath).length,
        externalDriveSourceCount: sources.filter((source) => source.availability === 'AVAILABLE_DRIVE').length,
        venueSeedExists: show.venueSeedExists ? 'Yes' : 'No',
        venueSeedReconciled: show.venueSeedReconciled,
        venueModelReadiness: show.venueModelReadiness,
        venueTwinReadiness: twin?.readiness ?? 'NO_TWIN',
        venueTwinRenderingStatus: twin?.diagnostics.renderingStatus ?? 'NO_TWIN',
        missingAction: show.missingAction,
        overallSourceStatus: show.overallSourceStatus,
        controllingSourceTitle: controlling?.title ?? 'Unresolved',
      };
    });
}

export function matrixSummary(rows: TourSourceMatrixRow[]) {
  return {
    showCount: rows.length,
    complete: rows.filter((row) => row.overallSourceStatus === 'Complete').length,
    partial: rows.filter((row) => row.overallSourceStatus === 'Partial').length,
    blocked: rows.filter((row) => row.overallSourceStatus === 'Blocked').length,
    tbd: rows.filter((row) => row.overallSourceStatus === 'TBD').length,
    relevantFilesFound: rows.reduce((total, row) => total + row.relevantFilesFound, 0),
    repoSourceCount: rows.reduce((total, row) => total + row.repoSourceCount, 0),
    externalDriveSourceCount: rows.reduce((total, row) => total + row.externalDriveSourceCount, 0),
    duplicateSources: rows.reduce((total, row) => total + row.duplicateSources, 0),
    conflicts: rows.filter((row) => row.conflicts !== '0').length,
  };
}
