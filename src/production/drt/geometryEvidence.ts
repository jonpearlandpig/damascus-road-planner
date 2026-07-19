import type { DrtGeometryStatus } from './schema';

export interface DrtGeometryEvidence {
  id: string;
  status: DrtGeometryStatus;
  sourceLabel: string;
  note: string;
}

export const DRT_GEOMETRY_EVIDENCE: Record<string, DrtGeometryEvidence> = {
  'DRT-AUTH-DECK-2026-07-17': {
    id: 'DRT-AUTH-DECK-2026-07-17',
    status: 'AUTHORED',
    sourceLabel: 'T.I. design authority',
    note: 'Controls the main deck dimensions, elevation, and center-to-center relationship with the B stage.',
  },
  'DRT-AUTH-MONOLITH-2026-07-17': {
    id: 'DRT-AUTH-MONOLITH-2026-07-17',
    status: 'AUTHORED',
    sourceLabel: 'T.I. design authority',
    note: 'Controls a two-face open monolith with a 50 ft upstage base and a vertex 25 ft downstage.',
  },
  'DRT-AUTH-THRUSTS-2026-07-17': {
    id: 'DRT-AUTH-THRUSTS-2026-07-17',
    status: 'AUTHORED',
    sourceLabel: 'T.I. design authority',
    note: 'Controls the center thrust and symmetric side-thrust dimensions and placement.',
  },
  'DRT-AUTH-B-STAGE-2026-07-17': {
    id: 'DRT-AUTH-B-STAGE-2026-07-17',
    status: 'AUTHORED',
    sourceLabel: 'T.I. design authority',
    note: 'Controls the 26 ft B-stage deck and venue-center anchor.',
  },
  'DRT-REF-B-STAGE-TAIL-2026-07-17': {
    id: 'DRT-REF-B-STAGE-TAIL-2026-07-17',
    status: 'REFERENCE',
    sourceLabel: 'T.I. current-master reference',
    note: 'Retains the filed current-master tail relationship as reference geometry, not fabrication approval.',
  },
  'DRT-SEED-LOW-FOG-COUNT-4': {
    id: 'DRT-SEED-LOW-FOG-COUNT-4',
    status: 'REFERENCE',
    sourceLabel: 'T.I. planner seed decision',
    note: 'Controls a count of four low-fog units. Exact operating placement remains unresolved.',
  },
  'DRT-UNRESOLVED-LAYOUT-2026-07-18': {
    id: 'DRT-UNRESOLVED-LAYOUT-2026-07-18',
    status: 'UNRESOLVED',
    sourceLabel: 'T.I. unresolved design register',
    note: 'No controlling dimensions or relationships are filed in this repository.',
  },
};
