import { ft } from "@/lib/units";
import type { SceneObject, SourceCitation, VenueTwin, ShowPlacement } from "../types";

const sources: SourceCitation[] = [
  {
    id: "bok-placeholder",
    fileName: "BOKCenter_TechPack_placeholder.pdf",
    pageOrSheet: "—",
    revision: "placeholder",
    date: "2026-12-15",
    authority: "INFERRED",
    confidence: "UNVERIFIED",
    originalText: "Reuse-test placeholder. Values TBD; awaiting venue tech pack.",
    notes: "Do not treat as venue-issued. Reuse-test only.",
  },
];

const floorW = ft(90);
const floorD = ft(200);

const objects: SceneObject[] = [
  {
    id: "bok-floor",
    kind: "venue-floor",
    label: "Event Floor (placeholder)",
    layer: "venue-shell",
    origin: "venue",
    position: { x: 0, y: 0, z: 0 },
    geometry: { type: "plane", size: { w: floorW, d: floorD } },
    color: "floor",
    confidence: "UNVERIFIED",
    authority: "INFERRED",
    sourceIds: ["bok-placeholder"],
    dims: "≈90′ × 200′ (placeholder)",
  },
  {
    id: "bok-court",
    kind: "court-marker",
    label: "Floor Midpoint (assumed)",
    layer: "venue-shell",
    origin: "venue",
    position: { x: 0, y: 0.01, z: 0 },
    geometry: { type: "marker", radius: ft(6) },
    color: "accent",
    confidence: "UNVERIFIED",
    authority: "INFERRED",
    sourceIds: ["bok-placeholder"],
  },
  {
    id: "bok-bowl",
    kind: "bowl-mass",
    label: "Bowl Mass",
    layer: "venue-bowl",
    origin: "venue",
    position: { x: 0, y: ft(38), z: 0 },
    geometry: { type: "box", size: { x: floorW + ft(100), y: ft(70), z: floorD + ft(120) } },
    color: "bowl-lower",
    confidence: "UNVERIFIED",
    authority: "INFERRED",
    sourceIds: ["bok-placeholder"],
  },
  {
    id: "bok-low-steel",
    kind: "grid-plane",
    label: "Low Steel (placeholder)",
    layer: "venue-rigging",
    origin: "venue",
    position: { x: 0, y: ft(100), z: 0 },
    geometry: { type: "plane", size: { w: floorW + ft(40), d: floorD + ft(40) } },
    color: "grid",
    confidence: "UNVERIFIED",
    authority: "INFERRED",
    sourceIds: ["bok-placeholder"],
    dims: "≈100′ AFF (placeholder)",
  },
];

export const bokCenter: VenueTwin = {
  id: "bok-center",
  name: "BOK Center",
  city: "Tulsa, OK",
  revision: "placeholder",
  floor: { widthFt: 90, depthFt: 200 },
  lowSteelFt: 100,
  highSteelFt: 120,
  riggingCapLb: 0,
  markedSpanMaxLb: 0,
  maxLoadAngleDeg: 0,
  disclaimer:
    "Reuse-test placeholder venue. No venue-issued data loaded. This system does not replace venue rigging approval, engineering, fire marshal, life safety, seating manifest or ADA review.",
  sources,
  objects,
};

export const bokPlacement: ShowPlacement = {
  id: "drt-at-bok",
  venueId: "bok-center",
  packageId: "drt-2027-spring",
  revision: "placeholder",
  showOrigin: { x: 0, y: 0, z: ft(76) },
  showRotationY: Math.PI,
  notes: "Reuse-test placement using default DRT package origin. Awaiting BOK tech pack.",
  adaptations: [],
  conflicts: [
    {
      id: "c1",
      title: "No venue-issued geometry",
      severity: "block",
      detail: "All BOK values are inferred. Do not use for planning until tech pack loads.",
      sourceIds: ["bok-placeholder"],
    },
  ],
  actions: [
    { id: "a1", title: "Request BOK Center tech pack", owner: "PM", status: "open" },
  ],
  sources,
};
