import { AlertTriangle, ExternalLink, Layers3, MapPinned, Ruler, ShieldCheck } from 'lucide-react';
import type { VenueNativeGeometry } from '../venue-twins/types';
import { geometryEvidenceForElement } from '../venue-twins/buildVenueTwin';

interface VenueTwinInspectorProps {
  twin?: VenueNativeGeometry;
  selectedElementId?: string;
  onSelectElement?: (id: string) => void;
}

function valueOrTbd(value: unknown): string {
  return value === undefined || value === null || value === '' ? 'TBD' : String(value);
}

function floorStatus(twin: VenueNativeGeometry): string {
  if (!twin.floor?.boundary) return 'Missing';
  return `${twin.floor.width?.value} x ${twin.floor.length?.value} ft / ${twin.floor.renderState}`;
}

function riggingStatus(twin: VenueNativeGeometry): string {
  if (!twin.rigging) return 'Missing';
  return `Low ${valueOrTbd(twin.rigging.lowSteel?.value)} / High ${valueOrTbd(twin.rigging.highSteel?.value)} / ${twin.rigging.gridBoundary ? 'grid boundary' : 'height only'}`;
}

function centerHungStatus(twin: VenueNativeGeometry): string {
  if (!twin.obstructions?.centerHung) return 'Missing';
  const centerHung = twin.obstructions.centerHung;
  return `${valueOrTbd(centerHung.dimensions.widthFt?.value)} x ${valueOrTbd(centerHung.dimensions.depthFt?.value)} / low ${valueOrTbd(centerHung.lowPoint?.value)}`;
}

export function VenueTwinInspector({ twin, selectedElementId, onSelectElement }: VenueTwinInspectorProps) {
  if (!twin) {
    return (
      <section className="planner-panel venue-twin-inspector">
        <div className="panel-heading"><div><span className="eyebrow">VENUE-NATIVE TWIN</span><h2>No generated twin</h2></div></div>
        <p className="muted-line">No generated venue-native record is available for this venue.</p>
      </section>
    );
  }

  const evidence = selectedElementId ? geometryEvidenceForElement(twin, selectedElementId).slice(0, 4) : [];
  const selectedLabel = selectedElementId?.replaceAll('-', ' ') ?? 'None';
  const evidenceTargets = [
    { id: 'venue-native-floor', label: 'Floor evidence', disabled: !twin.floor?.boundary },
    { id: 'venue-native-rigging', label: 'Rigging evidence', disabled: !twin.rigging },
    { id: 'venue-native-centerhung', label: 'Center-hung evidence', disabled: !twin.obstructions?.centerHung },
  ];

  return (
    <section className="planner-panel venue-twin-inspector" aria-label="Venue native twin inspector">
      <div className="panel-heading">
        <div><span className="eyebrow">VENUE-NATIVE TWIN</span><h2>{twin.readiness} / {twin.diagnostics.renderingStatus}</h2></div>
        <ShieldCheck size={18} aria-hidden="true" />
      </div>
      <dl className="measurement-grid venue-twin-grid">
        <dt>Origin</dt><dd><MapPinned size={13} /> {twin.coordinateSystem.originMethod}<small>{twin.coordinateSystem.originLabel}</small></dd>
        <dt>Floor</dt><dd><Ruler size={13} /> {floorStatus(twin)}</dd>
        <dt>Rigging</dt><dd>{riggingStatus(twin)}</dd>
        <dt>Center-hung</dt><dd>{centerHungStatus(twin)}</dd>
        <dt>Stage ref</dt><dd>{twin.stageReference?.endStageDirection ?? 'Missing'}<small>{twin.stageReference?.warning ?? 'No source-backed stage-end orientation.'}</small></dd>
        <dt>Loading</dt><dd>{twin.loading?.dockDirection ?? 'Missing'}<small>{twin.loading?.warning ?? 'No source-backed loading coordinate.'}</small></dd>
        <dt>Facts</dt><dd>{twin.diagnostics.approvedMeasurementCount} approved / {twin.diagnostics.derivedGeometryCount} derived / {twin.diagnostics.approximateGeometryCount} approximate</dd>
        <dt>Conflicts</dt><dd>{twin.diagnostics.conflictCount}</dd>
        <dt>Fit check</dt><dd>{twin.drtFit.status}<small>Planning fit only; not engineering approval.</small></dd>
      </dl>
      {twin.coordinateSystem.warning && <div className="warning-line"><AlertTriangle size={13} /> {twin.coordinateSystem.warning}</div>}
      {twin.diagnostics.blockers.slice(0, 4).map((blocker) => <div key={blocker} className="warning-line warning-line--error">{blocker}</div>)}
      <div className="source-card source-card--compact">
        <div className="source-card__title"><Layers3 size={16} /> Selected geometry evidence</div>
        {onSelectElement && (
          <div className="native-evidence-actions" aria-label="Venue-native evidence selectors">
            {evidenceTargets.map((target) => (
              <button key={target.id} type="button" disabled={target.disabled} onClick={() => onSelectElement(target.id)}>
                {target.label}
              </button>
            ))}
          </div>
        )}
        <p className="source-card__note">{selectedLabel}</p>
        {evidence.length === 0 ? (
          <p className="muted-line">No source-backed geometry element is selected.</p>
        ) : evidence.map((item) => (
          <a key={`${item.measurementId}-${item.page}`} className="evidence-link" href={item.driveUrl} target="_blank" rel="noreferrer">
            <span>{item.measurementId}</span>
            <small>{item.sourceTitle} / p.{item.page} / {item.section}</small>
            <em>{item.excerpt}</em>
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        ))}
      </div>
      <div className="source-card source-card--compact">
        <div className="source-card__title">Source titles</div>
        <p className="source-card__note">{twin.evidence.sourceTitles.join(', ')}</p>
      </div>
    </section>
  );
}
