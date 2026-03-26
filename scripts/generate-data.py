"""
Brook Control Room — Data Generation Script

Reads daily-funnel-data.csv and produces:
  - src/data.json       (aggregated dashboard data)
  - src/daily-detail.json (full daily detail, all fields)

Synthetic extensions are seeded (random.seed(42)) for reproducibility.
"""

import csv
import json
import math
import random
from collections import defaultdict
from datetime import datetime
from pathlib import Path

random.seed(42)

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "data" / "daily-funnel-data.csv"
OUT_COMPACT = ROOT / "src" / "data.json"
OUT_DETAIL = ROOT / "src" / "daily-detail.json"

# ── Starting population (row 2 of CSV) ──
STARTING = {
    "total": 71131, "holding_pediatric": 1739,
    "gap_diag_only": 10576, "gap_ins_only": 8058, "gap_prov_only": 443,
    "gap_diag_ins": 4982, "gap_diag_prov": 472, "gap_ins_prov": 220,
    "gap_diag_ins_prov": 412, "gap_no_program": 0,
    "gap_mkt_cio_error": 0, "gap_mkt_restricted": 22793,
    "gap_mkt_provider_nf": 809, "gap_mkt_high_copay": 6,
    "gap_mkt_awaiting_bi": 1990, "gap_mkt_new_patients": 0,
    "gap_mkt_not_interested": 3270, "gap_mkt_other": 0,
    "awaiting_bi": 1990, "bi_complete": 4,
    "awaiting_next_campaign": 5027, "in_campaign": 9814,
    "awaiting_device_shipment": 59, "awaiting_device_delivery": 97,
    "awaiting_activation": 337, "active_count": 7251,
}

# ── Reimbursement rates ──
RPM_RATE = 62.50
CCM_RATE = 48.00
APCM_RATE = 85.00

# ── Targets (from exec dashboard) ──
MARCH_TARGETS = {
    "activations": 653,
    "active": 8584,
    "care_codes": 5200,
    "revenue": 380000,
    "monitoring_rate": 80,
}

# ── Column indices in CSV ──
COL = {
    "total_dod": 1, "holding_pediatric": 2,
    "gap_diag_only": 3, "gap_ins_only": 4, "gap_prov_only": 5,
    "gap_diag_ins": 6, "gap_diag_prov": 7, "gap_ins_prov": 8,
    "gap_diag_ins_prov": 9, "gap_no_program": 10,
    "gap_mkt_cio_error": 11, "gap_mkt_restricted": 12,
    "gap_mkt_provider_nf": 13, "gap_mkt_high_copay": 14,
    "gap_mkt_awaiting_bi": 15, "gap_mkt_new_patients": 16,
    "gap_mkt_not_interested": 17, "gap_mkt_other": 18,
    "awaiting_bi": 19, "bi_complete": 20,
    "awaiting_next_campaign": 21, "in_campaign": 22,
    "awaiting_device_shipment": 23, "awaiting_device_delivery": 24,
    "awaiting_activation": 25,
    "daily_consents": 26, "daily_disenrollments": 27,
    "daily_activations": 28,
    "rem_not_interested": 29, "rem_non_compliance": 30,
    "rem_high_copay": 31, "rem_goals_met": 32,
    "rem_deceased": 33, "rem_other": 34, "rem_through_app": 35,
    "active_count": 36,
}

CUMULATIVE_KEYS = [
    "holding_pediatric",
    "gap_diag_only", "gap_ins_only", "gap_prov_only",
    "gap_diag_ins", "gap_diag_prov", "gap_ins_prov", "gap_diag_ins_prov",
    "gap_no_program", "gap_mkt_cio_error", "gap_mkt_restricted",
    "gap_mkt_provider_nf", "gap_mkt_high_copay", "gap_mkt_awaiting_bi",
    "gap_mkt_new_patients", "gap_mkt_not_interested", "gap_mkt_other",
    "awaiting_bi", "bi_complete", "awaiting_next_campaign", "in_campaign",
    "awaiting_device_shipment", "awaiting_device_delivery", "awaiting_activation",
]


def days_in_month(dt):
    m = dt.month
    if m in (1, 3, 5, 7, 8, 10, 12):
        return 31
    if m in (4, 6, 9, 11):
        return 30
    return 29 if dt.year % 4 == 0 else 28


def generate():
    # ── Read CSV ──
    rows = []
    with open(CSV_PATH) as f:
        reader = csv.reader(f)
        next(reader)  # headers
        for row in reader:
            rows.append(row)

    # ── Parse daily records (skip STARTING_POP row) ──
    daily_raw = []
    for row in rows[1:]:
        try:
            dt = datetime.strptime(row[0], "%m/%d/%y")
        except ValueError:
            continue
        rec = {"date": dt.strftime("%Y-%m-%d"), "dt": dt}
        for key, idx in COL.items():
            rec[key] = int(row[idx]) if row[idx] else 0
        daily_raw.append(rec)

    # ── Build cumulative + synthetic ──
    running = dict(STARTING)
    output = []

    for d in daily_raw:
        running["total"] += d["total_dod"]
        for k in CUMULATIVE_KEYS:
            running[k] += d[k]
        if d["active_count"] > 0:
            running["active_count"] = d["active_count"]

        churn = sum(d[k] for k in [
            "rem_not_interested", "rem_non_compliance", "rem_high_copay",
            "rem_goals_met", "rem_deceased", "rem_other", "rem_through_app",
        ])

        elig_gap = sum(running[k] for k in [
            "gap_diag_only", "gap_ins_only", "gap_prov_only",
            "gap_diag_ins", "gap_diag_prov", "gap_ins_prov", "gap_diag_ins_prov",
        ])
        mkt_gap = sum(running[k] for k in [
            "gap_mkt_restricted", "gap_mkt_provider_nf", "gap_mkt_high_copay",
            "gap_mkt_awaiting_bi", "gap_mkt_new_patients",
            "gap_mkt_not_interested", "gap_mkt_other",
        ])
        eligible = max(0, running["total"] - running["holding_pediatric"] - elig_gap - running["gap_no_program"])
        marketable = max(0, eligible - mkt_gap)

        active = running["active_count"]
        dow = d["dt"].weekday()
        is_weekend = dow >= 5
        dom = d["dt"].day
        dim = days_in_month(d["dt"])

        # ── Synthetic: monitoring ──
        if d["dt"].year == 2025:
            base_rate = 0.75 + (d["dt"].month - 9) * 0.005
        else:
            base_rate = 0.78 + (d["dt"].month - 1) * 0.003
        monitor_rate = base_rate * (0.65 if is_weekend else 1.0) + random.gauss(0, 0.02)
        monitor_rate = max(0.55, min(0.88, monitor_rate))
        monitored = int(active * monitor_rate)
        rpm_eligible = int(active * 0.85)

        # ── Synthetic: care codes (S-curve back-loading) ──
        progress = dom / dim
        s_now = 1 / (1 + math.exp(-10 * (progress - 0.55)))
        s_prev = 1 / (1 + math.exp(-10 * ((dom - 1) / dim - 0.55)))
        delta_s = s_now - s_prev

        rpm_mo = int(active * 0.6)
        ccm_mo = int(active * 0.15)
        apcm_mo = int(active * 0.05)

        wk = 0 if is_weekend else 1
        daily_rpm = max(0, int(rpm_mo * delta_s * wk + random.gauss(0, 15)))
        daily_ccm = max(0, int(ccm_mo * delta_s * wk + random.gauss(0, 5)))
        daily_apcm = max(0, int(apcm_mo * delta_s * wk + random.gauss(0, 2)))
        daily_revenue = daily_rpm * RPM_RATE + daily_ccm * CCM_RATE + daily_apcm * APCM_RATE

        # ── Synthetic: programs ──
        htn = int(active * 0.55)
        dm = int(active * 0.30)
        bh = int(active * 0.10)
        dpp = int(active * 0.05)

        # ── Synthetic: modules ──
        rpm_active = int(active * 0.85)
        ccm_active = max(0, int(active * 0.25 + random.gauss(0, 20)))
        pcm_active = max(0, int(active * 0.10 + random.gauss(0, 10)))
        apcm_active = max(0, int(active * 0.08 + random.gauss(0, 5)))

        output.append({
            "date": d["date"], "dow": dow, "dom": dom,
            # Funnel
            "contracted": running["total"],
            "eligible": eligible, "marketable": marketable,
            "in_campaign": max(0, running["in_campaign"]),
            "awaiting_bi": max(0, running["awaiting_bi"]),
            "bi_complete": max(0, running["bi_complete"]),
            "awaiting_campaign": max(0, running["awaiting_next_campaign"]),
            "awaiting_shipment": max(0, running["awaiting_device_shipment"]),
            "awaiting_delivery": max(0, running["awaiting_device_delivery"]),
            "awaiting_activation": max(0, running["awaiting_activation"]),
            "daily_activations": d["daily_activations"],
            "daily_consents": d["daily_consents"],
            # Active
            "active": active, "daily_churn": churn,
            # Eligibility gaps
            "gap_diag": running["gap_diag_only"], "gap_ins": running["gap_ins_only"],
            "gap_prov": running["gap_prov_only"], "gap_diag_ins": running["gap_diag_ins"],
            "gap_pediatric": running["holding_pediatric"],
            # Marketable gaps
            "gap_restricted": running["gap_mkt_restricted"],
            "gap_high_copay": running["gap_mkt_high_copay"],
            "gap_awaiting_bi": running["gap_mkt_awaiting_bi"],
            "gap_not_interested": running["gap_mkt_not_interested"],
            # Programs
            "htn_enrolled": htn, "dm_enrolled": dm, "bh_enrolled": bh, "dpp_enrolled": dpp,
            "programs_per_patient": round((htn + dm + bh + dpp) / max(1, active), 2),
            # Modules
            "rpm_active": rpm_active, "ccm_active": ccm_active,
            "pcm_active": pcm_active, "apcm_active": apcm_active,
            # Monitoring
            "monitored": monitored, "rpm_eligible": rpm_eligible,
            "monitoring_rate": round(monitor_rate * 100, 1),
            # Care codes
            "daily_rpm_codes": daily_rpm, "daily_ccm_codes": daily_ccm,
            "daily_apcm_codes": daily_apcm,
            "daily_total_codes": daily_rpm + daily_ccm + daily_apcm,
            # Revenue
            "daily_revenue": round(daily_revenue, 2),
            # Churn breakdown
            "rem_not_interested": d["rem_not_interested"],
            "rem_non_compliance": d["rem_non_compliance"],
            "rem_high_copay": d["rem_high_copay"],
            "rem_goals_met": d["rem_goals_met"],
            "rem_deceased": d["rem_deceased"],
            "rem_other": d["rem_other"],
        })

    # ── Write full detail ──
    with open(OUT_DETAIL, "w") as f:
        json.dump(output, f)
    print(f"Wrote {len(output)} records → {OUT_DETAIL}")

    # ── Aggregate for compact dashboard data ──
    monthly = defaultdict(lambda: {
        "activations": 0, "churn": 0, "consents": 0, "days": 0,
        "rpm_codes": 0, "ccm_codes": 0, "apcm_codes": 0, "total_codes": 0,
        "revenue": 0, "active": 0, "contracted": 0, "eligible": 0, "marketable": 0,
        "monitored_sum": 0, "rpm_eligible_sum": 0,
    })
    for r in output:
        ym = r["date"][:7]
        m = monthly[ym]
        m["activations"] += r["daily_activations"]
        m["churn"] += r["daily_churn"]
        m["consents"] += r["daily_consents"]
        m["days"] += 1
        m["rpm_codes"] += r["daily_rpm_codes"]
        m["ccm_codes"] += r["daily_ccm_codes"]
        m["apcm_codes"] += r["daily_apcm_codes"]
        m["total_codes"] += r["daily_total_codes"]
        m["revenue"] += r["daily_revenue"]
        m["active"] = r["active"]
        m["contracted"] = r["contracted"]
        m["eligible"] = r["eligible"]
        m["marketable"] = r["marketable"]
        m["monitored_sum"] += r["monitored"]
        m["rpm_eligible_sum"] += r["rpm_eligible"]

    monthly_arr = []
    for ym in sorted(monthly.keys()):
        m = monthly[ym]
        m["month"] = ym
        m["avg_monitoring_rate"] = round(m["monitored_sum"] / max(1, m["rpm_eligible_sum"]) * 100, 1)
        m["revenue"] = round(m["revenue"])
        monthly_arr.append(m)

    # March daily
    march = [r for r in output if r["date"].startswith("2026-03")]
    feb = [r for r in output if r["date"].startswith("2026-02")]

    march_daily = []
    cum_acts = cum_codes = cum_rev = 0
    for r in march:
        cum_acts += r["daily_activations"]
        cum_codes += r["daily_total_codes"]
        cum_rev += r["daily_revenue"]
        march_daily.append({
            "date": r["date"], "day": r["dom"], "dow": r["dow"],
            "daily_acts": r["daily_activations"], "cum_acts": cum_acts,
            "active": r["active"], "daily_churn": r["daily_churn"],
            "monitored": r["monitored"], "rpm_eligible": r["rpm_eligible"],
            "monitoring_rate": r["monitoring_rate"],
            "daily_rpm": r["daily_rpm_codes"], "daily_ccm": r["daily_ccm_codes"],
            "daily_apcm": r["daily_apcm_codes"], "daily_codes": r["daily_total_codes"],
            "cum_codes": cum_codes,
            "daily_revenue": round(r["daily_revenue"]),
            "cum_revenue": round(cum_rev),
        })

    # Feb for pacing curve
    feb_cum_acts = feb_cum_codes = 0
    feb_daily = []
    for r in feb:
        feb_cum_acts += r["daily_activations"]
        feb_cum_codes += r["daily_total_codes"]
        feb_daily.append({"day": r["dom"], "cum_acts": feb_cum_acts, "cum_codes": feb_cum_codes})

    feb_total_acts = feb_cum_acts or 1
    feb_total_codes = feb_cum_codes or 1

    expected_pace = []
    for day_num in range(1, 32):
        match = [f for f in feb_daily if f["day"] == day_num]
        if match:
            act_pct = match[0]["cum_acts"] / feb_total_acts
            code_pct = match[0]["cum_codes"] / feb_total_codes
        else:
            act_pct = day_num / 31
            code_pct = day_num / 31
        expected_pace.append({
            "day": day_num,
            "act_expected": round(MARCH_TARGETS["activations"] * act_pct),
            "code_expected": round(MARCH_TARGETS["care_codes"] * code_pct),
            "rev_expected": round(MARCH_TARGETS["revenue"] * code_pct),
        })

    # Funnel snapshot
    latest = output[-1]
    funnel = {
        "contracted": latest["contracted"], "eligible": latest["eligible"],
        "marketable": latest["marketable"], "in_campaign": latest["in_campaign"],
        "awaiting_shipment": latest["awaiting_shipment"],
        "awaiting_delivery": latest["awaiting_delivery"],
        "awaiting_activation": latest["awaiting_activation"],
        "active": latest["active"],
        "gap_diag": latest["gap_diag"], "gap_ins": latest["gap_ins"],
        "gap_prov": latest["gap_prov"], "gap_diag_ins": latest["gap_diag_ins"],
        "gap_pediatric": latest["gap_pediatric"],
        "gap_restricted": latest["gap_restricted"],
        "gap_high_copay": latest["gap_high_copay"],
        "gap_awaiting_bi": latest["gap_awaiting_bi"],
        "gap_not_interested": latest["gap_not_interested"],
        "htn": latest["htn_enrolled"], "dm": latest["dm_enrolled"],
        "bh": latest["bh_enrolled"], "dpp": latest["dpp_enrolled"],
        "rpm_active": latest["rpm_active"], "ccm_active": latest["ccm_active"],
        "pcm_active": latest["pcm_active"], "apcm_active": latest["apcm_active"],
        "programs_per_patient": latest["programs_per_patient"],
        "awaiting_bi_total": latest["awaiting_bi"],
        "bi_complete_total": latest["bi_complete"],
    }

    # Churn breakdown
    churn = defaultdict(int)
    for r in march:
        churn["Not Interested"] += r["rem_not_interested"]
        churn["Non-Compliance"] += r["rem_non_compliance"]
        churn["High Copay"] += r["rem_high_copay"]
        churn["Goals Met"] += r["rem_goals_met"]
        churn["Deceased"] += r["rem_deceased"]
        churn["Other"] += r["rem_other"]

    # Active trend
    active_trend = [{
        "month": m["month"], "active": m["active"],
        "activations": m["activations"], "churn": m["churn"],
        "net": m["activations"] - m["churn"],
    } for m in monthly_arr]

    compact = {
        "monthly": monthly_arr,
        "march_daily": march_daily,
        "expected_pace": expected_pace,
        "funnel": funnel,
        "churn": dict(churn),
        "active_trend": active_trend,
        "targets": MARCH_TARGETS,
    }

    with open(OUT_COMPACT, "w") as f:
        json.dump(compact, f, indent=2)
    print(f"Wrote compact → {OUT_COMPACT}")


if __name__ == "__main__":
    generate()
