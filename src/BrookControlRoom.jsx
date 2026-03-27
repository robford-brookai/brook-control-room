import React, { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
  ComposedChart, ReferenceLine, Legend, LabelList, ErrorBar
} from "recharts";
import {
  Activity, Users, Heart, DollarSign, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Clock, ChevronRight, Zap, Shield,
  Brain, Pill, BarChart3, Sun, Moon
} from "lucide-react";

// Aggregated data for dashboard views (monthly, march daily, pacing, funnel snapshot)
import D from "./data.json";
// Full 205-record daily detail — available for drill-down or custom analysis
import dailyDetail from "./daily-detail.json";

const fmt = (n) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(n);
const fmtD = (n) => `$${fmt(n)}`;
const pct = (a, b) => b ? Math.round((a / b) * 100) : 0;

const ACCENT = {
  blue: '#3b82f6', blueGlow: '#3b82f640',
  green: '#10b981', greenGlow: '#10b98140',
  amber: '#f59e0b', amberGlow: '#f59e0b40',
  red: '#ef4444', redGlow: '#ef444440',
  purple: '#8b5cf6', purpleGlow: '#8b5cf640',
  cyan: '#06b6d4', pink: '#ec4899', indigo: '#6366f1',
};
const COLORS_DARK = {
  bg: '#0a0e17', card: '#111827', cardHover: '#1a2236',
  border: '#1e293b', borderLight: '#334155',
  text: '#f1f5f9', textDim: '#94a3b8', textMuted: '#64748b',
  ...ACCENT,
};
const COLORS_LIGHT = {
  bg: '#f8fafc', card: '#ffffff', cardHover: '#f1f5f9',
  border: '#e2e8f0', borderLight: '#cbd5e1',
  text: '#0f172a', textDim: '#475569', textMuted: '#94a3b8',
  ...ACCENT,
};
let COLORS = COLORS_DARK;

const getTT = () => ({
  contentStyle: { background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, fontSize: 11, color: COLORS.text },
  labelStyle: { color: COLORS.textDim },
  itemStyle: { color: COLORS.textDim },
});

const StatusBadge = ({ status }) => {
  const c = status === 'On Track' ? COLORS.green : status === 'At Risk' ? COLORS.amber : COLORS.red;
  const Icon = status === 'On Track' ? CheckCircle : AlertTriangle;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: `${c}18`, color: c, fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>
      <Icon size={12} />{status}
    </span>
  );
};

const Sparkline = ({ data }) => {
  if (!data || data.length < 2) return null;
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 100, H = 30;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * W,
    y: 1 + ((max - v) / range) * 28,
    color: data[i].color,
  }));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" role="img" aria-label="Trend sparkline" style={{ display: 'block' }}>
      {pts.slice(0, -1).map((p, i) => (
        <line key={i} x1={p.x} y1={p.y} x2={pts[i + 1].x} y2={pts[i + 1].y}
          stroke={pts[i + 1].color} strokeWidth="2" strokeLinecap="butt" />
      ))}
    </svg>
  );
};

const KPITile = ({ label, value, target, expected, icon: Icon, format = 'number', trend, sparkData, onDrill, drillActive, redPct = 0.15 }) => {
  const v = format === 'dollar' ? fmtD(value) : format === 'pct' ? `${value}%` : fmt(value);
  const tgt = format === 'dollar' ? fmtD(target) : format === 'pct' ? `${target}%` : fmt(target);
  const pctToGoal = pct(value, target);
  const variance = expected ? value - expected : 0;
  const vColor = variance >= 0 ? COLORS.green : Math.abs(variance) / Math.max(1, expected) > redPct ? COLORS.red : COLORS.amber;
  const finalSpark = sparkData && sparkData.map((d, i) => i === sparkData.length - 1 ? { ...d, color: vColor } : d);
  return (
    <div onClick={onDrill} style={{ background: COLORS.card, border: `1px solid ${drillActive ? COLORS.blue : COLORS.border}`, borderRadius: 10, padding: '14px 16px', flex: 1, minWidth: 140, cursor: onDrill ? 'pointer' : 'default', transition: 'border-color 0.2s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ color: COLORS.textMuted, fontSize: 10, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</span>
        <Icon size={14} color={COLORS.textMuted} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, letterSpacing: '-0.5px' }}>{v}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10 }}>
        <span style={{ color: COLORS.textMuted }}>Target: {tgt}</span>
        <span style={{ color: vColor, fontWeight: 600 }}>{pctToGoal}%</span>
      </div>
      {expected !== undefined && (
        <div style={{ marginTop: 4, fontSize: 10, color: vColor }}>
          {variance >= 0 ? '▲' : '▼'} {Math.abs(variance).toLocaleString()} vs pace
        </div>
      )}
      <div style={{ marginTop: 6, height: 3, borderRadius: 2, background: COLORS.border }}>
        <div style={{ height: '100%', borderRadius: 2, background: vColor, width: `${Math.min(100, pctToGoal)}%`, transition: 'width 0.5s' }} />
      </div>
      {finalSpark && <div style={{ marginTop: 6 }}><Sparkline data={finalSpark} /></div>}
    </div>
  );
};

const Gauge = ({ value, label, thresholds = [70, 80, 95] }) => {
  const color = value >= thresholds[2] ? COLORS.green : value >= thresholds[1] ? COLORS.amber : value < thresholds[0] ? COLORS.red : COLORS.amber;
  const angle = (value / 100) * 180;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox="0 0 120 70" width="120" height="70" role="img" aria-label={`${label} gauge at ${value}%`}>
        <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke={COLORS.border} strokeWidth="8" strokeLinecap="round" />
        <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(angle / 180) * 157} 157`} />
        <text x="60" y="55" textAnchor="middle" fill={color} fontSize="18" fontWeight="700">{value}%</text>
      </svg>
      <div style={{ color: COLORS.textMuted, fontSize: 10, marginTop: 2 }}>{label}</div>
    </div>
  );
};

const FunnelBar = ({ label, value, maxValue, color, owner, sub }) => {
  const w = Math.max(5, (value / maxValue) * 100);
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
        <span style={{ color: COLORS.textDim }}>{label}</span>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {owner && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 8, background: owner === 'Brook' ? `${COLORS.blue}30` : owner === 'Partner' ? `${COLORS.amber}30` : `${COLORS.purple}30`, color: owner === 'Brook' ? COLORS.blue : owner === 'Partner' ? COLORS.amber : COLORS.purple }}>{owner}</span>}
          <span style={{ color: COLORS.text, fontWeight: 600 }}>{value.toLocaleString()}</span>
        </span>
      </div>
      <div style={{ height: 18, borderRadius: 4, background: COLORS.border, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: '100%', borderRadius: 4, background: color, width: `${w}%`, transition: 'width 0.6s ease' }} />
        {sub && <div style={{ position: 'absolute', right: 6, top: 1, fontSize: 9, color: COLORS.textMuted }}>{sub}</div>}
      </div>
    </div>
  );
};

const SectionTitle = ({ children, icon: Icon }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 4 }}>
    {Icon && <Icon size={16} color={COLORS.blue} />}
    <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, letterSpacing: 0.5 }}>{children}</span>
  </div>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, ...style }}>{children}</div>
);

const Tab = ({ label, active, onClick }) => (
  <button onClick={onClick} aria-label={`Switch to ${label}`} style={{
    padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
    background: active ? COLORS.blue : 'transparent', color: active ? '#fff' : COLORS.textMuted, transition: 'all 0.2s',
  }}>{label}</button>
);

/* ===== PHASE 1: CONTROL ROOM ===== */
const DRILL_CONFIG = {
  'Activations MTD': { cols: [{ key: 'date', label: 'Date' }, { key: 'daily_activations', label: 'Daily' }, { key: 'active', label: 'Active' }, { key: 'daily_churn', label: 'Churn' }] },
  'Active Patients': { cols: [{ key: 'date', label: 'Date' }, { key: 'active', label: 'Active' }, { key: 'daily_activations', label: 'New' }, { key: 'daily_churn', label: 'Churn' }] },
  'Eligible': { cols: [{ key: 'date', label: 'Date' }, { key: 'eligible', label: 'Eligible' }, { key: 'contracted', label: 'Contracted' }, { key: 'gap_diag', label: 'Diag Gap' }] },
  'Marketable': { cols: [{ key: 'date', label: 'Date' }, { key: 'marketable', label: 'Marketable' }, { key: 'eligible', label: 'Eligible' }, { key: 'in_campaign', label: 'In Campaign' }] },
  'Monitored': { cols: [{ key: 'date', label: 'Date' }, { key: 'monitoring_rate', label: 'Rate %' }, { key: 'monitored', label: 'Monitored' }, { key: 'rpm_eligible', label: 'RPM Elig' }] },
  'Care Codes': { cols: [{ key: 'date', label: 'Date' }, { key: 'daily_total_codes', label: 'Total' }, { key: 'daily_rpm_codes', label: 'RPM' }, { key: 'daily_ccm_codes', label: 'CCM' }, { key: 'daily_apcm_codes', label: 'APCM' }] },
  'Est. Revenue': { cols: [{ key: 'date', label: 'Date' }, { key: 'daily_revenue', label: 'Revenue' }, { key: 'daily_total_codes', label: 'Codes' }, { key: 'active', label: 'Active' }] },
};

const ControlRoom = () => {
  const [drill, setDrill] = useState(null);
  const today = D.march_daily[D.march_daily.length - 1];
  const pace = D.expected_pace.find(p => p.day === today.day) || {};
  const mRate = D.march_daily.filter(d => d.dow < 5).slice(-1)[0]?.monitoring_rate || 78;
  const overallStatus = today.cum_acts >= pace.act_expected * 0.9 ? (today.cum_acts >= pace.act_expected ? 'On Track' : 'At Risk') : 'Behind';

  const paceChart = D.march_daily.map(d => {
    const ep = D.expected_pace.find(p => p.day === d.day);
    const exp = ep?.act_expected;
    return { ...d, expected: exp, linear: Math.round((d.day / 31) * D.targets.activations), exp_upper: exp ? Math.round(exp * 1.15) : null, exp_lower: exp ? Math.round(exp * 0.85) : null };
  });
  const codeChart = D.march_daily.map(d => {
    const ep = D.expected_pace.find(p => p.day === d.day);
    const exp = ep?.code_expected;
    return { day: d.day, actual: d.cum_codes, expected: exp, linear: Math.round((d.day / 31) * D.targets.care_codes), exp_upper: exp ? Math.round(exp * 1.15) : null, exp_lower: exp ? Math.round(exp * 0.85) : null };
  });

  const paceMap = Object.fromEntries(D.expected_pace.map(p => [p.day, p]));
  const sc = (v, exp) => !exp ? COLORS.textMuted : v / exp >= 1 ? COLORS.green : v / exp >= 0.85 ? COLORS.amber : COLORS.red;
  const n = D.march_daily.length;
  const fakeTrend = (start, end, jitter) => Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return Math.round(start + (end - start) * t + Math.sin(i * 2.7 + 1.3) * jitter);
  });

  const sparkActs     = D.march_daily.map(d => ({ value: d.cum_acts,        color: sc(d.cum_acts,       paceMap[d.day]?.act_expected) }));
  const sparkMonitor  = D.march_daily.map(d => ({ value: d.monitoring_rate, color: d.monitoring_rate >= D.targets.monitoring_rate ? COLORS.green : d.monitoring_rate >= D.targets.monitoring_rate * 0.85 ? COLORS.amber : COLORS.red }));
  const sparkCodes    = D.march_daily.map(d => ({ value: d.cum_codes,       color: sc(d.cum_codes,      paceMap[d.day]?.code_expected) }));
  const sparkRevenue  = D.march_daily.map(d => ({ value: d.cum_revenue,     color: sc(d.cum_revenue,    paceMap[d.day]?.rev_expected) }));

  const activeVals     = fakeTrend(7900, today.active, 40);
  const eligibleVals   = fakeTrend(48200, D.funnel.eligible, 500);
  const marketableVals = fakeTrend(16400, D.funnel.marketable, 280);
  const sparkActive     = activeVals.map((v, i) =>     ({ value: v, color: sc(v, Math.round(D.targets.active * D.march_daily[i].day / 31)) }));
  const sparkEligible   = eligibleVals.map((v, i) =>   ({ value: v, color: sc(v, Math.round(D.targets.eligible * D.march_daily[i].day / 31)) }));
  const sparkMarketable = marketableVals.map((v, i) => ({ value: v, color: sc(v, Math.round(D.targets.marketable * D.march_daily[i].day / 31)) }));

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '10px 16px', background: COLORS.card, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>March 2026</span>
          <span style={{ color: COLORS.textMuted, fontSize: 12 }}>Day {today.day} / 31</span>
          <div style={{ width: 80, height: 4, borderRadius: 2, background: COLORS.border }}>
            <div style={{ height: '100%', borderRadius: 2, background: COLORS.blue, width: `${Math.round(today.day / 31 * 100)}%` }} />
          </div>
          <span style={{ color: COLORS.textDim, fontSize: 11 }}>{Math.round(today.day / 31 * 100)}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <StatusBadge status={overallStatus} />
          <span style={{ color: COLORS.textMuted, fontSize: 10 }}>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}</span>
        </div>
      </div>

      {/* KPI Tiles */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <KPITile label="Activations MTD" value={today.cum_acts} target={D.targets.activations} expected={pace.act_expected} icon={Zap} sparkData={sparkActs} redPct={0.05} onDrill={() => setDrill(drill === 'Activations MTD' ? null : 'Activations MTD')} drillActive={drill === 'Activations MTD'} />
        <KPITile label="Active Patients" value={today.active} target={D.targets.active} expected={Math.round(D.targets.active * today.day / 31)} icon={Users} sparkData={sparkActive} onDrill={() => setDrill(drill === 'Active Patients' ? null : 'Active Patients')} drillActive={drill === 'Active Patients'} />
        <KPITile label="Eligible" value={D.funnel.eligible} target={D.targets.eligible} icon={Shield} expected={Math.round(D.targets.eligible * today.day / 31)} sparkData={sparkEligible} onDrill={() => setDrill(drill === 'Eligible' ? null : 'Eligible')} drillActive={drill === 'Eligible'} />
        <KPITile label="Marketable" value={D.funnel.marketable} target={D.targets.marketable} icon={TrendingUp} expected={Math.round(D.targets.marketable * today.day / 31)} sparkData={sparkMarketable} onDrill={() => setDrill(drill === 'Marketable' ? null : 'Marketable')} drillActive={drill === 'Marketable'} />
        <KPITile label="Monitored" value={mRate} target={D.targets.monitoring_rate} expected={D.targets.monitoring_rate} format="pct" icon={Activity} sparkData={sparkMonitor} onDrill={() => setDrill(drill === 'Monitored' ? null : 'Monitored')} drillActive={drill === 'Monitored'} />
        <KPITile label="Care Codes" value={today.cum_codes} target={D.targets.care_codes} expected={pace.code_expected} icon={Heart} sparkData={sparkCodes} redPct={today.day >= 15 ? 0.10 : 0.15} onDrill={() => setDrill(drill === 'Care Codes' ? null : 'Care Codes')} drillActive={drill === 'Care Codes'} />
        <KPITile label="Est. Revenue" value={today.cum_revenue} target={D.targets.revenue} expected={pace.rev_expected} icon={DollarSign} format="dollar" sparkData={sparkRevenue} onDrill={() => setDrill(drill === 'Est. Revenue' ? null : 'Est. Revenue')} drillActive={drill === 'Est. Revenue'} />
      </div>

      {/* Drill-down Table */}
      {drill && DRILL_CONFIG[drill] && (
        <div style={{ marginBottom: 16 }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <SectionTitle icon={ChevronRight}>Last 30 Days — {drill}</SectionTitle>
              <button onClick={() => setDrill(null)} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 4, color: COLORS.textMuted, fontSize: 10, padding: '3px 8px', cursor: 'pointer' }}>Close</button>
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    {DRILL_CONFIG[drill].cols.map(c => (
                      <th key={c.key} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: `1px solid ${COLORS.border}`, color: COLORS.textMuted, fontSize: 10, fontWeight: 600, position: 'sticky', top: 0, background: COLORS.card }}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dailyDetail.slice(-30).reverse().map(row => (
                    <tr key={row.date} style={{ borderBottom: `1px solid ${COLORS.border}10` }}>
                      {DRILL_CONFIG[drill].cols.map(c => (
                        <td key={c.key} style={{ padding: '5px 8px', color: COLORS.text }}>
                          {c.key === 'date' ? row[c.key] : typeof row[c.key] === 'number' ? row[c.key].toLocaleString() : row[c.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 12, marginBottom: 12 }}>
        <Card>
          <SectionTitle icon={Zap}>Activation Pace</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={paceChart}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="day" tick={{ fill: COLORS.textMuted, fontSize: 10 }} stroke={COLORS.border} />
              <YAxis tick={{ fill: COLORS.textMuted, fontSize: 10 }} stroke={COLORS.border} />
              <Tooltip {...getTT()} />
              <Legend wrapperStyle={{ fontSize: 10, color: COLORS.textDim, paddingTop: 4 }} iconSize={10} payload={[{ value: 'Actual', type: 'line', color: COLORS.blue }, { value: 'Expected', type: 'line', color: COLORS.amber }, { value: '±15% band', type: 'rect', color: `${COLORS.amber}30` }, { value: 'Linear', type: 'line', color: COLORS.textMuted }]} />
              <ReferenceLine y={D.targets.activations} stroke={COLORS.green} strokeDasharray="4 4" label={{ value: `${D.targets.activations} target`, fill: COLORS.green, fontSize: 9, position: 'right' }} />
              <Area type="monotone" dataKey="exp_upper" stroke="none" fill={COLORS.amber} fillOpacity={0.12} isAnimationActive={false} />
              <Area type="monotone" dataKey="exp_lower" stroke="none" fill={COLORS.bg} fillOpacity={1} isAnimationActive={false} />
              <Line type="monotone" dataKey="cum_acts" stroke={COLORS.blue} strokeWidth={2.5} dot={false} name="Actual" />
              <Line type="monotone" dataKey="expected" stroke={COLORS.amber} strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="Expected" />
              <Line type="monotone" dataKey="linear" stroke={COLORS.textMuted} strokeWidth={1} strokeDasharray="3 3" dot={false} name="Linear" />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle icon={Heart}>Care Code Curve</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={codeChart}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="day" tick={{ fill: COLORS.textMuted, fontSize: 10 }} stroke={COLORS.border} />
              <YAxis tick={{ fill: COLORS.textMuted, fontSize: 10 }} stroke={COLORS.border} />
              <Tooltip {...getTT()} />
              <Legend wrapperStyle={{ fontSize: 10, color: COLORS.textDim, paddingTop: 4 }} iconSize={10} payload={[{ value: 'Actual', type: 'line', color: COLORS.green }, { value: 'Expected', type: 'line', color: COLORS.amber }, { value: '±15% band', type: 'rect', color: `${COLORS.amber}30` }, { value: 'Linear', type: 'line', color: COLORS.textMuted }]} />
              <ReferenceLine y={D.targets.care_codes} stroke={COLORS.green} strokeDasharray="4 4" label={{ value: `${fmt(D.targets.care_codes)} target`, fill: COLORS.green, fontSize: 9, position: 'right' }} />
              <Area type="monotone" dataKey="exp_upper" stroke="none" fill={COLORS.amber} fillOpacity={0.12} isAnimationActive={false} />
              <Area type="monotone" dataKey="exp_lower" stroke="none" fill={COLORS.bg} fillOpacity={1} isAnimationActive={false} />
              <Line type="monotone" dataKey="actual" stroke={COLORS.green} strokeWidth={2.5} dot={false} name="Actual" />
              <Line type="monotone" dataKey="expected" stroke={COLORS.amber} strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="Expected" />
              <Line type="monotone" dataKey="linear" stroke={COLORS.textMuted} strokeWidth={1} strokeDasharray="3 3" dot={false} name="Linear" />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 12 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <SectionTitle icon={BarChart3}>Daily Activations</SectionTitle>
            <Gauge value={Math.round(today.cum_acts / D.targets.activations * 100)} label="MTD Pace" thresholds={[70, 85, 95]} />
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={D.march_daily}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="day" tick={{ fill: COLORS.textMuted, fontSize: 9 }} stroke={COLORS.border} />
              <YAxis tick={{ fill: COLORS.textMuted, fontSize: 9 }} stroke={COLORS.border} />
              <Tooltip {...getTT()} />
              <ReferenceLine y={Math.round(D.targets.activations / 31)} stroke={COLORS.amber} strokeDasharray="4 4" label={{ value: `${Math.round(D.targets.activations / 31)}/day target`, fill: COLORS.amber, fontSize: 9, position: 'right' }} />
              <Legend wrapperStyle={{ fontSize: 10, color: COLORS.textDim, paddingTop: 4 }} iconSize={10} payload={[{ value: 'Above pace', type: 'rect', color: COLORS.green }, { value: 'Below pace', type: 'rect', color: COLORS.red }, { value: 'Daily target', type: 'plainline', color: COLORS.amber, payload: { strokeDasharray: '4 4' } }]} />
              <Bar dataKey="daily_acts" name="Activations" radius={[3, 3, 0, 0]}>
                {D.march_daily.map((d, i) => (
                  <Cell key={i} fill={d.daily_acts >= Math.round(D.targets.activations / 31) ? COLORS.green : COLORS.red} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <SectionTitle icon={Activity}>Monitoring</SectionTitle>
            <Gauge value={Math.round(mRate)} label="Rate" thresholds={[70, 80, 95]} />
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={D.march_daily.filter(d => d.dow < 5).map((d, i) => ({
              ...d,
              rpm_rate: +(d.monitoring_rate + 6.5 + Math.sin(i * 1.9) * 1.2).toFixed(1),
              ccm_rate: +(d.monitoring_rate - 4.8 + Math.sin(i * 2.3 + 1) * 1.5).toFixed(1),
              apcm_rate: +(d.monitoring_rate - 14.2 + Math.sin(i * 1.7 + 2) * 2.0).toFixed(1),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="day" tick={{ fill: COLORS.textMuted, fontSize: 9 }} stroke={COLORS.border} />
              <YAxis tick={{ fill: COLORS.textMuted, fontSize: 9 }} stroke={COLORS.border} domain={[50, 100]} />
              <Tooltip {...getTT()} />
              <Legend wrapperStyle={{ fontSize: 10, color: COLORS.textDim, paddingTop: 4 }} iconSize={10} payload={[
                { value: 'Total', type: 'line', color: COLORS.cyan },
                { value: 'RPM', type: 'line', color: COLORS.blue },
                { value: 'CCM', type: 'line', color: COLORS.green },
                { value: 'APCM', type: 'line', color: COLORS.purple },
                { value: 'Target (80%)', type: 'plainline', color: COLORS.amber, payload: { strokeDasharray: '4 4' } },
              ]} />
              <ReferenceLine y={D.targets.monitoring_rate} stroke={COLORS.amber} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="monitoring_rate" stroke={COLORS.cyan} strokeWidth={2.5} dot={false} name="Total" />
              <Line type="monotone" dataKey="rpm_rate" stroke={COLORS.blue} strokeWidth={1.5} dot={false} name="RPM" />
              <Line type="monotone" dataKey="ccm_rate" stroke={COLORS.green} strokeWidth={1.5} dot={false} name="CCM" />
              <Line type="monotone" dataKey="apcm_rate" stroke={COLORS.purple} strokeWidth={1.5} dot={false} name="APCM" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

/* ===== PHASE 2: GROWTH PIPELINE ===== */
const GrowthPipeline = () => {
  const f = D.funnel;
  const maxVal = f.contracted;
  const eligGaps = [
    { label: 'Diagnosis Gap', value: f.gap_diag, color: '#ef4444' },
    { label: 'Insurance Gap', value: f.gap_ins, color: '#f59e0b' },
    { label: 'Provider Gap', value: f.gap_prov, color: '#8b5cf6' },
    { label: 'Diag+Ins Gap', value: f.gap_diag_ins, color: '#ec4899' },
    { label: 'Pediatric', value: f.gap_pediatric, color: '#64748b' },
  ];
  const mktGaps = [
    { label: 'Restricted', value: f.gap_restricted, color: '#ef4444' },
    { label: 'Awaiting BI', value: f.gap_awaiting_bi, color: '#f59e0b' },
    { label: 'Not Interested', value: f.gap_not_interested, color: '#8b5cf6' },
  ];
  const devicePipeline = [
    { label: 'Awaiting Shipment', value: f.awaiting_shipment, color: COLORS.amber, avgDays: 2.1, sla: 3 },
    { label: 'Awaiting Delivery', value: f.awaiting_delivery, color: COLORS.cyan, avgDays: 3.4, sla: 5 },
    { label: 'Awaiting Activation', value: f.awaiting_activation, color: COLORS.purple, avgDays: 4.8, sla: 7 },
    { label: 'Awaiting Onboarding', value: f.awaiting_onboarding, color: COLORS.pink, avgDays: 1.6, sla: 3 },
  ];

  const eligWaterfall = (() => {
    let running = f.contracted;
    const otherGap = f.contracted - eligGaps.reduce((s, g) => s + g.value, 0) - f.eligible;
    const allGaps = [...eligGaps, ...(otherGap > 0 ? [{ label: 'Other', value: otherGap, color: COLORS.textMuted }] : [])];
    const rows = [{ name: 'Contracted', base: 0, delta: f.contracted, color: COLORS.blue, isTotal: true }];
    allGaps.forEach(g => {
      running -= g.value;
      rows.push({ name: g.label, base: running, delta: g.value, color: g.color, isTotal: false });
    });
    rows.push({ name: 'Eligible', base: 0, delta: f.eligible, color: COLORS.cyan, isTotal: true });
    return rows;
  })();

  const mktWaterfall = (() => {
    let running = f.eligible;
    const otherGap = f.eligible - mktGaps.reduce((s, g) => s + g.value, 0) - f.marketable;
    const allGaps = [...mktGaps, ...(otherGap > 0 ? [{ label: 'Other', value: otherGap, color: COLORS.textMuted }] : [])];
    const rows = [{ name: 'Eligible', base: 0, delta: f.eligible, color: COLORS.cyan, isTotal: true }];
    allGaps.forEach(g => {
      running -= g.value;
      rows.push({ name: g.label, base: running, delta: g.value, color: g.color, isTotal: false });
    });
    rows.push({ name: 'Marketable', base: 0, delta: f.marketable, color: COLORS.purple, isTotal: true });
    return rows;
  })();

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 12, marginBottom: 12 }}>
        <Card>
          <SectionTitle icon={TrendingUp}>Acquisition Funnel</SectionTitle>
          <FunnelBar label="Contracted" value={f.contracted} maxValue={maxVal} color={COLORS.blue} owner="Partner" />
          <FunnelBar label="Eligible" value={f.eligible} maxValue={maxVal} color={COLORS.cyan} owner="Shared" sub={`CR1: ${pct(f.eligible, f.contracted)}%`} />
          <FunnelBar label="Marketable" value={f.marketable} maxValue={maxVal} color={COLORS.purple} owner="Brook" sub={`CR2: ${pct(f.marketable, f.eligible)}%`} />
          <FunnelBar label="In Campaign" value={f.in_campaign} maxValue={maxVal} color={COLORS.indigo} owner="Brook" sub={`CR3: ${pct(f.in_campaign, f.marketable)}%`} />
          <FunnelBar label="Active" value={f.active} maxValue={maxVal} color={COLORS.green} owner="Brook" sub={`CR4: ${pct(f.active, f.in_campaign)}%`} />
          {(() => {
            const cr1 = f.eligible / f.contracted;
            const cr2 = f.marketable / f.eligible;
            const cr3 = f.in_campaign / f.marketable;
            const cr4 = f.active / f.in_campaign;
            const baseline = cr1 * cr2 * cr3 * cr4;
            const improved = (cr1 + 0.05) * (cr2 + 0.05) * (cr3 + 0.05) * (cr4 + 0.05);
            const lift = ((improved / baseline - 1) * 100).toFixed(1);
            const improvedActs = Math.round(f.contracted * improved);
            return (
              <div style={{ marginTop: 12, padding: '8px 10px', background: `${COLORS.blue}10`, borderRadius: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.blue, marginBottom: 6 }}>Π Compound Impact — +5pt per stage</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '2px 12px', fontSize: 10 }}>
                  <span style={{ color: COLORS.textMuted }}></span>
                  <span style={{ color: COLORS.textMuted, fontWeight: 600 }}>Baseline</span>
                  <span style={{ color: COLORS.green, fontWeight: 600 }}>+5pt each</span>
                  {[['CR1 (C→E)', cr1], ['CR2 (E→M)', cr2], ['CR3 (M→C)', cr3], ['CR4 (C→A)', cr4]].map(([label, val]) => (
                    <React.Fragment key={label}>
                      <span style={{ color: COLORS.textDim }}>{label}</span>
                      <span style={{ color: COLORS.text }}>{(val * 100).toFixed(1)}%</span>
                      <span style={{ color: COLORS.green }}>{((val + 0.05) * 100).toFixed(1)}%</span>
                    </React.Fragment>
                  ))}
                  <span style={{ color: COLORS.textDim, borderTop: `1px solid ${COLORS.border}`, paddingTop: 3 }}>End-to-end</span>
                  <span style={{ color: COLORS.text, fontWeight: 600, borderTop: `1px solid ${COLORS.border}`, paddingTop: 3 }}>{(baseline * 100).toFixed(2)}%</span>
                  <span style={{ color: COLORS.green, fontWeight: 600, borderTop: `1px solid ${COLORS.border}`, paddingTop: 3 }}>{(improved * 100).toFixed(2)}% (+{lift}%)</span>
                </div>
                <div style={{ marginTop: 4, fontSize: 10, color: COLORS.textDim }}>
                  Projected activations: {f.active.toLocaleString()} → <span style={{ color: COLORS.green, fontWeight: 600 }}>{improvedActs.toLocaleString()}</span> (+{(improvedActs - f.active).toLocaleString()})
                </div>
              </div>
            );
          })()}
        </Card>
        <Card>
          <SectionTitle icon={AlertTriangle}>Gap / Leakage Analysis</SectionTitle>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 8, fontWeight: 600 }}>CONTRACTED → ELIGIBLE GAPS</div>
          <ResponsiveContainer width="100%" height={eligWaterfall.length * 28 + 4}>
            <BarChart layout="vertical" data={eligWaterfall} barSize={16} margin={{ top: 2, right: 95, left: 0, bottom: 2 }}>
              <XAxis type="number" hide domain={[0, 'dataMax']} />
              <YAxis type="category" dataKey="name" tick={{ fill: COLORS.textDim, fontSize: 10 }} width={90} axisLine={false} tickLine={false} />
              <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
              <Bar dataKey="delta" stackId="w" isAnimationActive={false} radius={[0, 3, 3, 0]}>
                {eligWaterfall.map((d, i) => <Cell key={i} fill={d.color} opacity={d.isTotal ? 1 : 0.85} />)}
                <LabelList content={({ x, y, width, height, index }) => {
                  const d = eligWaterfall[index];
                  const pctStr = d.isTotal ? '' : `  -${(d.delta / f.contracted * 100).toFixed(1)}%`;
                  return (
                    <text key={index} x={x + width + 6} y={y + height / 2} dominantBaseline="middle" fill={d.isTotal ? COLORS.text : d.color} fontSize={10} fontWeight={600}>
                      {fmt(d.delta)}{pctStr}
                    </text>
                  );
                }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 8, marginTop: 12, fontWeight: 600 }}>ELIGIBLE → MARKETABLE GAPS</div>
          <ResponsiveContainer width="100%" height={mktWaterfall.length * 28 + 4}>
            <BarChart layout="vertical" data={mktWaterfall} barSize={16} margin={{ top: 2, right: 95, left: 0, bottom: 2 }}>
              <XAxis type="number" hide domain={[0, 'dataMax']} />
              <YAxis type="category" dataKey="name" tick={{ fill: COLORS.textDim, fontSize: 10 }} width={90} axisLine={false} tickLine={false} />
              <Bar dataKey="base" stackId="w2" fill="transparent" isAnimationActive={false} />
              <Bar dataKey="delta" stackId="w2" isAnimationActive={false} radius={[0, 3, 3, 0]}>
                {mktWaterfall.map((d, i) => <Cell key={i} fill={d.color} opacity={d.isTotal ? 1 : 0.85} />)}
                <LabelList content={({ x, y, width, height, index }) => {
                  const d = mktWaterfall[index];
                  const pctStr = d.isTotal ? '' : `  -${(d.delta / f.eligible * 100).toFixed(1)}%`;
                  return (
                    <text key={index} x={x + width + 6} y={y + height / 2} dominantBaseline="middle" fill={d.isTotal ? COLORS.text : d.color} fontSize={10} fontWeight={600}>
                      {fmt(d.delta)}{pctStr}
                    </text>
                  );
                }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 8, marginTop: 12, fontWeight: 600 }}>MARKETABLE → IN CAMPAIGN</div>
          {(() => {
            const gap = f.marketable - f.in_campaign;
            const bands = [
              { label: 'High (>30%)', value: Math.round(gap * 0.35), color: COLORS.green },
              { label: 'Medium (10–30%)', value: Math.round(gap * 0.40), color: COLORS.amber },
              { label: 'Low (<10%)', value: gap - Math.round(gap * 0.35) - Math.round(gap * 0.40), color: COLORS.red },
            ];
            return bands.map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: b.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: COLORS.textDim, flex: 1 }}>{b.label}</span>
                <span style={{ fontSize: 10, color: COLORS.text, fontWeight: 600 }}>{b.value.toLocaleString()}</span>
                <div style={{ width: 60, height: 6, borderRadius: 3, background: COLORS.border }}>
                  <div style={{ height: '100%', borderRadius: 3, background: b.color, width: `${Math.min(100, b.value / gap * 100)}%` }} />
                </div>
              </div>
            ));
          })()}
          <div style={{ marginTop: 6, fontSize: 10, color: COLORS.textMuted }}>
            Not in campaign: {(f.marketable - f.in_campaign).toLocaleString()} ({pct(f.marketable - f.in_campaign, f.marketable)}% of marketable)
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 12 }}>
        <Card>
          <SectionTitle icon={Clock}>Device Pipeline (Δt Compression)</SectionTitle>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {devicePipeline.map(s => {
              const slaColor = s.avgDays <= s.sla * 0.7 ? COLORS.green : s.avgDays <= s.sla ? COLORS.amber : COLORS.red;
              return (
                <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: 10, background: `${s.color}15`, borderRadius: 8, border: `1px solid ${s.color}30` }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 9, marginTop: 4, color: slaColor, fontWeight: 600 }}>
                    {s.avgDays}d avg <span style={{ fontSize: 8, color: COLORS.textMuted }}>/ {s.sla}d SLA</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            {devicePipeline.map((s, i) => (
              <React.Fragment key={i}>
                <div style={{ padding: '3px 8px', borderRadius: 4, background: `${s.color}20`, color: s.color, fontSize: 9, fontWeight: 600 }}>{s.value}</div>
                {i < devicePipeline.length - 1 && <ChevronRight size={12} color={COLORS.textMuted} />}
              </React.Fragment>
            ))}
            <ChevronRight size={12} color={COLORS.textMuted} />
            <div style={{ padding: '3px 8px', borderRadius: 4, background: `${COLORS.green}20`, color: COLORS.green, fontSize: 9, fontWeight: 600 }}>Activated</div>
          </div>
        </Card>
        <Card>
          <SectionTitle icon={TrendingUp}>Monthly Funnel Trend</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={D.active_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="month" tick={{ fill: COLORS.textMuted, fontSize: 9 }} stroke={COLORS.border} />
              <YAxis tick={{ fill: COLORS.textMuted, fontSize: 9 }} stroke={COLORS.border} />
              <Tooltip {...getTT()} />
              <Bar dataKey="activations" fill={COLORS.green} name="Activations" radius={[3, 3, 0, 0]} />
              <Bar dataKey="churn" fill={COLORS.red} name="Churn" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{ marginTop: 12 }}>
        <Card>
          <SectionTitle icon={Clock}>Device Pipeline Trend (7-month)</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={dailyDetail.map(d => ({ date: d.date.slice(5), Shipment: d.awaiting_shipment, Delivery: d.awaiting_delivery, Activation: d.awaiting_activation }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="date" tick={{ fill: COLORS.textMuted, fontSize: 9 }} stroke={COLORS.border} interval={29} />
              <YAxis tick={{ fill: COLORS.textMuted, fontSize: 9 }} stroke={COLORS.border} />
              <Tooltip {...getTT()} />
              <Legend wrapperStyle={{ fontSize: 10, color: COLORS.textDim, paddingTop: 4 }} iconSize={10} payload={[{ value: 'Shipment', type: 'rect', color: COLORS.amber }, { value: 'Delivery', type: 'rect', color: COLORS.cyan }, { value: 'Activation', type: 'rect', color: COLORS.purple }]} />
              <Area type="monotone" dataKey="Shipment" stackId="pipe" fill={COLORS.amber} stroke={COLORS.amber} fillOpacity={0.7} />
              <Area type="monotone" dataKey="Delivery" stackId="pipe" fill={COLORS.cyan} stroke={COLORS.cyan} fillOpacity={0.7} />
              <Area type="monotone" dataKey="Activation" stackId="pipe" fill={COLORS.purple} stroke={COLORS.purple} fillOpacity={0.7} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

/* ===== PHASE 2: CARE DELIVERY ===== */
const CareDelivery = () => {
  const f = D.funnel;
  const codeMix = D.monthly.map(m => ({
    month: m.month.slice(5),
    RPM: m.rpm_codes, CCM: m.ccm_codes, APCM: m.apcm_codes,
  }));
  const modulesData = [
    { name: 'RPM', value: f.rpm_active, color: COLORS.blue },
    { name: 'CCM', value: f.ccm_active, color: COLORS.green },
    { name: 'PCM', value: f.pcm_active, color: COLORS.purple },
    { name: 'APCM', value: f.apcm_active, color: COLORS.cyan },
  ];

  const paceMap = Object.fromEntries(D.expected_pace.map(p => [p.day, p]));
  const dailyCodeData = D.march_daily.map(d => {
    const ep = paceMap[d.day]?.code_expected || 0;
    const epPrev = paceMap[d.day - 1]?.code_expected || 0;
    const dailyExp = Math.max(0, ep - epPrev);
    const total = d.daily_rpm + d.daily_ccm + d.daily_apcm;
    const variance = total - dailyExp;
    return {
      day: d.day,
      RPM: d.daily_rpm,
      CCM: d.daily_ccm,
      APCM: d.daily_apcm,
      expected: dailyExp,
      errorY: [Math.max(0, variance), Math.max(0, -variance)],
    };
  });

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 12, marginBottom: 12 }}>
        <Card>
          <SectionTitle icon={Heart}>Care Code Mix (Monthly)</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={codeMix}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="month" tick={{ fill: COLORS.textMuted, fontSize: 10 }} stroke={COLORS.border} />
              <YAxis tick={{ fill: COLORS.textMuted, fontSize: 10 }} stroke={COLORS.border} />
              <Tooltip {...getTT()} />
              <Area type="monotone" dataKey="RPM" stackId="1" fill={COLORS.blue} stroke={COLORS.blue} fillOpacity={0.6} />
              <Area type="monotone" dataKey="CCM" stackId="1" fill={COLORS.green} stroke={COLORS.green} fillOpacity={0.6} />
              <Area type="monotone" dataKey="APCM" stackId="1" fill={COLORS.cyan} stroke={COLORS.cyan} fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle icon={Activity}>Active Modules</SectionTitle>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie data={modulesData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                  {modulesData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip {...getTT()} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {modulesData.map(m => (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
                  <span style={{ fontSize: 11, color: COLORS.textDim, flex: 1 }}>{m.name}</span>
                  <span style={{ fontSize: 11, color: COLORS.text, fontWeight: 600 }}>{m.value.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${COLORS.border}`, fontSize: 10, color: COLORS.textMuted }}>
                Modules/patient: {((f.rpm_active + f.ccm_active + f.pcm_active + f.apcm_active) / f.active).toFixed(2)}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Card>
          <SectionTitle icon={Heart}>Daily Care Codes by Type</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={dailyCodeData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="day" tick={{ fill: COLORS.textMuted, fontSize: 9 }} stroke={COLORS.border} />
              <YAxis tick={{ fill: COLORS.textMuted, fontSize: 9 }} stroke={COLORS.border} />
              <Tooltip {...getTT()} />
              <Legend wrapperStyle={{ fontSize: 10, color: COLORS.textDim, paddingTop: 4 }} iconSize={10} payload={[
                { value: 'RPM', type: 'rect', color: COLORS.blue },
                { value: 'CCM', type: 'rect', color: COLORS.green },
                { value: 'APCM', type: 'rect', color: COLORS.cyan },
                { value: 'Expected', type: 'plainline', color: COLORS.amber, payload: { strokeDasharray: '4 4' } },
                { value: 'Variance', type: 'line', color: COLORS.amber },
              ]} />
              <Bar dataKey="RPM" stackId="codes" fill={COLORS.blue} />
              <Bar dataKey="CCM" stackId="codes" fill={COLORS.green} />
              <Bar dataKey="APCM" stackId="codes" fill={COLORS.cyan} radius={[2, 2, 0, 0]}>
                <ErrorBar dataKey="errorY" direction="y" width={4} strokeWidth={1.5} stroke={COLORS.amber} />
              </Bar>
              <Line type="monotone" dataKey="expected" stroke={COLORS.amber} strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Expected" />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 12 }}>
        <Card>
          <SectionTitle icon={Activity}>Monitoring Daily (Weekdays)</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={D.march_daily.filter(d => d.dow < 5)}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="day" tick={{ fill: COLORS.textMuted, fontSize: 9 }} stroke={COLORS.border} />
              <YAxis yAxisId="l" tick={{ fill: COLORS.textMuted, fontSize: 9 }} stroke={COLORS.border} />
              <YAxis yAxisId="r" orientation="right" tick={{ fill: COLORS.textMuted, fontSize: 9 }} stroke={COLORS.border} />
              <Tooltip {...getTT()} />
              <Bar yAxisId="l" dataKey="monitored" fill={COLORS.cyan} name="Monitored" radius={[2, 2, 0, 0]} opacity={0.5} />
              <Line yAxisId="r" type="monotone" dataKey="monitoring_rate" stroke={COLORS.amber} strokeWidth={2} dot={false} name="Rate %" />
              <ReferenceLine yAxisId="r" y={D.targets.monitoring_rate} stroke={COLORS.red} strokeDasharray="4 4" />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle icon={DollarSign}>Daily Revenue Proxy</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={D.march_daily.filter(d => d.dow < 5)}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="day" tick={{ fill: COLORS.textMuted, fontSize: 9 }} stroke={COLORS.border} />
              <YAxis tick={{ fill: COLORS.textMuted, fontSize: 9 }} stroke={COLORS.border} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...getTT()} formatter={v => `$${v.toLocaleString()}`} />
              <Bar dataKey="daily_revenue" name="Revenue" radius={[3, 3, 0, 0]}>
                {D.march_daily.filter(d => d.dow < 5).map((d, i) => <Cell key={i} fill={d.daily_revenue > 10000 ? COLORS.green : COLORS.amber} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

/* ===== PHASE 2: PROGRAM ADOPTION ===== */
const ProgramAdoption = () => {
  const f = D.funnel;
  const progSpark = (field, color) => dailyDetail.map(d => ({ value: d[field], color }));
  const programs = [
    { name: 'Hypertension', abbr: 'HTN', enrolled: f.htn, color: COLORS.blue, pct: pct(f.htn, f.active), spark: progSpark('htn_enrolled', COLORS.blue) },
    { name: 'Diabetes', abbr: 'DM', enrolled: f.dm, color: COLORS.green, pct: pct(f.dm, f.active), spark: progSpark('dm_enrolled', COLORS.green) },
    { name: 'Brain Health', abbr: 'BH', enrolled: f.bh, color: COLORS.purple, pct: pct(f.bh, f.active), spark: progSpark('bh_enrolled', COLORS.purple) },
    { name: 'DPP', abbr: 'DPP', enrolled: f.dpp, color: COLORS.cyan, pct: pct(f.dpp, f.active), spark: progSpark('dpp_enrolled', COLORS.cyan) },
  ];
  const churnData = Object.entries(D.churn).map(([k, v]) => ({ name: k, value: v }));
  const churnColors = [COLORS.red, COLORS.amber, COLORS.pink, COLORS.green, COLORS.textMuted, COLORS.purple];
  const churnFields = [
    { key: 'Not Interested', field: 'rem_not_interested', color: COLORS.red },
    { key: 'Non-Compliance', field: 'rem_non_compliance', color: COLORS.amber },
    { key: 'High Copay', field: 'rem_high_copay', color: COLORS.pink },
    { key: 'Goals Met', field: 'rem_goals_met', color: COLORS.green },
    { key: 'Deceased', field: 'rem_deceased', color: COLORS.textMuted },
    { key: 'Other', field: 'rem_other', color: COLORS.purple },
  ];
  const churnByDay = dailyDetail.map(d => {
    const row = { date: d.date.slice(5) };
    churnFields.forEach(f => { row[f.key] = d[f.field]; });
    return row;
  });

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Card>
          <SectionTitle icon={TrendingDown}>Daily Churn by Reason (7-month trend)</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={churnByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="date" tick={{ fill: COLORS.textMuted, fontSize: 9 }} stroke={COLORS.border} interval={29} />
              <YAxis tick={{ fill: COLORS.textMuted, fontSize: 9 }} stroke={COLORS.border} />
              <Tooltip {...getTT()} />
              <Legend wrapperStyle={{ fontSize: 10, color: COLORS.textDim, paddingTop: 4 }} iconSize={10} payload={churnFields.map(f => ({ value: f.key, type: 'rect', color: f.color }))} />
              {churnFields.map(f => (
                <Area key={f.key} type="monotone" dataKey={f.key} stackId="churn" fill={f.color} stroke={f.color} fillOpacity={0.7} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 12, marginBottom: 12 }}>
        <Card>
          <SectionTitle icon={Heart}>Program Enrollment</SectionTitle>
          {programs.map(p => (
            <div key={p.abbr} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                <span style={{ color: COLORS.textDim }}>{p.name} ({p.abbr})</span>
                <span style={{ color: COLORS.text, fontWeight: 600 }}>{p.enrolled.toLocaleString()} <span style={{ color: p.color, fontSize: 10 }}>({p.pct}%)</span></span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1, height: 16, borderRadius: 4, background: COLORS.border }}>
                  <div style={{ height: '100%', borderRadius: 4, background: p.color, width: `${p.pct}%`, transition: 'width 0.5s' }} />
                </div>
                <div style={{ width: 60 }}><Sparkline data={p.spark} /></div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, padding: '8px 10px', background: `${COLORS.purple}10`, borderRadius: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>Programs per patient (A2P density)</span>
            <span style={{ fontSize: 12, color: COLORS.purple, fontWeight: 700 }}>{f.programs_per_patient}</span>
          </div>
        </Card>
        <Card>
          <SectionTitle icon={TrendingDown}>Churn Analysis (March MTD)</SectionTitle>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie data={churnData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {churnData.map((d, i) => <Cell key={i} fill={churnColors[i]} />)}
                </Pie>
                <Tooltip {...getTT()} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {churnData.map((d, i) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: churnColors[i] }} />
                  <span style={{ fontSize: 10, color: COLORS.textDim, flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: 10, color: COLORS.text, fontWeight: 600 }}>{d.value}</span>
                </div>
              ))}
              <div style={{ marginTop: 8, paddingTop: 6, borderTop: `1px solid ${COLORS.border}`, fontSize: 11 }}>
                <span style={{ color: COLORS.textMuted }}>Total: </span>
                <span style={{ color: COLORS.red, fontWeight: 700 }}>{churnData.reduce((s, d) => s + d.value, 0)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle icon={Users}>Installed Base Trend</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={D.active_trend}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis dataKey="month" tick={{ fill: COLORS.textMuted, fontSize: 10 }} stroke={COLORS.border} />
            <YAxis yAxisId="l" tick={{ fill: COLORS.textMuted, fontSize: 10 }} stroke={COLORS.border} />
            <YAxis yAxisId="r" orientation="right" tick={{ fill: COLORS.textMuted, fontSize: 10 }} stroke={COLORS.border} />
            <Tooltip {...getTT()} />
            <Area yAxisId="l" type="monotone" dataKey="active" fill={`${COLORS.blue}30`} stroke={COLORS.blue} strokeWidth={2} name="Active" />
            <Bar yAxisId="r" dataKey="net" name="Net Growth" radius={[3, 3, 0, 0]}>
              {D.active_trend.map((d, i) => <Cell key={i} fill={d.net >= 0 ? COLORS.green : COLORS.red} />)}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4 }}>
          <Gauge value={Math.round((1 - D.active_trend[D.active_trend.length - 1].churn / D.active_trend[D.active_trend.length - 2].active) * 1000) / 10} label="Monthly Retention" thresholds={[90, 95, 98]} />
          <Gauge value={Math.round(D.march_daily.slice(-1)[0]?.monitoring_rate || 78)} label="Monitoring Rate" thresholds={[70, 80, 90]} />
        </div>
      </Card>
    </div>
  );
};

/* ===== PHASE 3: REVENUE ANALYTICS ===== */
const RevenueAnalytics = () => {
  const revTrend = D.monthly.map(m => ({
    month: m.month.slice(5),
    revenue: m.revenue,
    rev_per_patient: Math.round(m.revenue / m.active),
    rpm_rev: Math.round(m.rpm_codes * D.rates.rpm),
    ccm_rev: Math.round(m.ccm_codes * D.rates.ccm),
    apcm_rev: Math.round(m.apcm_codes * D.rates.apcm),
  }));
  const unitEcon = D.monthly.map(m => ({
    month: m.month.slice(5),
    rpm_per: Math.round(m.rpm_codes / m.active * D.rates.rpm * 10) / 10,
    ccm_per: Math.round(m.ccm_codes / m.active * D.rates.ccm * 10) / 10,
    apcm_per: Math.round(m.apcm_codes / m.active * D.rates.apcm * 10) / 10,
  }));
  const lastMo = D.monthly[D.monthly.length - 1];
  const arr = lastMo.revenue * 12;
  const avgRetention = D.active_trend.slice(1).reduce((s, m, i) => s + (1 - m.churn / D.active_trend[i].active), 0) / (D.active_trend.length - 1);
  const avgLifetimeYears = Math.round((1 / (1 - avgRetention)) / 12 * 10) / 10;
  const plv = Math.round(arr * avgLifetimeYears);
  const nrr = Math.round((D.active_trend[D.active_trend.length - 1].active / D.active_trend[D.active_trend.length - 2].active) * 1000) / 10;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Monthly Revenue', value: fmtD(lastMo.revenue), sub: 'Mar MTD', color: COLORS.green },
          { label: 'ARR (annualized)', value: fmtD(arr), sub: '12× current', color: COLORS.blue },
          { label: 'PLV (est.)', value: fmtD(plv), sub: `${avgLifetimeYears}yr avg lifetime`, color: COLORS.purple },
          { label: 'NRR', value: `${nrr}%`, sub: nrr >= 100 ? 'Expansion > churn' : 'Churn > expansion', color: COLORS.cyan },
          { label: 'Rev / Patient', value: fmtD(Math.round(lastMo.revenue / lastMo.active)), sub: 'Monthly', color: COLORS.amber },
        ].map(k => (
          <div key={k.label} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ color: COLORS.textMuted, fontSize: 9, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.color, marginTop: 4 }}>{k.value}</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 12, marginBottom: 12 }}>
        <Card>
          <SectionTitle icon={DollarSign}>Revenue Trend</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={revTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="month" tick={{ fill: COLORS.textMuted, fontSize: 10 }} stroke={COLORS.border} />
              <YAxis tick={{ fill: COLORS.textMuted, fontSize: 10 }} stroke={COLORS.border} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...getTT()} formatter={v => `$${v.toLocaleString()}`} />
              <Area type="monotone" dataKey="revenue" fill={`${COLORS.green}20`} stroke={COLORS.green} strokeWidth={2} name="Total Revenue" />
              <Line type="monotone" dataKey="rev_per_patient" stroke={COLORS.amber} strokeWidth={2} dot={false} name="Rev/Patient" />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle icon={BarChart3}>Service Mix (Revenue)</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="month" tick={{ fill: COLORS.textMuted, fontSize: 10 }} stroke={COLORS.border} />
              <YAxis tick={{ fill: COLORS.textMuted, fontSize: 10 }} stroke={COLORS.border} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...getTT()} formatter={v => `$${v.toLocaleString()}`} />
              <Area type="monotone" dataKey="rpm_rev" stackId="1" fill={COLORS.blue} stroke={COLORS.blue} fillOpacity={0.7} name="RPM" />
              <Area type="monotone" dataKey="ccm_rev" stackId="1" fill={COLORS.green} stroke={COLORS.green} fillOpacity={0.7} name="CCM" />
              <Area type="monotone" dataKey="apcm_rev" stackId="1" fill={COLORS.cyan} stroke={COLORS.cyan} fillOpacity={0.7} name="APCM" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <SectionTitle icon={TrendingUp}>Unit Economics (Rev/Patient by Module)</SectionTitle>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={unitEcon}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis dataKey="month" tick={{ fill: COLORS.textMuted, fontSize: 10 }} stroke={COLORS.border} />
            <YAxis tick={{ fill: COLORS.textMuted, fontSize: 10 }} stroke={COLORS.border} tickFormatter={v => `$${v}`} />
            <Tooltip {...getTT()} formatter={v => `$${v}`} />
            <Line type="monotone" dataKey="rpm_per" stroke={COLORS.blue} strokeWidth={2} name="RPM $/patient" />
            <Line type="monotone" dataKey="ccm_per" stroke={COLORS.green} strokeWidth={2} name="CCM $/patient" />
            <Line type="monotone" dataKey="apcm_per" stroke={COLORS.cyan} strokeWidth={2} name="APCM $/patient" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ marginTop: 12 }}>
        <Card>
          <SectionTitle icon={DollarSign}>Revenue by Program (estimated)</SectionTitle>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 10 }}>Allocated proportionally by enrollment share</div>
          {(() => {
            const f = D.funnel;
            const totalEnrolled = f.htn + f.dm + f.bh + f.dpp;
            const progs = [
              { name: 'Hypertension (HTN)', enrolled: f.htn, color: COLORS.blue },
              { name: 'Diabetes (DM)', enrolled: f.dm, color: COLORS.green },
              { name: 'Brain Health (BH)', enrolled: f.bh, color: COLORS.purple },
              { name: 'DPP', enrolled: f.dpp, color: COLORS.cyan },
            ];
            return progs.map(p => {
              const share = p.enrolled / totalEnrolled;
              const rev = Math.round(lastMo.revenue * share);
              return (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: COLORS.textDim, width: 140 }}>{p.name}</span>
                  <div style={{ flex: 1, height: 14, borderRadius: 4, background: COLORS.border }}>
                    <div style={{ height: '100%', borderRadius: 4, background: p.color, width: `${share * 100}%`, transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: 11, color: COLORS.text, fontWeight: 600, width: 60, textAlign: 'right' }}>{fmtD(rev)}</span>
                  <span style={{ fontSize: 10, color: p.color, width: 35, textAlign: 'right' }}>{Math.round(share * 100)}%</span>
                </div>
              );
            });
          })()}
        </Card>
      </div>

      <div style={{ marginTop: 12 }}>
        <Card>
          <SectionTitle icon={TrendingUp}>PLV Sensitivity — Retention Impact</SectionTitle>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 10 }}>How monthly retention rate affects Patient Lifetime Value (based on current ARR of {fmtD(arr)})</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
            {[0.94, 0.95, 0.96, 0.97, 0.98, 0.99].map(r => {
              const ltMonths = 1 / (1 - r);
              const ltYears = Math.round(ltMonths / 12 * 10) / 10;
              const plvAtRate = Math.round(arr * ltYears);
              const isActual = Math.abs(r - avgRetention) < 0.005;
              return (
                <div key={r} style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 6, background: isActual ? `${COLORS.blue}20` : COLORS.card, border: `1px solid ${isActual ? COLORS.blue : COLORS.border}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isActual ? COLORS.blue : COLORS.text }}>{(r * 100).toFixed(0)}%</div>
                  <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 2 }}>{ltYears}yr</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: isActual ? COLORS.blue : COLORS.green, marginTop: 4 }}>{fmtD(plvAtRate)}</div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: COLORS.textDim }}>
            Current avg retention: <span style={{ color: COLORS.blue, fontWeight: 600 }}>{(avgRetention * 100).toFixed(1)}%</span> → {avgLifetimeYears}yr lifetime → PLV {fmtD(plv)}. Each +1pt retention ≈ +{fmtD(Math.round(arr * ((1 / (1 - (avgRetention + 0.01))) / 12 - avgLifetimeYears)))} PLV.
          </div>
        </Card>
      </div>
    </div>
  );
};

/* ===== PHASE N: FUTURE METRICS ===== */
const FutureMetrics = () => {
  const f = D.funnel;

  const pppTrend = dailyDetail.filter((_, i) => i % 5 === 0).map(d => ({
    date: d.date.slice(5),
    value: d.programs_per_patient,
  }));

  const revByProg = D.monthly.map(m => {
    const total = m.active;
    const htnShare = 0.55, dmShare = 0.30, bhShare = 0.10, dppShare = 0.05;
    return {
      month: m.month.slice(5),
      HTN: Math.round(m.revenue * htnShare),
      DM: Math.round(m.revenue * dmShare),
      BH: Math.round(m.revenue * bhShare),
      DPP: Math.round(m.revenue * dppShare),
    };
  });

  const planned = [
    { name: 'Medication Management', icon: Pill, status: 'Planned', desc: 'Module-level tracking for medication adherence, titration events, and pharmacist interactions', metrics: ['Adherence Rate', 'Titration Count', 'PharmD Sessions'] },
    { name: 'Brain Health KPIs', icon: Brain, status: 'Planned', desc: 'Program-specific outcome tracking for cognitive health interventions', metrics: ['Cognitive Assessments', 'BH Session Freq', 'Outcome Scores'] },
    { name: 'Care Team Productivity', icon: Users, status: 'Planned', desc: 'Provider-level capacity metrics: sessions/day, patients/provider, utilization rate', metrics: ['Sessions/Day', 'Patients/FTE', 'Utilization %'] },
    { name: 'Campaign ROI', icon: TrendingUp, status: 'Planned', desc: 'Cost per activation by campaign, enabling optimization of outreach investment', metrics: ['CPA by Campaign', 'Conversion by Channel', 'Campaign ROAS'] },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 12, marginBottom: 12 }}>
        <Card>
          <SectionTitle icon={Heart}>Programs per Patient (A2P Density)</SectionTitle>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: COLORS.purple }}>{f.programs_per_patient}</span>
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>programs / active patient</span>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={pppTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="date" tick={{ fill: COLORS.textMuted, fontSize: 9 }} stroke={COLORS.border} interval={7} />
              <YAxis tick={{ fill: COLORS.textMuted, fontSize: 9 }} stroke={COLORS.border} domain={[0.8, 1.4]} />
              <Tooltip {...getTT()} />
              <ReferenceLine y={1.0} stroke={COLORS.textMuted} strokeDasharray="3 3" />
              <Line type="monotone" dataKey="value" stroke={COLORS.purple} strokeWidth={2} dot={false} name="Progs/Patient" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle icon={DollarSign}>Revenue by Program (Monthly)</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={revByProg}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="month" tick={{ fill: COLORS.textMuted, fontSize: 10 }} stroke={COLORS.border} />
              <YAxis tick={{ fill: COLORS.textMuted, fontSize: 10 }} stroke={COLORS.border} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...getTT()} formatter={v => `$${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 10, color: COLORS.textDim, paddingTop: 4 }} iconSize={10} payload={[
                { value: 'HTN', type: 'rect', color: COLORS.blue },
                { value: 'DM', type: 'rect', color: COLORS.green },
                { value: 'BH', type: 'rect', color: COLORS.purple },
                { value: 'DPP', type: 'rect', color: COLORS.cyan },
              ]} />
              <Area type="monotone" dataKey="HTN" stackId="1" fill={COLORS.blue} stroke={COLORS.blue} fillOpacity={0.7} />
              <Area type="monotone" dataKey="DM" stackId="1" fill={COLORS.green} stroke={COLORS.green} fillOpacity={0.7} />
              <Area type="monotone" dataKey="BH" stackId="1" fill={COLORS.purple} stroke={COLORS.purple} fillOpacity={0.7} />
              <Area type="monotone" dataKey="DPP" stackId="1" fill={COLORS.cyan} stroke={COLORS.cyan} fillOpacity={0.7} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{ padding: '12px 16px', background: `${COLORS.purple}10`, border: `1px solid ${COLORS.purple}30`, borderRadius: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.purple, marginBottom: 4 }}>Future Metrics Roadmap</div>
        <div style={{ fontSize: 10, color: COLORS.textDim, lineHeight: 1.5 }}>
          Planned additions beyond Phase 1–3 scope. These require new data sources not yet available in the prototype.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 10 }}>
        {planned.map(p => (
          <Card key={p.name} style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <p.icon size={16} color={COLORS.purple} />
              <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.text, flex: 1 }}>{p.name}</span>
              <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 8, fontWeight: 600, background: `${COLORS.textMuted}20`, color: COLORS.textMuted }}>Planned</span>
            </div>
            <div style={{ fontSize: 10, color: COLORS.textDim, lineHeight: 1.5, marginBottom: 8 }}>{p.desc}</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {p.metrics.map(m => (
                <span key={m} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: COLORS.border, color: COLORS.textMuted }}>{m}</span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

/* ===== MAIN APP ===== */
const TABS = [
  { id: 'control', label: 'P1 · Control Room' },
  { id: 'growth', label: 'P2 · Growth Pipeline' },
  { id: 'care', label: 'P2 · Care Delivery' },
  { id: 'program', label: 'P2 · Programs & Retention' },
  { id: 'revenue', label: 'P3 · Revenue Analytics' },
  { id: 'future', label: 'PN · Future Metrics' },
];

export default function BrookControlRoom() {
  const [tab, setTab] = useState('control');
  const [dark, setDark] = useState(true);
  COLORS = dark ? COLORS_DARK : COLORS_LIGHT;

  React.useEffect(() => {
    document.body.style.background = COLORS.bg;
  }, [dark]);

  return (
    <div style={{
      background: COLORS.bg, minHeight: '100vh', padding: 16,
      fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: COLORS.text,
    }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={14} color="#fff" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.5px', color: COLORS.text }}>BROOK</span>
          <span style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 500 }}>Control Room</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => setDark(!dark)} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }} aria-label="Toggle theme">
            {dark ? <Sun size={12} color={COLORS.textMuted} /> : <Moon size={12} color={COLORS.textMuted} />}
            <span style={{ fontSize: 9, color: COLORS.textMuted }}>{dark ? 'Light' : 'Dark'}</span>
          </button>
          <span style={{ fontSize: 10, color: COLORS.textMuted }}>Prototype · Real funnel data + synthetic extensions</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, padding: 3, background: COLORS.card, borderRadius: 8, border: `1px solid ${COLORS.border}`, flexWrap: 'wrap' }}>
        {TABS.map(t => <Tab key={t.id} label={t.label} active={tab === t.id} onClick={() => setTab(t.id)} />)}
      </div>

      {/* Content */}
      {tab === 'control' && <ControlRoom />}
      {tab === 'growth' && <GrowthPipeline />}
      {tab === 'care' && <CareDelivery />}
      {tab === 'program' && <ProgramAdoption />}
      {tab === 'revenue' && <RevenueAnalytics />}
      {tab === 'future' && <FutureMetrics />}
    </div>
  );
}
