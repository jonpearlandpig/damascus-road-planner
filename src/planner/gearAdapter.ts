import audioPack from '../../gear-packs/audio.json';
import camerasPack from '../../gear-packs/cameras.json';
import deckingPack from '../../gear-packs/decking.json';
import lightingPack from '../../gear-packs/lighting.json';
import riggingPack from '../../gear-packs/rigging.json';
import sfxPack from '../../gear-packs/sfx.json';
import videoPack from '../../gear-packs/video.json';
import type { GearPackReference, ObjectDefinition, PlannerObjectCategory, PlannerScene } from './types';

export interface GearPackItem {
  id: string;
  item: string;
  qty: number;
  status: 'OWNED' | 'CANDIDATE' | 'RENTAL-TBD';
  weight_lbs: number | 'TBD';
  power: string;
  source: 'T.I.';
  notes: string;
}

export interface GearPack {
  department: string;
  schema: '_SCHEMA.md';
  source_policy: string;
  items: GearPackItem[];
}

export const gearPacks = [
  audioPack,
  camerasPack,
  deckingPack,
  lightingPack,
  riggingPack,
  sfxPack,
  videoPack,
] as GearPack[];

export const gearFilters = ['Lighting', 'Video', 'Audio', 'Rigging', 'Scenic', 'Effects', 'Staging', 'Atmospherics'] as const;
export type GearFilter = (typeof gearFilters)[number];

const departmentToCategory: Record<string, PlannerObjectCategory> = {
  audio: 'Audio arrays',
  cameras: 'Camera platforms',
  decking: 'Stage decks',
  lighting: 'Lighting fixtures',
  rigging: 'Truss',
  sfx: 'Hazers',
  video: 'Video walls',
};

const departmentToFilter: Record<string, GearFilter> = {
  audio: 'Audio',
  cameras: 'Scenic',
  decking: 'Staging',
  lighting: 'Lighting',
  rigging: 'Rigging',
  sfx: 'Atmospherics',
  video: 'Video',
};

function packId(pack: GearPack): string {
  return `gear-pack-${pack.department}`;
}

export function gearPackId(pack: GearPack): string {
  return packId(pack);
}

export function gearPackReferences(): string[] {
  return gearPacks.map((pack) => packId(pack));
}

export function filterForDepartment(department: string): GearFilter {
  return departmentToFilter[department] ?? 'Scenic';
}

export function placedQuantity(scene: PlannerScene, packIdValue: string, itemId: string): number {
  return scene.objects.filter((object) => object.gearPackRef?.packId === packIdValue && object.gearPackRef.itemId === itemId).length;
}

export function canPlaceGear(scene: PlannerScene, reference: GearPackReference, allowOverride: boolean): { allowed: boolean; used: number; warning?: string } {
  const used = placedQuantity(scene, reference.packId, reference.itemId);
  if (used < reference.quantityAvailable) return { allowed: true, used };
  if (allowOverride) return { allowed: true, used, warning: 'Planning override exceeds filed gear-pack quantity.' };
  return { allowed: false, used, warning: 'Filed gear-pack quantity is already allocated.' };
}

export function gearItemToDefinition(pack: GearPack, item: GearPackItem): ObjectDefinition {
  const category = departmentToCategory[pack.department] ?? 'Utility or custom object';
  const reference: GearPackReference = {
    packId: packId(pack),
    department: pack.department,
    itemId: item.id,
    itemLabel: item.item,
    quantityAvailable: item.qty,
  };
  const isFixture = category === 'Lighting fixtures';
  const isTruss = category === 'Truss';
  const isAtmospheric = category === 'Hazers';
  return {
    id: `gear-${item.id.toLowerCase()}`,
    label: item.item,
    category,
    dimensionsFt: isTruss ? { widthFt: 20, depthFt: 2, heightFt: 2 } : isFixture ? { widthFt: 1.5, depthFt: 1.5, heightFt: 2.5 } : { widthFt: 3, depthFt: 3, heightFt: 3 },
    dimensionStatus: 'ESTIMATE',
    weightLb: typeof item.weight_lbs === 'number' ? item.weight_lbs : undefined,
    weightStatus: typeof item.weight_lbs === 'number' ? 'REFERENCE' : 'TBD',
    mountingType: isTruss ? 'hanging' : isFixture ? 'truss-mounted' : isAtmospheric ? 'floor' : 'planning-only',
    sourceLabel: `${packId(pack)} / ${item.id}`,
    gearPackRef: reference,
    color: isFixture ? '#f2c65f' : isAtmospheric ? '#9ba8a3' : '#586874',
    shape: isTruss ? 'truss' : isFixture ? 'fixture' : isAtmospheric ? 'fog' : 'box',
    snapBehavior: isFixture ? 'TRUSS_LOCKED' : 'GRID_LOCKED',
    allowedParentTypes: isFixture ? ['Truss'] : [],
    planningOnly: true,
    warning: 'Gear-pack item inserted as a planning envelope. Dimensions and loads remain T.I. / TBD unless explicitly filed.',
  };
}

export function gearDefinitions(): ObjectDefinition[] {
  return gearPacks.flatMap((pack) => pack.items.map((item) => gearItemToDefinition(pack, item)));
}
