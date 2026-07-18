import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, CalendarDays, GitCompareArrows, Map, SlidersHorizontal, TriangleAlert } from 'lucide-react';
import { venues } from '../data/venues';
import { venueBrowserRows } from '../planner/venueAdapter';
import { venueTypes, type VenueType } from '../planner/types';
import { ConfidenceBadge } from './ConfidenceBadge';

export function Dashboard() {
  const [typeFilter, setTypeFilter] = useState<VenueType | 'All'>('All');
  const rows = useMemo(() => venueBrowserRows(venues), []);
  const visibleRows = useMemo(() => typeFilter === 'All' ? rows : rows.filter((row) => row.venueType === typeFilter), [rows, typeFilter]);
  const ready = venues.filter((venue) => venue.sourceStatus !== 'MISSING').length;
  const missing = venues.length - ready;

  return (
    <main className="dashboard-page">
      <header className="dashboard-hero">
        <div><span className="eyebrow">DAMASCUS ROAD TOUR / SPRING 2027</span><h1>Venue Twin Control Room</h1><p>One reusable production package. Nineteen venue records. Source-backed planning geometry with visible confidence and revision control.</p></div>
        <div className="hero-actions"><Link className="primary-button" to="/compare"><GitCompareArrows size={17} /> Compare strongest sources</Link></div>
      </header>
      <section className="summary-strip"><div><Map size={18} /><span>Route stops</span><strong>{venues.length}</strong></div><div><Building2 size={18} /><span>Source packages</span><strong>{ready}</strong></div><div><TriangleAlert size={18} /><span>Missing sources</span><strong>{missing}</strong></div><div><CalendarDays size={18} /><span>Run</span><strong>Apr 8-May 8</strong></div></section>
      <section className="dashboard-section">
        <div className="section-heading">
          <div><span className="eyebrow">VENUE BROWSER</span><h2>{visibleRows.length} venue records</h2></div>
          <label className="dashboard-filter">
            <SlidersHorizontal size={16} />
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.currentTarget.value as VenueType | 'All')} aria-label="Venue type filter">
              <option value="All">All venue types</option>
              {venueTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
        </div>
        <div className="venue-grid">{visibleRows.map((row, index) => (
          <article key={row.slug} className={`venue-card ${row.venue.sourceStatus === 'MISSING' ? 'venue-card--missing' : ''}`}>
            <div className="venue-card__topline"><span>STOP {String(index + 1).padStart(2, '0')}</span><span>{row.venue.showDate}</span></div>
            <h3>{row.name}</h3>
            <p>{row.city}, {row.state} / {row.venueType}</p>
            <div className="venue-card__score">
              <div className="score-ring" style={{ '--score': `${row.venue.sourceScore * 3.6}deg` } as CSSProperties}><span>{row.venue.sourceScore}</span></div>
              <div><span>Source readiness</span><strong>{row.sourceReadiness}</strong><small>{row.modelReadiness}</small></div>
            </div>
            <dl className="venue-readiness-list">
              <dt>Floor</dt><dd>{row.floorDimensions}</dd>
              <dt>Rigging</dt><dd>{row.riggingGrid}</dd>
              <dt>Warnings</dt><dd>{row.warnings.length ? row.warnings.slice(0, 2).join(' / ') : 'None filed'}</dd>
            </dl>
            <div className="venue-card__status"><ConfidenceBadge state={row.venue.riggingConfidence} /><span>{row.venue.pmOpen} PM / {row.venue.tmOpen} TM open</span></div>
            <Link className="card-link" to={`/venues/${row.slug}`}>Open venue workspace <ArrowRight size={15} /></Link>
          </article>
        ))}</div>
      </section>
    </main>
  );
}
