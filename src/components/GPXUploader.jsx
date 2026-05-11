import { useRef, useState } from 'react';

// Import all sample GPX files as raw text via Vite's glob import
const sampleLoaders = import.meta.glob('../sample_data/*.gpx', { query: '?raw', import: 'default' });

const samples = Object.entries(sampleLoaders).map(([path, load]) => ({
  name: path.split('/').pop().replace(/\.gpx$/i, ''),
  load,
}));

export default function GPXUploader({ onFile, onText, parseError }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [activeName, setActiveName] = useState(null);
  const [loadingSample, setLoadingSample] = useState(null);

  function handleFile(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      alert('Please upload a .gpx file');
      return;
    }
    setActiveName(file.name.replace(/\.gpx$/i, ''));
    onFile(file);
  }

  async function handleSample(sample) {
    setLoadingSample(sample.name);
    try {
      const text = await sample.load();
      setActiveName(sample.name);
      onText(text);
    } finally {
      setLoadingSample(null);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  return (
    <div className="space-y-3">
      {/* Sample routes */}
      {samples.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-1.5">Sample routes</p>
          <div className="flex flex-col gap-1.5">
            {samples.map((s) => (
              <button
                key={s.name}
                onClick={() => handleSample(s)}
                className={`text-left text-xs px-3 py-2 rounded-lg border transition-colors truncate
                  ${activeName === s.name
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700 font-medium'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50 text-gray-600'}`}
              >
                {loadingSample === s.name ? '⏳ Loading…' : `📍 ${s.name}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* File upload drop zone */}
      <div>
        <p className="text-xs text-gray-400 mb-1.5">Or upload your own</p>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current.click()}
          className={`cursor-pointer border-2 border-dashed rounded-xl px-4 py-4 text-center transition-colors
            ${dragging
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-gray-200 hover:border-emerald-400 hover:bg-gray-50'}`}
        >
          {activeName && !samples.some(s => s.name === activeName) ? (
            <p className="text-xs font-medium text-gray-700 truncate">{activeName}.gpx</p>
          ) : (
            <p className="text-xs text-gray-400">Drop GPX here or click to browse</p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".gpx"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      </div>

      {parseError && (
        <p className="text-xs text-red-500">{parseError}</p>
      )}
    </div>
  );
}
