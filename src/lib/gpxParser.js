import { haversine } from './haversine';

/**
 * Parse a GPX XML string and return normalized track points.
 * Returns an array of { lat, lon, ele, cumDist } objects.
 *
 * Uses the browser's built-in DOMParser — no external dependency needed.
 */
export function parseGPX(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) throw new Error('Invalid GPX file');

  // Try track points first, then route points, then waypoints
  const trkpts = doc.querySelectorAll('trkpt');
  const rtepts = doc.querySelectorAll('rtept');
  const nodeList = trkpts.length > 0 ? trkpts : rtepts;

  if (nodeList.length === 0) throw new Error('No track or route points found in GPX file');

  const raw = [];
  for (const node of nodeList) {
    const lat = parseFloat(node.getAttribute('lat'));
    const lon = parseFloat(node.getAttribute('lon'));
    const eleNode = node.querySelector('ele');
    const ele = eleNode ? parseFloat(eleNode.textContent) : 0;
    if (isNaN(lat) || isNaN(lon)) continue;
    raw.push({ lat, lon, ele: isNaN(ele) ? 0 : ele });
  }

  if (raw.length < 2) throw new Error('GPX file has fewer than 2 valid track points');

  // Compute cumulative distance
  let cumDist = 0;
  const points = raw.map((p, i) => {
    if (i > 0) {
      cumDist += haversine(raw[i - 1].lat, raw[i - 1].lon, p.lat, p.lon);
    }
    return { ...p, cumDist };
  });

  return points;
}

/**
 * Extract summary stats from a parsed points array.
 */
export function summarizePoints(points) {
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < points.length; i++) {
    const dEle = points[i].ele - points[i - 1].ele;
    if (dEle > 0) gain += dEle;
    else loss += -dEle;
  }
  return {
    totalDist: points[points.length - 1].cumDist,
    totalGain: gain,
    totalLoss: loss,
  };
}
