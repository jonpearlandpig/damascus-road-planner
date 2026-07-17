import { ft } from "@/lib/units";
import type { TourPackage, SceneObject, SourceCitation } from "../types";

const sources: SourceCitation[] = [
  {
    id: "drt-geo-v0.4",
    fileName: "DRT_ProductionGeometry_v0.4.pdf",
    pageOrSheet: "Plan-01",
    revision: "v0.4",
    date: "2026-11-12",
    authority: "TOUR_ISSUED",
    confidence: "CALIBRATED_PLANNING",
    notes: "Working geometry — not engineering approval.",
    originalText:
      "Main deck 78'-0\" × 42'-0\", deck +5'-6\". Monolith base 50'-0\", vertex 25'-0\" upstage, 35'-4\" above deck.",
  },
];

// Package-local frame: origin at show origin (front of main deck, on centerline).
// +Z upstage, +X stage-left, +Y up.
const deckW = ft(78);
const deckD = ft(42);
const deckH = ft(5, 6);

const objects: SceneObject[] = [
  {
    id: "main-deck",
    kind: "main-deck",
    label: "Main Deck",
    layer: "tour-deck",
    origin: "tour",
    position: { x: 0, y: deckH / 2, z: deckD / 2 },
    geometry: { type: "box", size: { x: deckW, y: deckH, z: deckD } },
    color: "deck",
    confidence: "CALIBRATED_PLANNING",
    authority: "TOUR_ISSUED",
    sourceIds: ["drt-geo-v0.4"],
    dims: "78′ × 42′, deck +5′ 6″",
    owner: "Production Design",
    status: "Working geometry v0.4",
    nextAction: "Confirm final deck footprint with scenic vendor",
  },
  {
    id: "monolith",
    kind: "monolith",
    label: "Monolith / Prow",
    layer: "tour-monolith",
    origin: "tour",
    // Prism sits on deck, base along downstage edge, vertex 25' upstage.
    position: { x: 0, y: deckH, z: ft(12, 6) }, // centered along its 25' depth from deck front
    geometry: { type: "prism", base: ft(50), depth: ft(25), height: ft(35, 4) },
    color: "monolith",
    confidence: "CALIBRATED_PLANNING",
    authority: "TOUR_ISSUED",
    sourceIds: ["drt-geo-v0.4"],
    dims: "Base 50′ · Depth 25′ · H 35′ 4″ AFD",
    owner: "Scenic",
    status: "Working geometry v0.4",
    nextAction: "Engineering package for load path",
  },
  {
    id: "center-thrust",
    kind: "center-thrust",
    label: "Center Thrust",
    layer: "tour-thrusts",
    origin: "tour",
    position: { x: 0, y: deckH / 2, z: -ft(21) },
    geometry: { type: "box", size: { x: ft(6), y: deckH, z: ft(42) } },
    color: "deck",
    confidence: "CALIBRATED_PLANNING",
    authority: "TOUR_ISSUED",
    sourceIds: ["drt-geo-v0.4"],
    dims: "6′ × 42′",
  },
  {
    id: "side-thrust-sl",
    kind: "side-thrust",
    label: "Side Thrust SL",
    layer: "tour-thrusts",
    origin: "tour",
    position: { x: ft(20), y: deckH / 2, z: -ft(16) },
    geometry: { type: "box", size: { x: ft(5), y: deckH, z: ft(32) } },
    color: "deck",
    confidence: "CALIBRATED_PLANNING",
    authority: "TOUR_ISSUED",
    sourceIds: ["drt-geo-v0.4"],
    dims: "5′ × 32′",
  },
  {
    id: "side-thrust-sr",
    kind: "side-thrust",
    label: "Side Thrust SR",
    layer: "tour-thrusts",
    origin: "tour",
    position: { x: -ft(20), y: deckH / 2, z: -ft(16) },
    geometry: { type: "box", size: { x: ft(5), y: deckH, z: ft(32) } },
    color: "deck",
    confidence: "CALIBRATED_PLANNING",
    authority: "TOUR_ISSUED",
    sourceIds: ["drt-geo-v0.4"],
    dims: "5′ × 32′",
  },
  {
    id: "b-stage",
    kind: "b-stage",
    label: "B-Stage",
    layer: "tour-bstage",
    origin: "tour",
    // Default local center 76 ft downstage from show origin. Downstage = -Z.
    position: { x: 0, y: ft(0, 6), z: -ft(76) },
    geometry: { type: "cylinder", radius: ft(13), height: ft(1) },
    color: "bstage",
    confidence: "CALIBRATED_PLANNING",
    authority: "TOUR_ISSUED",
    sourceIds: ["drt-geo-v0.4"],
    dims: "Ø 26′",
    owner: "Production Design",
    nextAction: "Confirm cable path across floor",
  },
  // Four band risers (upstage of monolith footprint)
  ...[0, 1, 2, 3].map<SceneObject>((i) => ({
    id: `band-${i + 1}`,
    kind: "band-riser",
    label: `Band Riser ${i + 1}`,
    layer: "tour-band",
    origin: "tour",
    position: {
      x: (i - 1.5) * ft(9),
      y: deckH + ft(1),
      z: ft(32),
    },
    geometry: { type: "box", size: { x: ft(8), y: ft(2), z: ft(8) } },
    color: "band",
    confidence: "APPROXIMATE_PLANNING",
    authority: "INFERRED",
    sourceIds: ["drt-geo-v0.4"],
    dims: "8′ × 8′ · +2′",
  })),
];

export const drtPackage: TourPackage = {
  id: "drt-2027-spring",
  name: "DRT Production Package",
  revision: "v0.4 · 2026-11-12",
  bandSize: 4,
  disclaimer:
    "Planning geometry only. Not engineering approval. Not for load calculations.",
  sources,
  objects,
};
