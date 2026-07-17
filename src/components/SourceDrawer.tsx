import { AlertTriangle, FileText, X } from 'lucide-react';
import type { SceneObjectRecord } from '../data/types';
import { ConfidenceBadge } from './ConfidenceBadge';

interface SourceDrawerProps {
  record?: SceneObjectRecord;
  onClose: () => void;
}

export function SourceDrawer({ record, onClose }: SourceDrawerProps) {
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
              </dl>
            </section>
            {record.source.confidence === 'ENGINEERING CONFIRMATION REQUIRED' && (
              <div className="warning-card"><AlertTriangle size={17} /><span>Venue reference only. Do not use for final loads, structure, life safety or rigging approval.</span></div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
