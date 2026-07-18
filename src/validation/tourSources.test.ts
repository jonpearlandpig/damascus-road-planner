import { describe, expect, it } from 'vitest';
import { venues } from '../data/venues';
import {
  buildCompletionMatrix,
  canonicalVenueSlug,
  selectControllingSource,
  sourcesForShow,
  tourSourceSnapshot,
  type TourSourceSnapshot,
} from '../data/tourSources';
import { validateTourSourceInventory } from './tourSources';

function cloneSnapshot(): TourSourceSnapshot {
  return JSON.parse(JSON.stringify(tourSourceSnapshot)) as TourSourceSnapshot;
}

describe('tour source inventory validation', () => {
  it('accepts the checked-in 19-show Drive snapshot', () => {
    const result = validateTourSourceInventory(tourSourceSnapshot, venues);

    expect(result.errors).toEqual([]);
  });

  it('requires exactly 19 route entries with positions 1-19', () => {
    const snapshot = cloneSnapshot();
    snapshot.shows = snapshot.shows.slice(0, 18);

    const result = validateTourSourceInventory(snapshot, venues);

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'shows', message: expect.stringContaining('exactly 19') }),
      expect.objectContaining({ path: 'shows.routePosition', message: expect.stringContaining('19') }),
    ]));
  });

  it('rejects duplicate show IDs', () => {
    const snapshot = cloneSnapshot();
    snapshot.shows[1] = { ...snapshot.shows[1], showId: snapshot.shows[0]!.showId };

    const result = validateTourSourceInventory(snapshot, venues);

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: expect.stringContaining('.showId'), message: expect.stringContaining('duplicate show id') }),
    ]));
  });

  it('canonicalizes known slug aliases without creating duplicate planner slugs', () => {
    expect(canonicalVenueSlug('h-e-b-center')).toBe('heb-center');
    expect(canonicalVenueSlug('giant-center-hershey')).toBe('giant-center');
    expect(canonicalVenueSlug('t-mobile')).toBe('t-mobile-center');
    expect(canonicalVenueSlug('spectrum')).toBe('spectrum-center');
  });

  it('groups duplicate source locations without counting them as independent relevant files', () => {
    const bok = tourSourceSnapshot.shows.find((show) => show.showId === 'show-01-bok-center');
    if (!bok) throw new Error('expected BOK show');
    const sources = sourcesForShow(tourSourceSnapshot, bok);

    expect(sources).toHaveLength(1);
    expect(sources[0]!.duplicateLocations).toHaveLength(1);
    expect(buildCompletionMatrix().find((row) => row.routePosition === 1)?.duplicateSources).toBe(1);
  });

  it('selects only valid controlling sources', () => {
    const bok = tourSourceSnapshot.shows.find((show) => show.showId === 'show-01-bok-center');
    if (!bok) throw new Error('expected BOK show');
    const source = selectControllingSource(sourcesForShow(tourSourceSnapshot, bok));

    expect(source?.sourceId).toBe('bok-center-production-manual-undated');
  });

  it('flags missing source folders as blocked rows', () => {
    const row = buildCompletionMatrix().find((matrixRow) => matrixRow.routePosition === 2);

    expect(row?.sourceFolderFound).toBe('No');
    expect(row?.overallSourceStatus).toBe('Blocked');
    expect(row?.missingAction).toContain('Create 01 SOURCE DOCUMENTS folder');
  });

  it('keeps venue-TBD handling separate from real venue slugs', () => {
    const row = buildCompletionMatrix().find((matrixRow) => matrixRow.routePosition === 13);

    expect(row?.venueSlug).toBe('los-angeles-contingency');
    expect(row?.venueSeedExists).toBe('No');
    expect(row?.overallSourceStatus).toBe('TBD');
  });

  it('preserves completion-status calculation from the snapshot', () => {
    const rows = buildCompletionMatrix();

    expect(rows.filter((row) => row.overallSourceStatus === 'Complete')).toHaveLength(8);
    expect(rows.filter((row) => row.overallSourceStatus === 'Partial')).toHaveLength(3);
    expect(rows.filter((row) => row.overallSourceStatus === 'Blocked')).toHaveLength(7);
    expect(rows.filter((row) => row.overallSourceStatus === 'TBD')).toHaveLength(1);
  });

  it('keeps conflicted venue model readiness blocked', () => {
    const row = buildCompletionMatrix().find((matrixRow) => matrixRow.routePosition === 4);

    expect(row?.venueModelReadiness).toBe('Blocked');
    expect(row?.conflicts).toContain('suspended-grid');
  });

  it('validates repository source paths when a source claims repo availability', () => {
    const snapshot = cloneSnapshot();
    snapshot.sources[0] = {
      ...snapshot.sources[0]!,
      availability: 'AVAILABLE_REPO',
      repositoryPath: 'source-assets/venues/bok-center/missing.pdf',
    };

    const result = validateTourSourceInventory(snapshot, venues, '/definitely/not/the/repo');

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'sources.bok-center-production-manual-undated.repositoryPath', message: expect.stringContaining('does not exist') }),
    ]));
  });

  it('validates Drive IDs for controlled external sources', () => {
    const snapshot = cloneSnapshot();
    snapshot.sources[0] = { ...snapshot.sources[0]!, driveFileId: 'bad' };

    const result = validateTourSourceInventory(snapshot, venues);

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'sources.bok-center-production-manual-undated.driveFileId', message: expect.stringContaining('stable Drive IDs') }),
    ]));
  });

  it('preserves conflict rows in the generated matrix', () => {
    const conflicted = buildCompletionMatrix().filter((row) => row.conflicts !== '0');

    expect(conflicted).toHaveLength(1);
    expect(conflicted[0]?.venue).toBe('Van Andel Arena');
  });
});
