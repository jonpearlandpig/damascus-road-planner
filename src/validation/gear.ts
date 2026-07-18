import Ajv, { type ErrorObject } from 'ajv';
import { emptyResult, type ValidationIssue, type ValidationResult } from './issues';

export const departmentPrefixes: Record<string, string> = {
  lighting: 'LX',
  audio: 'AU',
  video: 'VD',
  sfx: 'FX',
  decking: 'DK',
  cameras: 'CM',
  rigging: 'RG',
};

function issue(path: string, message: string): ValidationIssue {
  return { path, message };
}

function formatAjvPath(filePath: string, error: ErrorObject): string {
  return `${filePath}${error.instancePath.replaceAll('/', '.')}`;
}

export function validateGearPack(pack: unknown, schema: object, filePath: string): ValidationResult {
  const result = emptyResult();
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);

  if (!validate(pack)) {
    for (const error of validate.errors ?? []) {
      result.errors.push(issue(formatAjvPath(filePath, error), error.message ?? 'schema validation failed'));
    }
    return result;
  }

  const typedPack = pack as { department: string; items: Array<{ id: string }> };
  const expectedPrefix = departmentPrefixes[typedPack.department];
  const ids = new Set<string>();

  for (const [index, item] of typedPack.items.entries()) {
    const path = `${filePath}.items[${index}].id`;
    if (!item.id.startsWith(`${expectedPrefix}-`)) result.errors.push(issue(path, `id must use ${expectedPrefix} prefix for ${typedPack.department}`));
    if (ids.has(item.id)) result.errors.push(issue(path, `duplicate gear item id "${item.id}"`));
    ids.add(item.id);
  }

  return result;
}
