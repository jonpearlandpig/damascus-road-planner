import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Menu, Loader2, X } from "lucide-react";
import { LeftRail, LAYER_GROUPS, type RailSectionId } from "./LeftRail";
import { RailPanel } from "./RailPanel";
import { InfoDrawer } from "./InfoDrawer";
import { BottomBar } from "./BottomBar";
import { Disclaimer } from "./Disclaimer";
import type { LayerId, ShowPlacement, TourPackage, VenueTwin } from "@/lib/drt/types";
import { VenueScene } from "./VenueScene";

interface Props {
  venue: VenueTwin;
  tourPackage: TourPackage;
  placement: ShowPlacement;
}

const ALL_LAYERS: LayerId[] = LAYER_GROUPS.flatMap((g) => g.layers.map((l) => l.id));

export function VenueWorkspace({ venue, tourPackage, placement }: Props) {
  const [section, setSection] = useState<RailSectionId>("overview");
  const [activeLayers, setActiveLayers] = useState<Set<LayerId>>(
    () => new Set(ALL_LAYERS),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mobilePanels, setMobilePanels] = useState(false);

  useEffect(() => setMounted(true), []);

  const selectedObject = useMemo(() => {
    if (!selectedId) return null;
    return (
      venue.objects.find((o) => o.id === selectedId) ??
      tourPackage.objects.find((o) => o.id === selectedId) ??
      null
    );
  }, [selectedId, venue, tourPackage]);

  const sources = [...venue.sources, ...tourPackage.sources, ...placement.sources];

  const toggleLayer = (id: LayerId) =>
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex h-dvh flex-col bg-background text-ink">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border bg-card px-3 py-2">
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="flex items-center gap-1 rounded-sm px-2 py-1 text-xs text-ink-soft hover:bg-sand"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Tour
          </Link>
          <div className="hidden h-4 w-px bg-border md:block" />
          <div className="hidden md:block">
            <div className="rule-label">Venue Twin</div>
            <div className="font-display text-sm leading-tight">
              {venue.name} <span className="text-muted-foreground">· {venue.city}</span>
            </div>
          </div>
        </div>
        <div className="hidden gap-4 md:flex items-center">
          <div className="text-right">
            <div className="rule-label">Tour package</div>
            <div className="font-mono text-[11px] tabular">{tourPackage.revision}</div>
          </div>
          <div className="text-right">
            <div className="rule-label">Placement</div>
            <div className="font-mono text-[11px] tabular">{placement.revision}</div>
          </div>
        </div>
        <button
          onClick={() => setMobilePanels((v) => !v)}
          className="rounded-sm p-1.5 text-ink hover:bg-sand md:hidden"
          aria-label="Toggle panels"
        >
          <Menu className="h-4 w-4" />
        </button>
      </header>

      {/* Main body */}
      <div className="flex min-h-0 flex-1">
        {/* Icon rail — always desktop, drawer on mobile */}
        <div className="hidden md:block md:w-[220px] lg:w-[240px] shrink-0">
          <LeftRail
            active={section}
            onSelect={setSection}
            activeLayers={activeLayers}
            onToggleLayer={toggleLayer}
          />
        </div>

        {/* Section rail panel */}
        <div className="hidden lg:block w-[280px] shrink-0">
          <RailPanel
            section={section}
            venue={venue}
            tourPackage={tourPackage}
            placement={placement}
            onFocusObject={(id) => setSelectedId(id)}
          />
        </div>

        {/* Scene + bottom bar */}
        <div className="flex min-w-0 min-h-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1 bg-[oklch(0.94_0.015_80)]">
            {mounted ? (
              <VenueScene
                venue={venue}
                tourPackage={tourPackage}
                placement={placement}
                activeLayers={activeLayers}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-soft">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="text-xs">Preparing scene…</span>
              </div>
            )}

            <div className="pointer-events-none absolute left-3 top-3 max-w-md">
              <div className="pointer-events-auto rounded-sm border border-border bg-card/95 px-3 py-2 shadow-sm backdrop-blur">
                <div className="rule-label">Now viewing</div>
                <div className="font-display text-sm text-ink">
                  DRT at {venue.name}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Feet / inches shown · internal meters
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute right-3 top-3 hidden max-w-sm md:block">
              <div className="pointer-events-auto">
                <Disclaimer text={venue.disclaimer} />
              </div>
            </div>
          </div>

          <BottomBar
            venueRevision={venue.revision}
            packageRevision={tourPackage.revision}
            placementRevision={placement.revision}
          />
        </div>

        {/* Info drawer — desktop persistent */}
        <div className="hidden md:block shrink-0">
          <InfoDrawer
            object={selectedObject}
            sources={sources}
            onClose={() => setSelectedId(null)}
          />
        </div>
      </div>

      {/* Mobile: full-screen panels sheet */}
      {mobilePanels && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="absolute inset-0 bg-ink/50"
            onClick={() => setMobilePanels(false)}
          />
          <div className="relative ml-auto flex h-full w-[88vw] max-w-sm flex-col bg-card">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <div className="rule-label">Workspace</div>
              <button onClick={() => setMobilePanels(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <LeftRail
                active={section}
                onSelect={(id) => {
                  setSection(id);
                }}
                activeLayers={activeLayers}
                onToggleLayer={toggleLayer}
              />
              <RailPanel
                section={section}
                venue={venue}
                tourPackage={tourPackage}
                placement={placement}
                onFocusObject={(id) => {
                  setSelectedId(id);
                  setMobilePanels(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile info drawer overlay when object selected */}
      {selectedObject && (
        <div className="fixed inset-x-0 bottom-0 z-30 max-h-[70vh] overflow-y-auto border-t border-border bg-card md:hidden">
          <InfoDrawer
            object={selectedObject}
            sources={sources}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}
    </div>
  );
}
