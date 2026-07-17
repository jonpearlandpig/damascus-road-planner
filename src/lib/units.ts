// Unit helpers. Internal geometry is meters; UI displays feet & inches.
export const FT_TO_M = 0.3048;
export const IN_TO_M = 0.0254;

export const ft = (feet: number, inches = 0) => feet * FT_TO_M + inches * IN_TO_M;

export function formatFeetInches(meters: number, precisionInches = 1): string {
  const totalInches = meters / IN_TO_M;
  const sign = totalInches < 0 ? "-" : "";
  const abs = Math.abs(totalInches);
  const feet = Math.floor(abs / 12);
  const inches = abs - feet * 12;
  const inchStr =
    precisionInches === 0
      ? `${Math.round(inches)}″`
      : `${inches.toFixed(precisionInches).replace(/\.0+$/, "")}″`;
  return `${sign}${feet}′ ${inchStr}`;
}

export function formatFeetDecimal(meters: number, digits = 1): string {
  return `${(meters / FT_TO_M).toFixed(digits)} ft`;
}
