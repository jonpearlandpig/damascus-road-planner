import {
  Layers,
  Ruler,
  Wrench,
  DoorOpen,
  Truck,
  Users,
  ArmchairIcon,
  ShieldAlert,
  BookText,
  AlertOctagon,
  Eye,
  EyeOff,
} from "lucide-react";
import type { LayerId } from "@/lib/drt/types";
import { cn } from "@/lib/utils";

export type RailSectionId =
  | "overview"
  | "production"
  | "rigging"
  | "backstage"
  | "logistics"
  | "audience"
  | "seating"
  | "safety"
  | "sources"
  | "issues";

export const RAIL_SECTIONS: { id: RailSectionId; label: string; icon: typeof Layers }[] = [
  { id: "overview", label: "Overview", icon: Layers },
  { id: "production", label: "Production", icon: Ruler },
  { id: "rigging", label: "Rigging", icon: Wrench },
  { id: "backstage", label: "Backstage", icon: DoorOpen },
  { id: "logistics", label: "Logistics", icon: Truck },
  { id: "audience", label: "Audience & Sightlines", icon: Users },
  { id: "seating", label: "Seating Impact", icon: ArmchairIcon },
  { id: "safety", label: "Safety & Egress", icon: ShieldAlert },
  { id: "sources", label: "Sources", icon: BookText },
  { id: "issues", label: "Open Issues", icon: AlertOctagon },
];

export const LAYER_GROUPS: {
  heading: string;
  origin: "venue" | "tour";
  layers: { id: LayerId; label: string }[];
}[] = [
  {
    heading: "Venue",
    origin: "venue",
    layers: [
      { id: "venue-shell", label: "Floor & shell" },
      { id: "venue-bowl", label: "Bowl massing" },
      { id: "venue-rigging", label: "Steel & scoreboard" },
      { id: "venue-ops", label: "Dock & BOH" },
    ],
  },
  {
    heading: "Tour package",
    origin: "tour",
    layers: [
      { id: "tour-deck", label: "Main deck & thrusts", },
      { id: "tour-monolith", label: "Monolith / prow" },
      { id: "tour-thrusts", label: "Side thrusts" },
      { id: "tour-bstage", label: "B-stage" },
      { id: "tour-band", label: "Band risers" },
    ],
  },
];

interface Props {
  active: RailSectionId;
  onSelect: (id: RailSectionId) => void;
  activeLayers: Set<LayerId>;
  onToggleLayer: (id: LayerId) => void;
}

export function LeftRail({ active, onSelect, activeLayers, onToggleLayer }: Props) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto border-r border-border bg-card px-2 py-3">
      <div>
        <div className="rule-label px-2 pb-1">Workspace</div>
        <nav className="flex flex-col">
          {RAIL_SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                className={cn(
                  "flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm",
                  isActive
                    ? "bg-ink text-primary-foreground"
                    : "text-ink hover:bg-sand",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{s.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-border pt-3">
        <div className="rule-label px-2 pb-1">Layers</div>
        {LAYER_GROUPS.map((g) => (
          <div key={g.heading} className="mb-2">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {g.heading}
            </div>
            {g.layers.map((l) => {
              const on = activeLayers.has(l.id);
              return (
                <button
                  key={l.id}
                  onClick={() => onToggleLayer(l.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-sm px-2 py-1 text-left text-xs",
                    on ? "text-ink hover:bg-sand" : "text-muted-foreground hover:bg-sand",
                  )}
                >
                  <span>{l.label}</span>
                  {on ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
