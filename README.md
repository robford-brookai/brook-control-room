# Brook Unified Control Room — Prototype

## Quick Start

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## Project Structure

```md
brook-control-room/
├── index.html
├── package.json
├── vite.config.js
├── data/
│   └── daily-funnel-data.csv        # Raw source (205 days, Sept 2025 → Mar 2026)
├── scripts/
│   └── generate-data.py             # Transforms CSV → JSON with synthetic extensions
└── src/
    ├── main.jsx                      # React entry
    ├── BrookControlRoom.jsx          # Dashboard (all phases)
    ├── data.json                     # Aggregated: monthly, march_daily, pacing, funnel, churn, targets
    └── daily-detail.json             # Full 205-record daily detail (all fields)
```

## Data Layers

### Real (from daily-funnel-data.csv)

- **Layers 1–4**: Total population (DOD), eligibility gap combos (diag, ins, prov), marketable gaps (restricted, BI, copay, not interested), campaign/device pipeline stages
- **Layer 5**: Active patient count, daily activations, daily consents, daily disenrollments
- **Churn**: Breakdown by reason (not interested, non-compliance, high copay, goals met, deceased, other)

### Synthetic Extensions

- **Monitoring** (Layer 7): ~75–85% of RPM-eligible, weekday/weekend pattern, monthly trend
- **Care Codes** (Layer 8): S-curve intra-month accumulation (back-loaded per spec §8), RPM/CCM/APCM split
- **Revenue** (Layer 9): Codes × reimbursement rates (RPM $62.50, CCM $48.00, APCM $85.00)
- **Programs** (Layer 6): HTN 55%, DM 30%, BH 10%, DPP 5% of active
- **Modules** (Layer 7): RPM 85%, CCM 25%, PCM 10%, APCM 8% of active

### Pacing Model (spec §8)

February 2026 actual completion curve used as shape function, scaled to March targets:

- Activations target: 653 (from exec dashboard)
- Care codes target: 5,200
- Revenue target: $380,000

## Data Files

### data.json (13KB — dashboard source)

```md
{
  monthly: [...]          // 7 months, aggregated metrics
  march_daily: [...]      // 24 days, daily granularity for current month
  expected_pace: [...]    // 31 entries, non-linear expected values per day
  funnel: {...}           // Current snapshot: contracted → active + gaps
  churn: {...}            // March MTD churn by reason
  active_trend: [...]     // Monthly active/activations/churn/net
  targets: {...}          // Monthly targets for KPI tiles
}
```

### daily-detail.json (216KB — full granularity)

205 records, one per day. Every field from the CSV plus all synthetic extensions. Useful for:

- Custom drill-downs by date range
- Cohort analysis
- Building additional visualizations
- Exporting to BI tools

## Regenerating Data

```bash
python3 scripts/generate-data.py
```

Reads `data/daily-funnel-data.csv`, outputs `src/data.json` and `src/daily-detail.json`.
