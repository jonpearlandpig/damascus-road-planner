import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateGearPack } from './gear';

const schema = JSON.parse(readFileSync(join(process.cwd(), 'gear-packs', 'schema.json'), 'utf8')) as object;
const validPack = {
  department: 'lighting',
  schema: '_SCHEMA.md',
  source_policy: 'T.I. only — no reference names',
  items: [
    {
      id: 'LX-0002',
      item: 'Generic LED wash fixture',
      qty: 4,
      status: 'CANDIDATE',
      weight_lbs: 'TBD',
      power: 'TBD',
      source: 'T.I.',
      notes: 'Validation fixture with anonymized source lineage.',
    },
  ],
};

describe('gear-pack validation', () => {
  it('accepts a valid anonymized pack', () => {
    expect(validateGearPack(validPack, schema, 'fixture.json').errors).toEqual([]);
  });

  it('rejects malformed source provenance', () => {
    const result = validateGearPack({
      ...validPack,
      items: [{ ...validPack.items[0], source: 'quote.pdf' }],
    }, schema, 'fixture.json');

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: expect.stringContaining('fixture.json.items.0.source') }),
    ]));
  });

  it('rejects ids with the wrong department prefix', () => {
    const result = validateGearPack({
      ...validPack,
      department: 'audio',
    }, schema, 'fixture.json');

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'fixture.json.items[0].id', message: expect.stringContaining('AU prefix') }),
    ]));
  });

  it('rejects duplicate gear item ids', () => {
    const result = validateGearPack({
      ...validPack,
      items: [validPack.items[0], validPack.items[0]],
    }, schema, 'fixture.json');

    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: 'fixture.json.items[1].id', message: expect.stringContaining('duplicate') }),
    ]));
  });
});
