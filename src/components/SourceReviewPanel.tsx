import { useMemo, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, FileCheck2, Filter, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { buildAllDrtFitChecks, type DrtFitCheck } from '../data/drtFitChecks';
import { venueMap } from '../data/venues';
import {
  allVenueSourceReviews,
  buildVenueSourceReviewRows,
  sourceReviewForVenue,
  type VenueMeasurementFact,
  type VenueSourceReviewReadiness,
  type VenueSourceReviewState,
} from '../data/venueSourceReviews';

type ReviewFilter = 'All' | VenueSourceReviewReadiness | 'CONFLICT';

const reviewFilters: ReviewFilter[] = ['All', 'READY', 'PARTIAL', 'BLOCKED', 'CONFLICT'];

const initialFactState = Object.fromEntries(
  allVenueSourceReviews.flatMap((review) => review.extractedFacts.map((fact) => [fact.id, fact.reviewState])),
) as Record<string, VenueSourceReviewState>;

function rowMatchesFilter(row: ReturnType<typeof buildVenueSourceReviewRows>[number], filter: ReviewFilter): boolean {
  if (filter === 'All') return true;
  if (filter === 'CONFLICT') return row.conflicts > 0;
  return row.modelReadiness === filter;
}

function ReadinessIcon({ readiness }: { readiness: VenueSourceReviewReadiness }) {
  if (readiness === 'READY') return <CheckCircle2 size={15} aria-hidden="true" />;
  if (readiness === 'PARTIAL') return <FileCheck2 size={15} aria-hidden="true" />;
  return <AlertTriangle size={15} aria-hidden="true" />;
}

function fitForVenue(fitChecks: DrtFitCheck[], venueSlug: string): DrtFitCheck | undefined {
  return fitChecks.find((check) => check.venueSlug === venueSlug);
}

function factValue(fact: VenueMeasurementFact): string {
  if (typeof fact.normalizedValue !== 'number') return fact.originalValue;
  return `${fact.normalizedValue} ${fact.normalizedUnit}`;
}

export function SourceReviewPanel() {
  const rows = useMemo(() => buildVenueSourceReviewRows(), []);
  const fitChecks = useMemo(() => buildAllDrtFitChecks(), []);
  const [filter, setFilter] = useState<ReviewFilter>('All');
  const [selectedSlug, setSelectedSlug] = useState(rows[0]?.venueSlug ?? '');
  const [factStates, setFactStates] = useState<Record<string, VenueSourceReviewState>>(initialFactState);
  const visibleRows = useMemo(() => rows.filter((row) => rowMatchesFilter(row, filter)), [filter, rows]);
  const selectedReview = sourceReviewForVenue(selectedSlug) ?? allVenueSourceReviews[0];
  const selectedFit = selectedReview ? fitForVenue(fitChecks, selectedReview.venueSlug) : undefined;

  function setFactState(fact: VenueMeasurementFact, state: VenueSourceReviewState) {
    setFactStates((current) => ({ ...current, [fact.id]: state }));
  }

  return (
    <section className="dashboard-section source-review-section" aria-labelledby="source-review-heading">
      <div className="section-heading">
        <div>
          <span className="eyebrow">SOURCE REVIEW</span>
          <h2 id="source-review-heading">Venue source review approvals</h2>
        </div>
        <div className="source-status-summary" aria-label="Venue review summary">
          <span><ShieldCheck size={14} /> {rows.length} reviews</span>
          <span>{rows.reduce((total, row) => total + row.approvedFacts, 0)} approved</span>
          <span>{rows.filter((row) => row.modelReadiness === 'READY').length} ready</span>
          <span>{fitChecks.filter((check) => check.status === 'BLOCKED').length} fit blocked</span>
        </div>
      </div>
      <div className="source-filter-bar" aria-label="Venue review filters">
        <Filter size={15} aria-hidden="true" />
        {reviewFilters.map((option) => (
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
      <div className="source-review-layout">
        <div className="source-review-table" role="table" aria-label="Venue source review approval matrix">
          <div className="source-review-table__header" role="row">
            <span role="columnheader">Venue</span>
            <span role="columnheader">Review</span>
            <span role="columnheader">Fit</span>
            <span role="columnheader">Blockers</span>
          </div>
          {visibleRows.map((row) => {
            const fit = fitForVenue(fitChecks, row.venueSlug);
            return (
              <button
                key={row.venueSlug}
                type="button"
                className={row.venueSlug === selectedReview?.venueSlug ? 'source-review-table__row source-review-table__row--active' : 'source-review-table__row'}
                role="row"
                onClick={() => setSelectedSlug(row.venueSlug)}
              >
                <span className="source-venue" role="cell"><strong>{venueMap[row.venueSlug]?.name ?? row.venueSlug}</strong><small>{row.sourceIds.join(', ')}</small></span>
                <span role="cell"><ReadinessIcon readiness={row.modelReadiness} /> {row.modelReadiness}<small>{row.approvedFacts} approved / {row.rejectedFacts} rejected</small></span>
                <span role="cell">{fit?.status ?? 'UNRESOLVED'}<small>{row.pageCount} pages</small></span>
                <span role="cell">{row.conflicts ? `${row.conflicts} conflict` : row.missingRequiredGeometry.slice(0, 2).join(', ') || 'None'}</span>
              </button>
            );
          })}
        </div>
        {selectedReview && (
          <aside className="source-review-detail" aria-label="Selected venue source review">
            <div className="source-review-detail__top">
              <div>
                <span className="eyebrow">{selectedReview.venueSlug}</span>
                <h3>{venueMap[selectedReview.venueSlug]?.name ?? selectedReview.venueSlug}</h3>
              </div>
              <span className={`review-pill review-pill--${selectedReview.modelReadiness.toLowerCase()}`}>{selectedReview.modelReadiness}</span>
            </div>
            <dl className="source-review-meta">
              <dt>Source</dt><dd>{selectedReview.sourceIdsReviewed.join(', ')}</dd>
              <dt>Revision</dt><dd>{selectedReview.sourceRevision}</dd>
              <dt>Pages</dt><dd>{selectedReview.pageCount} / {selectedReview.pageCountSource}</dd>
              <dt>DRT fit</dt><dd>{selectedFit?.status ?? 'UNRESOLVED'}</dd>
            </dl>
            <div className="source-review-blockers">
              {(selectedFit?.blockers.length ? selectedFit.blockers : selectedReview.missingRequiredGeometry).slice(0, 4).map((blocker) => (
                <span key={blocker}><AlertTriangle size={13} /> {blocker}</span>
              ))}
            </div>
            <div className="source-review-facts" aria-label="Approved source fact controls">
              {selectedReview.extractedFacts.slice(0, 8).map((fact) => {
                const state = factStates[fact.id] ?? fact.reviewState;
                const locked = fact.reviewState === 'CONFLICT' || fact.reviewState === 'NOT_APPLICABLE';
                return (
                  <article key={fact.id} className="source-review-fact">
                    <div>
                      <strong>{fact.label}</strong>
                      <span>{fact.field} / {factValue(fact)}</span>
                      <small>p.{fact.evidence[0]?.page} {fact.evidence[0]?.section}</small>
                    </div>
                    <div className="approval-controls" aria-label={`${fact.label} approval controls`}>
                      <span className={`review-pill review-pill--${state.toLowerCase()}`}>{state}</span>
                      <button type="button" aria-label={`Approve ${fact.label}`} disabled={locked} onClick={() => setFactState(fact, 'APPROVED')}><Check size={14} /></button>
                      <button type="button" aria-label={`Reject ${fact.label}`} disabled={locked} onClick={() => setFactState(fact, 'REJECTED')}><X size={14} /></button>
                      <button type="button" aria-label={`Mark conflict for ${fact.label}`} disabled={fact.reviewState === 'NOT_APPLICABLE'} onClick={() => setFactState(fact, 'CONFLICT')}><AlertTriangle size={14} /></button>
                      <button type="button" aria-label={`Reset ${fact.label}`} onClick={() => setFactState(fact, fact.reviewState)}><RotateCcw size={14} /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}

