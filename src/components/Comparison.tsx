import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { comparisonVenues } from '../data/venues';
import { formatFeet, formatNumber } from '../lib/units';

export function Comparison() {
  return (
    <main className="comparison-page">
      <header className="comparison-header"><Link className="back-link" to="/"><ArrowLeft size={17} /> Control room</Link><span className="eyebrow">SOURCE-QUALITY BUILD WAVE</span><h1>Strongest venue comparison</h1><p>Side-by-side planning references. Rigging values remain subject to venue and engineering approval.</p></header>
      <div className="comparison-table-wrap"><table className="comparison-table">
        <thead><tr><th>Venue</th><th>Floor</th><th>Low steel / grid</th><th>End-stage rigging</th><th>Docks</th><th>Push</th><th>Centerhung</th><th>House stage</th><th>Source</th><th>Open work</th></tr></thead>
        <tbody>{comparisonVenues.map((venue) => <tr key={venue.slug}><td><Link to={`/venues/${venue.slug}`}>{venue.name} <ExternalLink size={13} /></Link><small>{venue.city}, {venue.state}</small></td><td>{formatFeet(venue.geometry.floorWidthFt)} × {formatFeet(venue.geometry.floorLengthFt)}</td><td>{formatFeet(venue.geometry.lowSteelFt)}</td><td>{formatNumber(venue.geometry.endStageRiggingLb)} lb</td><td>{venue.geometry.dockCount ?? '—'}</td><td>{formatFeet(venue.geometry.pushDistanceFt)}</td><td>{formatFeet(venue.geometry.centerhungBottomFt)}</td><td>{formatFeet(venue.geometry.houseStageWidthFt)} × {formatFeet(venue.geometry.houseStageDepthFt)}</td><td>{venue.sourceYear}<small>{venue.cadStatus} CAD</small></td><td>{venue.pmOpen} PM / {venue.tmOpen} TM</td></tr>)}</tbody>
      </table></div>
    </main>
  );
}
