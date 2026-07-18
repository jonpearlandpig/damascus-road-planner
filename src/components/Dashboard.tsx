import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, CalendarDays, GitCompareArrows, Map, TriangleAlert } from 'lucide-react';
import { getSourceAsset, sourceAvailabilityLabel } from '../data/sourceAssets';
import { venues } from '../data/venues';
import { ConfidenceBadge } from './ConfidenceBadge';

export function Dashboard() {
  const ready = venues.filter((venue) => venue.sourceStatus !== 'MISSING').length;
  const missing = venues.length - ready;
  return (
    <main className="dashboard-page">
      <header className="dashboard-hero">
        <div><span className="eyebrow">DAMASCUS ROAD TOUR · SPRING 2027</span><h1>Venue Twin Control Room</h1><p>One reusable production package. Nineteen venue records. Source-backed planning geometry with visible confidence and revision control.</p></div>
        <div className="hero-actions"><Link className="primary-button" to="/compare"><GitCompareArrows size={17} /> Compare strongest sources</Link></div>
      </header>
      <section className="summary-strip"><div><Map size={18} /><span>Route stops</span><strong>{venues.length}</strong></div><div><Building2 size={18} /><span>Source packages</span><strong>{ready}</strong></div><div><TriangleAlert size={18} /><span>Missing sources</span><strong>{missing}</strong></div><div><CalendarDays size={18} /><span>Run</span><strong>Apr 8–May 8</strong></div></section>
      <section className="dashboard-section">
        <div className="section-heading"><div><span className="eyebrow">ROUTE INVENTORY</span><h2>19 venue records</h2></div><div className="legend-inline"><span className="dot dot--ready" /> source filed <span className="dot dot--missing" /> source required</div></div>
        <div className="venue-grid">{venues.map((venue, index) => {
          const sourceAsset = getSourceAsset(venue.sourceFile);
          return (
            <article key={venue.slug} className={`venue-card ${venue.sourceStatus === 'MISSING' ? 'venue-card--missing' : ''}`}>
              <div className="venue-card__topline"><span>STOP {String(index + 1).padStart(2, '0')}</span><span>{venue.showDate}</span></div><h3>{venue.name}</h3><p>{venue.city}, {venue.state}</p>
              <div className="venue-card__score"><div className="score-ring" style={{ '--score': `${venue.sourceScore * 3.6}deg` } as CSSProperties}><span>{venue.sourceScore}</span></div><div><span>Source score</span><strong>{venue.sourceYear}</strong><small>{sourceAvailabilityLabel(sourceAsset?.availabilityState)} · {venue.cadStatus === 'NONE' ? 'No native CAD' : 'CAD requested'}</small></div></div>
              <p className="venue-card__strength">{venue.keyStrength}</p><div className="venue-card__status"><ConfidenceBadge state={venue.riggingConfidence} /><span>{venue.pmOpen} PM · {venue.tmOpen} TM open</span></div>
              {venue.detailed ? <Link className="card-link" to={`/venues/${venue.slug}`}>Open venue workspace <ArrowRight size={15} /></Link> : <span className="card-link card-link--disabled">Source / model pending</span>}
            </article>
          );
        })}</div>
      </section>
    </main>
  );
}
