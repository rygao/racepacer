export const METERS_PER_MILE = 1609.344;
export const METERS_PER_KM = 1000;

/**
 * Format seconds as H:MM:SS (omits hours if < 1h) or MM:SS.
 */
export function formatTime(totalSeconds, forceHours = false) {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  if (h > 0 || forceHours) return `${h}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

/**
 * Format pace in seconds/meter → "MM:SS /mi" or "MM:SS /km"
 */
export function formatPace(secsPerMeter, unit = 'mi') {
  const multiplier = unit === 'mi' ? METERS_PER_MILE : METERS_PER_KM;
  const secsPerUnit = secsPerMeter * multiplier;
  const m = Math.floor(secsPerUnit / 60);
  const s = Math.round(secsPerUnit % 60);
  const ss = String(s).padStart(2, '0');
  return `${m}:${ss}`;
}

/**
 * Parse "H:MM:SS" or "MM:SS" string → total seconds. Returns NaN if invalid.
 */
export function parseTime(str) {
  if (!str) return NaN;
  const parts = str.split(':').map(Number);
  if (parts.some(isNaN)) return NaN;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return NaN;
}

/**
 * Parse "MM:SS" pace string → seconds per meter for a given unit.
 */
export function parsePace(str, unit = 'mi') {
  const secs = parseTime(str);
  if (isNaN(secs)) return NaN;
  const multiplier = unit === 'mi' ? METERS_PER_MILE : METERS_PER_KM;
  return secs / multiplier;
}

/**
 * Format a distance in meters to display string.
 */
export function formatDistance(meters, unit = 'mi') {
  if (unit === 'mi') return `${(meters / METERS_PER_MILE).toFixed(2)} mi`;
  return `${(meters / METERS_PER_KM).toFixed(2)} km`;
}

/**
 * Format elevation in meters → ft or m.
 */
export function formatElevation(meters, unit = 'mi') {
  if (unit === 'mi') return `${Math.round(meters * 3.28084)} ft`;
  return `${Math.round(meters)} m`;
}
