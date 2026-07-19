import bokCenter from '../../source-assets/venue-twins/bok-center.twin.json';
import desertDiamondArena from '../../source-assets/venue-twins/desert-diamond-arena.twin.json';
import dickiesArena from '../../source-assets/venue-twins/dickies-arena.twin.json';
import gainbridgeFieldhouse from '../../source-assets/venue-twins/gainbridge-fieldhouse.twin.json';
import giantCenter from '../../source-assets/venue-twins/giant-center.twin.json';
import hebCenter from '../../source-assets/venue-twins/heb-center.twin.json';
import redRocks from '../../source-assets/venue-twins/red-rocks.twin.json';
import spectrumCenter from '../../source-assets/venue-twins/spectrum-center.twin.json';
import tMobileCenter from '../../source-assets/venue-twins/t-mobile-center.twin.json';
import targetCenter from '../../source-assets/venue-twins/target-center.twin.json';
import vanAndelArena from '../../source-assets/venue-twins/van-andel-arena.twin.json';
import type { VenueNativeGeometry } from './types';

export const venueNativeTwins = [
  bokCenter,
  gainbridgeFieldhouse,
  vanAndelArena,
  giantCenter,
  spectrumCenter,
  targetCenter,
  tMobileCenter,
  desertDiamondArena,
  redRocks,
  hebCenter,
  dickiesArena,
] as VenueNativeGeometry[];

export const venueNativeTwinMap = Object.fromEntries(venueNativeTwins.map((twin) => [twin.venueSlug, twin])) as Record<string, VenueNativeGeometry>;

export function venueNativeTwinForSlug(slug: string): VenueNativeGeometry | undefined {
  return venueNativeTwinMap[slug];
}

