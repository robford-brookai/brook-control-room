# Ideal Input Specification
## For Generating a Dashboard Prototype from a Spec + Raw Data

This document reconstructs the prompt, attachments, and structure that would have produced the Brook Control Room prototype in a single turn with minimal ambiguity, no reverse-engineering, and maximum spec-coverage.

---

## 1. Attachment Strategy

Upload **four files** in this order — the order signals priority:

### File 1: Data Dictionary (CSV or Markdown) — **THIS WAS MISSING**

The single highest-leverage addition. A machine-readable mapping between your raw data columns, the spec's metric IDs, and the engine layers they serve. Without this, the model spends tokens and tool calls reverse-engineering column semantics from the CSV header names.

```
| CSV Column                        | Spec Metric | Engine Layer | Type       | Notes                                           |
|-----------------------------------|-------------|-------------|------------|--------------------------------------------------|
| TOTAL_DOD                         | VM1 delta   | 1           | DOD delta  | Daily change to contracted population            |
| HOLDING_PEDIATRIC_DOD             | —           | 2 (gap)     | DOD delta  | Pediatric exclusion; subtracted from eligible    |
| GAP_ELIG_COMBO_DIAG_ONLY_DOD      | CR1 leakage | 1→2 gap     | DOD delta  | Patients failing diagnosis-only eligibility      |
| GAP_ELIG_COMBO_INS_ONLY_DOD       | CR1 leakage | 1→2 gap     | DOD delta  | Patients failing insurance-only eligibility      |
| GAP_ELIG_COMBO_PROV_ONLY_DOD      | CR1 leakage | 1→2 gap     | DOD delta  | Patients failing provider-only eligibility       |
| GAP_ELIG_COMBO_DIAG_AND_INS_DOD   | CR1 leakage | 1→2 gap     | DOD delta  | Patients failing diagnosis + insurance           |
| ...                               |             |             |            |                                                  |
| GAP_MKT_RESTRICTED_DOD            | CR2 leakage | 2→3 gap     | DOD delta  | Partner-restricted patients                      |
| GAP_MKT_AWAITING_BI_DOD           | CR2 leakage | 2→3 gap     | DOD delta  | Awaiting benefits investigation                  |
| GAP_MKT_NOT_INTERESTED_DOD        | CR2 leakage | 2→3 gap     | DOD delta  | Patient declined                                 |
| AWAITING_BI_DOD                   | §9.2 sub    | 3 sub       | DOD delta  | BI pipeline volume                               |
| BI_COMPLETE_DOD                   | §9.2 sub    | 3 sub       | DOD delta  | BI completions                                   |
| AWAITING_NEXT_CAMPAIGN_DOD        | §9.2 sub    | 3 sub       | DOD delta  | Cleared but not in campaign                      |
| IN_CAMPAIGN_DOD                   | §9.2 sub    | 3→4         | DOD delta  | Active campaign population                       |
| AWAITING_DEVICE_SHIPMENT_DOD      | §9.3 sub    | 4 sub       | DOD delta  | Device pipeline stage 1                          |
| AWAITING_DEVICE_DELIVERY_DOD      | §9.3 sub    | 4 sub       | DOD delta  | Device pipeline stage 2                          |
| AWAITING_ACTIVATION_DOD           | §9.3 sub    | 4 sub       | DOD delta  | Device pipeline stage 3                          |
| DAILY_CONSENTS                    | —           | 3→4         | Daily flow | Patient consent events                           |
| DAILY_DISENROLLMENTS              | —           | 5 (churn)   | Daily flow | Voluntary exits                                  |
| DAILY_ACTIVATIONS                 | VM4 daily   | 4           | Daily flow | Completed activations                            |
| REMOVALS_NOT_INTERESTED           | Churn       | 5→churned   | Daily flow | Churn reason: patient declined                   |
| REMOVALS_NON_COMPLIANCE           | Churn       | 5→churned   | Daily flow | Churn reason: non-compliance                     |
| REMOVALS_HIGH_COPAY               | Churn       | 5→churned   | Daily flow | Churn reason: copay barrier                      |
| REMOVALS_GOALS_MET                | Churn       | 5→churned   | Daily flow | Churn reason: program complete                   |
| REMOVALS_DECEASED                 | Churn       | 5→churned   | Daily flow | Churn reason: deceased                           |
| REMOVALS_OTHER                    | Churn       | 5→churned   | Daily flow | Churn reason: other                              |
| ACTIVE_COUNT                      | VM5         | 5           | Snapshot   | Active population (set on 1st of month)          |
| ACTIVE_COUNT_DOD                  | —           | 5           | DOD delta  | Daily change (usually 0; resets monthly)         |
```

Also include: **starting population values** as a separate row or section, since row 2 of the CSV is a special `STARTING_POP` record, not a date-indexed row. Explicitly state the accumulation model: "All `_DOD` columns are daily deltas. Cumulative = starting_value + sum(deltas). `ACTIVE_COUNT` is a monthly snapshot override, not a cumulative."

### File 2: Specification Document (the spec .docx you already have)

This was well-structured and complete. The consolidated format with section numbers worked well for cross-referencing. No changes needed.

### File 3: Current-State Screenshot (the exec dashboard PDF)

Useful for extracting target values and understanding what's being replaced. Improvement: annotate which values are targets vs. actuals. The PDF had both `Internal Forecast` and `Board Forecast` rows — call out which row is the binding target.

### File 4: Raw Data (the daily-funnel-data.csv)

This was the right file. Improvement: include 2–3 lines of inline commentary at the top of the CSV or in the data dictionary explaining the DOD (day-over-day delta) accumulation model. The model had to infer this from column naming patterns.

### File NOT needed: the .xlsx

The xlsx added noise. It was a binary blob that required tool calls to partially read and yielded no usable structured data beyond what the CSV and spec already provided. If your xlsx contains dimension tables or lookup values not in the CSV, export them as separate CSVs.

---

## 2. Prompt Structure

The prompt should have three clearly demarcated sections: **CONTEXT**, **TASK**, and **CONSTRAINTS**. Use markdown headers or XML-style tags — either works, but be consistent.

### Ideal Prompt

```
## CONTEXT

The attached spec (brook-unified-control-room-spec.docx) defines a 9-layer patient
operating engine for Brook Health. The exec-dashboard-screenshot.pdf shows the current
executive dashboard this will replace. The daily-funnel-data.csv contains 205 days of
real production data (Sept 2025 → Mar 24, 2026). The data-dictionary.md maps every CSV
column to the spec's metric IDs and engine layers.

All CSV columns are daily deltas (DOD) that accumulate from the STARTING_POP row.
ACTIVE_COUNT is a monthly snapshot that resets on the 1st.

## TASK

Build a React dashboard prototype (single .jsx, Recharts + Lucide) that covers all
implementation phases defined in spec §13:

**Phase 1 — Control Room (daily operating meeting view)**
- Header bar: month, day N/total, progress %, overall status, refresh timestamp
- 7 KPI tiles per §4.2: Activations MTD, Active Patients, Eligible, Marketable,
  Monitored, Care Codes, Est. Revenue — each with MTD value, target, non-linear
  expected pace (§8), variance, % to goal
- Activation pace chart: actual (solid) vs expected non-linear (dashed) vs linear (dotted)
- Care code curve: same triple-line with S-curve back-loading per §8.1
- Daily activations bar: green/red vs daily expected pace
- Monitoring gauge + weekday trend line with 80% threshold

**Phase 2 — Operational Dashboards**
- Growth Pipeline: full acquisition funnel (§5) with owner badges (Brook/Partner/Shared),
  conversion rates at each transition, gap/leakage analysis at contracted→eligible and
  eligible→marketable transitions per §5.3, device pipeline tracker per §9.3
- Care Delivery: monitoring rate gauge + daily trend, care code completion by type
  (RPM/CCM/APCM stacked), revenue proxy per §7.3
- Program Adoption: enrollment bars by program (HTN/DM/BH/DPP), programs-per-patient
  density metric, installed base trend (§6), churn pie by reason, retention gauge

**Phase 3 — Revenue Analytics**
- KPI tiles: Monthly Revenue, ARR, PLV, NRR, Rev/Patient
- Revenue trend + rev/patient overlay
- Service mix stacked area (RPM/CCM/APCM revenue)
- Unit economics: rev/patient/module trend

**Phase N — Future Metrics**
- Roadmap cards for §14 items: medication management, brain health, programs/patient,
  revenue/program, care team productivity, campaign ROI — with status badges

## DATA INSTRUCTIONS

Real data covers layers 1–5 (funnel volumes, activations, churn, active count).
Layers 6–9 need synthetic extensions:

- **Monitoring (Layer 7):** ~75–85% of RPM-eligible (85% of active), weekday/weekend
  split, trending upward monthly
- **Care codes (Layer 8):** S-curve intra-month accumulation (per §8.1 back-loading),
  RPM/CCM/APCM split roughly 70/20/10
- **Revenue (Layer 9):** Codes × rates: RPM $62.50, CCM $48.00, APCM $85.00
- **Programs (Layer 6):** HTN 55%, DM 30%, BH 10%, DPP 5% of active
- **Modules (Layer 7):** RPM 85%, CCM 25%, PCM 10%, APCM 8% of active
- **Non-linear pacing:** Use prior month (Feb 2026) actual completion curve as shape
  function scaled to current month targets per §8.2

Use random.seed(42) for reproducibility.

## TARGETS (from exec dashboard, March 2026)

| Metric          | Target | Source              |
|-----------------|--------|---------------------|
| Activations     | 653    | Internal forecast   |
| Active EOM      | 8,584  | Internal goal       |
| Care codes      | 5,200  | Derived             |
| Revenue         | $380K  | Derived from codes  |
| Monitoring rate | 80%    | Operational target  |

## CONSTRAINTS

- Output: single .jsx file for Recharts + Lucide (available in artifact renderer)
- Dark theme, operational aesthetic — not marketing/consumer
- Tab navigation: P1 Control Room, P2 Growth Pipeline, P2 Care Delivery,
  P2 Programs & Retention, P3 Revenue Analytics, PN Future Metrics
- Embed aggregated data inline (keep under 15KB); don't require external fetch
- Use spec nomenclature exactly: VM1–VM9, CR1–CR8, Σ/Π, Layers 1–9
- Color-code status: green (on track), amber (at risk), red (behind) per §12
- Owner badges on funnel: Brook (blue), Partner (amber), Shared (purple)
```

---

## 3. What Made This Hard (and How the Ideal Input Fixes It)

| Friction Point | Time Cost | Fix in Ideal Input |
|---|---|---|
| Reverse-engineering CSV column semantics | 2 tool calls + parsing logic | Data dictionary file |
| Discovering STARTING_POP is row 2 (not a date) | 1 tool call + conditional parsing | State accumulation model in data dictionary |
| Extracting target values from PDF image | Reading a noisy, truncated screenshot | Explicit targets table in prompt |
| Determining which synthetic extensions are needed vs. present in data | Inference from spec cross-referenced against CSV headers | DATA INSTRUCTIONS section with explicit real vs. synthetic boundary |
| Choosing output format (React vs HTML vs other) | Ambiguity | CONSTRAINTS section specifying .jsx + libraries |
| Deciding design direction | Default to generic dark dashboard | CONSTRAINTS specifying operational aesthetic |
| Understanding DOD accumulation model | Trial and error on running totals | One sentence in CONTEXT |

---

## 4. Nomenclature Rules

Use spec terminology exactly. The model will mirror whatever language appears in the prompt.

| Use This | Not This | Why |
|---|---|---|
| "Layers 1–9" | "stages", "steps", "phases" | Spec §1.1 defines "layers" |
| "VM1–VM9" | "volume metrics", "patient counts" | Spec §2.3 registry IDs |
| "CR1–CR8" | "conversion rates", "funnel rates" | Spec §2.4 registry IDs |
| "Π compound" | "multiplication", "funnel math" | Spec §3.2 — Pi notation |
| "Σ accumulation" | "addition", "summing" | Spec §3.1 — Sigma notation |
| "Non-linear pacing" | "curve-based pacing", "S-curve" | Spec §8 section title |
| "Gap/leakage analysis" | "drop-off analysis", "loss analysis" | Spec §5.3 terminology |
| "Installed base" | "active patients", "patient base" | Spec §6 section title |
| "Care codes" | "billing codes", "CPT codes" | Spec §7.2 terminology |
| "Revenue proxy" | "estimated revenue" | Spec §7.3 — proxy acknowledges billing lag |
| "Owner badges" | "responsibility tags" | Spec uses "Owner" column throughout |

---

## 5. Anti-Patterns to Avoid

**Don't upload binary files when structured text exists.** The .xlsx was unreadable as binary. If it contains dimension tables, export to CSV. If it contains formulas, document the formula logic in the prompt or data dictionary.

**Don't say "help me construct" — say "build."** "Help me" introduces ambiguity about whether you want a plan, guidance, or an artifact. "Build a React dashboard prototype" is unambiguous.

**Don't list phase names without section references.** "Phase 1: Control Room" is less actionable than "Phase 1: Control Room per spec §4 + §8." Section numbers let the model cross-reference without re-reading the entire spec.

**Don't mix targets into narrative prose.** The exec dashboard PDF buried targets in rows labeled `Internal Forecast` alongside `Board Forecast`, `Projection`, and `Actual` — four different number lines. A flat table of binding targets eliminates parsing ambiguity.

**Don't leave the synthetic boundary implicit.** The model needs to know what's real vs. what to generate. "The CSV has layers 1–5; synthesize layers 6–9 with these parameters" is a clean contract. Without it, the model might attempt to extract care code data from the CSV that doesn't exist, or might skip synthetic generation assuming the data is complete.

**Don't omit the accumulation model.** DOD deltas are unusual. Most people expect CSVs to contain absolute values or period totals. Stating "all columns are daily deltas accumulated from STARTING_POP" prevents the model from treating delta values as absolute counts (which would produce nonsensical funnel volumes).

---

## 6. Prompt Sizing Guidelines

| Section | Target Length | Purpose |
|---|---|---|
| CONTEXT | 3–5 sentences | Orient the model on what the files are and how they relate |
| TASK | 300–500 words | Explicit deliverables per phase, referencing spec sections |
| DATA INSTRUCTIONS | 100–200 words | Real vs. synthetic boundary, parameters, seed |
| TARGETS | Table | 5–10 rows, no prose |
| CONSTRAINTS | 50–100 words | Format, theme, libraries, nomenclature rules |

Total prompt body: ~600–800 words + the targets table. The spec document provides the remaining detail — the prompt shouldn't restate the spec, it should point into it.

---

## 7. File Naming Convention

Name files so their purpose is self-evident in the upload list:

```
1-data-dictionary.md           ← NEW: column→spec mapping
2-unified-control-room-spec.docx  ← existing spec
3-current-exec-dashboard.pdf      ← screenshot of what's being replaced
4-daily-funnel-data.csv           ← raw production data
```

Prefix with numbers to signal processing order. The model processes uploaded files in the order they appear in context, so put the data dictionary first — it primes column understanding before the CSV is read.
