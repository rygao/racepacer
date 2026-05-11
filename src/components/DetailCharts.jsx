import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { METERS_PER_MILE, METERS_PER_KM } from '../lib/formatters';

function distLabel(unit) { return unit === 'mi' ? 'mi' : 'km'; }

// Shared x-axis props
function xAxisProps(unit, maxDist) {
  const tickInterval = [1, 2, 5, 10, 20, 25, 50].find(c => Math.floor(maxDist / c) <= 10) ?? 50;
  const wholeTicks = Array.from({ length: Math.floor(maxDist / tickInterval) + 1 }, (_, i) => i * tickInterval);
  return {
    dataKey: 'dist',
    type: 'number',
    domain: [0, maxDist],
    ticks: wholeTicks,
    tickFormatter: (v) => String(v),
    tick: { fontSize: 10 },
  };
}

const EleTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  const eleLabel = unit === 'mi' ? 'ft' : 'm';
  const eleVal = payload[0]?.value;
  return (
    <div className="bg-white border border-gray-200 rounded p-2 shadow text-xs">
      <p className="text-gray-500">{Number(label).toFixed(2)} {distLabel(unit)}</p>
      <p className="text-emerald-600">{eleVal} {eleLabel}</p>
    </div>
  );
};

const GradeTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
    <div className="bg-white border border-gray-200 rounded p-2 shadow text-xs">
      <p className="text-gray-500">{Number(label).toFixed(2)} {distLabel(unit)}</p>
      <p className={val > 0 ? 'text-orange-500' : val < 0 ? 'text-blue-500' : 'text-gray-500'}>
        {val > 0 ? '+' : ''}{val}%
      </p>
    </div>
  );
};

const MultTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
    <div className="bg-white border border-gray-200 rounded p-2 shadow text-xs">
      <p className="text-gray-500">{Number(label).toFixed(2)} {distLabel(unit)}</p>
      <p className="text-purple-600">{val}×</p>
    </div>
  );
};

export default function DetailCharts({ detailProfile, unit }) {
  if (!detailProfile || detailProfile.length === 0) return null;

  const distDivisor = unit === 'mi' ? METERS_PER_MILE : METERS_PER_KM;
  const eleMultiplier = unit === 'mi' ? 3.28084 : 1;
  const eleLabel = unit === 'mi' ? 'ft' : 'm';

  const data = detailProfile.map((p) => ({
    dist: +(p.dist / distDivisor).toFixed(3),
    ele: +(p.ele * eleMultiplier).toFixed(0),
    grade: p.grade,
    gapMult: p.gapMult,
  }));

  const maxDist = data[data.length - 1]?.dist ?? 0;
  const xProps = xAxisProps(unit, maxDist);

  // Grade domain: symmetric around 0
  const maxAbsGrade = Math.max(...data.map(d => Math.abs(d.grade)), 5);
  const gradeDomain = [-maxAbsGrade, maxAbsGrade];

  // GAP mult: log scale, compute domain from data for nice bounds
  const multValues = data.map(d => d.gapMult).filter(v => v > 0);
  const minMult = Math.min(...multValues);
  const maxMult = Math.max(...multValues);
  // Snap to nice log-friendly boundaries
  const logMin = Math.max(0.1, Math.pow(10, Math.floor(Math.log10(minMult) * 2) / 2));
  const logMax = Math.pow(10, Math.ceil(Math.log10(maxMult) * 2) / 2);
  const logTicks = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0]
    .filter(t => t >= logMin * 0.8 && t <= logMax * 1.25);

  return (
    <div className="space-y-4">
      {/* Elevation */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Elevation</p>
        <div className="w-full h-28">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="dEleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis {...xProps} label={{ value: distLabel(unit), position: 'insideBottomRight', offset: -4, fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} width={42} tickFormatter={(v) => `${v}`}
                domain={['auto', 'auto']}
                label={{ value: eleLabel, angle: -90, position: 'insideLeft', offset: 6, fontSize: 10 }} />
              <Tooltip content={<EleTooltip unit={unit} />} />
              <Area type="monotone" dataKey="ele" stroke="#10b981" strokeWidth={1.5}
                fill="url(#dEleGrad)" dot={false} isAnimationActive={false} baseValue="dataMin" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grade */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Grade (%)</p>
        <div className="w-full h-28">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis {...xProps} label={{ value: distLabel(unit), position: 'insideBottomRight', offset: -4, fontSize: 10 }} />
              <YAxis domain={gradeDomain} tick={{ fontSize: 10 }} width={42}
                tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`}
                label={{ value: '%', angle: -90, position: 'insideLeft', offset: 6, fontSize: 10 }} />
              <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1} />
              <Tooltip content={<GradeTooltip unit={unit} />} />
              <Line type="monotone" dataKey="grade" stroke="#6366f1" strokeWidth={1.5}
                dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GAP multiplier */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">GAP Multiplier</p>
        <div className="w-full h-28">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis {...xProps} label={{ value: distLabel(unit), position: 'insideBottomRight', offset: -4, fontSize: 10 }} />
              <YAxis scale="log" domain={[logMin, logMax]} ticks={logTicks}
                tick={{ fontSize: 10 }} width={42}
                tickFormatter={(v) => `${v % 1 === 0 ? v : v.toFixed(2)}×`}
                label={{ value: '×', angle: -90, position: 'insideLeft', offset: 6, fontSize: 10 }}
                allowDataOverflow />
              <ReferenceLine y={1} stroke="#9ca3af" strokeWidth={1} strokeDasharray="4 4"
                label={{ value: 'flat', position: 'right', fontSize: 9, fill: '#9ca3af' }} />
              <Tooltip content={<MultTooltip unit={unit} />} />
              <Line type="monotone" dataKey="gapMult" stroke="#a855f7" strokeWidth={1.5}
                dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
