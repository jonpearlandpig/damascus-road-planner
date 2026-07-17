import { X } from "lucide-react";
import type { SceneObject, SourceCitation } from "@/lib/drt/types";
import { AuthorityBadge, ConfidenceBadge } from "./ConfidenceBadge";

interface Props {
  object: SceneObject | null;
  sources: SourceCitation[];
  onClose: () => void;
}

export function InfoDrawer({ object, sources, onClose }: Props) {
  if (!object) {
    return (
      <div className="hidden h-full w-80 shrink-0 border-l border-border bg-card md:block">
        <div className="p-4">
          <div className="rule-label">Selection</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Click any object in the scene to inspect dimensions, source and status.
          </p>
        </div>
      </div>
    );
  }

  const cited = sources.filter((s) => object.sourceIds.includes(s.id));

  return (
    <div className="flex h-full w-full shrink-0 flex-col border-l border-border bg-card md:w-96">
      <div className="flex items-start justify-between border-b border-border px-4 py-3">
        <div>
          <div className="rule-label">{object.origin === "venue" ? "Venue object" : object.origin === "tour" ? "Tour object" : "Placement"}</div>
          <div className="font-display text-lg leading-tight">{object.label}</div>
          {object.dims && (
            <div className="mt-1 font-mono text-xs text-ink-soft tabular">{object.dims}</div>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-sm p-1 text-muted-foreground hover:bg-sand hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3 text-sm">
        <div className="flex flex-wrap gap-1.5">
          <ConfidenceBadge confidence={object.confidence} />
          <AuthorityBadge authority={object.authority} />
        </div>

        {object.notes && (
          <div>
            <div className="rule-label pb-1">Notes</div>
            <p className="text-ink-soft">{object.notes}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {object.owner && (
            <Field label="Owner" value={object.owner} />
          )}
          {object.contact && (
            <Field label="Contact" value={object.contact} />
          )}
          {object.status && (
            <Field label="Status" value={object.status} />
          )}
          {object.nextAction && (
            <Field label="Next action" value={object.nextAction} />
          )}
        </div>

        <div>
          <div className="rule-label pb-1">Sources</div>
          {cited.length === 0 ? (
            <p className="text-xs text-muted-foreground">No citations attached.</p>
          ) : (
            <ul className="space-y-2">
              {cited.map((s) => (
                <li key={s.id} className="rounded-sm border border-border bg-sand/60 p-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-medium text-ink">{s.fileName}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-ink-soft">
                        {s.pageOrSheet ?? "—"} · {s.revision ?? "—"} · {s.date ?? "—"}
                      </div>
                    </div>
                    <ConfidenceBadge confidence={s.confidence} />
                  </div>
                  {s.originalText && (
                    <blockquote className="mt-2 border-l border-ink/20 pl-2 text-[11px] italic text-ink-soft">
                      “{s.originalText}”
                    </blockquote>
                  )}
                  {s.notes && (
                    <div className="mt-1 text-[11px] text-muted-foreground">{s.notes}</div>
                  )}
                  <div className="mt-1">
                    <AuthorityBadge authority={s.authority} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="rule-label pb-0.5">{label}</div>
      <div className="text-sm text-ink">{value}</div>
    </div>
  );
}
