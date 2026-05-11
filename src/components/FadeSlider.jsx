import { useState, useEffect } from 'react';

const MIN = -20;
const MAX = 40;

export default function FadeSlider({ fade, onChange }) {
  const pct = Math.round(fade * 100);
  const [inputVal, setInputVal] = useState(String(pct));

  useEffect(() => {
    setInputVal(String(pct));
  }, [pct]);

  const label =
    pct === 0 ? 'Even effort' :
    pct > 0 ? `+${pct}% slower at finish (positive split)` :
    `${pct}% faster at finish (negative split)`;

  function commitInput(str) {
    const n = parseFloat(str);
    if (!isNaN(n)) {
      const clamped = Math.max(MIN, Math.min(MAX, Math.round(n)));
      onChange(clamped / 100);
      setInputVal(String(clamped));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Fade
        </label>
        <div className="flex items-center gap-1">
          <input
            type="text"
            inputMode="numeric"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={(e) => commitInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commitInput(e.target.value); }}
            className={`w-14 text-right text-xs font-mono font-medium border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-400
              ${pct > 0 ? 'text-orange-500 border-orange-200' : pct < 0 ? 'text-emerald-600 border-emerald-200' : 'text-gray-500 border-gray-200'}`}
          />
          <span className="text-xs text-gray-400">%</span>
        </div>
      </div>
      <input
        type="range"
        min={MIN}
        max={MAX}
        step="1"
        value={pct}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="w-full accent-emerald-500"
      />
      {/* Marker positions are proportional to the slider range, not evenly spaced */}
      <div className="relative text-xs text-gray-300 mt-0.5 h-4 select-none">
        <span className="absolute left-0">{MIN}%</span>
        <span className="absolute" style={{ left: `${((0 - MIN) / (MAX - MIN) * 100).toFixed(1)}%`, transform: 'translateX(-50%)' }}>0%</span>
        <span className="absolute right-0">+{MAX}%</span>
      </div>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}
