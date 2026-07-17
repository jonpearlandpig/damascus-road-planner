export const FEET_TO_METERS = 0.3048;

export function ft(value: number): number {
  return value * FEET_TO_METERS;
}

export function formatFeet(value?: number): string {
  if (value === undefined) return '—';
  const whole = Math.floor(value);
  const inches = Math.round((value - whole) * 12);
  if (inches === 12) return `${whole + 1}′-0″`;
  return `${whole}′-${inches}″`;
}

export function formatNumber(value?: number): string {
  return value === undefined ? '—' : new Intl.NumberFormat('en-US').format(value);
}
