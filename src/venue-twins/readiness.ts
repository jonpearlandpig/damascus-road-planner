import type { VenueNativeGeometry } from './types';

export function venueTwinHealthScore(twins: VenueNativeGeometry[]): number {
  if (twins.length === 0) return 0;
  const raw = twins.reduce((total, twin) => {
    const readiness = twin.readiness === 'READY' ? 100 : twin.readiness === 'PARTIAL' ? 62 : 24;
    const conflicts = twin.diagnostics.conflictCount * 12;
    const missing = Math.min(twin.diagnostics.missingCriticalFields.length * 4, 24);
    return total + Math.max(0, readiness - conflicts - missing);
  }, 0) / twins.length;
  return Math.round(raw);
}

export function venueTwinOriginSummary(twins: VenueNativeGeometry[]) {
  return Object.fromEntries(
    [...new Set(twins.map((twin) => twin.coordinateSystem.originMethod))]
      .sort()
      .map((method) => [method, twins.filter((twin) => twin.coordinateSystem.originMethod === method).length]),
  );
}

