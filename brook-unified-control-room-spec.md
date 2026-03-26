# BROOK — Unified Control Room Specification

**Operating Engine · Data Model · Mathematical Model · Growth Pipeline**

Consolidates: Dashboard Spec (a) · Data Model Spec (b) · Math Spec (c) · Growth Dashboard Spec (d)

March 2026 | v1.0

**CONFIDENTIAL**

---

## 1. Brook Operating Engine

The Brook operating engine defines the canonical patient flow from contracted population through revenue realization. Every dashboard, metric, and report in this specification maps to one or more layers of this nine-layer model.

> The left side of the engine (Layers 1–4) is governed by repeated multiplication of conversion rates (Π). The right side (Layers 5–9) is governed by cumulative addition of compounded terms (Σ). This mathematical asymmetry is the source of nonlinear growth.

### 1.1 Engine Layers

| Layer | State | Definition | Owner | Dashboard |
|-------|-------|------------|-------|-----------|
| 1 | Contracted Patients | Total patient population under contract with partner organizations | Partner | Growth Engine |
| 2 | Eligible Patients | Patients meeting clinical, insurance, and partner eligibility criteria | Shared | Growth Engine |
| 3 | Marketable Patients | Eligible patients cleared for outreach with completed BI and approved campaigns | Brook | Growth Engine |
| 4 | Activations | Patients who complete device setup, onboarding call, and platform enrollment | Brook | Growth Engine |
| 5 | Active Patients | Currently engaged patients receiving care through Brook | Brook | Installed Base |
| 6 | Care Programs | Clinical offerings assigned (HTN, DM, Brain Health, DPP) | Shared | Care Delivery |
| 7 | Care Modules | Delivery methods active (RPM, CCM, PCM, APCM) | Brook | Care Delivery |
| 8 | Care Sessions | Individual care interactions completed and documented | Brook | Care Delivery |
| 9 | Revenue | Billed and estimated revenue output from care delivery | Brook | Revenue Engine |

### 1.2 Parallel Lenses

| Lens | Engine Layers | Math Domain | Perspective |
|------|--------------|-------------|-------------|
| Ownership | 1–3 (Contracted → Marketable) | Acquisition (Π) | Partner-side: eligibility determination and outreach approval |
| Subscription | 4–6 (Activation → Programs) | Inflection + Retention (Σ) | Platform-side: enrollment, engagement, clinical assignment |
| Consumption | 7–9 (Modules → Revenue) | Expansion (ΣΠ) | Delivery-side: care consumed, billed, revenue realized |

### 1.3 Patient Journey Mapping

| Journey Phase | Engine Transition | Patient Experience | System of Record |
|--------------|-------------------|-------------------|-----------------|
| Awareness | Contracted → Eligible | Patient learns their provider offers Brook | POP (patient database) |
| Education | Eligible (qualification stages) | Patient is assessed for clinical and insurance eligibility | POP + EMR |
| Prioritization | Eligible → Marketable | BI completed, partner/provider approval obtained | POP + BI system |
| Selection | Marketable → Campaign | Patient enters outreach campaign | Campaign platform |
| Mutual Commit | Campaign → Activation | Device shipped, delivered, activated; onboarding call completed | Impilo + ZCC |
| Onboarding | Activated → Active | First biomarker reading, care plan established | Brook platform |
| Retention | Active → Programs/Modules | Consistent engagement with care programs | Brook platform |
| Expansion | Modules → Sessions → Revenue | Additional programs, increased session frequency | Brook + Billing |

---

## 2. Metric Framework

Every metric in the Brook system is classified into one of three types. This classification determines calculation method, display format, pacing model, and sensitivity ranking.

### 2.1 Metric Types

| Type | Notation | Measures | Unit | Math Operation |
|------|----------|----------|------|---------------|
| Volume | VM [n] | Quantity of patients at a given state | Count | Absolute value |
| Conversion | CR [n] | Rate of input-to-output transformation | Percentage | Output / Input |
| Time | Δt [n] | Duration to convert input to output state | Days | Avg time between states |

### 2.2 System Model

Each engine transition is modeled as a system with an input volume, an output volume, a conversion rate linking them, and a time metric measuring throughput speed.

```
Output = Input × Conversion Rate
Time   = Avg latency of conversion

For any transition:
  VM[y] = VM[x] × CR[n]
  Δt[n] = Avg(date[y] - date[x])
```

### 2.3 Volume Metric Registry

| ID | Metric | Definition | Layer | Owner |
|----|--------|------------|-------|-------|
| VM1 | Contracted | Total patients under partner contract | 1 | Partner |
| VM2 | Eligible | Patients meeting all eligibility criteria | 2 | Shared |
| VM3 | Marketable | Patients cleared for outreach | 3 | Brook |
| VM4 | Activated | Patients completing enrollment | 4 | Brook |
| VM5 | Active | Currently engaged patients | 5 | Brook |
| VM6 | Enrolled (Programs) | Patients in care programs | 6 | Shared |
| VM7 | Revenue | Committed revenue net of churn | 9 | Brook |
| VM8 | ARR | Annual Recurring Revenue | 9 | Brook |
| VM9 | PLV | Patient Lifetime Value | 9 | Brook |

### 2.4 Conversion Metric Registry

| ID | Metric | Formula | Transition | Owner |
|----|--------|---------|------------|-------|
| CR1 | C2E (Contracted → Eligible) | VM2 / VM1 | Layer 1→2 | Shared |
| CR2 | E2M (Eligible → Marketable) | VM3 / VM2 | Layer 2→3 | Shared |
| CR3 | M2A (Marketable → Activated) | VM4 / VM3 | Layer 3→4 | Brook |
| CR4 | A2A (Activated → Active) | VM5 / VM4 | Layer 4→5 | Brook |
| CR5 | A2P (Active → Programs) | VM6 / VM5 | Layer 5→6 | Shared |
| CR6 | P2R (Programs → Revenue) | VM7 / VM6 | Layer 6→9 | Brook |
| CR7 | R2A (Revenue → ARR) | VM8 / VM7 | Layer 9 int. | Brook |
| CR8 | A2V (ARR → PLV) | VM9 / VM8 | Layer 9 int. | Brook |

### 2.5 Time Metric Registry

| ID | Metric | Measures | Transition |
|----|--------|----------|------------|
| Δt1 | Awareness | Time to develop initial organization contact | 1→2 |
| Δt2 | Education | Time for patients to begin enrollment process | 2→3 |
| Δt3 | Prioritization | Time to complete BI and obtain outreach approval | 2→3 |
| Δt4 | Qualification | Time to qualify patients by condition | 2→3 |
| Δt5 | Onboarding | Time from activation to first biomarker reading | 4→5 |
| Δt6 | Retention | Length of active engagement | 5 ongoing |
| Δt7 | Expansion | Patient lifetime measured in years | 5→9 |
| Δt8 | Closed Loop | Full cycle: contracted to revenue | 1→9 |

### 2.6 Metric Relationships

Each engine transition creates a linked system. Improving any variable changes the output.

| Transition | Volume In | Conversion | Time | Volume Out | Owner |
|-----------|-----------|------------|------|------------|-------|
| Contracted → Eligible | VM1 | CR1 (C2E) | Δt1 | VM2 | Shared |
| Eligible → Marketable | VM2 | CR2 (E2M) | Δt2–Δt4 | VM3 | Shared |
| Marketable → Activated | VM3 | CR3 (M2A) | Δt5 | VM4 | Brook |
| Activated → Active | VM4 | CR4 (A2A) | Δt5 | VM5 | Brook |
| Active → Programs | VM5 | CR5 (A2P) | Δt6 | VM6 | Shared |
| Programs → Revenue | VM6 | CR6 (P2R) | Δt7 | VM7 | Brook |

---

## 3. Mathematical Model

The Brook Bowtie is governed by two mathematical operations. Understanding them is prerequisite to interpreting Control Room metrics, setting targets, and allocating operational resources.

### 3.1 Sigma (Σ) — Repeated Addition

Accumulates revenue across time periods, aggregates patients across cohorts, totals care sessions. Governs the right side of the Bowtie (Retention & Expansion).

```
General:
  y = Σ x(n) for n = 1 to N
  y = x(1) + x(2) + ... + x(N)

Brook: Revenue
  Monthly Revenue = Σ (Care Codes × Reimbursement Rate)
  = RPM codes × RPM rate + CCM codes × CCM rate + APCM codes × APCM rate

Brook: PLV
  PLV = Σ ARR(t) for t = 1 to Lifetime
  PLV = ARR(yr 1) + ARR(yr 2) + ... + ARR(yr N)
```

### 3.2 Pi (Π) — Repeated Multiplication

Compounds conversion rates across sequential pipeline stages. Governs the left side of the Bowtie (Acquisition). Source of nonlinear behavior.

```
General:
  y = Π x(n) for n = 1 to N
  y = x(1) × x(2) × ... × x(N)

Brook: Activations
  Activations = Contracted × CR1 × CR2 × CR3 × CR4
  = VM1 × C2E × E2M × M2A × A2A
```

> Because acquisition is a product of conversion rates, a small improvement at any stage compounds across all subsequent stages. A 5-point improvement in each of 4 conversion rates yields 25.7% more activations — far exceeding the 5% lift from a 5% increase in volume.

### 3.3 Linear vs. Nonlinear Growth

```
Linear:     y = x × n    (e.g. 1.15 × 6 = 6.9)
            Growth proportional to input count.

Nonlinear:  y = x ^ n    (e.g. 1.15 ^ 6 = 2.3)
            Growth exponential with compounding.
```

At low input values, linear and exponential outputs converge. At high input values, exponential dramatically exceeds linear. This is disproportionate impact.

| Input Range | Linear Δy | Exponential Δy | Ratio |
|------------|-----------|---------------|-------|
| Low (0–12) | ~7 | ~7 | 1:1 |
| Mid (12–24) | ~7 | ~15 | 1:2 |
| High (24–36) | ~7 | ~32 | 1:4.5 |

### 3.4 Compound Impact: Acquisition Scenarios

Applying the Π model to Brook's acquisition pipeline. 1,000 contracted patients, 4 conversion stages.

| Scenario | Contracted | CR/Stage | Stages | Activations | Δ vs Baseline |
|----------|-----------|----------|--------|-------------|--------------|
| Baseline | 1,000 | 85% | 4 | 522 | — |
| CR +5pts (to 90%) | 1,000 | 90% | 4 | 656 | +25.7% |
| CR +10pts (to 95%) | 1,000 | 95% | 4 | 815 | +56.1% |
| 2× Volume | 2,000 | 85% | 4 | 1,044 | +100% (linear) |
| Remove 1 stage | 1,000 | 85% | 3 | 614 | +17.6% |

### 3.5 Retention Impact: PLV Scenarios

Demonstrating cumulative effect of retention rate. Assume $500 ARR per patient.

| Monthly Retention | Annual Retention | Avg Lifetime (mo) | PLV | vs Baseline |
|------------------|-----------------|-------------------|-----|-------------|
| 95% | 54% | 20 | $833 | Baseline |
| 96% | 61% | 25 | $1,042 | +25% |
| 97% | 69% | 33 | $1,375 | +65% |
| 98% | 78% | 50 | $2,083 | +150% |
| 99% | 89% | 100 | $4,167 | +400% |

> A 4-point improvement in monthly retention (95% → 99%) produces a 5× increase in patient lifetime value. Retention is the single highest-leverage metric in the Brook model.

### 3.6 Metric Hierarchy by Impact

Ranked by revenue impact per unit of improvement.

| Rank | Metric | Impact Mechanism | Leverage |
|------|--------|-----------------|----------|
| 1 | Monthly Retention Rate | Σ accumulates over years. 1pt ≈ 25% PLV. | Highest |
| 2 | Stage Conversion Rates (CR1–CR4) | Π compound. 5pts across 4 stages = 25.7%. | Very High |
| 3 | Net Revenue Retention (NRR) | Compounds ARR annually. >100% = self-sustaining. | Very High |
| 4 | Care Code Completion Rate | Direct Σ to revenue. Linear but high volume. | High |
| 5 | Monitoring Rate | Gates RPM billing. Binary threshold. | High |
| 6 | Modules per Patient | Multiplier within Σ ARR. Expansion lever. | Medium-High |
| 7 | Contracted Volume (VM1) | Linear top-of-funnel. Capital-intensive. | Medium |
| 8 | Stage Reduction | One-time structural. Removes Π multiplier. | Medium |

---

## 4. Control Room Dashboard

Primary operational dashboard. Displayed during the daily operating meeting. Answers: Are we on track to hit the month?

### 4.1 Header Bar

| Field | Definition | Example |
|-------|------------|---------|
| Current Month | Calendar month label | March 2026 |
| Day of Month | Day N / total days | Day 14 / 31 |
| Month Progress | Percentage through month | 45% |
| Overall Status | On Track │ At Risk │ Behind | At Risk (amber) |
| Last Refresh | Timestamp of data refresh | 08:15 AM ET |

### 4.2 Company Scoreboard (Top Row KPI Tiles)

Seven KPI tiles arranged horizontally. Each tile displays a consistent data structure.

Each tile contains:

- **MTD Value** — current month-to-date actual
- **Monthly Target** — goal for the full month
- **Expected Pace** — non-linear expected value for current day (see §8)
- **Variance vs Pace** — delta between actual and expected
- **% to Goal** — MTD / Target
- **Same Period Last Month** — MTD at same day last month
- **7-Day Trend** — sparkline of trailing 7 days

#### Scoreboard KPIs

| Metric | Definition | Math Type | Pacing | Owner |
|--------|------------|-----------|--------|-------|
| Activations MTD | Patients activated this month | Π compound | Non-linear (prior month curve) | Brook |
| Active Patients | Total active patient base | Σ cumulative | Linear (stock metric) | Brook |
| Eligible Patients | Eligible population count | Single CR | Linear | Shared |
| Marketable Patients | Outreach-ready population | Single CR | Linear | Brook |
| Patients Monitored | Patients sending monitoring data | Ratio | Linear (daily operational) | Brook |
| Care Codes Completed | All completed care codes MTD | Σ sum | Non-linear (back-loaded) | Brook |
| Estimated Revenue | Revenue proxy from code completion | Σ weighted | Non-linear (follows codes) | Brook |

### 4.3 Scoreboard Tile Formulas

```
Activations
  Activations = VM1 × CR1 × CR2 × CR3 × CR4
  Pacing: Non-linear (prior month curve)

Active Patients
  Active = Prior Active + Activations - Churn
  Active = VM5(t-1) + VM4(t) - Churn(t)

Eligible
  Eligible = VM1 × CR1 (C2E rate)

Marketable
  Marketable = VM2 × CR2 (E2M rate)

Monitored
  Monitored = Active RPM patients with readings ≥ threshold
  Monitoring Rate = Monitored / RPM-eligible

Care Codes
  Total Codes = RPM + CCM + PCM + APCM codes completed
  Pacing: Non-linear (late-month accumulation)

Est. Revenue
  Revenue = Σ (Codes × Reimbursement rate per type)
  = RPM codes × RPM rate + CCM × CCM rate + APCM × APCM rate
```

---

## 5. Growth Engine Section

Tracks pipeline health from contracted population through activation. Maps to engine layers 1–4: Contracted → Eligible → Marketable → Activated. Includes gap/leakage analysis at each funnel transition.

### 5.1 Growth Metrics

| Metric | Definition | Layer | Owner |
|--------|------------|-------|-------|
| Contracted Patients | Total panel size under partner contract | 1 | Partner |
| Eligible Patients | Patients meeting all eligibility criteria | 2 | Shared |
| New Eligible Added | Newly eligible this month | 2 | Shared |
| Marketable Patients | Outreach-ready population (BI complete, approved) | 3 | Brook |
| Eligible → Marketable % | Pipeline conversion rate (CR2) | 2→3 | Shared |
| Activations | Successful enrollments this month | 4 | Brook |
| Activation Conversion % | Marketable → Activated rate (CR3) | 3→4 | Brook |

### 5.2 Growth Visualizations

**Activation Pace Chart:** Line chart — Actual Activations (solid), Expected Pace (dashed, non-linear), Last Month Pace (dotted). X: day of month. Y: cumulative activations.

**Daily Activations Bar:** Vertical bar chart. Daily count. Green if above daily pace, red if below.

**Funnel Diagram:** Horizontal funnel — Contracted → Eligible → Marketable → Activated. Show counts and conversion rates at each transition. Owner badge (Brook/Partner/Shared) at each stage.

### 5.3 Gap/Leakage Analysis

At each funnel transition, a gap/leakage visualization shows WHERE patients fall out. This is the primary diagnostic tool for improving conversion rates (Π compound impact).

| Transition | Leakage Visualization | Breakdown Dimensions | Owner |
|-----------|----------------------|---------------------|-------|
| Contracted → Eligible | Pie chart: reasons patients fail eligibility | By diagnosis, age, insurance type | Partner |
| Eligible → Marketable | Pie chart: reasons patients are not outreach-ready | By BI status, partner approval, provider approval, copay restriction | Shared |
| Marketable → In Campaign | Bar chart: campaign status distribution | By conversion probability band (green >30%, amber 10–30%, red <10%) | Brook |
| In Campaign → Activated | Waterfall: device/onboarding drop-off | By stage: awaiting shipment, delivery, device activation, onboarding call | Brook |

> Gap/leakage analysis directly supports the Π compound impact model. Identifying and closing the largest leakage point at any single stage improves conversion at that stage, which compounds across all downstream stages. A 5-point improvement in the leakiest stage yields disproportionate activation gains.

---

## 6. Installed Base Section

Tracks active patient population. Maps to engine layer 5: Active Patients. Governed by cumulative addition (Σ).

### 6.1 Installed Base Metrics

| Metric | Definition | Formula | Owner |
|--------|------------|---------|-------|
| Active Patients | Current active population | VM5(t-1) + VM4(t) - Churn(t) | Brook |
| Net Growth | Activations minus churn | VM4 - Churn | Brook |
| Churn | Patients leaving active status | Count(status change to churned) | Brook |
| Retention Rate | Patient persistence | (Active - Churn) / Active | Brook |

### 6.2 Installed Base Visualizations

**Cumulative Active Trend:** Area chart — active patient count over time. Net growth as secondary axis.

**Net Growth Trend:** Bar chart — activations (green, positive) vs churn (red, negative). Net line overlaid.

**Retention Gauge:** Radial gauge. Green >95%, amber 90–95%, red <90%.

---

## 7. Care Delivery Section

Ensures Brook delivers sufficient care activity to support revenue targets. Maps to engine layers 6–8: Care Programs → Care Modules → Care Sessions.

### 7.1 Monitoring Activity

Monitoring drives RPM billing eligibility. A patient must transmit required data to qualify for RPM codes.

| Metric | Definition | Owner |
|--------|------------|-------|
| Patients Monitored | Patients sending required monitoring data | Brook |
| Monitoring Rate | Monitored / RPM-eligible population | Brook |
| Monitoring Gap | RPM-eligible minus monitored | Brook |

**Daily Monitored:** Line — daily count vs prior month. Highlight weekday/weekend.

**Monitoring Gauge:** Radial gauge. Green >80%, amber 70–80%, red <70%.

### 7.2 Care Code Completion

| Metric | Definition | Owner |
|--------|------------|-------|
| RPM Codes Completed | Completed RPM care codes | Brook |
| CCM/PCM Codes Completed | Completed CCM and PCM codes | Brook |
| APCM Codes Completed | Completed APCM codes | Brook |
| Total Care Codes | All codes combined | Brook |

**Care Code Curve:** Line — MTD actual vs non-linear expected pace (prior month shape). See §8.

**Care Delivery Mix:** Stacked area — RPM, CCM, PCM, APCM over time. Tracks service expansion.

### 7.3 Revenue Proxy

Billing lag prevents real-time revenue visibility. Revenue is estimated from completed care codes.

```
Est. Revenue = (RPM codes × RPM rate) + (CCM codes × CCM rate) + (APCM codes × APCM rate)
Maps to engine layer 9.
```

---

## 8. Non-Linear Pacing Model

Linear pacing assumes uniform daily progress. The mathematical model proves this wrong: acquisition compounds (Π) and care delivery accumulates late (Σ). Both require curve-based pacing.

### 8.1 Why Linear Pacing Fails

| Day | Linear % | Actual Typical % | Variance | False Signal |
|-----|---------|-----------------|----------|-------------|
| Day 5 | 16% | 8% | -8pts | False alarm: Behind |
| Day 10 | 32% | 22% | -10pts | False alarm: Behind |
| Day 15 | 48% | 48% | 0pts | Correct (crossover) |
| Day 20 | 65% | 70% | +5pts | False confidence |
| Day 25 | 81% | 88% | +7pts | False confidence |
| Day 30 | 100% | 100% | 0pts | Correct (target) |

### 8.2 Curve-Based Pacing Formula

```
Expected(day N) = (Last Month Actual(day N) / Last Month Total) × Current Month Target

Prior month completion curve = shape function
Current month target = scale factor
```

### 8.3 Reference Curve

| Day of Month | Expected % Complete |
|-------------|-------------------|
| Day 5 | 8% |
| Day 10 | 22% |
| Day 15 | 48% |
| Day 20 | 70% |
| Day 25 | 88% |
| Day 30 | 100% |

Recalculated monthly using actual prior-month data. The reference above is illustrative.

### 8.4 Pacing by Metric

| Metric | Pacing Type | Rationale |
|--------|------------|-----------|
| Activations | Non-linear (prior month curve) | Enrollment varies by outreach cadence |
| Care Codes | Non-linear (strongly back-loaded) | Clinical documentation completes late in month |
| Active Patients | Linear (cumulative stock) | Net additions roughly uniform |
| Monitoring Rate | Linear (daily operational) | Device readings uniform when engaged |
| Revenue | Non-linear (follows care codes) | Derived from code completion |

---

## 9. Phase 2: Growth Pipeline Dashboard

Deep-dive operational dashboard for the Growth team. Expands Control Room's Eligible → Marketable → Activated layers into granular sub-stages with full accountability tracking. Not displayed in daily operating meeting; used by Growth leadership for pipeline management.

### 9.1 Eligibility Sub-Funnel (Layer 2 Expansion)

Layer 2 (Eligible) in the Control Room is a single number. The Growth Pipeline decomposes it into sequential qualification and eligibility gates.

| Sub-Stage | Definition | Owner | System | Gap/Leakage Analysis |
|-----------|------------|-------|--------|---------------------|
| Total Panel Size | Total clinic panel (updated quarterly at QBR) | Partner | Manual/QBR | Separate chart (avoid funnel compression) |
| Opportunity Size | Eligible Dx by Brook capability; age >18 | Brook | EMR analysis | Dx distribution breakdown |
| POP Population | Patients loaded in Brook patient database | Brook | POP | Remove non-qualifying + pediatrics automatically |
| Qualified – Age | Patients over 18 years old | Brook | POP | Count of pediatric exclusions |
| Qualified – Diagnosis | Patients with qualifying Dx for PCM/CCM/RPM | Brook | POP | Distribution by diagnosis code |
| Qualified – Insurance | Insurance covers at least one service | Shared | POP | Pie chart: Medicaid + each non-covering insurer |
| Eligible – Insurance | Partner-approved insurance plans | Partner | POP | Pie chart: each excluded insurer |
| Eligible – Service Line | Qualifying service line per partner agreement | Partner | POP | Service line distribution |
| Eligible – Diagnosis | Partner-agreed diagnosis set (e.g. no CHF) | Partner | POP | Gap by excluded diagnosis |
| Eligible – Health Status | Within-condition clinical rules (A1c >9, uncontrolled HTN) | Brook | POP + EMR | Gap by diagnosis with drill-down |
| Eligible – Provider Participating | Patient's provider enrolled in Brook service | Partner | POP | Gap by provider name |
| Eligible – Partner Approved | Partner has approved outreach for patient | Partner | POP | Gap by partner |
| Eligible – Provider Approved | Individual provider has approved outreach | Partner | POP | Gap by provider |
| Eligible – Copay Range | Patient not excluded by partner copay restriction | Partner | POP | Copay band distribution |

> **UX note:** Total Panel Size should be displayed separately or toggled, as including it in the funnel compresses all downstream bars to near-zero. Recommend a separate panel size indicator above the funnel.

### 9.2 Marketable Sub-Funnel (Layer 3 Expansion)

| Sub-Stage | Definition | Owner | System | Gap/Leakage Analysis |
|-----------|------------|-------|--------|---------------------|
| Pending – BI Completion | Patients awaiting Benefits Investigation | Brook | BI system | Gap: awaiting BI, by insurer |
| BI Complete | Patients that have been through BI | Brook | BI system | BI pass/fail by insurer |
| Marketable | Patients cleared for campaign (no campaign restrictions) | Brook | POP | Gap by partner (restricted campaigns) |
| In Campaign | Patients currently in active outreach campaign | Brook | Campaign platform | Conversion probability bands: green >30%, amber 10–30%, red <10% |

### 9.3 Activation Sub-Funnel (Layer 4 Expansion)

The device logistics and onboarding pipeline between campaign engagement and platform activation.

| Sub-Stage | Definition | Owner | System | Gap/Leakage Analysis |
|-----------|------------|-------|--------|---------------------|
| Awaiting Device Shipment | Patient enrolled, device not yet shipped | Brook | Impilo | Days in queue; volume by device type |
| Awaiting Device Delivery | Device shipped, not yet delivered | Brook | Impilo | Delivery SLA tracking; failed deliveries |
| Awaiting Device Activation | Device delivered, not yet activated/paired | Brook | Impilo | Days since delivery; activation rate |
| Awaiting Onboarding Call | Device active, onboarding call not completed | Brook | ZCC | Call scheduling backlog; days waiting |
| Activated | Onboarding call completed; patient live on platform | Brook | ZCC | Time-to-activate from campaign entry |

> Each sub-stage in the activation funnel represents a Δt component. Compressing time at any stage (faster shipment, faster delivery, faster call scheduling) directly reduces Δt5 and improves the M2A conversion rate by reducing patient drop-off during the waiting period.

### 9.4 Growth Pipeline Visualizations

**Full Sub-Stage Funnel:** Vertical waterfall — all sub-stages from Qualified through Activated. Color-coded by owner (blue = Brook, yellow = Partner, purple = Shared). Counts and drop-off at each transition.

**Eligibility Gap Analysis:** Stacked horizontal bar per eligibility sub-stage. Shows patients passing (green) vs excluded (red segments by reason). Drill-down capability.

**Device Pipeline Tracker:** Horizontal pipeline — volume at each device stage (Shipment → Delivery → Activation → Onboarding). SLA indicators (green/amber/red) per stage.

**Campaign Conversion Heat Map:** Matrix — campaigns (rows) × probability bands (columns). Cell color by conversion rate. Identifies high-performing vs struggling campaigns.

**Time-in-Stage Distribution:** Box plot per sub-stage showing median, quartiles, and outliers for days-in-stage. Identifies bottlenecks.

---

## 10. Dimensions & Filters

All dashboards support the following filter dimensions. Filters apply globally within a dashboard view.

| Dimension | Values | Source Table | Applies To |
|-----------|--------|-------------|------------|
| Time | Day, Week, Month, Quarter | All tables (date columns) | All metrics |
| Organization | Partner, Provider, Clinic, Geography | patients, care_sessions | All metrics |
| Patient Attributes | Condition, Risk Segment, Cohort | patients | VM1–VM5, CR1–CR4 |
| Care Program | HTN, DM, Brain Health, DPP | patient_program_enrollments | VM6, CR5–CR6 |
| Care Module | RPM, CCM, PCM, APCM | patient_module_participation | Care delivery metrics |
| Billing Model | RPM CPT, CCM CPT, APCM CPT, PMPM, Value-based | billing_events | VM7–VM9, Revenue |
| Insurance | Payer, Plan type | patients (insurance fields) | Eligibility sub-stages |
| Campaign | Campaign name, status, probability band | campaign_events | Growth Pipeline |

---

## 11. Snowflake Data Model

Physical table definitions supporting the operating engine. Each table maps to one or more engine layers. Enriched with eligibility-stage and device-pipeline fields from Growth Pipeline requirements.

### 11.1 patients

Layers 1–5. Primary entity table. Extended with eligibility gate dates and device pipeline tracking.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| patient_id | VARCHAR | PK | Unique patient identifier |
| partner_id | VARCHAR | FK | Partner organization |
| provider_id | VARCHAR | FK | Assigned provider |
| clinic_id | VARCHAR | FK | Associated clinic |
| contracted_date | DATE | | Entered contracted pool |
| eligible_date | DATE | NULLABLE | Met all eligibility criteria |
| marketable_date | DATE | NULLABLE | Cleared for outreach (BI complete + approved) |
| campaign_entry_date | DATE | NULLABLE | Entered outreach campaign |
| activation_date | DATE | NULLABLE | Completed enrollment |
| status | VARCHAR | | contracted│eligible│marketable│in_campaign│activated│active│churned |
| condition | VARCHAR | | Primary clinical condition |
| risk_segment | VARCHAR | NULLABLE | Risk stratification tier |
| cohort | VARCHAR | NULLABLE | Enrollment cohort |
| geography | VARCHAR | NULLABLE | Patient geography |
| insurance_payer | VARCHAR | NULLABLE | Insurance payer name |
| insurance_plan | VARCHAR | NULLABLE | Plan identifier |
| copay_amount | DECIMAL | NULLABLE | Patient copay |
| bi_status | VARCHAR | NULLABLE | pending│complete│failed |
| bi_completion_date | DATE | NULLABLE | BI completion date |
| partner_approved | BOOLEAN | | Partner outreach approval |
| provider_approved | BOOLEAN | | Provider outreach approval |
| campaign_probability | VARCHAR | NULLABLE | high│medium│low conversion band |

### 11.2 device_pipeline

Layer 4 sub-stage tracking. New table from Growth Pipeline requirements.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| pipeline_id | VARCHAR | PK | Unique pipeline event |
| patient_id | VARCHAR | FK | Reference to patients |
| device_type | VARCHAR | | BP cuff │ glucometer │ scale │ pulse ox |
| shipment_date | DATE | NULLABLE | Device shipped (Impilo) |
| delivery_date | DATE | NULLABLE | Device delivered (Impilo) |
| device_activation_date | DATE | NULLABLE | Device paired (Impilo) |
| onboarding_call_date | DATE | NULLABLE | Onboarding completed (ZCC) |
| current_stage | VARCHAR | | awaiting_shipment│awaiting_delivery│awaiting_activation│awaiting_onboarding│activated |
| system_source | VARCHAR | | impilo│zcc |

### 11.3 patient_program_enrollments

Layer 6.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| patient_id | VARCHAR | FK | Reference to patients |
| program_type | VARCHAR | | HTN │ DM │ Brain Health │ DPP |
| enrollment_date | DATE | | Program enrollment date |
| completion_date | DATE | NULLABLE | Program exit date |
| status | VARCHAR | | enrolled │ completed │ withdrawn |

### 11.4 patient_module_participation

Layer 7.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| patient_id | VARCHAR | FK | Reference to patients |
| module_type | VARCHAR | | RPM │ CCM │ PCM │ APCM |
| start_date | DATE | | Module start |
| end_date | DATE | NULLABLE | Module end |
| status | VARCHAR | | active │ completed │ paused |

### 11.5 care_sessions

Layer 8.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| session_id | VARCHAR | PK | Unique session |
| patient_id | VARCHAR | FK | Reference to patients |
| module_type | VARCHAR | | RPM │ CCM │ PCM │ APCM |
| session_date | DATE | | Session date |
| timestamp | TIMESTAMP | | Exact timestamp |
| duration | INTEGER | | Duration (minutes) |
| provider_id | VARCHAR | FK | Delivering provider |
| clinic_id | VARCHAR | FK | Associated clinic |

### 11.6 billing_events

Layer 9.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| billing_id | VARCHAR | PK | Unique billing event |
| session_id | VARCHAR | FK | Reference to care_sessions |
| billing_code | VARCHAR | | CPT or billing code |
| billing_model | VARCHAR | | RPM CPT │ CCM CPT │ APCM CPT │ PMPM │ Value-based |
| amount | DECIMAL(10,2) | | Billed amount (USD) |
| payer | VARCHAR | | Payer identifier |
| timestamp | TIMESTAMP | | Billing event time |
| status | VARCHAR | | pending │ submitted │ paid │ denied |

### 11.7 monitoring_events

RPM module tracking within layer 7.

| Column | Type | Constraint | Description |
|--------|------|-----------|-------------|
| event_id | VARCHAR | PK | Unique monitoring event |
| patient_id | VARCHAR | FK | Reference to patients |
| device_type | VARCHAR | | BP cuff │ glucometer │ scale │ pulse ox |
| reading_timestamp | TIMESTAMP | | Time of reading |
| reading_date | DATE | | Date partition key |
| value | JSON | | Structured reading data |

---

## 12. Control Room Alert Integration

How the mathematical model maps to Control Room status indicators and alert thresholds.

| Element | Math Model | Formula | Alert Logic |
|---------|-----------|---------|------------|
| Activation Pace | Π compound | Actual vs prior-month-scaled target | Amber: >5% below. Red: >15% below. |
| Funnel Diagram | Π stage CR | VM at each stage; CR between | Flag stage with largest CR degradation |
| Care Code Curve | Σ late-accumulation | MTD vs prior-month curve | Amber: >10% below after day 15 |
| Revenue Proxy | Σ weighted sum | Codes × rates summed | Tracks care code status |
| Active Trend | Σ cumulative | Prior + activations − churn | Red: net growth negative 3+ days |
| Monitoring Gauge | Ratio | Monitored / RPM-eligible | Amber: <80%. Red: <70%. |
| KPI Variance | Actual − Expected | Non-linear expected per metric | Color bands: green/amber/red |
| Gap/Leakage | Π stage analysis | Drop-off volume per transition | Highlight largest single leakage point |

---

## 13. Implementation Phases

### Phase 1: Control Room

Core operational dashboard for daily operating meeting.

- Activations MTD and non-linear pace tracking
- Active patients count and cumulative trend
- Monitoring activity and rate gauge
- Care code completion with non-linear pacing curve
- Revenue proxy estimate
- Company scoreboard (7 KPI tiles with variance)
- Header bar with month progress and overall status

### Phase 2: Operational Dashboards

Deep-dive dashboards for functional leadership.

- Growth Pipeline: full sub-stage funnel (14 eligibility gates + 4 marketable stages + 5 activation stages) with gap/leakage analysis, owner badges, and system-of-record tags
- Care Delivery: monitoring rates, code completion mix, service expansion tracking
- Program Adoption: enrollment rates by program, program-level retention

### Phase 3: Revenue Analytics

Financial dashboards for executive and finance teams.

- Revenue per patient trending
- Unit economics by module and program
- Service mix optimization analysis
- Billing model performance comparison
- PLV and ARR cohort analysis

---

## 14. Future Metrics

Planned additions not included in Phase 1–3 scope.

- Medication management module metrics
- Brain health program-specific KPIs
- Programs per patient (density metric: VM6 / VM5)
- Revenue per program breakdown
- Care team productivity and capacity metrics
- Value-based contract outcome tracking
- Campaign-level ROI analytics (cost per activation by campaign)
- Provider-level activation and retention scorecards

---

## Appendix A: Source Document Index

This unified specification consolidates four source documents. Where conflicts existed, the resolution hierarchy was applied.

| ID | Document | Authority | Primary Contribution |
|----|----------|-----------|---------------------|
| a | Dashboard Spec (CEO) | Highest — language and structure authority | 9-layer engine, Control Room layout, KPI tiles, implementation phases |
| b | Data Model Spec | High — metric taxonomy authority | VM/CR/Δt framework, Snowflake schema, entity relationships, metric computation |
| c | Math Spec (book-derived) | High — mathematical model authority | Bowtie model, Σ/Π operations, compound impact, sensitivity analysis, pacing model |
| d | Growth Dashboard Spec (Growth team) | Detail enrichment — language deferred to a/b/c | Eligibility sub-stages, device pipeline, BI gate, gap/leakage analysis, system-of-record tags, partner/Brook ownership |

**Resolution rule:** a/b/c terminology and structure are canonical. Document d enriched detail within existing layers (sub-stages nested in Phase 2), added system ownership columns, and introduced gap/leakage analysis pattern for the Growth Engine section.
