export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export function emptyResult(): ValidationResult {
  return { errors: [], warnings: [] };
}

export function mergeResults(...results: ValidationResult[]): ValidationResult {
  return {
    errors: results.flatMap((result) => result.errors),
    warnings: results.flatMap((result) => result.warnings),
  };
}
