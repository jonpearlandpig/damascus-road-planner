import { AlertTriangle, FileText, X } from 'lucide-react';
import type { SceneObjectRecord } from '../data/types';
import { getSourceAsset, isUnavailableSourceState, sourceAvailabilityLabel } from '../data/sourceAssets';
import { ConfidenceBadge } from './ConfidenceBadge';

interface SourceDrawerProps {
  record?: SceneObjectRecord;
  onClose: () => void;
}

export function SourceDrawer({ record, onClose }: SourceDrawerProps) {
  const sourceAsset = getSourceAsset(record?.source.file);
  const isUnavailable = isUnavailableSourceState(sourceAsset?.availabilityState);
  const isConflict = record?.source.confidence === 'CONFLICT';
  return (
    <aside className={`source-drawer ${record ? 'source-drawer--open' : ''}`} aria-hidden={!record}>
      {record && (
        <>
          <div className="drawer-header">
            <div><span className="eyebrow">SELECTED OBJECT</span><h2>{record.label}</h2></div>
            <button className="icon-button" onClick={onClose} aria-label="Close details"><X size={18} /></button>
          </div>
          <div className="drawer-body">
            <ConfidenceBadge state={record.source.confidence} />
            <dl className="detail-list">
              {record.dimensions && <><dt>Dimensions</dt><dd>{record.dimensions}</dd></>}
              {record.value && <><dt>Value</dt><dd>{record.value}</dd></>}
              {record.status && <><dt>Status</dt><dd>{record.status}</dd></>}
              {record.owner && <><dt>Owner</dt><dd>{record.owner}</dd></>}
              {record.notes && <><dt>Operational note</dt><dd>{record.notes}</dd></>}
              {record.nextAction && <><dt>Next action</dt><dd>{record.nextAction}</dd></>}
            </dl>
            <section className="source-card">
              <div className="source-card__title"><FileText size={16} /> Source lineage</div>
              <dl className="detail-list detail-list--compact">
                <dt>File</dt><dd>{record.source.file}</dd>
                <dt>Section</dt><dd>{record.source.section}</dd>
                {record.source.page && <><dt>Page / sheet</dt><dd>{record.source.page}</dd></>}
                {record.source.revision && <><dt>Revision</dt><dd>{record.source.revision}</dd></>}
                {record.source.originalValue && <><dt>Original value</dt><dd>{record.source.originalValue}</dd></>}
                <dt>Authority</dt><dd>{record.source.authority}</dd>
                <dt>Availability</dt><dd>{sourceAvailabilityLabel(sourceAsset?.availabilityState)}</dd>
                {sourceAsset && <><dt>Source type</dt><dd>{sourceAsset.sourceType}</dd></>}
                {sourceAsset && <><dt>Control</dt><dd>{sourceAsset.controllingStatus}</dd></>}
                {sourceAsset?.knownConflictFlags.length ? <><dt>Flags</dt><dd>{sourceAsset.knownConflictFlags.join(', ')}</dd></> : null}
              </dl>
              {sourceAsset && <p className="source-card__note">{sourceAsset.notes}</p>}
            </section>
            {(record.source.confidence === 'ENGINEERING CONFIRMATION REQUIRED' || isConflict || isUnavailable) && (
              <div className="warning-card"><AlertTriangle size={17} /><span>{isUnavailable ? 'Declared external source file is unavailable in this workspace. Treat the value as unverified until refiled.' : isConflict ? 'This source has an unresolved conflict. Do not use it as trusted geometry.' : 'Venue reference only. Do not use for final loads, structure, life safety or rigging approval.'}</span></div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
