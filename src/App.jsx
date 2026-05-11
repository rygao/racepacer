import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine,
  ResponsiveContainer, Tooltip as ReTooltip,
} from 'recharts';
import { useRacePlan } from './hooks/useRacePlan';
import GPXUploader from './components/GPXUploader';
import GoalInputs from './components/GoalInputs';
import FadeSlider from './components/FadeSlider';
import ElevationChart from './components/ElevationChart';
import PaceChart from './components/PaceChart';
import DetailCharts from './components/DetailCharts';
import SplitsTable from './components/SplitsTable';
import { formatDistance, formatElevation, formatTime } from './lib/formatters';
import { stravaGapMultiplier } from './lib/minetti';

// Static GAP curve data: grade -30% to +30% in 1% steps
const gapCurveData = Array.from({ length: 61 }, (_, i) => {
  const g = i - 30;
  return { grade: g, mult: +stravaGapMultiplier(g / 100).toFixed(3) };
});

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{label}</p>
      <p className="text-lg font-bold text-gray-800 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function InfoBanner() {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">⛰️</span>
          <span className="text-sm font-semibold text-gray-700">How RacePacer works</span>
        </div>
        <span className="text-gray-400 text-xs">{open ? '▲ hide' : '▼ show'}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
          <div>
            <p className="font-semibold text-gray-800 mb-1">1. Upload a GPX route</p>
            <p>Export any trail route from Strava, Garmin, Caltopo, etc. as a GPX file and drop it in. The app reads the elevation profile from the GPS track.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-1">2. Set a goal &amp; strategy</p>
            <p>Enter a goal finish time or average pace. Use the <strong>fade</strong> slider to model effort distribution — 0% is even effort, positive % means you plan to slow down toward the end.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-1">3. Read your splits</p>
            <p><strong>Actual pace</strong> is how fast you'll run each mile given the terrain. <strong>GAP</strong> (Grade-Adjusted Pace) strips out elevation and shows the flat-equivalent effort — it should stay roughly constant if you're running even effort. The <strong>GAP multiplier</strong> shows how much harder each mile is than flat ground.</p>
          </div>
          <div className="sm:col-span-3 border-t border-gray-100 pt-3 text-xs text-gray-400 space-y-3">
            <p>
              <strong className="text-gray-500">GAP model:</strong> Grade-Adjusted Pace is computed at every GPS trackpoint using the Strava distillation formula — a polynomial fit to Strava's observed pace-vs-grade data. Grades are clamped to ±30%, the range where the polynomial is valid. A 10% uphill has a GAP multiplier of ~1.45 (takes 45% longer per mile than flat); a 10% downhill is ~0.87 (13% faster).
            </p>
            <div className="w-full h-36">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gapCurveData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="grade"
                    type="number"
                    domain={[-30, 30]}
                    ticks={[-30, -20, -10, 0, 10, 20, 30]}
                    tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    width={38}
                    tickFormatter={(v) => `${v}×`}
                    domain={[0.7, 3.2]}
                    ticks={[0.75, 1.0, 1.5, 2.0, 2.5, 3.0]}
                  />
                  <ReTooltip
                    formatter={(v, _name) => [`${v}×`, 'Multiplier']}
                    labelFormatter={(g) => `Grade: ${g > 0 ? '+' : ''}${g}%`}
                    contentStyle={{ fontSize: 11 }}
                  />
                  <ReferenceLine x={0} stroke="#9ca3af" strokeDasharray="4 4" />
                  <ReferenceLine y={1} stroke="#9ca3af" strokeDasharray="4 4"
                    label={{ value: 'flat', position: 'right', fontSize: 9, fill: '#9ca3af' }} />
                  <Line
                    type="monotone"
                    dataKey="mult"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const {
    points,
    plan,
    goalMode,
    goalInputStr,
    fade,
    unit,
    parseError,
    setGoalMode,
    setGoalInput,
    setFade,
    setUnit,
    loadGPX,
    loadGPXText,
  } = useRacePlan();

  const hasData = plan !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">RacePacer</h1>
          <span className="text-xs text-gray-400 hidden sm:inline">Trail race pacing with Grade-Adjusted Pace</span>
        </div>
        {/* Unit toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {['mi', 'km'].map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                unit === u
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Info banner */}
        <InfoBanner />

        {/* Top row: controls + elevation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Control panel */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Route</h2>
              <GPXUploader onFile={loadGPX} onText={loadGPXText} parseError={parseError} />
            </div>

            <div>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Goal</h2>
              <GoalInputs
                mode={goalMode}
                inputStr={goalInputStr}
                unit={unit}
                onModeChange={setGoalMode}
                onInputChange={setGoalInput}
              />
            </div>

            <div>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Pacing Strategy</h2>
              <FadeSlider fade={fade} onChange={setFade} />
            </div>
          </div>

          {/* Elevation + summary */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Elevation Profile</h2>
              {hasData ? (
                <ElevationChart elevProfile={plan.elevProfile} unit={unit} />
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-300 text-sm">
                  Upload a GPX file to see the elevation profile
                </div>
              )}
            </div>

            {/* Summary stats */}
            {hasData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Distance" value={formatDistance(plan.totalDist, unit)} />
                <StatCard label="Elevation Gain" value={formatElevation(plan.totalGain, unit)} />
                <StatCard label="Elevation Loss" value={formatElevation(plan.totalLoss, unit)} />
                <StatCard
                  label="Finish Time"
                  value={formatTime(plan.finishTime, true)}
                  sub={plan.avgGapPace ? `Avg GAP: ${formatTime(plan.avgGapPace * (unit === 'mi' ? 1609.344 : 1000))}/${unit}` : undefined}
                />
              </div>
            )}

            {!hasData && points && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                GPX loaded — enter a goal time or pace above to generate your pacing plan.
              </div>
            )}
          </div>
        </div>

        {/* Pace chart */}
        {hasData && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
              Pace Per {unit === 'mi' ? 'Mile' : 'km'}
              <span className="ml-2 text-xs font-normal text-gray-400 normal-case">
                Green bars = actual pace · Amber line = GAP (effort-equivalent flat pace)
              </span>
            </h2>
            <PaceChart splits={plan.splits} unit={unit} />
          </div>
        )}

        {/* Splits table */}
        {hasData && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                {unit === 'mi' ? 'Mile' : 'km'} Splits
              </h2>
            </div>
            <SplitsTable splits={plan.splits} unit={unit} />
          </div>
        )}

        {/* Detail charts */}
        {hasData && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">
              Detail Charts
              <span className="ml-2 text-xs font-normal text-gray-400 normal-case">
                Elevation · Grade · GAP multiplier vs. distance
              </span>
            </h2>
            <DetailCharts detailProfile={plan.detailProfile} unit={unit} />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-8 py-4 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Ryan Gao &mdash;{' '}
        <a
          href="https://github.com/rygao"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-600 underline underline-offset-2"
        >
          github.com/rygao
        </a>
      </footer>
    </div>
  );
}
