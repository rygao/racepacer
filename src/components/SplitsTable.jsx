import { formatTime, formatPace, formatElevation, METERS_PER_MILE, METERS_PER_KM } from '../lib/formatters';

export default function SplitsTable({ splits, unit }) {
  if (!splits || splits.length === 0) return null;

  const splitLabel = unit === 'mi' ? 'Mile' : 'km';
  const paceLabel = unit === 'mi' ? '/mi' : '/km';
  const splitLen = unit === 'mi' ? METERS_PER_MILE : METERS_PER_KM;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <th className="text-left px-3 py-2 font-semibold">{splitLabel}</th>
            <th className="text-right px-3 py-2 font-semibold">+Elev</th>
            <th className="text-right px-3 py-2 font-semibold">−Elev</th>
            <th className="text-right px-3 py-2 font-semibold">Cum. Time</th>
            <th className="text-right px-3 py-2 font-semibold">Pace {paceLabel}</th>
            <th className="text-right px-3 py-2 font-semibold">GAP {paceLabel}</th>
            <th className="text-right px-3 py-2 font-semibold">GAP mult</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {splits.map((s, i) => {
            const isLast = i === splits.length - 1;
            const isPartial = isLast && s.dist < splitLen * 0.95;
            const fracDist = (s.dist / splitLen).toFixed(2);
            const isUphill = s.elevGain > s.elevLoss + 5;
            const isDownhill = s.elevLoss > s.elevGain + 5;
            const gapMult = s.gapPace > 0 ? s.actualPace / s.gapPace : 1;
            const multColor =
              gapMult > 1.05 ? 'text-orange-500' :
              gapMult < 0.95 ? 'text-blue-500' :
              'text-gray-500';

            return (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2 font-medium text-gray-700">
                  {s.splitNum}
                  {isPartial && (
                    <span className="ml-1.5 text-xs font-normal text-gray-400">
                      ({fracDist} {unit})
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right text-emerald-600 font-mono text-xs">
                  {formatElevation(s.elevGain, unit)}
                </td>
                <td className="px-3 py-2 text-right text-red-400 font-mono text-xs">
                  {s.elevLoss > 0 ? formatElevation(s.elevLoss, unit) : '—'}
                </td>
                <td className="px-3 py-2 text-right font-mono text-gray-500">{formatTime(s.cumTime, true)}</td>
                <td className={`px-3 py-2 text-right font-mono font-medium ${isUphill ? 'text-orange-500' : isDownhill ? 'text-blue-500' : 'text-gray-700'}`}>
                  {formatPace(s.actualPace, unit)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-amber-600">
                  {formatPace(s.gapPace, unit)}
                </td>
                <td className={`px-3 py-2 text-right font-mono text-xs ${multColor}`}>
                  {gapMult.toFixed(2)}×
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-semibold text-gray-700 border-t-2 border-gray-200">
            <td className="px-3 py-2" colSpan={3}>Total</td>
            <td className="px-3 py-2 text-right font-mono">
              {splits.length > 0 ? formatTime(splits[splits.length - 1].cumTime, true) : '—'}
            </td>
            <td colSpan={3} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
