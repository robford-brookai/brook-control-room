# Spec Amendment Recommendations

Based on friction encountered during prototype construction and the principles in `ideal-input-reference.md`.

---

## A. Add: §15 Data Dictionary (new section)

**Priority: Critical**

The spec defines metrics (§2), data model (§11), and dashboards (§4–9) — but never maps production data sources to those definitions. Anyone implementing the spec (human or AI) must reverse-engineer which data column feeds which metric.

### What to add

A new §15 that maps every production data field to the spec's metric framework:

```markdown
## 15. Data Dictionary

### 15.1 Accumulation Model

All daily source data uses day-over-day (DOD) deltas. Cumulative values are
derived as: `cumulative(day N) = starting_population + Σ delta(day 1..N)`.

Active patient count (VM5) is a monthly snapshot override set on the 1st of
each month, not a cumulative delta.

### 15.2 Source Field → Metric Mapping

| Source Field                       | Spec Metric | Layer | Type      |
|------------------------------------|-------------|-------|-----------|
| TOTAL_DOD                          | VM1 delta   | 1     | DOD delta |
| GAP_ELIG_COMBO_DIAG_ONLY_DOD       | CR1 leakage | 1→2   | DOD delta |
| ...                                |             |       |           |
| DAILY_ACTIVATIONS                  | VM4 daily   | 4     | Daily flow|
| ACTIVE_COUNT                       | VM5         | 5     | Snapshot  |

### 15.3 Derived Metric Formulas (from source fields)

| Metric    | Formula                                               |
|-----------|-------------------------------------------------------|
| Eligible  | cumulative(TOTAL) - cumulative(PEDIATRIC) - Σ(elig gaps) |
| Marketable| Eligible - Σ(marketable gaps)                         |
| ...       |                                                       |
```

### Why

The spec's Snowflake schema (§11) describes the target analytical model, but production data arrives in a different shape (daily DOD deltas, gap combination columns, snapshot overrides). Without the mapping, every implementer independently solves the same translation problem.

---

## B. Add: §4.4 Monthly Targets Table (to §4 Control Room)

**Priority: High**

The spec defines KPI tiles (§4.2) and pacing formulas (§8.2) but never specifies where target values come from or what they are. The exec dashboard PDF contained targets buried in multi-row forecast tables with no clear binding designation.

### What to add

```markdown
### 4.4 Monthly Targets

Targets are set at the beginning of each month by the CEO. The following
table is the canonical source for Control Room pacing calculations.

| Metric          | Mar 2026 | Apr 2026 | Source          | Update Cadence |
|-----------------|----------|----------|-----------------|----------------|
| Activations     | 653      | 1,088    | Internal forecast | Monthly       |
| Active EOM      | 8,584    | 9,348    | Internal goal    | Monthly       |
| Care Codes      | 5,200    | TBD      | Derived          | Monthly       |
| Est. Revenue    | $380,000 | TBD      | Derived          | Monthly       |
| Monitoring Rate | 80%      | 80%      | Operational      | Quarterly     |
| Eligible        | 68,000   | TBD      | Partner pipeline | Quarterly     |
| Marketable      | 22,000   | TBD      | Growth team      | Monthly       |
```

### Why

Without explicit targets, the pacing model (§8) has no scale factor. The formula `Expected(day N) = (prior_month_curve / prior_month_total) × current_month_target` requires `current_month_target` as an input. The spec defines the formula but omits the parameter.

---

## C. Add: §15.4 Real vs. Synthetic Data Boundary (to new §15)

**Priority: High**

The prototype required synthetic extensions for layers 6–9 because production data only covers layers 1–5. The spec doesn't distinguish which layers have production data feeds vs. which require modeling or manual entry.

### What to add

```markdown
### 15.4 Data Availability by Layer

| Layer | Data Source          | Availability    | Notes                              |
|-------|---------------------|-----------------|------------------------------------|
| 1     | POP daily export    | Production      | DOD deltas, daily refresh          |
| 2     | POP + eligibility   | Production      | Gap combination columns            |
| 3     | POP + BI system     | Production      | Marketable gap columns             |
| 4     | Impilo + ZCC        | Production      | Device pipeline + activations      |
| 5     | POP                 | Production      | Monthly snapshot + churn breakdown |
| 6     | Brook platform      | Not yet piped   | Requires enrollment event feed     |
| 7     | Brook platform      | Not yet piped   | Requires module participation feed |
| 8     | Brook platform      | Partial         | Care sessions exist; code completion not in daily export |
| 9     | Billing system      | Not yet piped   | Requires billing event feed        |
```

### Why

Anyone building dashboards needs to know which metrics can be computed from available data vs. which need proxies, manual entry, or new data pipelines. This prevents building to a spec that assumes data availability that doesn't exist.

---

## D. Amend: §8.2 Pacing Formula — Add Fallback Logic

**Priority: Medium**

The pacing formula uses prior month's completion curve as the shape function. This fails for:
- First month of operation (no prior month)
- Months where prior month had anomalies (holidays, system outages)
- New metrics with no history

### What to add

```markdown
### 8.5 Pacing Fallback Hierarchy

1. Prior month actual curve (default per §8.2)
2. Rolling 3-month average curve (if prior month anomalous)
3. Reference curve from §8.3 (if <3 months of history)
4. Linear pacing (last resort; flag as provisional)

Anomaly detection: if prior month's day-15 completion exceeds +/- 20pts
from the 3-month average, use the 3-month average instead.
```

---

## E. Amend: §11 Snowflake Schema — Add DOD Staging Table

**Priority: Medium**

The Snowflake schema (§11) describes the target analytical model but omits the staging layer where daily DOD data lands before transformation. In practice, the daily CSV feed is the actual data source. The schema should acknowledge this.

### What to add

```markdown
### 11.8 daily_funnel_snapshot (Staging)

Raw daily feed. All values are day-over-day deltas except ACTIVE_COUNT
(monthly snapshot). Transformed into analytical tables via ETL.

| Column                          | Type    | Description                    |
|---------------------------------|---------|--------------------------------|
| report_date                     | DATE    | PK — reporting day             |
| total_dod                       | INTEGER | VM1 daily delta                |
| holding_pediatric_dod           | INTEGER | Pediatric exclusion delta      |
| gap_elig_combo_diag_only_dod    | INTEGER | Diagnosis-only gap delta       |
| ...                             |         |                                |
| daily_activations               | INTEGER | VM4 daily flow                 |
| active_count                    | INTEGER | VM5 snapshot (set on 1st)      |
```

---

## F. Amend: §7.3 Revenue Proxy — Add Reimbursement Rates

**Priority: Medium**

The formula `Revenue = Σ (Codes × Reimbursement rate per type)` is stated but the rates are never specified. The prototype used $62.50 / $48.00 / $85.00 — these should be canonical.

### What to add

```markdown
### 7.4 Reimbursement Rate Schedule

| Module | CPT Range    | Blended Rate | Update Cadence |
|--------|-------------|-------------|----------------|
| RPM    | 99453–99458 | $62.50      | Annual (CMS)   |
| CCM    | 99490–99491 | $48.00      | Annual (CMS)   |
| PCM    | 99424–99427 | $48.00      | Annual (CMS)   |
| APCM   | G0556–G0558 | $85.00      | Annual (CMS)   |

Rates are blended averages across payer mix. Actual rates vary by payer
and geography. Revenue proxy uses blended rates; actual billing uses
payer-specific schedules from the billing_events table.
```

---

## G. Amend: §12 Alert Integration — Add Alert Priority/Routing

**Priority: Low**

§12 defines threshold logic (amber >5% below, red >15% below) but doesn't specify who gets alerted or what action is expected. This is operational context that helps implementers build the right notification UX.

### What to add

```markdown
### 12.2 Alert Routing

| Alert              | Audience          | Expected Response          |
|--------------------|-------------------|----------------------------|
| Activation pace    | Growth lead (Luke)| Review daily campaign mix  |
| Care code curve    | Care lead (Kit)   | Accelerate documentation   |
| Monitoring gauge   | Care lead (Kit)   | Outreach to non-readers    |
| Active trend       | CEO               | Escalation in daily standup|
| Funnel CR degrade  | Growth lead       | Gap/leakage drill-down     |
| Revenue proxy      | Finance (Alex)    | Billing pipeline review    |
```

---

## H. Amend: §1.1 Engine Layers — Add Layer Transition Events

**Priority: Low**

The engine layer table defines states but not the events that trigger transitions. This matters for implementation because events are what the data model actually captures.

### What to add (additional column to §1.1 table)

| Layer | State | **Transition Event** | Owner |
|-------|-------|---------------------|-------|
| 1→2 | Contracted → Eligible | All eligibility gates pass | Shared |
| 2→3 | Eligible → Marketable | BI complete + partner/provider approved | Brook |
| 3→4 | Marketable → Activated | Device activated + onboarding call complete | Brook |
| 4→5 | Activated → Active | First biomarker reading received | Brook |
| 5→6 | Active → Programs | Clinical assignment by care team | Shared |

---

## Summary: Priority Order

| # | Section | Priority | Effort | Impact on Implementability |
|---|---------|----------|--------|---------------------------|
| A | §15 Data Dictionary | Critical | 2–3 hours | Eliminates primary implementation friction |
| B | §4.4 Monthly Targets | High | 30 min | Enables pacing calculations |
| C | §15.4 Data Availability | High | 1 hour | Prevents building to unavailable data |
| D | §8.5 Pacing Fallback | Medium | 30 min | Handles edge cases |
| E | §11.8 Staging Table | Medium | 1 hour | Bridges spec schema to reality |
| F | §7.4 Reimbursement Rates | Medium | 15 min | Makes revenue proxy reproducible |
| G | §12.2 Alert Routing | Low | 30 min | Operational completeness |
| H | §1.1 Transition Events | Low | 30 min | Clarifies state machine |
