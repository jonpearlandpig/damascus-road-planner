import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Boxes, ChevronDown, Crosshair, Eye, FileText, Grid3X3, Landmark, LocateFixed, Route, ShieldAlert, SlidersHorizontal } from 'lucide-react';
import type { ConfidenceState, SceneObjectRecord, VenueTwin } from '../data/types';
import { adaptVenueGeometry, buildVenueIngestionRecords, inferVenueType, measurementFrameForVenue } from '../planner/venueAdapter';
import { applyHistoryAction, createPlannerHistory, redoHistory, undoHistory, type PlannerHistory } from '../planner/history';
import { createInitialPlannerScene } from '../planner/sceneSchema';
import { autosaveSceneLocal, exportSceneJson, importSceneJson, loadSceneLocal, saveSceneLocal } from '../planner/persistence';
import type { PlacedObject, PlannerScene } from '../planner/types';
import { applyPlannerAction, type PlannerAction } from '../planner/store';
import { validateIngestionRecords } from '../planner/ingestion';
import { AtmosphereControls } from './planner/AtmosphereControls';
import { CommandConsole } from './planner/CommandConsole';
import { GearPackBrowser } from './planner/GearPackBrowser';
import { LightingControls } from './planner/LightingControls';
import { MeasurementPanel } from './planner/MeasurementPanel';
import { ObjectLibrary } from './planner/ObjectLibrary';
import { PlannerToolbar } from './planner/PlannerToolbar';
import { SavedViewsPanel } from './planner/SavedViewsPanel';
import { SceneInspector } from './planner/SceneInspector';
import { ConfidenceBadge } from './ConfidenceBadge';
import { SourceDrawer } from './SourceDrawer';
import { VenueTwinInspector } from './VenueTwinInspector';
import { nativeRecordForElement } from '../venue-twins/adapters';
import { venueNativeTwinForSlug } from '../venue-twins/records';

const VenueScene = lazy(() => import('./VenueScene').then((module) => ({ default: module.VenueScene })));

const layers: Array<{ key: string; label: string; icon: typeof Eye }> = [
  { key: 'floor', label: 'Floor', icon: Landmark },
  { key: 'centerlines', label: 'Centerlines', icon: Crosshair },
  { key: 'stage-reference', label: 'Stage reference', icon: LocateFixed },
  { key: 'rigging-grid', label: 'Rigging grid', icon: Grid3X3 },
  { key: 'center-hung', label: 'Center-hung', icon: Boxes },
  { key: 'obstructions', label: 'Obstructions', icon: ShieldAlert },
  { key: 'loading', label: 'Loading', icon: Route },
  { key: 'reference-geometry', label: 'Reference geometry', icon: FileText },
  { key: 'drt-production', label: 'DRT production', icon: Boxes },
  { key: 'fit-overlay', label: 'Fit-check overlay', icon: Eye },
];

const defaultNativeLayers = ['floor', 'centerlines', 'stage-reference', 'rigging-grid', 'center-hung', 'loading', 'reference-geometry', 'drt-production', 'fit-overlay'];

function layerStorageKey(venueSlug: string): string {
  return `${venueSlug}-venue-native-layers`;
}

function loadLayerSettings(venueSlug: string): Set<string> {
  try {
    const raw = localStorage.getItem(layerStorageKey(venueSlug));
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set(defaultNativeLayers);
  } catch {
    return new Set(defaultNativeLayers);
  }
}

function zoneToRecord(venue: VenueTwin, id: string): SceneObjectRecord | undefined {
  const zone = venue.zones.find((item) => item.id === id);
  if (!zone) return undefined;
  return { id: zone.id, label: zone.label, category: zone.layer, dimensions: `${zone.widthFt} ft x ${zone.depthFt} ft${zone.heightFt ? ` x ${zone.heightFt} ft` : ''}`, notes: `${zone.kind.toUpperCase()} planning zone generated from source-backed operational data.`, source: zone.source };
}

function confidenceFromMeasurement(status: PlacedObject['dimensionStatus']): ConfidenceState {
  if (status === 'VERIFIED') return 'VERIFIED';
  if (status === 'REFERENCE') return 'CALIBRATED PLANNING';
  if (status === 'CONFLICT') return 'CONFLICT';
  return 'UNVERIFIED';
}

function objectToRecord(object: PlacedObject): SceneObjectRecord {
  return {
    id: object.id,
    label: object.label,
    category: object.category === 'Truss' || object.category === 'Motors' || object.category === 'Lighting fixtures' ? 'rigging' : 'production',
    dimensions: `${object.dimensions.widthFt} ft x ${object.dimensions.depthFt} ft x ${object.dimensions.heightFt} ft`,
    value: `X ${object.position.xFt} ft / Y ${object.position.yFt} ft / Z ${object.position.zFt} ft / Rot ${object.rotationYDeg} deg`,
    status: object.planningOnly ? 'PLANNING ONLY' : object.dimensionStatus,
    notes: object.warnings.join(' '),
    source: {
      file: object.sourceLabel,
      section: 'Planner scene object',
      revision: object.gearPackRef?.packId ?? 'Local planner scene',
      originalValue: object.gearPackRef ? object.gearPackRef.itemId : object.definitionId,
      confidence: confidenceFromMeasurement(object.dimensionStatus),
      authority: object.gearPackRef ? 'DEPARTMENT CONFIRMED' : 'MANAGEMENT CONFIRMED',
    },
  };
}

function SceneFallback({ venue }: { venue: VenueTwin }) {
  return <div className="scene-shell scene-shell--loading">Loading {venue.name} planning model...</div>;
}

function createInitialHistory(venue: VenueTwin): PlannerHistory {
  return createPlannerHistory(loadSceneLocal(`${venue.slug}-planner-scene`) ?? createInitialPlannerScene(venue));
}

export function VenueWorkspace({ venue }: { venue: VenueTwin }) {
  const [activeLayers, setActiveLayers] = useState<Set<string>>(() => loadLayerSettings(venue.slug));
  const [history, setHistory] = useState(() => createInitialHistory(venue));
  const [mobileLayersOpen, setMobileLayersOpen] = useState(false);
  const [measurementArmed, setMeasurementArmed] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Scene ready');
  const scene = history.present;
  const nativeTwin = useMemo(() => venueNativeTwinForSlug(venue.slug), [venue.slug]);
  const selectedObject = scene.objects.find((object) => object.id === scene.selectedObjectId);
  const frame = useMemo(() => measurementFrameForVenue(venue), [venue]);
  const adaptedGeometry = useMemo(() => adaptVenueGeometry(venue), [venue]);
  const ingestionRecords = useMemo(() => buildVenueIngestionRecords(venue), [venue]);
  const ingestionValidation = useMemo(() => validateIngestionRecords(ingestionRecords), [ingestionRecords]);
  const selectedRecord = useMemo(
    () => selectedObject
      ? objectToRecord(selectedObject)
      : scene.selectedObjectId
        ? nativeTwin ? nativeRecordForElement(nativeTwin, scene.selectedObjectId) ?? venue.objects.find((record) => record.id === scene.selectedObjectId) ?? zoneToRecord(venue, scene.selectedObjectId) : venue.objects.find((record) => record.id === scene.selectedObjectId) ?? zoneToRecord(venue, scene.selectedObjectId)
        : undefined,
    [nativeTwin, scene.selectedObjectId, selectedObject, venue],
  );

  useEffect(() => {
    autosaveSceneLocal(scene);
  }, [scene]);

  useEffect(() => {
    localStorage.setItem(layerStorageKey(venue.slug), JSON.stringify([...activeLayers]));
  }, [activeLayers, venue.slug]);

  function dispatch(action: PlannerAction) {
    setHistory((current) => {
      const { history: nextHistory, result } = applyHistoryAction(current, venue, action);
      setStatusMessage(result.message ?? (result.rejected ? 'Action rejected' : 'Scene updated'));
      return nextHistory;
    });
  }

  function replaceScene(nextScene: PlannerScene, message = 'Scene loaded') {
    setHistory((current) => ({ past: [...current.past, current.present], present: nextScene, future: [] }));
    setStatusMessage(message);
  }

  function toggleLayer(layer: string) {
    setActiveLayers((current) => {
      const next = new Set(current);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }

  function saveScene() {
    const revised = applyPlannerAction(scene, venue, { type: 'recordRevision', note: 'Manual local save' }).scene;
    saveSceneLocal(revised);
    replaceScene(revised, 'Scene saved locally');
    setStatusMessage('Scene saved locally');
  }

  function loadScene() {
    const loaded = loadSceneLocal(scene.id);
    if (loaded) replaceScene(loaded, 'Saved scene loaded');
    else setStatusMessage('No saved scene found');
  }

  function exportScene() {
    const blob = new Blob([exportSceneJson(scene)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${scene.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Scene JSON exported');
  }

  function importScene(file: File) {
    file.text().then((raw) => {
      const result = importSceneJson(raw);
      if (result.scene) replaceScene(result.scene, 'Scene JSON imported');
      else setStatusMessage(result.errors.join(' '));
    }).catch((error: unknown) => setStatusMessage(error instanceof Error ? error.message : 'Scene import failed'));
  }

  function undo() {
    setHistory((current) => undoHistory(current));
    setStatusMessage('Undo');
  }

  function redo() {
    setHistory((current) => redoHistory(current));
    setStatusMessage('Redo');
  }

  return (
    <div className="workspace-page">
      <header className="workspace-header">
        <div className="workspace-header__identity">
          <Link className="back-link" to="/"><ArrowLeft size={17} /> Route</Link>
          <div><span className="eyebrow">VENUE TWIN / {venue.fidelity} / {inferVenueType(venue)}</span><h1>{venue.name}</h1><p>{venue.city}, {venue.state} / {venue.showDate}</p></div>
        </div>
        <div className="workspace-header__metrics">
          <div><span>Source score</span><strong>{venue.sourceScore}</strong></div>
          <div><span>Source revision</span><strong>{venue.sourceYear}</strong></div>
          <div><span>CAD</span><strong>{venue.cadStatus}</strong></div>
          <div><span>Scene</span><strong>{scene.objects.length} obj</strong></div>
        </div>
      </header>
      <div className="workspace-layout workspace-layout--planner">
        <nav className="layer-rail planner-left-rail" aria-label="Venue model layers">
          <div className="layer-rail__title">LAYERS</div>
          {layers.map(({ key, label, icon: Icon }) => <button key={key} className={`layer-button ${activeLayers.has(key) ? 'layer-button--active' : ''}`} onClick={() => toggleLayer(key)}><Icon size={17} /><span>{label}</span></button>)}
          <div className="layer-rail__status">
            <ConfidenceBadge state={venue.riggingConfidence} />
            <p>Rigging loads and capacities require venue and engineer approval.</p>
          </div>
          <ObjectLibrary onAction={dispatch} />
          <GearPackBrowser scene={scene} onAction={dispatch} />
          <CommandConsole
            history={history}
            venue={venue}
            onSceneResult={(nextScene, message) => replaceScene(nextScene, message ?? 'Command applied')}
          />
        </nav>
        <main className="workspace-main">
          <PlannerToolbar
            scene={scene}
            measurementArmed={measurementArmed}
            canUndo={history.past.length > 0}
            canRedo={history.future.length > 0}
            onAction={dispatch}
            onUndo={undo}
            onRedo={redo}
            onSave={saveScene}
            onLoad={loadScene}
            onExport={exportScene}
            onImport={importScene}
            onToggleMeasurement={() => setMeasurementArmed((armed) => !armed)}
          />
          <Suspense fallback={<SceneFallback venue={venue} />}>
            <VenueScene
              venue={venue}
              plannerScene={scene}
              activeLayers={activeLayers}
              measurementArmed={measurementArmed}
              onAction={dispatch}
            />
          </Suspense>
          <div className="bottom-control-bar planner-status-bar">
            <div><span>Venue revision</span><strong>{venue.sourceYear}</strong></div>
            <div><span>Coordinate convention</span><strong>X / Y / Z feet</strong></div>
            <div><span>Source mappings</span><strong>{ingestionRecords.length} records</strong></div>
            <div><span>Status</span><strong>{statusMessage}</strong></div>
          </div>
          <button className="mobile-layer-trigger" onClick={() => setMobileLayersOpen((open) => !open)}><SlidersHorizontal size={17} /> Layers <ChevronDown size={15} /></button>
          {mobileLayersOpen && <div className="mobile-layer-sheet">{layers.map(({ key, label }) => <button key={key} className={activeLayers.has(key) ? 'mobile-layer-chip mobile-layer-chip--active' : 'mobile-layer-chip'} onClick={() => toggleLayer(key)}>{label}</button>)}</div>}
        </main>
        <aside className="planner-right-rail">
          <MeasurementPanel scene={scene} selectedObject={selectedObject} frame={frame} onAction={dispatch} onCancelMove={undo} />
          <VenueTwinInspector
            twin={nativeTwin}
            selectedElementId={scene.selectedObjectId}
            onSelectElement={(id) => dispatch({ type: 'selectObject', id })}
          />
          <LightingControls selectedObject={selectedObject} onAction={dispatch} />
          <AtmosphereControls selectedObject={selectedObject} atmosphereObjects={scene.objects.filter((object) => Boolean(object.atmosphere))} onAction={dispatch} />
          <SavedViewsPanel scene={scene} onAction={dispatch} />
          <SceneInspector scene={scene} selectedObject={selectedObject} onAction={dispatch} />
          <section className="planner-panel source-integrity-panel">
            <div className="panel-heading"><div><span className="eyebrow">SOURCE INTEGRITY</span><h2>{adaptedGeometry.floorWidth.status} floor</h2></div></div>
            <p>{adaptedGeometry.floorBoundary.note}</p>
            {adaptedGeometry.warnings.slice(0, 5).map((warning) => <div key={warning} className="warning-line">{warning}</div>)}
            {ingestionValidation.errors.map((error) => <div key={error} className="warning-line warning-line--error">{error}</div>)}
          </section>
          <SourceDrawer record={selectedRecord} onClose={() => dispatch({ type: 'selectObject', id: undefined })} />
        </aside>
      </div>
      <footer className="planning-disclaimer"><AlertTriangle size={16} />Planning and advance only. Does not replace venue rigging approval, structural engineering, fire marshal, life safety, seating manifest, CAD confirmation, or ADA review.</footer>
    </div>
  );
}
