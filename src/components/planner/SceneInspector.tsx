import { Copy, Eye, EyeOff, FolderTree, Lock, LockOpen, Trash2 } from 'lucide-react';
import type { PlannerAction } from '../../planner/store';
import type { PlacedObject, PlannerScene } from '../../planner/types';

interface SceneInspectorProps {
  scene: PlannerScene;
  selectedObject?: PlacedObject;
  onAction: (action: PlannerAction) => void;
}

function childrenFor(scene: PlannerScene, id: string): PlacedObject[] {
  return scene.objects.filter((object) => object.parentId === id);
}

export function SceneInspector({ scene, selectedObject, onAction }: SceneInspectorProps) {
  const rootObjects = scene.objects.filter((object) => !object.parentId);
  const selectedIds = selectedObject ? scene.objects.filter((object) => object.category === selectedObject.category).map((object) => object.id) : [];

  return (
    <section className="planner-panel scene-inspector" aria-label="Scene inspector">
      <div className="panel-heading">
        <div><span className="eyebrow">SCENE</span><h2>Inspector</h2></div>
      </div>
      {selectedObject && (
        <div className="inspector-actions">
          <button onClick={() => onAction({ type: 'lockObject', id: selectedObject.id, locked: !selectedObject.locked })} aria-label={selectedObject.locked ? 'Unlock selected object' : 'Lock selected object'}>{selectedObject.locked ? <Lock size={15} /> : <LockOpen size={15} />}</button>
          <button onClick={() => onAction({ type: 'toggleObjectVisibility', id: selectedObject.id, visible: !selectedObject.visible })} aria-label={selectedObject.visible ? 'Hide selected object' : 'Show selected object'}>{selectedObject.visible ? <Eye size={15} /> : <EyeOff size={15} />}</button>
          <button onClick={() => onAction({ type: 'duplicateObject', id: selectedObject.id })} aria-label="Duplicate selected object"><Copy size={15} /></button>
          <button onClick={() => onAction({ type: 'deleteObject', id: selectedObject.id })} aria-label="Delete selected object"><Trash2 size={15} /></button>
          <button onClick={() => onAction({ type: 'groupObjects', ids: selectedIds, groupId: `${selectedObject.category}-group` })} aria-label="Group matching objects"><FolderTree size={15} /></button>
          <button onClick={() => onAction({ type: 'ungroupObjects', ids: selectedIds })} aria-label="Ungroup matching objects"><FolderTree size={15} /></button>
        </div>
      )}
      <div className="scene-tree">
        <div className="tree-header"><span>Venue</span><strong>{scene.venueSlug}</strong></div>
        <div className="tree-header"><span>Show</span><strong>{scene.name}</strong></div>
        {rootObjects.map((object) => (
          <div key={object.id} className="tree-node-wrap">
            <button className={scene.selectedObjectId === object.id ? 'tree-node tree-node--selected' : 'tree-node'} onClick={() => onAction({ type: 'selectObject', id: object.id })}>
              <span>{object.visible ? 'on' : 'off'}</span><strong>{object.label}</strong><small>{object.category}{object.locked ? ' / locked' : ''}</small>
            </button>
            {childrenFor(scene, object.id).map((child) => (
              <button key={child.id} className={scene.selectedObjectId === child.id ? 'tree-node tree-node--child tree-node--selected' : 'tree-node tree-node--child'} onClick={() => onAction({ type: 'selectObject', id: child.id })}>
                <span>{child.visible ? 'on' : 'off'}</span><strong>{child.label}</strong><small>{child.category}</small>
              </button>
            ))}
          </div>
        ))}
        <div className="tree-header"><span>Saved measurements</span><strong>{scene.measurements.length}</strong></div>
        <div className="tree-header"><span>Saved views</span><strong>{scene.savedViews.length}</strong></div>
      </div>
    </section>
  );
}
