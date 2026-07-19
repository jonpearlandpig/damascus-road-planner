import { BoxSelect, Download, Eye, Grid3X3, Hand, Import, MousePointer2, Move3d, Rotate3d, RotateCcw, RotateCw, Save, Undo2 } from 'lucide-react';
import type { PlannerAction } from '../../planner/store';
import type { CameraProjection, PlannerScene, PlannerTool, PlannerViewMode } from '../../planner/types';
import { rotationIncrementsDeg, snapIntervalsFt } from '../../planner/snapping';

const viewOptions: Array<{ mode: PlannerViewMode; label: string }> = [
  { mode: 'PLAN', label: 'Plan' },
  { mode: 'FRONT_CENTER_AUDIENCE', label: 'Front' },
  { mode: 'STAGE_TO_AUDIENCE', label: 'Stage' },
  { mode: 'STAGE_LEFT', label: 'SL' },
  { mode: 'STAGE_RIGHT', label: 'SR' },
  { mode: 'REAR_OF_HOUSE', label: 'ROH' },
  { mode: 'LOWER_BOWL', label: 'Lower' },
  { mode: 'UPPER_BOWL', label: 'Upper' },
  { mode: 'FREE_ORBIT', label: 'Orbit' },
  { mode: 'ORBIT_360', label: '360' },
];

interface PlannerToolbarProps {
  scene: PlannerScene;
  tool: PlannerTool;
  canUndo: boolean;
  canRedo: boolean;
  onAction: (action: PlannerAction) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onLoad: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onToolChange: (tool: PlannerTool) => void;
}

export function PlannerToolbar({
  scene,
  tool,
  canUndo,
  canRedo,
  onAction,
  onUndo,
  onRedo,
  onSave,
  onLoad,
  onExport,
  onImport,
  onToolChange,
}: PlannerToolbarProps) {
  const tools: Array<{ id: PlannerTool; label: string; icon: typeof MousePointer2; ariaLabel: string }> = [
    { id: 'SELECT', label: 'Select', icon: MousePointer2, ariaLabel: 'Use select tool' },
    { id: 'MOVE', label: 'Move', icon: Move3d, ariaLabel: 'Use move tool' },
    { id: 'ROTATE', label: 'Rotate', icon: Rotate3d, ariaLabel: 'Use rotate tool' },
    { id: 'MEASURE', label: 'Measure', icon: BoxSelect, ariaLabel: 'Toggle measurement tool' },
    { id: 'PAN', label: 'Pan', icon: Hand, ariaLabel: 'Use pan tool' },
  ];
  return (
    <div className="planner-toolbar" aria-label="Planner controls">
      <div className="tool-mode-group" role="group" aria-label="Editor tool">
        {tools.map(({ id, label, icon: Icon, ariaLabel }) => (
          <button
            key={id}
            className={tool === id ? 'tool-button tool-button--active' : 'tool-button'}
            onClick={() => onToolChange(id === 'MEASURE' && tool === 'MEASURE' ? 'SELECT' : id)}
            aria-label={ariaLabel}
            aria-pressed={tool === id}
          >
            <Icon size={16} /><span>{label}</span>
          </button>
        ))}
      </div>
      <button className={scene.grid.visible ? 'tool-button tool-button--active' : 'tool-button'} onClick={() => onAction({ type: 'setGrid', grid: { visible: !scene.grid.visible } })} aria-label="Toggle floor grid">
        <Grid3X3 size={16} /><span>Grid</span>
      </button>
      <label className="tool-select">
        <span>Snap</span>
        <select value={scene.grid.snapFt} onChange={(event) => onAction({ type: 'setGrid', grid: { snapFt: Number(event.currentTarget.value) } })}>
          {snapIntervalsFt.map((interval) => <option key={interval} value={interval}>{interval === 1 ? '1 ft' : interval === 0.5 ? '6 in' : '3 in'}</option>)}
        </select>
      </label>
      <label className="tool-select">
        <span>Rot</span>
        <select value={scene.grid.rotationIncrementDeg} onChange={(event) => onAction({ type: 'setGrid', grid: { rotationIncrementDeg: Number(event.currentTarget.value) } })}>
          {rotationIncrementsDeg.map((increment) => <option key={increment} value={increment}>{increment} deg</option>)}
        </select>
      </label>
      <label className="tool-select">
        <span>View</span>
        <select value={scene.camera.mode} onChange={(event) => {
          const mode = event.currentTarget.value as PlannerViewMode;
          onAction({ type: 'setCamera', camera: { mode, projection: mode === 'PLAN' ? 'ORTHOGRAPHIC' : scene.camera.projection } });
        }}>
          {viewOptions.map((view) => <option key={view.mode} value={view.mode}>{view.label}</option>)}
        </select>
      </label>
      <label className="tool-select">
        <span>Lens</span>
        <select value={scene.camera.projection} onChange={(event) => onAction({ type: 'setCamera', camera: { projection: event.currentTarget.value as CameraProjection } })}>
          <option value="PERSPECTIVE">Perspective</option>
          <option value="ORTHOGRAPHIC">Ortho</option>
        </select>
      </label>
      <button className="tool-button" onClick={onUndo} disabled={!canUndo} aria-label="Undo last edit"><Undo2 size={16} /><span>Undo</span></button>
      <button className="tool-button" onClick={onRedo} disabled={!canRedo} aria-label="Redo last edit"><RotateCw size={16} /><span>Redo</span></button>
      <button className="tool-button" onClick={() => onAction({ type: 'setCamera', camera: { mode: 'FREE_ORBIT', projection: 'PERSPECTIVE', activeSavedViewId: undefined, resetSequence: (scene.camera.resetSequence ?? 0) + 1 } })} aria-label="Reset camera"><RotateCcw size={16} /><span>Reset</span></button>
      <button className="tool-button" onClick={onSave} aria-label="Save scene locally"><Save size={16} /><span>Save</span></button>
      <button className="tool-button" onClick={onLoad} aria-label="Load saved scene"><Eye size={16} /><span>Load</span></button>
      <button className="tool-button" onClick={onExport} aria-label="Export scene JSON"><Download size={16} /><span>Export</span></button>
      <label className="tool-button tool-button--file" aria-label="Import scene JSON">
        <Import size={16} /><span>Import</span>
        <input type="file" accept="application/json,.json" onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) onImport(file);
          event.currentTarget.value = '';
        }} />
      </label>
    </div>
  );
}
