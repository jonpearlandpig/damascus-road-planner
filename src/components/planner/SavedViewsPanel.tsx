import { Camera, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { PlannerAction } from '../../planner/store';
import type { PlannerScene } from '../../planner/types';

interface SavedViewsPanelProps {
  scene: PlannerScene;
  onAction: (action: PlannerAction) => void;
}

export function SavedViewsPanel({ scene, onAction }: SavedViewsPanelProps) {
  const [viewName, setViewName] = useState('View');

  return (
    <section className="planner-panel saved-views-panel" aria-label="Saved camera views">
      <div className="panel-heading">
        <div><span className="eyebrow">VIEWS</span><h2>Camera</h2></div>
      </div>
      <div className="inline-form">
        <input value={viewName} onChange={(event) => setViewName(event.currentTarget.value)} aria-label="Saved view name" />
        <button onClick={() => onAction({ type: 'saveCameraView', name: viewName })} aria-label="Save current view"><Camera size={15} /></button>
      </div>
      <div className="saved-list">
        {scene.savedViews.map((view) => (
          <div key={view.id} className={scene.camera.activeSavedViewId === view.id ? 'saved-row saved-row--active' : 'saved-row'}>
            <button onClick={() => onAction({ type: 'restoreCameraView', id: view.id })}>{view.name}</button>
            <span>{view.mode}</span>
            <button onClick={() => onAction({ type: 'renameCameraView', id: view.id, name: `${view.name} rev` })} aria-label={`Rename ${view.name}`}><Pencil size={14} /></button>
            <button onClick={() => onAction({ type: 'deleteCameraView', id: view.id })} aria-label={`Delete ${view.name}`}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </section>
  );
}
