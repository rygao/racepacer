import { useState, useMemo, useCallback } from 'react';
import { parseGPX } from '../lib/gpxParser';
import { computePlan } from '../lib/paceCalc';
import { parseTime, parsePace, METERS_PER_MILE, METERS_PER_KM } from '../lib/formatters';

export function useRacePlan() {
  const [points, setPoints] = useState(null);
  const [goalMode, setGoalMode] = useState('time'); // 'time' | 'pace'
  const [goalInputStr, setGoalInputStr] = useState('');
  const [fade, setFade] = useState(0);
  const [unit, setUnit] = useState('mi');
  const [parseError, setParseError] = useState(null);

  // Derive goalTimeSecs from current input — null if unparseable
  const goalTimeSecs = useMemo(() => {
    if (goalMode === 'time') {
      const secs = parseTime(goalInputStr);
      return isNaN(secs) || secs <= 0 ? null : secs;
    } else {
      // pace mode: need total distance to convert pace → time
      if (!points) return null;
      const secsPerMeter = parsePace(goalInputStr, unit);
      if (isNaN(secsPerMeter) || secsPerMeter <= 0) return null;
      return secsPerMeter * points[points.length - 1].cumDist;
    }
  }, [goalMode, goalInputStr, points, unit]);

  const plan = useMemo(() => {
    if (!points || !goalTimeSecs) return null;
    return computePlan(points, goalTimeSecs, fade, unit);
  }, [points, goalTimeSecs, fade, unit]);

  const loadGPXText = useCallback((text) => {
    setParseError(null);
    try {
      setPoints(parseGPX(text));
    } catch (e) {
      setParseError(e.message);
      setPoints(null);
    }
  }, []);

  const loadGPX = useCallback(async (file) => {
    setParseError(null);
    try {
      loadGPXText(await file.text());
    } catch (e) {
      setParseError(e.message);
      setPoints(null);
    }
  }, [loadGPXText]);

  const handleModeChange = useCallback((newMode) => {
    setGoalMode(newMode);
    setGoalInputStr(''); // clear input when switching modes
  }, []);

  // Reformat pace display string when unit toggles
  const handleUnitChange = useCallback((newUnit) => {
    setUnit(newUnit);
    if (goalMode === 'pace' && goalTimeSecs && points) {
      const totalDist = points[points.length - 1].cumDist;
      const distPerUnit = newUnit === 'mi' ? METERS_PER_MILE : METERS_PER_KM;
      const paceSecPerUnit = goalTimeSecs / (totalDist / distPerUnit);
      const m = Math.floor(paceSecPerUnit / 60);
      const s = Math.round(paceSecPerUnit % 60);
      setGoalInputStr(`${m}:${String(s).padStart(2, '0')}`);
    }
  }, [goalMode, goalTimeSecs, points]);

  return {
    points,
    plan,
    goalMode,
    goalInputStr,
    goalTimeSecs,
    fade,
    unit,
    parseError,
    setGoalMode: handleModeChange,
    setGoalInput: setGoalInputStr,
    setFade,
    setUnit: handleUnitChange,
    loadGPX,
    loadGPXText,
  };
}
