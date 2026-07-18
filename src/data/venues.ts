import type { VenueTwin } from './types';
import { drtPackage, placeholder } from './helpers';
import { pilotVenues } from './venue-seeds/pilots';
import { waveOneA } from './venue-seeds/wave-one';
import { waveOneB } from './venue-seeds/wave-two';

export { drtPackage };

const detailed = [...pilotVenues, ...waveOneA, ...waveOneB];
const map = Object.fromEntries(detailed.map((venue) => [venue.slug, venue])) as Record<string, VenueTwin>;
export const detailedVenueMap = map;

export const venues: VenueTwin[] = [
  map['bok-center'],
  placeholder('chaifetz-arena', 'Chaifetz Arena', 'St. Louis', 'MO', '2027-04-09', 0, 'MISSING'),
  placeholder('gainbridge-fieldhouse', 'Gainbridge Fieldhouse', 'Indianapolis', 'IN', '2027-04-10', 60, 'READY'),
  map['van-andel-arena'],
  placeholder('coca-cola-coliseum', 'Coca-Cola Coliseum', 'Toronto', 'ON', '2027-04-13', 0, 'MISSING'),
  placeholder('dcu-center', 'DCU Center', 'Worcester', 'MA', '2027-04-15', 0, 'MISSING'),
  placeholder('giant-center', 'GIANT Center', 'Hershey', 'PA', '2027-04-16', 0, 'MISSING', 'giant-center.pdf'),
  map['spectrum-center'],
  placeholder('gas-south-arena', 'Gas South Arena', 'Duluth', 'GA', '2027-04-18', 0, 'MISSING'),
  placeholder('now-arena', 'NOW Arena', 'Hoffman Estates', 'IL', '2027-04-23', 0, 'MISSING'),
  placeholder('target-center', 'Target Center', 'Minneapolis', 'MN', '2027-04-24', 0, 'MISSING', 'target-center.pdf'),
  map['t-mobile-center'],
  placeholder('la-contingency', 'Los Angeles Playoff Contingency', 'Los Angeles', 'CA', '2027-04-28', 0, 'MISSING'),
  placeholder('honda-center', 'Honda Center', 'Anaheim', 'CA', '2027-04-29', 0, 'MISSING'),
  placeholder('viejas-arena', 'Viejas Arena', 'San Diego', 'CA', '2027-04-30', 0, 'MISSING'),
  map['desert-diamond-arena'],
  placeholder('red-rocks', 'Red Rocks Amphitheatre', 'Morrison', 'CO', '2027-05-04', 58, 'STALE'),
  map['heb-center'], map['dickies-arena'],
];

export const venueMap = Object.fromEntries(venues.map((venue) => [venue.slug, venue])) as Record<string, VenueTwin>;
export const comparisonVenues = ['dickies-arena', 'van-andel-arena', 'heb-center', 't-mobile-center', 'desert-diamond-arena'].map((slug) => map[slug]);
