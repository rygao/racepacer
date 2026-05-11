import { gapMultiplier } from './minetti';
import { METERS_PER_MILE, METERS_PER_KM } from './formatters';

/**
 * Compute grade at point i using a centered difference that spans at least
 * minSpan meters in total. This avoids extreme grades from short horizontal
 * GPS segments (the main GPS noise artifact on this data type).
 */
function centeredGrade(points, i, minSpan = 50) {
  let lo = i, hi = i;
  while (lo > 0 && points[i].cumDist - points[lo - 1].cumDist < minSpan / 2) lo--;
  while (hi < points.length - 1 && points[hi + 1].cumDist - points[i].cumDist < minSpan / 2) hi++;
  const span = points[hi].cumDist - points[lo].cumDist;
  if (span < 1) return 0;
  return (points[hi].ele - points[lo].ele) / span;
}

/**
 * Core pacing algorithm.
 *
 * Grade at each point is computed via centered difference over ≥50m of
 * horizontal distance, then clamped to ±30% (valid range of the Strava
 * polynomial). Adjacent point grades are averaged per segment.
 *
 * @param {Array} rawPoints  - [{lat, lon, ele, cumDist}] from gpxParser
 * @param {number} goalTimeSecs - target finish time in seconds
 * @param {number} fade - linear fade factor (-0.2 to 0.4 typical). 0.2 = 20% slower at end.
 * @param {string} unit - 'mi' | 'km'
 */
export function computePlan(rawPoints, goalTimeSecs, fade, unit = 'mi') {
  if (!rawPoints || rawPoints.length < 2) return null;

  const points = rawPoints;
  const totalDist = points[points.length - 1].cumDist;
  const splitLen = unit === 'mi' ? METERS_PER_MILE : METERS_PER_KM;

  // Pre-compute centered grade at every point
  const grades = points.map((_, i) => centeredGrade(points, i));

  // Build per-segment data
  const segments = [];
  let totalGain = 0;
  let totalLoss = 0;
  let flatEquivDist = 0; // for avgGapPace

  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const dist = p1.cumDist - p0.cumDist;
    if (dist < 0.001) continue;

    const dEle = p1.ele - p0.ele;
    // Average centered grades at both endpoints for this segment
    const grade = (grades[i] + grades[i - 1]) / 2;
    const mult = gapMultiplier(grade);
    const midDist = (p0.cumDist + p1.cumDist) / 2;
    const x = midDist / totalDist;
    const fadeMult = 1 + fade * x;

    if (dEle > 0) totalGain += dEle;
    else totalLoss += -dEle;

    flatEquivDist += dist * mult;
    segments.push({ dist, dEle, grade, mult, x, fadeMult, cumDist: p1.cumDist });
  }

  const denominator = segments.reduce((acc, s) => acc + s.dist * s.mult * s.fadeMult, 0);
  const basePace = goalTimeSecs / denominator;
  const avgGapPace = flatEquivDist > 0 ? goalTimeSecs / flatEquivDist : basePace;

  // Assign segments to split buckets
  const splitMap = new Map();
  for (const seg of segments) {
    const splitIdx = Math.floor(seg.cumDist / splitLen);
    if (!splitMap.has(splitIdx)) {
      splitMap.set(splitIdx, { dist: 0, elevGain: 0, elevLoss: 0, cost: 0, gapCost: 0 });
    }
    const b = splitMap.get(splitIdx);
    b.dist += seg.dist;
    if (seg.dEle > 0) b.elevGain += seg.dEle;
    else b.elevLoss += -seg.dEle;
    b.cost += seg.dist * seg.mult * seg.fadeMult * basePace;
    b.gapCost += seg.dist * seg.fadeMult * basePace;
  }

  const splitIndices = Array.from(splitMap.keys()).sort((a, b) => a - b);
  let cumTime = 0;
  const splits = splitIndices.map((idx, i) => {
    const b = splitMap.get(idx);
    cumTime += b.cost;
    return {
      splitNum: i + 1,
      dist: b.dist,
      elevGain: b.elevGain,
      elevLoss: b.elevLoss,
      time: b.cost,
      cumTime,
      actualPace: b.dist > 0 ? b.cost / b.dist : 0,
      gapPace: b.dist > 0 ? b.gapCost / b.dist : 0,
    };
  });

  // Detail profile: downsample to ~500 points, include grade and gapMult
  const step = Math.max(1, Math.floor(points.length / 500));
  const detailProfile = [];
  for (let i = 0; i < points.length; i++) {
    if (i % step !== 0 && i !== points.length - 1) continue;
    const g = grades[i] ?? 0;
    // Display grade clamped to ±30 for readability (matches what goes into GAP calc)
    const gradePct = Math.max(-30, Math.min(30, g * 100));
    detailProfile.push({
      dist: points[i].cumDist,
      ele: points[i].ele,
      grade: +gradePct.toFixed(1),
      gapMult: +(gapMultiplier(g)).toFixed(3),
    });
  }

  return {
    splits,
    totalDist,
    totalGain,
    totalLoss,
    basePace,
    avgGapPace,
    finishTime: goalTimeSecs,
    elevProfile: detailProfile,
    detailProfile,
    unit,
  };
}
