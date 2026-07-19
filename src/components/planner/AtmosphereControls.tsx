import { RotateCcw } from 'lucide-react';
import type { PlannerAction } from '../../planner/store';
import type { PlacedObject } from '../../planner/types';

interface AtmosphereControlsProps {
  selectedObject?: PlacedObject;
  atmosphereObjects: PlacedObject[];
  onAction: (action: PlannerAction) => void;
}

export function AtmosphereControls({ selectedObject, atmosphereObjects, onAction }: AtmosphereControlsProps) {
  if (!selectedObject?.atmosphere) return null;
  const atmosphere = selectedObject.atmosphere;
  const group = selectedObject.atmosphere.groupId
    ? atmosphereObjects.filter((object) => object.atmosphere?.groupId === selectedObject.atmosphere?.groupId)
    : [selectedObject];

  function updateGroup(update: Partial<typeof atmosphere>) {
    for (const object of group) onAction({ type: 'updateAtmosphere', id: object.id, atmosphere: update });
  }

  return (
    <section className="planner-panel atmosphere-controls" aria-label="Atmosphere controls">
      <div className="panel-heading">
        <div><span className="eyebrow">ATMOSPHERE</span><h2>{selectedObject.label}</h2></div>
        <button onClick={() => onAction({ type: 'updateAtmosphere', id: selectedObject.id, atmosphere: { enabled: true, output: 0.45, directionDeg: 0, coverageRadiusFt: selectedObject.category === 'Low fog' ? 18 : 28 } })} aria-label="Reset atmosphere"><RotateCcw size={15} /></button>
      </div>
      <div className="control-stack">
        <label className="checkbox-line"><input type="checkbox" checked={atmosphere.enabled} onChange={(event) => onAction({ type: 'updateAtmosphere', id: selectedObject.id, atmosphere: { enabled: event.currentTarget.checked } })} /><span>On</span></label>
        <label><span>Output</span><input type="range" min="0" max="1" step="0.01" value={atmosphere.output} onChange={(event) => onAction({ type: 'updateAtmosphere', id: selectedObject.id, atmosphere: { output: Number(event.currentTarget.value) } })} /></label>
        <label><span>Direction</span><input type="number" value={atmosphere.directionDeg} onChange={(event) => onAction({ type: 'updateAtmosphere', id: selectedObject.id, atmosphere: { directionDeg: Number(event.currentTarget.value) } })} /></label>
        <label><span>Coverage</span><input type="number" value={atmosphere.coverageRadiusFt} onChange={(event) => onAction({ type: 'updateAtmosphere', id: selectedObject.id, atmosphere: { coverageRadiusFt: Number(event.currentTarget.value) } })} /></label>
        {group.length > 1 && (
          <div className="point-row">
            <button onClick={() => updateGroup({ enabled: true })}>Group on</button>
            <button onClick={() => updateGroup({ enabled: false })}>Group off</button>
          </div>
        )}
      </div>
    </section>
  );
}
