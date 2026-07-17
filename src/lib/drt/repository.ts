// Clean repository interface. Seed adapter today, Supabase adapter later.
import type { TourPackage, TourShow, VenueTwin, ShowPlacement } from "./types";
import { spectrumCenter, spectrumPlacement } from "./seed/spectrum";
import { bokCenter, bokPlacement } from "./seed/bok";
import { drtPackage } from "./seed/drt-package";
import { tourShows } from "./seed/tour";

export interface DrtRepository {
  listShows(): TourShow[];
  getVenue(slug: string): VenueTwin | undefined;
  getPackage(id: string): TourPackage | undefined;
  getPlacement(venueId: string): ShowPlacement | undefined;
}

const venues: Record<string, VenueTwin> = {
  [spectrumCenter.id]: spectrumCenter,
  [bokCenter.id]: bokCenter,
};

const placements: Record<string, ShowPlacement> = {
  [spectrumPlacement.venueId]: spectrumPlacement,
  [bokPlacement.venueId]: bokPlacement,
};

const packages: Record<string, TourPackage> = {
  [drtPackage.id]: drtPackage,
};

export const seedRepository: DrtRepository = {
  listShows: () => tourShows,
  getVenue: (slug) => venues[slug],
  getPackage: (id) => packages[id],
  getPlacement: (venueId) => placements[venueId],
};

// Singleton used by the app. Swap to a Supabase-backed implementation later
// without touching call sites.
export const repository: DrtRepository = seedRepository;
