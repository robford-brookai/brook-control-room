# 1. The Data Model

Covers the entire patient journey and refers to the complete set of experiences and interactions that a patient goes through when engaging with Brook. It encompasses various patient stages, from organizational awareness to contracted, eligible, marketable, activated, active, and care programs, modules and sessions until it has achieved its full revenue potential. 

## 1.1 Each dashboard aligns with a layer of this model:

`Contracted → Eligible → Marketable → Activated → Active → Care Programs → Revenue`

`Awareness → Education → Selection → Mutual Commit → Onboarding → Retention ←→ Expansion`

`Ownership | Subscription | Consumption`

## 1.2 Data Structure

**Volume metrics (VM [n])** measure the quantity of deals, meetings and wins

**Conversion metrics (CR [n])** measure how many inputs are needed to generate desired outputs

**Time metrics (Δ tn)** measure how long it takes to convert input to output

| **Input [x]** | **Time Metric →** | **Output [y]** |
| --- | --- | --- |
| **Time 1 →** | **System or Sub-system** | **Time 2 →** |
| **Volume Metric** | **← Conversion Metric →** | **Volume Metric** |

## 1.3 Metrics

| Volume metrics | **VM Description** | Conversion metrics | Time metrics | TM Description |
| --- | --- | --- | --- | --- |
| VM1 | Contracted | Brook match to organization based on situation, pain and impact potential | CR1 | C2E | Δt1 | Awareness | Time it takes to develop a conversation with an organization |
| VM2 | Eligible | Organization interested and makes formal contact with Brook | CR2 | E2M | Δt2 | Education | Time it takes for patients to start the process |
| VM3 | Marketable | Organization has enough pain that they are considering Brook | CR3 | M2A | Δt3 | Prioritization | Time it takes to onboard patients |
| VM4 | Activated | Verified that Brook is a priority and no action has consequences | CR4 | A2A | Δt4 | Selling | Time it takes to qualify patients based on condition |
| VM5 | Active | Number of mutual commitments (wins) | CR5 | A2P | Δt5 | Commit | Time it takes to get patients running on platform |
| VM6 | Enrolled | Amount of revenue committed | CR6 | P2R | Δt6 | Onboarding | Time from when patient signs up to first biomarker |
| VM7 | Revenue | Amount of revenue committed minus Onboarding churn | CR7 | R2A | Δt7 | Retention | Length of contract with organization |
| VM8 | ARR | Annual Recurring Revenue | CR8 | A2V | Δt8 | Expansion | Lifetime of patient measured in years |
| VM9 | PLV | Patient Lifetime Value total amount of revenue generated over entire lifetime |  | Δt9 | Closed loop |  |