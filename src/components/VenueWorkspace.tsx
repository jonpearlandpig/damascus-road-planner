import { lazy, Suspense, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Boxes, Building2, Cable, ChevronDown, ClipboardList, Eye, FileText, Grid3X3, MapPinned, Route, ShieldAlert, SlidersHorizontal, Users } from 'lucide-react';
import type { LayerKey, SceneObjectRecord, VenueTwin } from '../data/types';
import { ConfidenceBadge } from './ConfidenceBadge';
import { SourceDrawer } from './SourceDrawer';

const VenueScene = lazy(() => import('./VenueScene').then((module) => ({ default: module.VenueScene })));

const layers: Array<{ key: LayerKey; label: string; icon: typeof Eye }> = [
  { key: 'overview', label: 'Overview', icon: Building2 }, { key: 'production', label: 'Production', icon: Boxes },
  { key: 'rigging', label: 'Rigging', icon: Grid3X3 }, { key: 'backstage', label: 'Backstage', icon: Users },
  { key: 'logistics', label: 'Logistics', icon: Route }, { key: 'audience', label: 'Audience & sightlines', icon: Eye },
  { key: 'seating', label: 'Seating impact', icon: SlidersHorizontal }, { key: 'safety', label: 'Safety & egress', icon: ShieldAlert },
  { key: 'sources', label: 'Sources', icon: FileText }, { key: 'issues', label: 'Open issues', icon: ClipboardList },
];

function initialSelectedObject(): string | undefined {
  if (typeof window === 'undefined' || !window.matchMedia) return 'center-court';
  return window.matchMedia('(min-width: 861px)').matches ? 'center-court' : undefined;
}

function zoneToRecord(venue: VenueTwin, id: string): SceneObjectRecord | undefined {
  const zone = venue.zones.find((item) => item.id === id);
  if (!zone) return undefined;
  return { id: zone.id, label: zone.label, category: zone.layer, dimensions: `${zone.widthFt}′ × ${zone.depthFt}′${zone.heightFt ? ` × ${zone.heightFt}′` : ''}`, notes: `${zone.kind.toUpperCase()} planning zone generated from source-backed operational data.`, source: zone.source };
}

function SceneFallback({ venue }: { venue: VenueTwin }) {
  return <div className="scene-shell scene-shell--loading">Loading {venue.name} planning model…</div>;
}

export function VenueWorkspace({ venue }: { venue: VenueTwin }) {
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(['overview', 'production', 'rigging', 'logistics', 'backstage', 'safety']));
  const [selectedId, setSelectedId] = useState<string | undefined>(initialSelectedObject);
  const [mobileLayersOpen, setMobileLayersOpen] = useState(false);
  const selectedRecord = useMemo(() => venue.objects.find((record) => record.id === selectedId) ?? (selectedId ? zoneToRecord(venue, selectedId) : undefined), [selectedId, venue]);

  function toggleLayer(layer: string) {
    setActiveLayers((current) => { const next = new Set(current); if (next.has(layer)) next.delete(layer); else next.add(layer); return next; });
  }

  return (
    <div className="workspace-page">
      <header className="workspace-header">
        <div className="workspace-header__identity">
          <Link className="back-link" to="/"><ArrowLeft size={17} /> Route</Link>
          <div><span className="eyebrow">VENUE TWIN · {venue.fidelity}</span><h1>{venue.name}</h1><p>{venue.city}, {venue.state} · {venue.showDate}</p></div>
        </div>
        <div className="workspace-header__metrics"><div><span>Source score</span><strong>{venue.sourceScore}</strong></div><div><span>Source revision</span><strong>{venue.sourceYear}</strong></div><div><span>CAD</span><strong>{venue.cadStatus}</strong></div></div>
      </header>
      <div className="workspace-layout">
        <nav className="layer-rail" aria-label="Venue model layers">
          <div className="layer-rail__title">LAYERS</div>
          {layers.map(({ key, label, icon: Icon }) => <button key={key} className={`layer-button ${activeLayers.has(key) ? 'layer-button--active' : ''}`} onClick={() => toggleLayer(key)}><Icon size={17} /><span>{label}</span></button>)}
          <div className="layer-rail__status"><ConfidenceBadge state={venue.riggingConfidence} /><p>Rigging values are venue references only.</p></div>
        </nav>
        <main className="workspace-main">
          <Suspense fallback={<SceneFallback venue={venue} />}>
            <VenueScene venue={venue} activeLayers={activeLayers} onSelect={setSelectedId} />
          </Suspense>
          <div className="bottom-control-bar">
            <div><span>Venue revision</span><strong>{venue.sourceYear}</strong></div>
            <div><span>Tour package</span><strong>DRT Working v12</strong></div>
            <button disabled aria-label="Saved views coming soon"><MapPinned size={16} /><span>Saved views</span><small>Coming soon</small></button>
            <button disabled aria-label="Measure tool coming soon"><Cable size={16} /><span>Measure</span><small>Coming soon</small></button>
          </div>
          <button className="mobile-layer-trigger" onClick={() => setMobileLayersOpen((open) => !open)}><SlidersHorizontal size={17} /> Layers <ChevronDown size={15} /></button>
          {mobileLayersOpen && <div className="mobile-layer-sheet">{layers.map(({ key, label }) => <button key={key} className={activeLayers.has(key) ? 'mobile-layer-chip mobile-layer-chip--active' : 'mobile-layer-chip'} onClick={() => toggleLayer(key)}>{label}</button>)}</div>}
        </main>
        <SourceDrawer record={selectedRecord} onClose={() => setSelectedId(undefined)} />
      </div>
      <footer className="planning-disclaimer"><AlertTriangle size={16} />Planning and advance only. Does not replace venue rigging approval, structural engineering, fire marshal, life safety, seating manifest or ADA review.</footer>
    </div>
  );
}
