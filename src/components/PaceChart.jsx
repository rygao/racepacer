import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { METERS_PER_MILE, METERS_PER_KM } from '../lib/formatters';

function paceToSecs(secsPerMeter, unit) {
  return secsPerMeter * (unit === 'mi' ? METERS_PER_MILE : METERS_PER_KM);
}

function secsToPaceStr(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  const paceLabel = unit === 'mi' ? '/mi' : '/km';
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow text-xs">
      <p className="font-semibold text-gray-700 mb-1">Split {label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {secsToPaceStr(entry.value)}{paceLabel}
        </p>
      ))}
    </div>
  );
};

export default function PaceChart({ splits, unit }) {
  if (!splits || splits.length === 0) return null;

  const paceLabel = unit === 'mi' ? '/mi' : '/km';

  const data = splits.map((s) => ({
    split: s.splitNum,
    'Actual Pace': +paceToSecs(s.actualPace, unit).toFixed(1),
    'GAP': +paceToSecs(s.gapPace, unit).toFixed(1),
  }));

  const allPaces = data.flatMap((d) => [d['Actual Pace'], d['GAP']]).filter(Boolean);
  const minPace = Math.min(...allPaces);
  const maxPace = Math.max(...allPaces);
  const pad = (maxPace - minPace) * 0.15 || 30;
  const domainMin = Math.max(0, minPace - pad);
  const domainMax = maxPace + pad;

  // Whole-minute ticks within domain
  const firstMinute = Math.ceil(domainMin / 60) * 60;
  const ticks = [];
  for (let t = firstMinute; t <= domainMax; t += 60) ticks.push(t);

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="split"
            label={{ value: `Split (${unit})`, position: 'insideBottomRight', offset: -4, fontSize: 11 }}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            domain={[domainMin, domainMax]}
            ticks={ticks}
            tickFormatter={secsToPaceStr}
            label={{ value: `Pace ${paceLabel}`, angle: -90, position: 'insideLeft', offset: 12, fontSize: 11 }}
            tick={{ fontSize: 11 }}
            width={52}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Actual Pace" fill="#34d399" opacity={0.85} radius={[3, 3, 0, 0]} />
          <Line
            type="monotone"
            dataKey="GAP"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 3, fill: '#f59e0b' }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
