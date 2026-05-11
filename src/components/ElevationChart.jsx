import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { METERS_PER_MILE, METERS_PER_KM } from '../lib/formatters';

const CustomTooltip = ({ active, payload, label, distLabel, eleLabel }) => {
  if (!active || !payload?.length) return null;
  const dist = Number(label);
  const splitNum = Math.floor(dist) + 1;
  const ele = payload[0]?.value;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2 shadow text-xs">
      <p className="font-semibold text-gray-700">
        {distLabel === 'mi' ? `Mile ${splitNum}` : `km ${splitNum}`}
      </p>
      <p className="text-gray-500">{dist.toFixed(2)} {distLabel}</p>
      <p className="text-emerald-600">{ele} {eleLabel}</p>
    </div>
  );
};

export default function ElevationChart({ elevProfile, unit }) {
  if (!elevProfile || elevProfile.length === 0) return null;

  const distDivisor = unit === 'mi' ? METERS_PER_MILE : METERS_PER_KM;
  const distLabel = unit === 'mi' ? 'mi' : 'km';
  const eleMultiplier = unit === 'mi' ? 3.28084 : 1;
  const eleLabel = unit === 'mi' ? 'ft' : 'm';

  const data = elevProfile.map((p) => ({
    dist: +(p.dist / distDivisor).toFixed(2),
    ele: +(p.ele * eleMultiplier).toFixed(0),
  }));

  const maxDist = data[data.length - 1]?.dist ?? 0;
  const tickInterval = [1, 2, 5, 10, 20, 25, 50].find(c => Math.floor(maxDist / c) <= 10) ?? 50;
  const wholeTicks = Array.from({ length: Math.floor(maxDist / tickInterval) + 1 }, (_, i) => i * tickInterval);

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="eleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="dist"
            type="number"
            domain={[0, maxDist]}
            ticks={wholeTicks}
            tickFormatter={(v) => String(v)}
            label={{ value: distLabel, position: 'insideBottomRight', offset: -4, fontSize: 11 }}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            domain={['auto', 'auto']}
            tickFormatter={(v) => `${v}`}
            label={{ value: eleLabel, angle: -90, position: 'insideLeft', offset: 8, fontSize: 11 }}
            tick={{ fontSize: 11 }}
            width={48}
          />
          <Tooltip content={<CustomTooltip distLabel={distLabel} eleLabel={eleLabel} />} />
          <Area
            type="monotone"
            dataKey="ele"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#eleGrad)"
            dot={false}
            isAnimationActive={false}
            baseValue="dataMin"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
