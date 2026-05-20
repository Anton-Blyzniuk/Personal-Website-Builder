import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { BarChart2, Globe, Monitor, Smartphone, Tablet, Bot, TrendingUp, Users, Eye, Zap, RefreshCw } from 'lucide-react';
import { analyticsApi } from '../api/analytics';
import { pwbUnitsApi } from '../api/pwbunits';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useThemeStore } from '../store/themeStore';
import type { AnalyticsData } from '../types/api';

// ─── Colour tokens ────────────────────────────────────────────────────────────

const WEB_COLOR  = '#a78bfa'; // violet-400
const API_COLOR  = '#34d399'; // emerald-400
const DEVICE_COLORS: Record<string, string> = {
  desktop: '#60a5fa',  // blue-400
  mobile:  '#f472b6',  // pink-400
  tablet:  '#fbbf24',  // amber-400
  bot:     '#6b7280',  // gray-500
  unknown: '#94a3b8',  // slate-400
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtDate(iso: string, period: number): string {
  const d = new Date(iso);
  if (period <= 7) return d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' });
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{fmt(value)}</p>
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Empty / skeleton states ──────────────────────────────────────────────────

function EmptyUnits() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <BarChart2 className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
      <p className="text-slate-600 dark:text-slate-400 font-medium">No PWBUnits yet</p>
      <p className="text-slate-400 dark:text-slate-600 text-sm mt-1">Create your first PWBUnit to start tracking analytics.</p>
    </div>
  );
}

function EmptyData() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <TrendingUp className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
      <p className="text-slate-600 dark:text-slate-400 font-medium">No views recorded yet</p>
      <p className="text-slate-400 dark:text-slate-600 text-sm mt-1">Share your PWBUnit link and views will appear here.</p>
    </div>
  );
}

// ─── Custom tooltip for area chart ───────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label, period }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 dark:bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-300 mb-1.5">{label ? fmtDate(label, period) : ''}</p>
      {(payload as { name: string; value: number; color: string }[]).map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-slate-400 capitalize">{p.name}:</span>
          <span className="text-white font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Device icon helper ───────────────────────────────────────────────────────

function DeviceIcon({ type }: { type: string }) {
  const cls = 'h-3.5 w-3.5 shrink-0';
  if (type === 'mobile')  return <Smartphone className={cls} />;
  if (type === 'tablet')  return <Tablet className={cls} />;
  if (type === 'bot')     return <Bot className={cls} />;
  if (type === 'desktop') return <Monitor className={cls} />;
  return <Globe className={cls} />;
}

// ─── Main analytics content ───────────────────────────────────────────────────

function AnalyticsContent({ unitName, period }: { unitName: string; period: number }) {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['analytics', unitName, period],
    queryFn: () => analyticsApi.get(unitName, period),
    staleTime: 1000 * 60 * 3,
  });

  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const gridColor  = isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.06)';
  const axisColor  = isDark ? '#475569' : '#94a3b8';
  const tickColor  = isDark ? '#64748b' : '#94a3b8';

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-48 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-48 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (!data || data.total_views === 0) return <EmptyData />;

  // Build device bar data
  const deviceData = Object.entries(data.by_device)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  // Pie data
  const pieData = [
    { name: 'Web', value: data.web_views, color: WEB_COLOR },
    { name: 'API', value: data.api_views, color: API_COLOR },
  ].filter((d) => d.value > 0);

  const totalForPct = data.total_views || 1;

  // Tick density for x-axis
  const tickEvery = data.views_over_time.length <= 7 ? 1
    : data.views_over_time.length <= 30 ? 5 : 10;

  return (
    <div className="space-y-5">
      {/* All-time callout */}
      {data.all_time_total > data.total_views && (
        <p className="text-xs text-slate-400 dark:text-slate-600">
          All-time total: <span className="font-semibold text-slate-500 dark:text-slate-400">{fmt(data.all_time_total)}</span> views
        </p>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label={`Views (${period}d)`}
          value={data.total_views}
          icon={<Eye className="h-5 w-5 text-violet-400" />}
          accent="bg-violet-500/10"
        />
        <StatCard
          label="Unique visitors"
          value={data.unique_visitors}
          icon={<Users className="h-5 w-5 text-emerald-400" />}
          accent="bg-emerald-500/10"
        />
        <StatCard
          label="Web visits"
          value={data.web_views}
          icon={<Globe className="h-5 w-5 text-blue-400" />}
          accent="bg-blue-500/10"
        />
        <StatCard
          label="API reads"
          value={data.api_views}
          icon={<Zap className="h-5 w-5 text-amber-400" />}
          accent="bg-amber-500/10"
        />
      </div>

      {/* Area chart */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Views over time</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data.views_over_time} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="gWeb" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={WEB_COLOR} stopOpacity={0.3} />
                <stop offset="95%" stopColor={WEB_COLOR} stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="gApi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={API_COLOR} stopOpacity={0.3} />
                <stop offset="95%" stopColor={API_COLOR} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="date"
              tick={{ fill: tickColor, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: axisColor }}
              interval={tickEvery - 1}
              tickFormatter={(v) => fmtDate(v, period)}
            />
            <YAxis
              tick={{ fill: tickColor, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={(props: unknown) => <ChartTooltip {...(props as object)} period={period} />} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(v) => <span style={{ color: tickColor, fontSize: 12, textTransform: 'capitalize' }}>{v}</span>}
            />
            <Area type="monotone" dataKey="web" name="Web" stroke={WEB_COLOR} strokeWidth={2} fill="url(#gWeb)" dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="api" name="API" stroke={API_COLOR} strokeWidth={2} fill="url(#gApi)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Source + Device side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Source breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Traffic source</p>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={34}
                    outerRadius={54}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-slate-600 dark:text-slate-400 flex-1">{d.name}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{fmt(d.value)}</span>
                    <span className="text-slate-400 dark:text-slate-600 text-xs w-10 text-right">
                      {Math.round((d.value / totalForPct) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-600 py-8 text-center">No data</p>
          )}
        </div>

        {/* Device breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Devices</p>
          {deviceData.length > 0 ? (
            <div className="space-y-2.5">
              {deviceData.map((d) => {
                const pct = Math.round((d.value / totalForPct) * 100);
                const color = DEVICE_COLORS[d.name] ?? DEVICE_COLORS.unknown;
                return (
                  <div key={d.name} className="flex items-center gap-2 text-sm">
                    <span style={{ color }} className="shrink-0"><DeviceIcon type={d.name} /></span>
                    <span className="text-slate-600 dark:text-slate-400 capitalize w-16 shrink-0">{d.name}</span>
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 w-8 text-right">{fmt(d.value)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-600 py-8 text-center">No data</p>
          )}
        </div>
      </div>

      {/* Top referrers */}
      {data.top_referrers.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Top referrers</p>
          <div className="space-y-2">
            {data.top_referrers.map((r, i) => {
              const pct = Math.round((r.count / data.top_referrers[0].count) * 100);
              return (
                <div key={r.referrer} className="flex items-center gap-3 text-sm">
                  <span className="text-slate-400 dark:text-slate-600 w-4 text-right shrink-0 text-xs">{i + 1}</span>
                  <span className="text-slate-600 dark:text-slate-400 flex-1 truncate font-mono text-xs">{r.referrer}</span>
                  <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
                    <div className="h-full bg-violet-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 w-8 text-right shrink-0">{fmt(r.count)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PERIODS = [
  { label: '7d',  value: 7  },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
];

export function AnalyticsPage() {
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [period, setPeriod] = useState(30);
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: unitsData, isLoading: unitsLoading, isError: unitsError } = useQuery({
    queryKey: ['pwbunits'],
    queryFn: () => pwbUnitsApi.list(),
  });

  const units = unitsData?.results ?? [];

  // Auto-select when only one unit or on first load
  useEffect(() => {
    if (units.length > 0 && !selectedUnit) {
      setSelectedUnit(units[0].unit_name);
    }
  }, [units, selectedUnit]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.refetchQueries({ queryKey: ['analytics', selectedUnit, period] });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-enter space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Analytics</h1>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-0.5">Track views and visitors for your PWBUnits</p>
          </div>

          {/* Controls */}
          {units.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={refreshing || !selectedUnit}
                className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700
                  bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400
                  hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300
                  disabled:opacity-40 transition-colors"
                title="Refresh data"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              {/* Unit selector */}
              {units.length > 1 && (
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="text-sm rounded-lg border border-slate-200 dark:border-slate-700
                    bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300
                    px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                >
                  {units.map((u) => (
                    <option key={u.unit_name} value={u.unit_name}>
                      /{u.unit_name}
                    </option>
                  ))}
                </select>
              )}

              {/* Period selector */}
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      period === p.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Single unit label */}
        {units.length === 1 && selectedUnit && (
          <p className="text-xs text-slate-400 dark:text-slate-600 -mt-4">
            Showing data for <span className="font-mono text-slate-500 dark:text-slate-500">/{selectedUnit}</span>
          </p>
        )}

        {/* Content */}
        {unitsLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-slate-200 dark:bg-slate-800" />)}
            </div>
            <div className="h-64 rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
        ) : unitsError ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-slate-600 dark:text-slate-400 font-medium">Failed to load units</p>
            <p className="text-slate-400 dark:text-slate-600 text-sm mt-1">
              Please refresh the page.
            </p>
          </div>
        ) : units.length === 0 ? (
          <EmptyUnits />
        ) : selectedUnit ? (
          <AnalyticsContent unitName={selectedUnit} period={period} />
        ) : null}
      </div>
    </DashboardLayout>
  );
}
