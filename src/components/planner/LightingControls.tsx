import { RotateCcw } from 'lucide-react';
import type { PlannerAction } from '../../planner/store';
import type { PlacedObject } from '../../planner/types';

interface LightingControlsProps {
  selectedObject?: PlacedObject;
  onAction: (action: PlannerAction) => void;
}

export function LightingControls({ selectedObject, onAction }: LightingControlsProps) {
  if (!selectedObject?.lighting) return null;
  const lighting = selectedObject.lighting;
  return (
    <section className="planner-panel lighting-controls" aria-label="Lighting controls">
      <div className="panel-heading">
        <div><span className="eyebrow">LIGHTING</span><h2>{selectedObject.label}</h2></div>
        <button onClick={() => onAction({ type: 'updateLighting', id: selectedObject.id, lighting: { intensity: 0.8, panDeg: 0, tiltDeg: -35, zoomDeg: 20, color: '#f7d36b', shutterOpen: true, movementPreview: false } })} aria-label="Reset lighting"><RotateCcw size={15} /></button>
      </div>
      <div className="control-stack">
        <label><span>Intensity</span><input type="range" min="0" max="1" step="0.01" value={lighting.intensity} onChange={(event) => onAction({ type: 'updateLighting', id: selectedObject.id, lighting: { intensity: Number(event.currentTarget.value) } })} /></label>
        <label><span>Pan</span><input type="number" value={lighting.panDeg} onChange={(event) => onAction({ type: 'updateLighting', id: selectedObject.id, lighting: { panDeg: Number(event.currentTarget.value) } })} /></label>
        <label><span>Tilt</span><input type="number" value={lighting.tiltDeg} onChange={(event) => onAction({ type: 'updateLighting', id: selectedObject.id, lighting: { tiltDeg: Number(event.currentTarget.value) } })} /></label>
        <label><span>Zoom</span><input type="number" value={lighting.zoomDeg ?? 20} onChange={(event) => onAction({ type: 'updateLighting', id: selectedObject.id, lighting: { zoomDeg: Number(event.currentTarget.value) } })} /></label>
        <label><span>Color</span><input type="color" value={lighting.color} onChange={(event) => onAction({ type: 'updateLighting', id: selectedObject.id, lighting: { color: event.currentTarget.value } })} /></label>
        <label><span>Temp K</span><input type="number" value={lighting.colorTemperatureK ?? 3200} onChange={(event) => onAction({ type: 'updateLighting', id: selectedObject.id, lighting: { colorTemperatureK: Number(event.currentTarget.value) } })} /></label>
        <label className="checkbox-line"><input type="checkbox" checked={lighting.shutterOpen} onChange={(event) => onAction({ type: 'updateLighting', id: selectedObject.id, lighting: { shutterOpen: event.currentTarget.checked } })} /><span>Shutter</span></label>
        <label className="checkbox-line"><input type="checkbox" checked={lighting.movementPreview} onChange={(event) => onAction({ type: 'updateLighting', id: selectedObject.id, lighting: { movementPreview: event.currentTarget.checked } })} /><span>Preview</span></label>
      </div>
    </section>
  );
}
