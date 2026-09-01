import { useState, type ReactNode } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Download, FileText, Calendar, TrendingUp, Users, DollarSign,
  Clock, Target, AlertTriangle, Ticket, UserPlus, Heart, Wallet,
  ArrowUpRight, ArrowDownRight, RefreshCw, BarChart2, Check,
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, ComposedChart,
} from 'recharts';
import { StringDatePicker } from '../../../../ui/CustomDatePicker';

// ── Mock Data ────────────────────────────────────────────────────────────────

// Report 1 — Coupon to Conversion Analysis
const COUPON_MONTHLY = [
  { month: 'Nov', redeemed: 187, converted: 78 },
  { month: 'Dec', redeemed: 241, converted: 104 },
  { month: 'Jan', redeemed: 198, converted: 82 },
  { month: 'Feb', redeemed: 208, converted: 88 },
  { month: 'Mar', redeemed: 237, converted: 97 },
  { month: 'Apr', redeemed: 213, converted: 92 },
];

const TIME_TO_CONVERT = [
  { range: '1–15 days',  count: 97 },
  { range: '16–30 days', count: 184 },
  { range: '31–45 days', count: 152 },
  { range: '46–60 days', count: 65 },
  { range: '61–90 days', count: 43 },
];

const TTConvert_COLORS = ['#93c5fd', '#3b82f6', '#6366f1', '#8b5cf6', '#a78bfa'];

// Report 2 — New Client Performance
const NEW_CLIENT_MONTHLY = [
  { month: 'Nov', clients: 82,  income: 234880 },
  { month: 'Dec', clients: 107, income: 307070 },
  { month: 'Jan', clients: 91,  income: 260910 },
  { month: 'Feb', clients: 98,  income: 281120 },
  { month: 'Mar', clients: 118, income: 338640 },
  { month: 'Apr', clients: 104, income: 298464 },
];

const SOURCE_ATTR = [
  { name: 'Free Trial Program', value: 42 },
  { name: 'Member Referral',    value: 23 },
  { name: 'Corporate Tie-up',   value: 18 },
  { name: 'Walk-in',            value: 11 },
  { name: 'Online Campaign',    value: 6  },
];
const SOURCE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

// Report 3 — Existing Customer Insights
const RETENTION_BY_TIER = [
  { tier: 'Sapphire', rate: 96, fill: '#0f2942' },
  { tier: 'Diamond',  rate: 91, fill: '#3b82f6' },
  { tier: 'Platinum', rate: 84, fill: '#8b5cf6' },
  { tier: 'Gold',     rate: 73, fill: '#f59e0b' },
];

const CLV_BY_TIER = [
  { tier: 'Gold',     clv: 28400,  fill: '#f59e0b' },
  { tier: 'Platinum', clv: 67800,  fill: '#8b5cf6' },
  { tier: 'Diamond',  clv: 124500, fill: '#3b82f6' },
  { tier: 'Sapphire', clv: 240000, fill: '#0f2942' },
];

const CHURN_TREND = [
  { month: 'Nov', churn: 12.1 },
  { month: 'Dec', churn: 11.8 },
  { month: 'Jan', churn: 13.4 },
  { month: 'Feb', churn: 14.8 },
  { month: 'Mar', churn: 15.2 },
  { month: 'Apr', churn: 14.2 },
];

// Report 3 — Existing Customer income data
const EXISTING_INCOME_MONTHLY = [
  { month: 'Nov', income: 612320 },
  { month: 'Dec', income: 817730 },
  { month: 'Jan', income: 671490 },
  { month: 'Feb', income: 697480 },
  { month: 'Mar', income: 748660 },
  { month: 'Apr', income: 755736 },
];

const EXISTING_INCOME_BY_TIER = [
  { month: 'Nov', Sapphire: 153080, Diamond: 183696, Platinum: 171450, Gold: 104094 },
  { month: 'Dec', Sapphire: 204433, Diamond: 245319, Platinum: 228964, Gold: 139014 },
  { month: 'Jan', Sapphire: 167873, Diamond: 201447, Platinum: 188017, Gold: 114153 },
  { month: 'Feb', Sapphire: 174370, Diamond: 209244, Platinum: 195294, Gold: 118572 },
  { month: 'Mar', Sapphire: 187165, Diamond: 224598, Platinum: 209625, Gold: 127272 },
  { month: 'Apr', Sapphire: 188934, Diamond: 226721, Platinum: 211606, Gold: 128475 },
];

const INCOME_BY_TIER_TOTAL = [
  { tier: 'Sapphire', income: 1075855, fill: '#0f2942' },
  { tier: 'Diamond',  income: 1291025, fill: '#3b82f6' },
  { tier: 'Platinum', income: 1204956, fill: '#8b5cf6' },
  { tier: 'Gold',     income:  731580, fill: '#f59e0b' },
];

// 2026-06-27 — real-data wiring. Container (hkial-react
// src/components/Reports.tsx) computes these shapes from
// bookingService / accountService / purchaseService data.
// MOCK_* constants above stay as fallbacks for Figma Make
// standalone preview per INV-X1. Each sub-component accepts
// the matching prop and uses `prop ?? MOCK_*` per pattern
// already established in CorporateReports.tsx:48-75.

export type CouponMonthlyPoint = { month: string; redeemed: number; converted: number };
export type TimeToConvertPoint = { range: string; count: number };
export type NewClientMonthlyPoint = { month: string; clients: number; income: number };
export type SourceAttributionPoint = { name: string; value: number };
export type RetentionByTierPoint = { tier: string; rate: number; fill: string };
export type ClvByTierPoint = { tier: string; clv: number; fill: string };
export type ChurnTrendPoint = { month: string; churn: number };
export type IncomeMonthlyPoint = { month: string; income: number };
export type IncomeByTierPoint = { month: string; Sapphire: number; Diamond: number; Platinum: number; Gold: number };
export type IncomeByTierTotalPoint = { tier: string; income: number; fill: string };
export type TierSummaryRow = {
  tier: string; color: string; members: number;
  retention: string; freq: string; clv: string;
  risk: string; riskColor: string;
};

export interface OperationalKpis {
  totalBookings?: number;
  totalIncome?: number;
  activeMembers?: number;
  avgOccupancy?: string;
}

export interface CouponKpis {
  redemptionRate?: number;
  conversionRate?: number;
  avgTimeToConvert?: number;
  cac?: number;
  spendingUplift?: number;
  funnel?: { couponsIssued: number; couponsRedeemed: number; convertedToPaid: number };
}

export interface NewClientKpis {
  newClients?: number;
  income?: number;
  avgTransactionValue?: number;
  penetrationPct?: number;
  sixMonthTotal?: number;
  periodLabel?: string;
}

export interface ExistingCustomerKpis {
  retentionRate?: number;
  avgVisitFrequency?: string;
  customerLifetimeValue?: number;
  churnRate?: number;
  totalIncome?: number;
  bestMonth?: string;
  existingClientShare?: number;
}

export interface OperationalReportData {
  kpis?: OperationalKpis;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (value: string) => void;
  onEndDateChange?: (value: string) => void;
}

export type ExportFormat = 'csv' | 'pdf' | 'xlsx';

export interface OperationalScheduleView {
  id: string;
  name: string;
  reportId: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  email: string;
  active: boolean;
  summary: string;
}

export interface ReportPreviewState {
  reportId: string;
  title: string;
  periodLabel: string;
  rows: Array<Record<string, string | number | boolean | null | undefined>>;
}

export interface CouponConversionData {
  couponMonthly?: CouponMonthlyPoint[];
  timeToConvert?: TimeToConvertPoint[];
  kpis?: CouponKpis;
}

export interface NewClientReportData {
  newClientMonthly?: NewClientMonthlyPoint[];
  sourceAttribution?: SourceAttributionPoint[];
  kpis?: NewClientKpis;
}

export interface ExistingCustomerReportData {
  retentionByTier?: RetentionByTierPoint[];
  clvByTier?: ClvByTierPoint[];
  churnTrend?: ChurnTrendPoint[];
  existingIncomeMonthly?: IncomeMonthlyPoint[];
  existingIncomeByTier?: IncomeByTierPoint[];
  incomeByTierTotal?: IncomeByTierTotalPoint[];
  tierSummary?: TierSummaryRow[];
  kpis?: ExistingCustomerKpis;
}

export interface ReportsData {
  operational?: OperationalReportData;
  coupon?: CouponConversionData;
  newClient?: NewClientReportData;
  existingCustomer?: ExistingCustomerReportData;
}

// ── Shared sub-components ────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  blue:   'bg-blue-50 text-blue-600',
  green:  'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  amber:  'bg-amber-50 text-amber-600',
  red:    'bg-red-50 text-red-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  navy:   'bg-[#e8edf3] text-[#0f2942]',
};

function KpiCard({
  label, value, sub, icon: Icon, color = 'blue', up, trend,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color?: string;
  up?: boolean; trend?: string;
}) {
  return (
    <Card className="p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 leading-tight">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${COLOR_MAP[color] ?? 'bg-gray-100 text-gray-600'} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
      {trend && (
        <div className={`text-xs font-medium flex items-center gap-1 ${up ? 'text-green-600' : 'text-red-600'}`}>
          {up
            ? <ArrowUpRight className="w-3 h-3" />
            : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      )}
    </Card>
  );
}

function InsightBox({ color, icon: Icon, title, body }: { color: 'blue'|'green'|'amber'|'red'; icon: React.ElementType; title: string; body: string }) {
  const cls = {
    blue:  'bg-blue-50 border-blue-200 text-blue-600 text-blue-800 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-600 text-green-800 text-green-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-600 text-amber-800 text-amber-700',
    red:   'bg-red-50 border-red-200 text-red-600 text-red-800 text-red-700',
  }[color];
  const parts = cls.split(' ');
  return (
    <div className={`${parts[0]} border ${parts[1]} rounded-lg p-4 flex gap-3`}>
      <Icon className={`w-5 h-5 ${parts[2]} flex-shrink-0 mt-0.5`} />
      <div>
        <p className={`text-sm font-semibold ${parts[3]}`}>{title}</p>
        <p className={`text-sm ${parts[4]} mt-1`}>{body}</p>
      </div>
    </div>
  );
}

const chartTooltipStyle = { borderRadius: '8px', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' };

// ── Report 1: Coupon to Conversion Analysis ──────────────────────────────────
const MOCK_COUPON_FUNNEL = { couponsIssued: 1877, couponsRedeemed: 1284, convertedToPaid: 541 };
const MOCK_COUPON_KPIS: Required<NonNullable<CouponKpis>> = {
  redemptionRate: 68.4, conversionRate: 42.1, avgTimeToConvert: 23.4, cac: 1068, spendingUplift: 190,
  funnel: MOCK_COUPON_FUNNEL,
};

function CouponConversionReport({ data }: { data?: CouponConversionData } = {}) {
  const couponMonthly = data?.couponMonthly ?? COUPON_MONTHLY;
  const timeToConvert = data?.timeToConvert ?? TIME_TO_CONVERT;
  const kpis = { ...MOCK_COUPON_KPIS, ...(data?.kpis ?? {}) };
  const funnel = kpis.funnel;
  const fmt = (n: number) => n.toLocaleString('en-US');
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Tracks the <strong>"Free to Paid"</strong> pipeline — helping management understand if coupons attract
          high-value returning customers or one-time opportunists. {data?.kpis ? 'Period: based on selected date range.' : <>Report period: <strong>Nov 2025 – Apr 2026</strong>.</>}
        </p>
      </div>

      {/* Visual Funnel */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Coupons Issued',     value: fmt(funnel.couponsIssued),     pct: '100%',                                       bg: 'bg-blue-600' },
          { label: 'Coupons Redeemed',   value: fmt(funnel.couponsRedeemed),   pct: `Redemption Rate: ${kpis.redemptionRate.toFixed(1)}%`, bg: 'bg-purple-600' },
          { label: 'Converted to Paid',  value: fmt(funnel.convertedToPaid),   pct: `Conversion Rate: ${kpis.conversionRate.toFixed(1)}%`, bg: 'bg-emerald-600' },
        ].map((f) => (
          <div key={f.label} className={`${f.bg} text-white rounded-xl p-5 text-center`}>
            <p className="text-3xl font-bold">{f.value}</p>
            <p className="text-sm opacity-85 mt-1">{f.label}</p>
            <p className="text-xs opacity-65 mt-0.5">{f.pct}</p>
          </div>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Redemption Rate" value={`${kpis.redemptionRate.toFixed(1)}%`} sub={`${fmt(funnel.couponsRedeemed)} of ${fmt(funnel.couponsIssued)} issued`} icon={Ticket} color="blue" />
        <KpiCard label="Conversion Rate" value={`${kpis.conversionRate.toFixed(1)}%`} sub={`${fmt(funnel.convertedToPaid)} of ${fmt(funnel.couponsRedeemed)} redeemed`} icon={Target} color="purple" />
        <KpiCard label="Avg Time-to-Convert" value={`${kpis.avgTimeToConvert.toFixed(1)} days`} sub="First visit → Paid return" icon={Clock} color="indigo" />
        <KpiCard label="Acq. Cost (CAC)" value={`HK$${kpis.cac.toLocaleString()}`} sub="Campaign cost ÷ converted" icon={DollarSign} color="amber" />
        <KpiCard label="Spending Uplift" value={`+${kpis.spendingUplift.toFixed(0)}%`} sub="Paid vs free cost" icon={ArrowUpRight} color="green" up trend={`+${kpis.spendingUplift.toFixed(0)}% uplift`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Monthly Redemption vs. Conversion to Paid</h4>
          <p className="text-xs text-gray-500 mb-4">Tracking the free-to-paid pipeline each month</p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={couponMonthly} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="redeemed" name="Redeemed (Free)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="converted" name="Converted to Paid" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Time-to-Conversion Distribution</h4>
          <p className="text-xs text-gray-500 mb-4">Days between first free visit and first paid return (n={funnel.convertedToPaid} converted clients)</p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={timeToConvert} layout="vertical" barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="range" type="category" tick={{ fontSize: 11 }} width={80} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v} clients`, 'Count']} />
              <Bar dataKey="count" name="Clients" radius={[0, 4, 4, 0]}>
                {timeToConvert.map((_, i) => <Cell key={i} fill={TTConvert_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <InsightBox
        color="green" icon={TrendingUp} title="Key Insight"
        body="Coupon-to-paid conversion tracks the free-trial-to-returning-customer pipeline. The 16-30 day window is typically the highest-converting re-engagement period; a 5% uplift in conversion rate compounds materially over a 6-month cycle."
      />
    </div>
  );
}

// ── Report 2: New Client Performance ─────────────────────────────────────────
const MOCK_NEW_CLIENT_KPIS: Required<NewClientKpis> = {
  newClients: 104, income: 298464, avgTransactionValue: 2868,
  penetrationPct: 28.3, sixMonthTotal: 600, periodLabel: 'Apr 2026',
};

function NewClientReport({ data }: { data?: NewClientReportData } = {}) {
  const newClientMonthly = data?.newClientMonthly ?? NEW_CLIENT_MONTHLY;
  const sourceAttribution = data?.sourceAttribution ?? SOURCE_ATTR;
  const kpis = { ...MOCK_NEW_CLIENT_KPIS, ...(data?.kpis ?? {}) };
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          Focuses on the <strong>"Inflow"</strong> of the business — tracking whether the new paying client base
          is growing, what they are worth, and where they come from. {data?.kpis ? `Period: ${kpis.periodLabel}.` : <>Period: <strong>Nov 2025 – Apr 2026</strong>.</>}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label={`New Clients (${kpis.periodLabel})`} value={kpis.newClients.toLocaleString()} sub={`vs prior period`} icon={UserPlus} color="green" />
        <KpiCard label={`Income from New Clients`} value={`HK$${Math.round(kpis.income / 1000)}K`} sub="of total lounge income" icon={DollarSign} color="blue" />
        <KpiCard label="Avg Transaction Value" value={`HK$${kpis.avgTransactionValue.toLocaleString()}`} sub="per new client visit" icon={TrendingUp} color="purple" />
        <KpiCard label="New Client Penetration" value={`${kpis.penetrationPct.toFixed(1)}%`} sub="of total period income" icon={Target} color="indigo" />
        <KpiCard label="Period New Clients" value={kpis.sixMonthTotal.toLocaleString()} sub="Total across period" icon={Users} color="amber" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Monthly New Client Count &amp; Income</h4>
          <p className="text-xs text-gray-500 mb-4">Bars = new client count (left axis) · Line = HK$ income from new clients (right axis)</p>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={newClientMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${Math.round(v / 1000)}K`}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(v: number, name: string) =>
                  name === 'New Clients' ? [v, name] : [`HK$${Math.round(v / 1000)}K`, name]
                }
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="clients" name="New Clients" fill="#10b981" radius={[4, 4, 0, 0]} barSize={28} />
              <Line yAxisId="right" type="monotone" dataKey="income" name="Income (HK$)" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">New Client Source Attribution</h4>
          {sourceAttribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={sourceAttribution} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                    {sourceAttribution.map((_, i) => <Cell key={i} fill={SOURCE_COLORS[i % SOURCE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v}%`, 'Share']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {sourceAttribution.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: SOURCE_COLORS[i % SOURCE_COLORS.length] }} />
                      <span className="text-gray-600">{s.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{s.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-500 italic">
              Source attribution requires an <code>Account.source</code> column (deferred — see <code>docs/pending-changes/2026-06-27-reports-real-data.md</code>).
            </p>
          )}
        </Card>
      </div>

      <InsightBox
        color="blue" icon={UserPlus} title="Key Insight"
        body="New-client performance tracks the inflow of first-time paying customers each month. Pair with the Coupon Conversion tab to understand which acquisition channels drive the highest-LTV cohorts."
      />
    </div>
  );
}

// ── Report 3: Existing Customer Insights ─────────────────────────────────────
const MOCK_EXISTING_TIER_SUMMARY: TierSummaryRow[] = [
  { tier: 'Sapphire', color: 'bg-[#0f2942]', members: 127, retention: '96%', freq: '4.2×', clv: 'HK$240,000+', risk: 'Very Low',  riskColor: 'bg-green-100 text-green-700' },
  { tier: 'Diamond',  color: 'bg-blue-600',  members: 384, retention: '91%', freq: '2.8×', clv: 'HK$124,500',  risk: 'Low',       riskColor: 'bg-green-100 text-green-700' },
  { tier: 'Platinum', color: 'bg-purple-600', members: 621, retention: '84%', freq: '2.1×', clv: 'HK$67,800',   risk: 'Moderate',  riskColor: 'bg-amber-100 text-amber-700' },
  { tier: 'Gold',     color: 'bg-amber-500', members: 1045, retention: '73%', freq: '1.4×', clv: 'HK$28,400',   risk: 'High',      riskColor: 'bg-red-100 text-red-700' },
];
const MOCK_EXISTING_KPIS: Required<ExistingCustomerKpis> = {
  retentionRate: 72.8, avgVisitFrequency: '1.8× / month',
  customerLifetimeValue: 48400, churnRate: 14.2,
  totalIncome: 4303000, bestMonth: 'Dec 2025', existingClientShare: 71.4,
};

function ExistingCustomerReport({ data }: { data?: ExistingCustomerReportData } = {}) {
  const retentionByTier       = data?.retentionByTier       ?? RETENTION_BY_TIER;
  const clvByTier             = data?.clvByTier             ?? CLV_BY_TIER;
  const churnTrend            = data?.churnTrend            ?? CHURN_TREND;
  const existingIncomeMonthly = data?.existingIncomeMonthly ?? EXISTING_INCOME_MONTHLY;
  const existingIncomeByTier  = data?.existingIncomeByTier  ?? EXISTING_INCOME_BY_TIER;
  const incomeByTierTotal     = data?.incomeByTierTotal     ?? INCOME_BY_TIER_TOTAL;
  const tierSummary           = data?.tierSummary           ?? MOCK_EXISTING_TIER_SUMMARY;
  const kpis                  = { ...MOCK_EXISTING_KPIS, ...(data?.kpis ?? {}) };
  const totalIncome = incomeByTierTotal.reduce((s, x) => s + x.income, 0);
  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          Measures the health and loyalty of the core <strong>"Bread and Butter"</strong> client base — tracking
          retention, visit frequency, lifetime value, and early churn signals. {data?.kpis ? 'Period: based on selected date range.' : <>Period: <strong>Nov 2025 – Apr 2026</strong>.</>}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Retention Rate (6-month)" value={`${kpis.retentionRate.toFixed(1)}%`} sub="Visited >1× in 6 months" icon={Heart} color="green" />
        <KpiCard label="Avg Visit Frequency" value={kpis.avgVisitFrequency} sub="Per existing customer" icon={RefreshCw} color="blue" />
        <KpiCard label="Customer Lifetime Value" value={`HK$${(kpis.customerLifetimeValue / 1000).toFixed(0)}K`} sub="Avg across all active tiers" icon={DollarSign} color="purple" />
        <KpiCard label="Churn Rate" value={`${kpis.churnRate.toFixed(1)}%`} sub="No visit in 6+ months (heuristic)" icon={AlertTriangle} color="red" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Retention Rate by Membership Tier</h4>
          <p className="text-xs text-gray-500 mb-4">% of tier members with ≥1 visit in past 6 months</p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={retentionByTier} layout="vertical" barSize={26}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <YAxis dataKey="tier" type="category" tick={{ fontSize: 12 }} width={68} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v}%`, 'Retention Rate']} />
              <Bar dataKey="rate" name="Retention Rate" radius={[0, 5, 5, 0]}>
                {retentionByTier.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Monthly Churn Rate Trend</h4>
          <p className="text-xs text-gray-500 mb-4">% of previously active clients who lapsed (&gt;6 months without a visit)</p>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={churnTrend}>
              <defs>
                <linearGradient id="churnGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[9, 17]} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, 'Churn Rate']} />
              <Area type="monotone" dataKey="churn" name="Churn Rate" stroke="#ef4444" strokeWidth={2.5} fill="url(#churnGradient)" dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Avg CLV by Membership Tier</h4>
          <p className="text-xs text-gray-500 mb-4">Total income generated per client since first visit (HK$)</p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={clvByTier} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="tier" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}K` : `${v}`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`HK$${v.toLocaleString()}`, 'Avg CLV']} />
              <Bar dataKey="clv" name="Customer Lifetime Value" radius={[5, 5, 0, 0]}>
                {clvByTier.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tier breakdown table */}
      <Card className="p-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Membership Tier Health Summary</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {['Tier', 'Active Members', 'Retention Rate', 'Avg Visits/Month', 'Avg CLV', 'Churn Risk'].map(h => (
                  <th key={h} className="text-left text-xs text-gray-500 pb-2 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tierSummary.map(row => (
                <tr key={row.tier}>
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${row.color}`} />
                      <span className="font-medium text-gray-800">{row.tier}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-600">{row.members.toLocaleString()}</td>
                  <td className="py-2.5 pr-4 text-gray-800 font-medium">{row.retention}</td>
                  <td className="py-2.5 pr-4 text-gray-600">{row.freq}</td>
                  <td className="py-2.5 pr-4 text-gray-800 font-medium">{row.clv}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.riskColor}`}>{row.risk}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Income Performance Section ──────────────────────────────────── */}
      <div className="flex items-center gap-2 pt-2">
        <div className="flex-1 h-px bg-gray-200" />
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0f2942] rounded-full">
          <DollarSign className="w-3.5 h-3.5 text-white" />
          <span className="text-xs font-semibold text-white tracking-wide">INCOME PERFORMANCE</span>
        </div>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Income KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Total Income" value={`HK$${(kpis.totalIncome / 1_000_000).toFixed(2)}M`}
          sub="From existing clients in period"
          icon={DollarSign} color="navy"
        />
        <KpiCard
          label="Best Month" value={kpis.bestMonth}
          sub="Highest income month in period"
          icon={ArrowUpRight} color="purple"
        />
        <KpiCard
          label="Existing Client Income Share" value={`${kpis.existingClientShare.toFixed(1)}%`}
          sub="of total lounge income in period"
          icon={Target} color="amber"
        />
      </div>

      {/* Income Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly income trend — area */}
        <Card className="p-5 lg:col-span-2">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Monthly Income from Existing Customers</h4>
          <p className="text-xs text-gray-500 mb-4">Total HK$ income generated by returning clients each month</p>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={existingIncomeMonthly}>
              <defs>
                <linearGradient id="existingIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0f2942" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0f2942" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${Math.round(v / 1000)}K`}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(v: number) => [`HK$${(v / 1000).toFixed(1)}K`, 'Income']}
              />
              <Area
                type="monotone" dataKey="income" name="Income (HK$)"
                stroke="#0f2942" strokeWidth={2.5}
                fill="url(#existingIncomeGrad)"
                dot={{ r: 5, fill: '#0f2942', strokeWidth: 0 }}
                activeDot={{ r: 7, fill: '#3b82f6', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          {/* MoM change row */}
          {existingIncomeMonthly.length > 0 && (
            <div className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${existingIncomeMonthly.length}, minmax(0, 1fr))` }}>
              {existingIncomeMonthly.map((d, i) => {
                const prev = existingIncomeMonthly[i - 1];
                const change = prev ? ((d.income - prev.income) / prev.income * 100) : null;
                return (
                  <div key={d.month} className="text-center">
                    <p className="text-xs text-gray-400">{d.month}</p>
                    <p className="text-xs font-semibold text-gray-800">{(d.income / 1000).toFixed(0)}K</p>
                    {change !== null && (
                      <p className={`text-[10px] font-medium ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Income by tier (period total) */}
        <Card className="p-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Income by Tier</h4>
          <p className="text-xs text-gray-500 mb-4">Total income contribution per membership tier in period</p>
          {incomeByTierTotal.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={incomeByTierTotal} layout="vertical" barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis
                    type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${Math.round(v / 1000)}K`}
                  />
                  <YAxis dataKey="tier" type="category" width={62} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`HK$${v.toLocaleString()}`, 'Income']} />
                  <Bar dataKey="income" name="Income" radius={[0, 5, 5, 0]}>
                    {incomeByTierTotal.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Tier income share */}
              <div className="mt-3 space-y-1.5">
                {incomeByTierTotal.slice().reverse().map((t) => {
                  const pct = totalIncome > 0 ? (t.income / totalIncome * 100).toFixed(1) : '0.0';
                  return (
                    <div key={t.tier} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: t.fill }} />
                      <span className="text-gray-600 flex-1">{t.tier}</span>
                      <span className="text-gray-500">HK${(t.income / 1000).toFixed(0)}K</span>
                      <span className="font-semibold text-gray-800 w-10 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-500 italic">
              Tier-income breakdown requires the <code>Account.membership_type</code> column to be populated for active clients in the selected period.
            </p>
          )}
        </Card>
      </div>

      {/* Monthly stacked bar by tier */}
      {existingIncomeByTier.length > 0 && (
        <Card className="p-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Monthly Income Breakdown by Membership Tier</h4>
          <p className="text-xs text-gray-500 mb-4">Stacked monthly income (HK$) showing each tier's contribution</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={existingIncomeByTier} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}K`} />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(v: number, name: string) => [`HK$${v.toLocaleString()}`, name]}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Gold"     name="Gold"     stackId="a" fill="#f59e0b" />
              <Bar dataKey="Platinum" name="Platinum" stackId="a" fill="#8b5cf6" />
              <Bar dataKey="Diamond"  name="Diamond"  stackId="a" fill="#3b82f6" />
              <Bar dataKey="Sapphire" name="Sapphire" stackId="a" fill="#0f2942" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <InsightBox
        color="amber" icon={AlertTriangle} title="Key Insight"
        body="Existing-customer insights measure loyalty, lifetime value, and churn risk per membership tier. Top tier (Sapphire) typically has the highest retention but smallest cohort; Gold tier is the largest cohort and the most at risk — targeted upgrade incentives compound over the membership lifetime."
      />
    </div>
  );
}

// ── Operational report definitions ──────────────────────────────────────────

const OPERATIONAL_REPORTS = [
  { id: 'daily-bookings',  title: 'Daily Booking List',       description: 'List of all bookings for a specific date',             icon: Calendar,   color: 'text-blue-600 bg-blue-50',       fields: ['Booking No.', 'Guest Name', 'Suite', 'Time', 'Flight Info'] },
  { id: 'departure-list',  title: 'Departure List',           description: 'Departure information for retail team coordination',    icon: TrendingUp, color: 'text-green-600 bg-green-50',     fields: ['Booking No.', 'Passenger Names', 'Flight No.', 'Departure Time', 'Suite'] },
  { id: '48hr-bookings',   title: '48-Hour Booking Report',   description: 'Bookings scheduled within next 48 hours',              icon: Calendar,   color: 'text-orange-600 bg-orange-50',   fields: ['Booking No.', 'Guest Name', 'Time', 'Add-on Services', 'Special Requests'] },
  { id: 'movement-list',   title: 'Movement List',            description: 'Guest arrival and departure tracking',                 icon: Users,      color: 'text-purple-600 bg-purple-50',   fields: ['Guest Name', 'Arrival Time', 'Departure Time', 'Baggage Info', 'Staff Name'] },
  { id: 'room-allocation', title: 'Room Allocation Table',    description: 'Current suite allocation and availability',            icon: FileText,   color: 'text-indigo-600 bg-indigo-50',   fields: ['Suite Name', 'Guest Name', 'Check-in Time', 'Expected Departure', 'Status'] },
  { id: 'income-report',   title: 'Income Report',            description: 'Financial summary and income breakdown',               icon: DollarSign, color: 'text-emerald-600 bg-emerald-50', fields: ['Date', 'Total Bookings', 'Income', 'Payment Method', 'Discounts Applied'] },
  { id: 'member-report',   title: 'Member Activity Report',   description: 'Member usage statistics and patterns',                 icon: Users,      color: 'text-pink-600 bg-pink-50',       fields: ['Member Name', 'Account No.', 'Total Bookings', 'Last Visit', 'Membership Status'] },
  { id: 'sales-report',    title: 'Add-on Services Sales',    description: 'Sales breakdown for additional services',              icon: DollarSign, color: 'text-teal-600 bg-teal-50',       fields: ['Service Name', 'Quantity', 'Income', 'Discount Applied', 'Popular Times'] },
];

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function OperationalReports({
  data,
  onExport,
  onPreview,
  isLoading = false,
  exportFormat = 'csv',
  onExportFormatChange,
  preview,
  onClosePreview,
  onApplyFilter,
  schedules = [],
  onSaveSchedule,
  onDeleteSchedule,
}: {
  data?: OperationalReportData;
  onExport?: (reportType: string) => void;
  onPreview?: (reportType: string) => void;
  isLoading?: boolean;
  exportFormat?: ExportFormat;
  onExportFormatChange?: (format: ExportFormat) => void;
  preview?: ReportPreviewState | null;
  onClosePreview?: () => void;
  onApplyFilter?: (startDate: string, endDate: string) => void;
  schedules?: OperationalScheduleView[];
  onSaveSchedule?: (schedule: Omit<OperationalScheduleView, 'summary'> & { id?: string }) => void;
  onDeleteSchedule?: (id: string) => void;
} = {}) {
  const kpis = data?.kpis ?? { totalBookings: 0, totalIncome: 0, activeMembers: 0, avgOccupancy: '—' };
  const [draftStart, setDraftStart] = useState(data?.startDate ?? '');
  const [draftEnd, setDraftEnd] = useState(data?.endDate ?? '');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<OperationalScheduleView | null>(null);
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleReportId, setScheduleReportId] = useState(OPERATIONAL_REPORTS[0].id);
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [scheduleEmail, setScheduleEmail] = useState('');
  const [scheduleActive, setScheduleActive] = useState(true);

  const totalIncomeDisplay = typeof kpis.totalIncome === 'number' && kpis.totalIncome > 0
    ? (kpis.totalIncome >= 1_000_000
        ? `HK$${(kpis.totalIncome / 1_000_000).toFixed(2)}M`
        : `HK$${Math.round(kpis.totalIncome / 1000)}K`)
    : 'HK$0';

  const openSchedule = (existing?: OperationalScheduleView) => {
    setEditingSchedule(existing ?? null);
    setScheduleName(existing?.name ?? '');
    setScheduleReportId(existing?.reportId ?? OPERATIONAL_REPORTS[0].id);
    setScheduleFrequency(existing?.frequency ?? 'daily');
    setScheduleTime(existing?.time ?? '08:00');
    setScheduleEmail(existing?.email ?? '');
    setScheduleActive(existing?.active ?? true);
    setScheduleOpen(true);
  };

  const handleSaveSchedule = () => {
    if (!scheduleName.trim() || !scheduleEmail.trim()) return;
    onSaveSchedule?.({
      id: editingSchedule?.id,
      name: scheduleName.trim(),
      reportId: scheduleReportId,
      frequency: scheduleFrequency,
      time: scheduleTime || '08:00',
      email: scheduleEmail.trim(),
      active: scheduleActive,
    });
    setScheduleOpen(false);
  };

  const formatOptions: Array<{ id: ExportFormat; label: string; button: string; desc: string }> = [
    { id: 'csv', label: 'CSV Format', button: 'CSV', desc: 'Spreadsheet-compatible format for data analysis in Excel / Google Sheets' },
    { id: 'pdf', label: 'PDF Format', button: 'PDF', desc: 'Formatted document ready for printing and email distribution' },
    { id: 'xlsx', label: 'Excel Format', button: 'Excel', desc: 'Advanced spreadsheet with calculated columns and pivot-ready layout' },
  ];

  const previewHeaders = preview && preview.rows.length > 0 ? Object.keys(preview.rows[0]) : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings',  value: (kpis.totalBookings ?? 0).toLocaleString(), icon: Calendar,   color: 'text-blue-600' },
          { label: 'Total Income',    value: totalIncomeDisplay,                          icon: DollarSign, color: 'text-green-600' },
          { label: 'Active Members',  value: (kpis.activeMembers ?? 0).toLocaleString(),  icon: Users,      color: 'text-purple-600' },
          { label: 'Avg. Occupancy',  value: kpis.avgOccupancy ?? '—',                    icon: TrendingUp, color: 'text-orange-600' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{s.label}</p>
                <h2 className="mt-1">{s.value}</h2>
              </div>
              <s.icon className={`w-8 h-8 ${s.color}`} />
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="mb-4 text-gray-800">Report Period</h3>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="mb-[10px] block text-sm text-gray-600">Start Date</label>
            <StringDatePicker
              data-testid="operational-start-date"
              value={draftStart}
              onChange={setDraftStart}
            />
          </div>
          <div className="flex-1">
            <label className="mb-[10px] block text-sm text-gray-600">End Date</label>
            <StringDatePicker
              data-testid="operational-end-date"
              value={draftEnd}
              onChange={setDraftEnd}
            />
          </div>
          <Button
            variant="outline"
            disabled={isLoading}
            data-testid="operational-apply-filter"
            onClick={() => onApplyFilter?.(draftStart, draftEnd)}
          >
            {isLoading ? 'Loading…' : 'Apply Filter'}
          </Button>
        </div>
        {isLoading && <p className="text-xs text-gray-500 mt-2">Refreshing data for selected period…</p>}
        <p className="text-xs text-gray-500 mt-2">Preview and export use this period after you apply it. The 48-hour report always uses the next 48 hours in HKT.</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {OPERATIONAL_REPORTS.map((report) => (
          <Card key={report.id} className="p-5 flex flex-col">
            <div className={`w-11 h-11 rounded-lg ${report.color} flex items-center justify-center mb-4`}>
              <report.icon className="w-5 h-5" />
            </div>
            <h3 className="mb-1.5 text-gray-900 text-sm font-semibold">{report.title}</h3>
            <p className="text-xs text-gray-500 mb-4 flex-1">{report.description}</p>
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Included fields:</p>
              <div className="flex flex-wrap gap-1">
                {report.fields.slice(0, 3).map((f, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{f}</span>
                ))}
                {report.fields.length > 3 && (
                  <span className="text-xs text-gray-400 px-1.5 py-0.5">+{report.fields.length - 3} more</span>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-auto">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                data-testid={`preview-${report.id}`}
                onClick={() => onPreview?.(report.id)}
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" />Preview
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-[#0f2942] hover:bg-[#1a3a5c] text-white"
                data-testid={`export-${report.id}`}
                onClick={() => onExport?.(report.id)}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />Export
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="mb-4 text-gray-800">Export Format Options</h3>
        <p className="text-xs text-gray-500 mb-4">Chooses the file type for the Export buttons on the report cards above. This card does not download a file.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {formatOptions.map((option) => {
            const selected = exportFormat === option.id;
            return (
              <button
                type="button"
                key={option.id}
                data-testid={`export-format-${option.id}`}
                aria-pressed={selected}
                onClick={() => onExportFormatChange?.(option.id)}
                className={`p-4 border rounded-lg text-left ${selected ? 'border-[#0f2942] ring-2 ring-[#0f2942]/20 bg-slate-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <p className="text-sm font-semibold text-gray-800 mb-1">{option.label}</p>
                <p className="text-xs text-gray-500 mb-3">{option.desc}</p>
                <span
                  className={`inline-flex items-center justify-center w-full rounded-md border px-3 py-1.5 text-sm ${selected ? 'bg-[#0f2942] text-white border-[#0f2942]' : 'bg-white text-gray-700 border-gray-200'}`}
                >
                  {selected ? <Check className="w-4 h-4 mr-2" /> : null}
                  {selected ? `${option.button} selected` : `Use ${option.button}`}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-800">Scheduled Reports</h3>
          <Button variant="outline" size="sm" data-testid="configure-schedule" onClick={() => openSchedule()}>
            Configure Schedule
          </Button>
        </div>
        <div className="space-y-3">
          {schedules.length === 0 ? (
            <p className="text-sm text-gray-500">No scheduled reports yet. Configure a schedule to add one.</p>
          ) : schedules.map((schedule) => (
            <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{schedule.name}</p>
                <p className="text-xs text-gray-500">{schedule.summary}</p>
                <p className="text-xs text-gray-400">{schedule.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge className={schedule.active ? 'bg-green-100 text-green-700 border-0' : 'bg-gray-200 text-gray-600 border-0'}>
                  {schedule.active ? 'Active' : 'Paused'}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => openSchedule(schedule)}>Edit</Button>
                <Button variant="outline" size="sm" onClick={() => onDeleteSchedule?.(schedule.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => { if (!open) onClosePreview?.(); }}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto" data-testid="operational-preview-dialog">
          <DialogHeader>
            <DialogTitle>Preview: {preview?.title}</DialogTitle>
            <DialogDescription>
              {preview?.periodLabel} · same rows as the selected export format
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              {preview?.rows.length ?? 0} row(s)
            </span>
            <span className="text-xs text-gray-500 uppercase">{exportFormat}</span>
          </div>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            {preview && preview.rows.length === 0 ? (
              <p className="p-6 text-sm text-gray-500 text-center">No data for the selected period.</p>
            ) : (
              <table className="min-w-full text-sm" data-testid="operational-preview-table">
                <thead className="bg-gray-50">
                  <tr>
                    {previewHeaders.map((header) => (
                      <th key={header} className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(preview?.rows ?? []).map((row, rowIndex) => (
                    <tr key={`preview-row-${rowIndex}`} className="border-t border-gray-100">
                      {previewHeaders.map((header) => (
                        <td key={header} className="px-3 py-2 whitespace-nowrap text-gray-700">
                          {formatCell(row[header])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onClosePreview?.()}>Close</Button>
            <Button
              className="bg-[#0f2942] hover:bg-[#1a3a5c] text-white"
              onClick={() => preview && onExport?.(preview.reportId)}
            >
              <Download className="w-4 h-4 mr-2" />Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-lg" data-testid="operational-schedule-dialog">
          <DialogHeader>
            <DialogTitle>{editingSchedule ? 'Edit schedule' : 'Configure Schedule'}</DialogTitle>
            <DialogDescription>
              Saved in this browser. Automatic email sending is not enabled yet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm text-gray-600">Name</label>
              <Input value={scheduleName} onChange={(event) => setScheduleName(event.target.value)} data-testid="schedule-name" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Report</label>
              <select
                className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
                value={scheduleReportId}
                onChange={(event) => setScheduleReportId(event.target.value)}
                data-testid="schedule-report-id"
              >
                {OPERATIONAL_REPORTS.map((report) => (
                  <option key={report.id} value={report.id}>{report.title}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-gray-600">Frequency</label>
                <select
                  className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
                  value={scheduleFrequency}
                  onChange={(event) => setScheduleFrequency(event.target.value as 'daily' | 'weekly' | 'monthly')}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">Time (HKT)</label>
                <Input type="time" value={scheduleTime} onChange={(event) => setScheduleTime(event.target.value)} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Email</label>
              <Input type="email" value={scheduleEmail} onChange={(event) => setScheduleEmail(event.target.value)} data-testid="schedule-email" />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={scheduleActive} onChange={(event) => setScheduleActive(event.target.checked)} />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#0f2942] hover:bg-[#1a3a5c] text-white"
              data-testid="schedule-save"
              disabled={!scheduleName.trim() || !scheduleEmail.trim()}
              onClick={handleSaveSchedule}
            >
              Save schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Analytics report tab definitions ────────────────────────────────────────

const ANALYTICS_TABS = [
  {
    id: 'operational',
    label: 'Operational Reports',
    icon: FileText,
    accent: 'border-slate-500',
    badge: 'bg-slate-100 text-slate-700',
    Component: OperationalReports,
  },
  {
    id: 'coupon',
    label: 'Coupon to Conversion Analysis',
    icon: Ticket,
    accent: 'border-blue-500',
    badge: 'bg-blue-100 text-blue-700',
    Component: CouponConversionReport,
  },
  {
    id: 'new-client',
    label: 'New Client Performance',
    icon: UserPlus,
    accent: 'border-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
    Component: NewClientReport,
  },
  {
    id: 'existing',
    label: 'Existing Customer Insights',
    icon: Heart,
    accent: 'border-amber-500',
    badge: 'bg-amber-100 text-amber-700',
    Component: ExistingCustomerReport,
  },
  {
    id: 'customer-spending',
    label: 'Customer Spending',
    icon: Wallet,
    accent: 'border-teal-500',
    badge: 'bg-teal-100 text-teal-700',
    Component: null,
  },
];

// ── Main Reports Component ───────────────────────────────────────────────────

export interface ReportsProps {
  reportData?: ReportsData;
  isLoading?: boolean;
  onExport?: (reportType: string) => void;
  onPreview?: (reportType: string) => void;
  customerSpendingContent?: ReactNode;
  exportFormat?: ExportFormat;
  onExportFormatChange?: (format: ExportFormat) => void;
  preview?: ReportPreviewState | null;
  onClosePreview?: () => void;
  onApplyFilter?: (startDate: string, endDate: string) => void;
  schedules?: OperationalScheduleView[];
  onSaveSchedule?: (schedule: Omit<OperationalScheduleView, 'summary'> & { id?: string }) => void;
  onDeleteSchedule?: (id: string) => void;
}

export function Reports({
  reportData,
  isLoading,
  onExport,
  onPreview,
  customerSpendingContent,
  exportFormat,
  onExportFormatChange,
  preview,
  onClosePreview,
  onApplyFilter,
  schedules,
  onSaveSchedule,
  onDeleteSchedule,
}: ReportsProps = {}) {
  const [activeTab, setActiveTab] = useState<string>('operational');

  const activeReport = ANALYTICS_TABS.find(t => t.id === activeTab)!;
  const isAnalytics = activeTab !== 'operational';

  return (
    <div className="p-6 space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div>
        <h1>Reports &amp; Analytics</h1>
        <p className="text-gray-600">Operational report generation and strategic management analytics</p>
      </div>

      {/* ── Unified Tab Section ───────────────────────────────────────────── */}
      <section className="space-y-4">
        {/* Tab selector */}
        <div className="flex flex-col sm:flex-row gap-2 bg-gray-100 p-1.5 rounded-xl">
          {ANALYTICS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white shadow-sm text-gray-900 border-b-2 ' + tab.accent
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/60'
              }`}
            >
              <tab.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === tab.id ? 'text-gray-700' : 'text-gray-400'}`} />
              <span className="text-left leading-tight">{tab.label}</span>
              {activeTab === tab.id && (
                <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${tab.badge}`}>Active</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content card */}
        <Card className="p-6">
          {/* Report header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${activeReport.badge} flex items-center justify-center flex-shrink-0`}>
                <activeReport.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-gray-900">{activeReport.label}</h3>
                <p className="text-xs text-gray-500">
                  {isAnalytics
                    ? 'Data period: based on selected report period · updated on filter change'
                    : 'Generate, preview and export operational data for daily team use'}
                </p>
              </div>
            </div>
            {isAnalytics && activeTab !== 'customer-spending' && (
              <Button
                size="sm"
                className="bg-[#0f2942] hover:bg-[#1a3a5c] text-white gap-2 flex-shrink-0"
                onClick={() => onExport?.(activeTab)}
              >
                <Download className="w-4 h-4" />
                Export Report
              </Button>
            )}
          </div>

          {/* Dynamic content — each tab receives its data sub-shape from reportData */}
          {activeTab === 'operational' && (
            <OperationalReports
              data={{
                kpis: reportData?.operational?.kpis,
                startDate: reportData?.operational?.startDate,
                endDate: reportData?.operational?.endDate,
                onStartDateChange: reportData?.operational?.onStartDateChange,
                onEndDateChange: reportData?.operational?.onEndDateChange,
              }}
              onExport={onExport}
              onPreview={onPreview}
              isLoading={isLoading}
              exportFormat={exportFormat}
              onExportFormatChange={onExportFormatChange}
              preview={preview}
              onClosePreview={onClosePreview}
              onApplyFilter={onApplyFilter}
              schedules={schedules}
              onSaveSchedule={onSaveSchedule}
              onDeleteSchedule={onDeleteSchedule}
            />
          )}
          {activeTab === 'coupon'      && <CouponConversionReport data={reportData?.coupon} />}
          {activeTab === 'new-client'  && <NewClientReport       data={reportData?.newClient} />}
          {activeTab === 'existing'    && <ExistingCustomerReport data={reportData?.existingCustomer} />}
          {activeTab === 'customer-spending' && customerSpendingContent}
        </Card>
      </section>
    </div>
  );
}