import type { RailSectionId } from "./LeftRail";
import type { ShowPlacement, TourPackage, VenueTwin } from "@/lib/drt/types";
import { AuthorityBadge, ConfidenceBadge } from "./ConfidenceBadge";
import { Disclaimer } from "./Disclaimer";

interface Props {
  section: RailSectionId;
  venue: VenueTwin;
  tourPackage: TourPackage;
  placement: ShowPlacement;
  onFocusObject: (id: string) => void;
}

export function RailPanel({ section, venue, tourPackage, placement, onFocusObject }: Props) {
  return (
    <div className="flex h-full flex-col overflow-y-auto border-r border-border bg-background">
      <div className="border-b border-border px-4 py-3">
        <div className="rule-label">{venue.name}</div>
        <h2 className="font-display text-xl leading-tight text-ink">
          {sectionTitle(section)}
        </h2>
        <div className="mt-1 text-xs text-muted-foreground">
          {venue.city} · {venue.revision}
        </div>
      </div>

      <div className="flex-1 space-y-4 px-4 py-3 text-sm">
        {renderSection(section, venue, tourPackage, placement, onFocusObject)}
      </div>
    </div>
  );
}

function sectionTitle(id: RailSectionId) {
  return {
    overview: "Overview",
    production: "Production",
    rigging: "Rigging",
    backstage: "Backstage",
    logistics: "Logistics",
    audience: "Audience & Sightlines",
    seating: "Seating Impact",
    safety: "Safety & Egress",
    sources: "Sources",
    issues: "Open Issues",
  }[id];
}

function renderSection(
  section: RailSectionId,
  venue: VenueTwin,
  pkg: TourPackage,
  placement: ShowPlacement,
  focus: (id: string) => void,
) {
  switch (section) {
    case "overview":
      return (
        <>
          <Disclaimer text={venue.disclaimer} />
          <KV label="Floor" value={`${venue.floor.widthFt}′ × ${venue.floor.depthFt}′`} />
          <KV label="Low steel" value={`${venue.lowSteelFt}′ AFF`} note="Venue reference · engineering confirmation required" />
          <KV label="High steel" value={`${venue.highSteelFt}′ AFF`} note="Venue reference · engineering confirmation required" />
          <KV
            label="Show origin"
            value={`${(placement.showOrigin.z / 0.3048).toFixed(1)}′ upstage from anchor`}
          />
          <div className="pt-2">
            <div className="rule-label pb-1">Placement notes</div>
            <p className="text-ink-soft">{placement.notes}</p>
          </div>
        </>
      );
    case "production":
      return (
        <>
          <div className="rule-label">DRT package · {pkg.revision}</div>
          {pkg.objects.map((o) => (
            <button
              key={o.id}
              onClick={() => focus(o.id)}
              className="flex w-full items-start justify-between rounded-sm border border-border bg-card px-3 py-2 text-left hover:border-firelight"
            >
              <div>
                <div className="text-sm font-medium text-ink">{o.label}</div>
                {o.dims && <div className="font-mono text-[11px] tabular text-ink-soft">{o.dims}</div>}
              </div>
              <ConfidenceBadge confidence={o.confidence} />
            </button>
          ))}
        </>
      );
    case "rigging":
      return (
        <>
          <Disclaimer text="Reference values only. All points, loads, spans and angles require engineering confirmation per show." />
          <KV label="Total end-stage cap. ref." value={`${venue.riggingCapLb.toLocaleString()} lb`} />
          <KV label="Marked span max ref." value={`${venue.markedSpanMaxLb.toLocaleString()} lb`} />
          <KV label="Max load angle" value={`${venue.maxLoadAngleDeg}° from vertical`} />
          <KV label="Low steel" value={`${venue.lowSteelFt}′ AFF`} />
          <KV label="High steel" value={`${venue.highSteelFt}′ AFF`} />
        </>
      );
    case "backstage":
      return (
        <>
          <KV label="Backstage clearance (plan-derived)" value="≈ 27′ 9″" note="Confirm with venue ops" />
          <KV label="Deck side remainder" value="3′ 6″ per side" />
          <p className="text-xs text-muted-foreground">
            BOH and dock zones shown in scene are prior-show references pending venue confirmation.
          </p>
        </>
      );
    case "logistics":
      return (
        <>
          <KV label="Load-in call" value="TBD" />
          <KV label="Dock count" value="Ref. from prior show" />
          <KV label="Bus parking" value="TBD" />
        </>
      );
    case "audience":
      return <p className="text-ink-soft">Sightline analysis for center-court B-stage — pending seating map ingest.</p>;
    case "seating":
      return (
        <>
          <p className="text-ink-soft">
            Kill/hold seat calculations require venue seating manifest. Not yet loaded.
          </p>
          <Disclaimer text="Seating manifest review is out of scope of this tool. Coordinate with venue and ticketing." />
        </>
      );
    case "safety":
      return (
        <Disclaimer text="Fire marshal, life-safety and ADA review are the venue's authority. This tool does not certify egress." />
      );
    case "sources": {
      const all = [...venue.sources, ...pkg.sources, ...placement.sources];
      return (
        <ul className="space-y-2">
          {all.map((s) => (
            <li key={s.id} className="rounded-sm border border-border bg-card p-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-medium text-ink">{s.fileName}</div>
                  <div className="font-mono text-[11px] tabular text-ink-soft">
                    {s.pageOrSheet ?? "—"} · {s.revision ?? "—"} · {s.date ?? "—"}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <ConfidenceBadge confidence={s.confidence} />
                  <AuthorityBadge authority={s.authority} />
                </div>
              </div>
              {s.originalText && (
                <blockquote className="mt-1 border-l border-ink/20 pl-2 text-[11px] italic text-ink-soft">
                  “{s.originalText}”
                </blockquote>
              )}
            </li>
          ))}
        </ul>
      );
    }
    case "issues":
      return (
        <>
          <div className="rule-label">Conflicts</div>
          {placement.conflicts.map((c) => (
            <div key={c.id} className="rounded-sm border border-border bg-card p-2">
              <div className="flex items-center gap-2">
                <span
                  className={
                    c.severity === "block"
                      ? "inline-block h-2 w-2 rounded-full bg-conflict"
                      : c.severity === "warn"
                        ? "inline-block h-2 w-2 rounded-full bg-caution"
                        : "inline-block h-2 w-2 rounded-full bg-ink-soft"
                  }
                />
                <div className="text-sm font-medium text-ink">{c.title}</div>
              </div>
              <p className="mt-1 text-xs text-ink-soft">{c.detail}</p>
            </div>
          ))}
          <div className="rule-label pt-2">Actions</div>
          {placement.actions.map((a) => (
            <div
              key={a.id}
              className="flex items-start justify-between rounded-sm border border-border bg-card p-2"
            >
              <div>
                <div className="text-sm text-ink">{a.title}</div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {a.owner}
                </div>
              </div>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {a.status}
              </span>
            </div>
          ))}
        </>
      );
  }
}

function KV({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border-b border-border/60 pb-2">
      <div className="rule-label">{label}</div>
      <div className="font-mono text-sm tabular text-ink">{value}</div>
      {note && <div className="text-[11px] text-muted-foreground">{note}</div>}
    </div>
  );
}
