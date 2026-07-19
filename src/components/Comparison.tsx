import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { MeasurementStatus, SourcedMeasurement, VenueGeometry, VenueTwin } from '../data/types';
import { getSourceAsset, sourceAvailabilityLabel } from '../data/sourceAssets';
import { comparisonVenues } from '../data/venues';
import { formatFeet, formatNumber } from '../lib/units';
import { polygonAreaSqFt, polygonDimensions } from '../venue-twins/geometryRules';
import { venueNativeTwinForSlug } from '../venue-twins/records';
import type { SourcedGeometryValue, VenueNativeGeometry } from '../venue-twins/types';

type GeometryField = keyof VenueGeometry;

const measurementTone: Record<MeasurementStatus, string> = {
  VERIFIED: 'verified',
  REFERENCE: 'reference',
  ESTIMATE: 'estimate',
  MISSING: 'missing',
  CONFLICT: 'conflict',
};

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

function TwinValueReadout({ value, formatter = (raw) => String(raw) }: { value?: SourcedGeometryValue; formatter?: (raw: number | string | null) => string }) {
  const status = value?.status ?? 'MISSING';
  const text = value ? formatter(value.value) : 'TBD';
  return (
    <span className={`measurement-readout measurement-readout--${measurementTone[status]}`}>
      <span>{text}</span>
      <small>{status}{value ? ` · ${value.confidence}` : ''}</small>
    </span>
  );
}

function TwinAreaReadout({ twin }: { twin?: VenueNativeGeometry }) {
  const area = twin?.floor?.boundary ? polygonAreaSqFt(twin.floor.boundary.points) : undefined;
  return (
    <span className={`measurement-readout measurement-readout--${area ? 'reference' : 'missing'}`}>
      <span>{area ? `${formatNumber(area)} sq ft` : 'TBD'}</span>
      <small>{twin?.floor?.boundary?.exactness ?? 'MISSING'}</small>
    </span>
  );
}

function GridSizeReadout({ twin }: { twin?: VenueNativeGeometry }) {
  const dimensions = twin?.rigging?.gridBoundary ? polygonDimensions(twin.rigging.gridBoundary.points) : undefined;
  return (
    <span className={`measurement-readout measurement-readout--${dimensions ? 'reference' : 'missing'}`}>
      <span>{dimensions ? `${formatFeet(dimensions.widthFt)} x ${formatFeet(dimensions.lengthFt)}` : 'TBD'}</span>
      <small>{twin?.rigging?.gridBoundary?.renderState ?? 'MISSING'}</small>
    </span>
  );
}

export function Comparison() {
  return (
    <main className="comparison-page">
      <header className="comparison-header"><Link className="back-link" to="/"><ArrowLeft size={17} /> Control room</Link><span className="eyebrow">SOURCE-QUALITY BUILD WAVE</span><h1>Strongest venue comparison</h1><p>Side-by-side planning references. Rigging values remain subject to venue and engineering approval.</p></header>
      <div className="comparison-table-wrap"><table className="comparison-table">
        <thead><tr><th>Venue</th><th>Floor width</th><th>Floor length</th><th>Floor area</th><th>Origin quality</th><th>Low steel</th><th>High steel</th><th>Center-hung low point</th><th>Grid size</th><th>Stage orientation</th><th>DRT fit</th><th>Readiness</th><th>Missing critical</th><th>Conflicts</th><th>End-stage rigging</th><th>Source</th><th>Open work</th></tr></thead>
        <tbody>{comparisonVenues.map((venue) => {
          const twin = venueNativeTwinForSlug(venue.slug);
          return <tr key={venue.slug}><td><Link to={`/venues/${venue.slug}`}>{venue.name} <ExternalLink size={13} /></Link><small>{venue.city}, {venue.state}</small></td><td><TwinValueReadout value={twin?.floor?.width} formatter={(value) => typeof value === 'number' ? formatFeet(value) : 'TBD'} /></td><td><TwinValueReadout value={twin?.floor?.length} formatter={(value) => typeof value === 'number' ? formatFeet(value) : 'TBD'} /></td><td><TwinAreaReadout twin={twin} /></td><td>{twin?.coordinateSystem.originMethod ?? 'NO_TWIN'}<small>{twin?.coordinateSystem.originLabel ?? 'TBD'}</small></td><td><TwinValueReadout value={twin?.rigging?.lowSteel} formatter={(value) => typeof value === 'number' ? formatFeet(value) : 'TBD'} /></td><td><TwinValueReadout value={twin?.rigging?.highSteel} formatter={(value) => typeof value === 'number' ? formatFeet(value) : 'TBD'} /></td><td><TwinValueReadout value={twin?.obstructions?.scoreboardLowPoint} formatter={(value) => typeof value === 'number' ? formatFeet(value) : 'TBD'} /></td><td><GridSizeReadout twin={twin} /></td><td>{twin?.stageReference?.endStageDirection ?? 'TBD'}<small>{twin?.stageReference?.renderState ?? 'MISSING'}</small></td><td>{twin?.drtFit.status ?? 'NO_TWIN'}<small>Planning fit only</small></td><td>{twin?.readiness ?? 'NO_TWIN'}<small>{twin?.diagnostics.renderingStatus ?? 'TBD'}</small></td><td>{twin?.diagnostics.missingCriticalFields.slice(0, 3).join(' / ') || 'None'}</td><td>{twin?.diagnostics.conflictCount ?? 0}</td><td><MeasurementReadout measurement={measurementFor(venue, 'endStageRiggingLb')} formatter={(value) => `${formatNumber(value)} lb`} /></td><td><SourceReadout venue={venue} /></td><td>{venue.pmOpen} PM / {venue.tmOpen} TM</td></tr>;
        })}</tbody>
      </table></div>
    </main>
  );
}
