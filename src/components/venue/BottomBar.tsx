import { Camera, GitCompare, MessageSquare, Ruler, Save } from "lucide-react";

interface Props {
  venueRevision: string;
  packageRevision: string;
  placementRevision: string;
}

const savedViews = ["Overview", "Rigging plan", "Backstage", "B-stage / center court"];

export function BottomBar({ venueRevision, packageRevision, placementRevision }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border bg-card px-4 py-2 text-xs text-ink-soft">
      <RevBlock label="Venue" value={venueRevision} />
      <RevBlock label="Tour pkg" value={packageRevision} />
      <RevBlock label="Placement" value={placementRevision} />

      <div className="flex items-center gap-1">
        <span className="rule-label">Views</span>
        {savedViews.map((v) => (
          <button
            key={v}
            className="rounded-sm border border-border bg-background px-2 py-0.5 text-[11px] hover:bg-sand"
          >
            {v}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <IconBtn icon={GitCompare} label="Compare" />
        <IconBtn icon={Ruler} label="Measure" />
        <IconBtn icon={Camera} label="Screenshot" />
        <IconBtn icon={MessageSquare} label="Comment" />
        <IconBtn icon={Save} label="Save view" />
      </div>
    </div>
  );
}

function RevBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="rule-label">{label}</span>
      <span className="font-mono text-[11px] tabular text-ink">{value}</span>
    </div>
  );
}

function IconBtn({ icon: Icon, label }: { icon: typeof Camera; label: string }) {
  return (
    <button
      title={label}
      className="flex items-center gap-1 rounded-sm border border-border bg-background px-2 py-1 text-[11px] hover:bg-sand"
    >
      <Icon className="h-3 w-3" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
