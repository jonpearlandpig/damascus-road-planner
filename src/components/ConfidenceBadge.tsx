import type { ConfidenceState } from '../data/types';

const classByState: Record<ConfidenceState, string> = {
  VERIFIED: 'badge badge--verified',
  'CALIBRATED PLANNING': 'badge badge--calibrated',
  'APPROXIMATE PLANNING': 'badge badge--approximate',
  UNVERIFIED: 'badge badge--unverified',
  CONFLICT: 'badge badge--conflict',
  'ENGINEERING CONFIRMATION REQUIRED': 'badge badge--engineering',
};

export function ConfidenceBadge({ state }: { state: ConfidenceState }) {
  return <span className={classByState[state]}>{state}</span>;
}
