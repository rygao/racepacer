# RacePacer

A client-side web app for trail race pacing. Upload a GPX route, set a goal time, and get per-mile/km splits that account for elevation using Grade-Adjusted Pace (GAP).

## Features

- **GPX upload** — drag-and-drop or file picker; parses tracks and routes
- **Linked goal inputs** — enter a finish time *or* an average pace; editing either updates the other
- **Fade slider** — linear pacing strategy from −20% to +40%; defaults to 0 (even effort)
- **Elevation profile** — elevation chart across the full course
- **Pace chart** — per-mile/km actual pace (bars) vs. GAP (line)
- **Splits table** — mile/km splits with elevation gain/loss, time, cumulative time, actual pace, and GAP
- **mi / km toggle** — switch units at any time

## How GAP is Calculated

RacePacer uses the **Strava distillation** polynomial, a curve fit to Strava's observed pace-vs-grade data:

```
GAP_mult(g) = 1 + 0.0279167g + 0.00157083g² + 0.00001375g³ + 2.91667e-7g⁴ − 2.91667e-8g⁵
```

where `g` is grade in percent (e.g., 10 for 10% uphill). Grade is clamped to ±30% — the range where the polynomial is monotone and physically valid.

```
actual_pace = base_pace × GAP_multiplier × fade_multiplier
GAP pace    = base_pace × fade_multiplier   (grade terms cancel)
avg_GAP     = finish_time / flat_equivalent_distance
```

**GPS noise handling:** Grade at each trackpoint is computed via centered difference spanning ≥50 m of horizontal distance, then averaged with the adjacent point's grade for each segment. This avoids extreme grades from short GPS horizontal-position jitter.

## Pacing Algorithm

Given a goal time `T` and fade factor `f` (e.g., 0.2 = 20% slower at finish):

1. For each GPX segment at fractional race position `x ∈ [0, 1]`:
   - `fade_mult(x) = 1 + f × x`
   - `seg_cost = seg_dist × gap_mult × fade_mult`
2. Solve for base pace: `P₀ = T / Σ seg_cost`
3. Each split's actual time follows naturally; total always equals `T` exactly.

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Building for Production

```bash
npm run build
```

Output goes to `dist/` — deploy anywhere that serves static files (GitHub Pages, Netlify, Vercel, etc.).

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 19 + Vite |
| Charts | Recharts |
| Styling | Tailwind CSS v4 |
| GPX parsing | Browser DOMParser (no external dep) |

## Deferred / Future Features

- Map visualization of the route (Leaflet)
- Strava route link import (requires Strava API OAuth)
- Aid station markers with custom split targets
- Export splits to CSV or PDF
- Custom GAP model coefficients
- **GAP Pace goal type:** a third goal input mode where the user enters a target GAP pace directly. When Fade = 0%, this matches the displayed GAP pace exactly. When Fade ≠ 0%, it would represent the average GAP effort across the race.

## File Structure

```
src/
  lib/
    haversine.js     # Great-circle distance between GPS points
    minetti.js       # Minetti GAP multiplier from grade
    paceCalc.js      # Core algorithm: GPX points → mile/km splits
    gpxParser.js     # GPX XML → normalized point array
    formatters.js    # Pace/time/distance/elevation formatting utilities
  hooks/
    useRacePlan.js   # Central state: file loading, goal inputs, plan derivation
  components/
    GPXUploader.jsx  # Drag-and-drop file upload
    GoalInputs.jsx   # Linked time ↔ pace inputs
    FadeSlider.jsx   # Linear fade strategy slider
    ElevationChart.jsx
    PaceChart.jsx
    SplitsTable.jsx
  App.jsx            # Layout and composition
```
