import rawManifest from '../../source-assets/manifest.json';
import type { SourceAssetAvailabilityState, SourceAssetManifest, SourceAssetManifestEntry } from './types';

export const sourceAssetManifest = rawManifest as SourceAssetManifest;

const sourceAssetByFilename = new Map(sourceAssetManifest.assets.map((asset) => [asset.filename, asset]));

const availabilityLabels: Record<SourceAssetAvailabilityState, string> = {
  AVAILABLE_LOCAL: 'Available local',
  AVAILABLE_EXTERNAL: 'Available external',
  REQUESTED: 'Requested',
  MISSING: 'Missing',
  SUPERSEDED: 'Superseded',
  NOT_REQUIRED: 'Not required',
};

export function getSourceAsset(filename?: string): SourceAssetManifestEntry | undefined {
  if (!filename) return undefined;
  return sourceAssetByFilename.get(filename);
}

export function sourceAvailabilityLabel(state?: SourceAssetAvailabilityState): string {
  return state ? availabilityLabels[state] : 'Not declared';
}

export function isUnavailableSourceState(state?: SourceAssetAvailabilityState): boolean {
  return state === 'MISSING' || state === 'REQUESTED';
}
