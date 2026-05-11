/**
 * Goal input: user picks Time OR Pace mode, enters one value.
 * No cross-field sync — keeps state simple.
 */
export default function GoalInputs({ mode, inputStr, unit, onModeChange, onInputChange }) {
  const paceLabel = unit === 'mi' ? '/mi' : '/km';
  const placeholder = mode === 'time' ? 'H:MM:SS' : 'MM:SS';
  const hint = mode === 'time'
    ? 'e.g. 4:30:00'
    : `e.g. 9:30 ${paceLabel}`;

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {['time', 'pace'].map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`px-3 py-1 text-xs rounded-md font-semibold capitalize transition-colors ${
              mode === m
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {m === 'time' ? 'Goal Time' : 'Goal Pace'}
          </button>
        ))}
      </div>

      {/* Single input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder={placeholder}
          value={inputStr}
          onChange={(e) => onInputChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        {mode === 'pace' && (
          <span className="text-sm text-gray-400 whitespace-nowrap">{paceLabel}</span>
        )}
      </div>
      <p className="text-xs text-gray-400">{hint}</p>
    </div>
  );
}
