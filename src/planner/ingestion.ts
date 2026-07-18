import type { VenueIngestionRecord } from './types';

export interface IngestionValidationResult {
  errors: string[];
  warnings: string[];
}

function isBlank(value: string | undefined): boolean {
  return !value || value.trim().length === 0;
}

export function validateIngestionRecords(records: VenueIngestionRecord[]): IngestionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();

  for (const record of records) {
    if (ids.has(record.id)) errors.push(`${record.id}: duplicate source ingestion id.`);
    ids.add(record.id);
    if (isBlank(record.venueSlug)) errors.push(`${record.id}: venue slug is required.`);
    if (isBlank(record.label)) errors.push(`${record.id}: source label is required.`);
    if (record.category !== 'EXTERNAL_SOURCE_REFERENCE' && record.category !== 'STRUCTURED_VENUE_SEED' && isBlank(record.filename)) {
      warnings.push(`${record.id}: filed source filename is not present.`);
    }
    if (record.role === 'CONTROLLING' && record.approvalState !== 'APPROVED') {
      warnings.push(`${record.id}: controlling source is not approved yet.`);
    }
    if ((record.role === 'MISSING' || record.role === 'UNRESOLVED') && record.approvalState === 'APPROVED') {
      errors.push(`${record.id}: missing or unresolved source cannot be approved.`);
    }
    for (const mapping of record.mappings) {
      if (mapping.status === 'VERIFIED' && mapping.approvalState !== 'APPROVED') {
        errors.push(`${record.id}.${mapping.field}: verified measurements require approved source mapping.`);
      }
      if ((mapping.status === 'MISSING' || mapping.status === 'CONFLICT') && isBlank(mapping.note)) {
        errors.push(`${record.id}.${mapping.field}: ${mapping.status.toLowerCase()} mapping requires a note.`);
      }
      if (mapping.status === 'VERIFIED' && record.role !== 'CONTROLLING') {
        errors.push(`${record.id}.${mapping.field}: verified measurements require a controlling source.`);
      }
    }
    for (const conflict of record.conflicts) {
      if (conflict.status === 'OPEN' && isBlank(conflict.note)) errors.push(`${record.id}.${conflict.id}: open conflicts require notes.`);
      if (conflict.sourceIds.length < 1) errors.push(`${record.id}.${conflict.id}: conflict must reference at least one source.`);
    }
  }

  return { errors, warnings };
}
