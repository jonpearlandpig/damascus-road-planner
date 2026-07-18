import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { MeasurementStatus, SourcedMeasurement, VenueGeometry, VenueTwin } from '../data/types';
import { getSourceAsset, sourceAvailabilityLabel } from '../data/sourceAssets';
import { comparisonVenues } from '../data/venues';
import { formatFeet, formatNumber } from '../lib/units';

type GeometryField = keyof VenueGeometry;

const measurementTone: Record<MeasurementStatus, string> = {
  VERIFIED: 'verified',
  REFERENCE: 'reference',
  ESTIMATE: 'estimate',
  MISSING: 'missing',
  CONFLICT: 'conflict',
};

function measurementStatus(fields: Array<SourcedMeasurement | undefined>): MeasurementStatus {
  if (fields.some((field) => field?.status === 'CONFLICT')) return 'CONFLICT';
  if (fields.some((field) => field?.status === 'MISSING') || fields.some((field) => !field)) return 'MISSING';
  if (fields.some((field) => field?.status === 'ESTIMATE')) return 'ESTIMATE';
  if (fields.some((field) => field?.status === 'REFERENCE')) return 'REFERENCE';
  return 'VERIFIED';
}

function MeasurementReadout({ measurement, formatter }: { measurement?: SourcedMeasurement; formatter: (value: number) => string }) {
  const status = measurement?.status ?? 'MISSING';
  const value = status === 'CONFLICT' ? 'Unresolved' : status === 'MISSING' || !measurement ? 'TBD' : formatter(measurement.value);
  return (
    <span className={`measurement-readout measurement-readout--${measurementTone[status]}`}>
      <span>{value}</span>
      <small>{status}{measurement ? ` · ${measurement.confidence}` : ''}</small>
    </span>
  );
}

function FloorReadout({ venue }: { venue: VenueTwin }) {
  const width = venue.geometryProvenance.floorWidthFt;
  const length = venue.geometryProvenance.floorLengthFt;
  const status = measurementStatus([width, length]);
  const value = status === 'CONFLICT' ? 'Unresolved' : status === 'MISSING' || !width || !length ? 'TBD' : `${formatFeet(width.value)} x ${formatFeet(length.value)}`;
  const confidence = width && length ? `${width.confidence}/${length.confidence}` : 'UNKNOWN';
  return (
    <span className={`measurement-readout measurement-readout--${measurementTone[status]}`}>
      <span>{value}</span>
      <small>{status} · {confidence}</small>
    </span>
  );
}

function measurementFor(venue: VenueTwin, field: GeometryField): SourcedMeasurement | undefined {
  return venue.geometryProvenance[field];
}

function SourceReadout({ venue }: { venue: VenueTwin }) {
  const sourceAsset = getSourceAsset(venue.sourceFile);
  return (
    <span className="source-readout">
      <span>{venue.sourceYear}</span>
      <small>{sourceAvailabilityLabel(sourceAsset?.availabilityState)} · {venue.cadStatus} CAD</small>
    </span>
  );
}

export function Comparison() {
  return (
    <main className="comparison-page">
      <header className="comparison-header"><Link className="back-link" to="/"><ArrowLeft size={17} /> Control room</Link><span className="eyebrow">SOURCE-QUALITY BUILD WAVE</span><h1>Strongest venue comparison</h1><p>Side-by-side planning references. Rigging values remain subject to venue and engineering approval.</p></header>
      <div className="comparison-table-wrap"><table className="comparison-table">
        <thead><tr><th>Venue</th><th>Floor</th><th>Low steel / grid</th><th>End-stage rigging</th><th>Docks</th><th>Push</th><th>Centerhung</th><th>House stage</th><th>Source</th><th>Open work</th></tr></thead>
        <tbody>{comparisonVenues.map((venue) => <tr key={venue.slug}><td><Link to={`/venues/${venue.slug}`}>{venue.name} <ExternalLink size={13} /></Link><small>{venue.city}, {venue.state}</small></td><td><FloorReadout venue={venue} /></td><td><MeasurementReadout measurement={measurementFor(venue, 'lowSteelFt')} formatter={formatFeet} /></td><td><MeasurementReadout measurement={measurementFor(venue, 'endStageRiggingLb')} formatter={(value) => `${formatNumber(value)} lb`} /></td><td><MeasurementReadout measurement={measurementFor(venue, 'dockCount')} formatter={(value) => String(value)} /></td><td><MeasurementReadout measurement={measurementFor(venue, 'pushDistanceFt')} formatter={formatFeet} /></td><td><MeasurementReadout measurement={measurementFor(venue, 'centerhungBottomFt')} formatter={formatFeet} /></td><td><MeasurementReadout measurement={measurementFor(venue, 'houseStageWidthFt')} formatter={(value) => `${formatFeet(value)} x ${formatFeet(venue.geometry.houseStageDepthFt)}`} /></td><td><SourceReadout venue={venue} /></td><td>{venue.pmOpen} PM / {venue.tmOpen} TM</td></tr>)}</tbody>
      </table></div>
    </main>
  );
}
