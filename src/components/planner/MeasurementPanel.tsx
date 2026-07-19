import { Copy, Lock, LockOpen, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { distanceBetweenPoints, formatFeetDecimal, objectMeasurementReadout, type MeasurementFrame } from '../../planner/measurements';
import type { PlannerAction } from '../../planner/store';
import type { PlacedObject, PlannerScene, PlannerTool, ScenePosition } from '../../planner/types';
import { formatFeet } from '../../lib/units';

interface MeasurementPanelProps {
  scene: PlannerScene;
  selectedObject?: PlacedObject;
  frame: MeasurementFrame;
  tool: PlannerTool;
  onAction: (action: PlannerAction) => void;
  onCancelMove: () => void;
}

function numberValue(value: number): string {
  return Number(value.toFixed(2)).toString();
}

function inputPosition(object: PlacedObject, field: keyof ScenePosition, value: string): Partial<ScenePosition> {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? { [field]: numeric } : { [field]: object.position[field] };
}

export function MeasurementPanel({ scene, selectedObject, frame, tool, onAction, onCancelMove }: MeasurementPanelProps) {
  const [measurementName, setMeasurementName] = useState('Measurement');
  const activeResult = scene.activeMeasurement?.start && scene.activeMeasurement.end
    ? distanceBetweenPoints(scene.activeMeasurement.start, scene.activeMeasurement.end)
    : undefined;
  const readout = selectedObject ? objectMeasurementReadout(selectedObject, frame) : undefined;

  return (
    <section className="measurement-panel" aria-label="Persistent measurement readout">
      <div className="panel-heading">
        <div><span className="eyebrow">MEASUREMENTS</span><h2>{selectedObject?.label ?? 'No object selected'}</h2></div>
        {selectedObject && <span className={`status-pill status-pill--${selectedObject.dimensionStatus.toLowerCase()}`}>{selectedObject.dimensionStatus}</span>}
      </div>

      {selectedObject && (
        <>
          <div className="transform-grid">
            <label><span>X</span><input data-testid="selected-x" type="number" step={scene.grid.snapFt} value={numberValue(selectedObject.position.xFt)} disabled={selectedObject.locked || tool !== 'MOVE'} onChange={(event) => onAction({ type: 'moveObject', id: selectedObject.id, position: inputPosition(selectedObject, 'xFt', event.currentTarget.value) })} /></label>
            <label><span>Y</span><input type="number" step={scene.grid.snapFt} value={numberValue(selectedObject.position.yFt)} disabled={selectedObject.locked || tool !== 'MOVE'} onChange={(event) => onAction({ type: 'moveObject', id: selectedObject.id, position: inputPosition(selectedObject, 'yFt', event.currentTarget.value) })} /></label>
            <label><span>Z</span><input data-testid="selected-z" type="number" step={scene.grid.snapFt} value={numberValue(selectedObject.position.zFt)} disabled={selectedObject.locked || tool !== 'MOVE'} onChange={(event) => onAction({ type: 'moveObject', id: selectedObject.id, position: inputPosition(selectedObject, 'zFt', event.currentTarget.value) })} /></label>
            <label><span>Rot</span><input data-testid="selected-rotation" type="number" step={scene.grid.rotationIncrementDeg} value={numberValue(selectedObject.rotationYDeg)} disabled={selectedObject.locked || tool !== 'ROTATE'} onChange={(event) => onAction({ type: 'rotateObject', id: selectedObject.id, rotationYDeg: Number(event.currentTarget.value) })} /></label>
          </div>
          <p className="transform-permission" data-testid="transform-permission">
            {selectedObject.locked ? 'Locked. Unlock deliberately before transforming.' : tool === 'MOVE' ? 'Move enabled through visible axis handles or numeric fields.' : tool === 'ROTATE' ? 'Rotate enabled through the visible ring or rotation field.' : 'Select a Move or Rotate tool to transform this object.'}
          </p>
          <dl className="measurement-grid">
            <dt>Width</dt><dd>{formatFeet(selectedObject.dimensions.widthFt)}</dd>
            <dt>Depth</dt><dd>{formatFeet(selectedObject.dimensions.depthFt)}</dd>
            <dt>Height</dt><dd>{formatFeet(selectedObject.dimensions.heightFt)}</dd>
            <dt>Room center</dt><dd>{formatFeetDecimal(readout?.distanceFromRoomCenterFt)}</dd>
            <dt>Venue CL</dt><dd>{formatFeetDecimal(readout?.distanceFromVenueCenterlineFt)}</dd>
            <dt>Stage CL</dt><dd>{formatFeetDecimal(readout?.distanceFromStageCenterlineFt)}</dd>
            <dt>Upstage edge</dt><dd>{formatFeetDecimal(readout?.distanceFromUpstageEdgeFt)}</dd>
            <dt>Downstage edge</dt><dd>{formatFeetDecimal(readout?.distanceFromDownstageEdgeFt)}</dd>
            <dt>Nearest boundary</dt><dd>{formatFeetDecimal(readout?.nearestFloorBoundaryFt)}</dd>
            <dt>Source</dt><dd>{selectedObject.sourceLabel}</dd>
          </dl>
          <div className="icon-row">
            <button onClick={() => onAction({ type: 'duplicateObject', id: selectedObject.id })} aria-label="Duplicate selected object"><Copy size={15} /></button>
            <button onClick={() => onAction({ type: 'lockObject', id: selectedObject.id, locked: !selectedObject.locked })} aria-label={selectedObject.locked ? 'Unlock selected object' : 'Lock selected object'}>{selectedObject.locked ? <Lock size={15} /> : <LockOpen size={15} />}</button>
            <button onClick={onCancelMove} aria-label="Cancel last move"><X size={15} /></button>
            <button onClick={() => onAction({ type: 'deleteObject', id: selectedObject.id })} aria-label="Delete selected object"><Trash2 size={15} /></button>
          </div>
          <div className="point-row">
            <button onClick={() => onAction({ type: 'setMeasurementPoint', point: 'start', position: selectedObject.position })}>Set start</button>
            <button onClick={() => onAction({ type: 'setMeasurementPoint', point: 'end', position: selectedObject.position })}>Set end</button>
          </div>
        </>
      )}

      <div className="measurement-tool-readout">
        <dl className="measurement-grid">
          <dt>Start</dt><dd>{scene.activeMeasurement?.start ? `${formatFeetDecimal(scene.activeMeasurement.start.xFt)}, ${formatFeetDecimal(scene.activeMeasurement.start.zFt)}` : '-'}</dd>
          <dt>End</dt><dd>{scene.activeMeasurement?.end ? `${formatFeetDecimal(scene.activeMeasurement.end.xFt)}, ${formatFeetDecimal(scene.activeMeasurement.end.zFt)}` : '-'}</dd>
          <dt>Total</dt><dd data-testid="measurement-total">{formatFeetDecimal(activeResult?.totalFt)}</dd>
          <dt>X delta</dt><dd>{formatFeetDecimal(activeResult?.xDeltaFt)}</dd>
          <dt>Y delta</dt><dd>{formatFeetDecimal(activeResult?.yDeltaFt)}</dd>
          <dt>Z delta</dt><dd>{formatFeetDecimal(activeResult?.zDeltaFt)}</dd>
        </dl>
        <div className="inline-form">
          <input value={measurementName} onChange={(event) => setMeasurementName(event.currentTarget.value)} aria-label="Measurement name" />
          <button onClick={() => onAction({ type: 'saveMeasurement', name: measurementName })} aria-label="Save measurement"><Save size={15} /></button>
          <button onClick={() => onAction({ type: 'clearMeasurement' })} aria-label="Clear measurement"><X size={15} /></button>
        </div>
      </div>

      {scene.measurements.length > 0 && (
        <div className="saved-list">
          {scene.measurements.map((measurement) => {
            const result = distanceBetweenPoints(measurement.start, measurement.end);
            return (
              <div key={measurement.id} className="saved-row">
                <button onClick={() => onAction({ type: 'renameMeasurement', id: measurement.id, name: `${measurement.name} rev` })}>{measurement.name}</button>
                <span>{formatFeetDecimal(result.totalFt)}</span>
                <button onClick={() => onAction({ type: 'deleteMeasurement', id: measurement.id })} aria-label={`Delete ${measurement.name}`}><Trash2 size={14} /></button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
