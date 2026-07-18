import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Database, FileWarning, Filter, FolderX, MapPinned } from 'lucide-react';
import { buildCompletionMatrix, matrixSummary, type TourSourceMatrixRow } from '../data/tourSources';

type SourceStatusFilter =
  | 'All'
  | 'Complete'
  | 'Partial'
  | 'Blocked'
  | 'Missing tech pack'
  | 'Missing rigging'
  | 'Missing CAD'
  | 'Conflict'
  | 'Venue TBD';

const filters: SourceStatusFilter[] = ['All', 'Complete', 'Partial', 'Blocked', 'Missing tech pack', 'Missing rigging', 'Missing CAD', 'Conflict', 'Venue TBD'];

function rowMatchesFilter(row: TourSourceMatrixRow, filter: SourceStatusFilter): boolean {
  if (filter === 'All') return true;
  if (filter === 'Complete' || filter === 'Partial' || filter === 'Blocked') return row.overallSourceStatus === filter;
  if (filter === 'Missing tech pack') return row.techPack === 'Missing';
  if (filter === 'Missing rigging') return row.riggingPlot === 'Missing';
  if (filter === 'Missing CAD') return row.cadDwgDxf === 'Missing';
  if (filter === 'Conflict') return row.conflicts !== '0';
  return row.overallSourceStatus === 'TBD';
}

function StatusIcon({ row }: { row: TourSourceMatrixRow }) {
  if (row.overallSourceStatus === 'Complete') return <CheckCircle2 size={16} aria-hidden="true" />;
  if (row.overallSourceStatus === 'TBD') return <MapPinned size={16} aria-hidden="true" />;
  if (row.overallSourceStatus === 'Blocked') return <FolderX size={16} aria-hidden="true" />;
  if (row.conflicts !== '0') return <AlertTriangle size={16} aria-hidden="true" />;
  return <FileWarning size={16} aria-hidden="true" />;
}

export function SourceStatusMatrix() {
  const [filter, setFilter] = useState<SourceStatusFilter>('All');
  const rows = useMemo(() => buildCompletionMatrix(), []);
  const visibleRows = useMemo(() => rows.filter((row) => rowMatchesFilter(row, filter)), [filter, rows]);
  const summary = useMemo(() => matrixSummary(rows), [rows]);

  return (
    <section className="dashboard-section source-status-section" aria-labelledby="source-status-heading">
      <div className="section-heading">
        <div>
          <span className="eyebrow">SOURCE INVENTORY</span>
          <h2 id="source-status-heading">19-show source status</h2>
        </div>
        <div className="source-status-summary" aria-label="Source inventory summary">
          <span><Database size={14} /> {summary.relevantFilesFound} files</span>
          <span>{summary.externalDriveSourceCount} Drive</span>
          <span>{summary.duplicateSources} duplicates</span>
          <span>{summary.conflicts} conflict</span>
        </div>
      </div>
      <div className="source-filter-bar" aria-label="Source status filters">
        <Filter size={15} aria-hidden="true" />
        {filters.map((option) => (
          <button
            key={option}
            type="button"
            className={option === filter ? 'source-filter source-filter--active' : 'source-filter'}
            onClick={() => setFilter(option)}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="source-matrix" role="table" aria-label="19-show source completion matrix">
        <div className="source-matrix__header" role="row">
          <span role="columnheader">Stop</span>
          <span role="columnheader">Venue</span>
          <span role="columnheader">Sources</span>
          <span role="columnheader">Coverage</span>
          <span role="columnheader">Readiness</span>
          <span role="columnheader">Blocker</span>
        </div>
        {visibleRows.map((row) => (
          <article key={row.routePosition} className={`source-matrix__row source-matrix__row--${row.overallSourceStatus.toLowerCase()}`} role="row">
            <span className="source-stop" role="cell">{String(row.routePosition).padStart(2, '0')}<small>{row.date}</small></span>
            <span className="source-venue" role="cell"><strong>{row.venue}</strong><small>{row.market} / {row.venueSlug}</small></span>
            <span className="source-counts" role="cell">{row.relevantFilesFound} file<small>{row.controllingSourceTitle}</small><small>{row.externalDriveSourceCount} Drive / {row.duplicateSources} dup</small></span>
            <span className="source-coverage" role="cell">Tech {row.techPack}<small>Rig {row.riggingPlot} / CAD {row.cadDwgDxf}</small></span>
            <span className="source-readiness" role="cell"><StatusIcon row={row} /> {row.overallSourceStatus}<small>{row.venueModelReadiness} model</small></span>
            <span className="source-blocker" role="cell">{row.conflicts !== '0' ? row.conflicts : row.missingAction}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
