/**
 * GAP multiplier models.
 *
 * Both functions accept grade as a decimal (e.g., 0.10 = 10% uphill) and
 * return a multiplier where 1.0 = flat effort.
 *   > 1  → uphill (takes more effort / actual pace is slower than GAP)
 *   < 1  → easier downhill
 */

// ---------------------------------------------------------------------------
// Strava Distillation (default)
// Polynomial fit derived from Strava's GAP data.
// Input g is grade in percent (converted internally from decimal).
// ---------------------------------------------------------------------------
export function stravaGapMultiplier(grade) {
  const g = Math.max(-30, Math.min(30, grade * 100)); // decimal → percent, clamped to ±30% (polynomial valid range)
  return (
    1 +
    0.0279167 * g +
    0.00157083 * Math.pow(g, 2) +
    0.00001375 * Math.pow(g, 3) +
    2.91667e-7 * Math.pow(g, 4) -
    2.91667e-8 * Math.pow(g, 5)
  );
}

// ---------------------------------------------------------------------------
// Minetti et al. (2002) — backup
// E(i) = 155.4i^5 - 30.4i^4 - 43.3i^3 + 46.3i^2 + 19.5i + 3.6 [J/(kg·m)]
// Input i is grade as a decimal.
// ---------------------------------------------------------------------------
const E_FLAT = 3.6;

function minettiEnergyCost(grade) {
  const i = Math.max(-0.5, Math.min(0.5, grade));
  return (
    155.4 * i ** 5 -
    30.4 * i ** 4 -
    43.3 * i ** 3 +
    46.3 * i ** 2 +
    19.5 * i +
    3.6
  );
}

export function minettiGapMultiplier(grade) {
  return minettiEnergyCost(grade) / E_FLAT;
}

// Default export used throughout the app
export const gapMultiplier = stravaGapMultiplier;
