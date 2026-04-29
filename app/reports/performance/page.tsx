'use client';

import { useEffect, useRef, useState } from 'react';
import { getPropertyPerformanceReport, getProperties } from '../../api/client';
import DashboardLayout from '../../components/DashboardLayout';
import {
  MagnifyingGlassIcon,
  XCircleIcon,
  CheckCircleIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChevronDownIcon,
  CheckIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  MoonIcon,
  Squares2X2Icon,
  ChartBarIcon,
  BoltIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PerformanceData {
  otb: { nights: number; revenue: number };
  kpis: {
    adr_gap: number;
    adr_ratio: { value: number; low_threshold: number; high_threshold: number };
    pace_ratio: { value: number; threshold: number };
    nights_pace_ratio: { value: number; low_threshold: number; high_threshold: number };
  };
  month: string;
  actual: { adr: number; nights_to_date: number; revenue_to_date: number };
  expected: {
    adr: number; occupancy: number; nights_month: number; revenue_month: number;
    nights_to_date: number; revenue_to_date: number;
  };
  forecast: {
    forecast_revenue: number; potential_revenue: number; forecast_vs_target: number;
    remaining_free_days: number; forecast_after_action: number; forecast_vs_target_pct: number;
  };
  property: { id: number; name: string };
  confidence: string;
  current_day: number;
  days_in_month: number;
  month_progress: number;
  data_validation: { is_valid: boolean; has_nights_data: boolean; has_revenue_data: boolean };
}

interface Property {
  id: number; property_code: string; property_name: string; is_active: boolean;
}

// ── Floating dropdown helpers ─────────────────────────────────────────────────

type DropPos = { top: number; left: number; width: number };
const calcPos = (el: HTMLElement): DropPos => {
  const r = el.getBoundingClientRect();
  return { top: r.bottom + 4, left: r.left, width: r.width };
};

function useFloatingClose(
  a: React.RefObject<HTMLElement | null>,
  b: React.RefObject<HTMLElement | null>,
  open: boolean,
  close: () => void,
) {
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!a.current?.contains(e.target as Node) && !b.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, a, b, close]);
}

// ── Property dropdown ─────────────────────────────────────────────────────────

function PropertyDropdown({ properties, loading, value, onChange }: {
  properties: Property[]; loading: boolean; value: string; onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropPos>({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useFloatingClose(triggerRef, panelRef, open, () => setOpen(false));

  const toggle = () => {
    if (!open && triggerRef.current) setPos(calcPos(triggerRef.current));
    setOpen(v => !v);
  };
  const selected = properties.find(p => String(p.id) === value);

  return (
    <>
      <button ref={triggerRef} type="button" disabled={loading} onClick={toggle}
        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 border rounded-lg text-sm transition-all ${open ? 'border-indigo-400 ring-2 ring-indigo-500/20 bg-white' : 'border-gray-200 bg-gray-50/60 hover:border-gray-300 hover:bg-white'} ${loading ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
      >
        <BuildingOffice2Icon className="w-4 h-4 text-slate-300 shrink-0" />
        {loading ? (
          <span className="flex items-center gap-2 text-slate-400 flex-1">
            <span className="w-3 h-3 border border-slate-300 border-t-transparent rounded-full animate-spin" />Loading…
          </span>
        ) : selected ? (
          <span className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-slate-900 font-medium truncate">{selected.property_name}</span>
            <span className="text-[0.6rem] font-mono font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded shrink-0">{selected.property_code}</span>
          </span>
        ) : <span className="text-gray-300 flex-1">Select a property</span>}
        <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${open ? '-rotate-180' : ''}`} />
      </button>
      {open && (
        <div ref={panelRef} style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden py-1">
          <div className="max-h-52 overflow-y-auto">
            {properties.length === 0
              ? <p className="text-xs text-slate-400 text-center py-5">No properties available</p>
              : properties.map(p => {
                const isSel = String(p.id) === value;
                return (
                  <button key={p.id} type="button" onClick={() => { onChange(String(p.id)); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isSel ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                    <div className={`p-1.5 rounded-lg shrink-0 ${isSel ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                      <BuildingOffice2Icon className={`w-3.5 h-3.5 ${isSel ? 'text-indigo-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate leading-tight ${isSel ? 'text-indigo-900' : 'text-slate-800'}`}>{p.property_name}</p>
                      <p className="text-[0.6rem] text-slate-400 mt-0.5">ID #{p.id}</p>
                    </div>
                    <span className="text-[0.6rem] font-mono font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded shrink-0">{p.property_code}</span>
                    {isSel && <CheckIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </>
  );
}

// ── Month picker ──────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function MonthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropPos>({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  useFloatingClose(triggerRef, panelRef, open, () => setOpen(false));

  const toggle = () => {
    if (!open && triggerRef.current) setPos(calcPos(triggerRef.current));
    setOpen(v => !v);
  };
  const label = value ? MONTHS[parseInt(value) - 1] : null;

  return (
    <>
      <button ref={triggerRef} type="button" onClick={toggle}
        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 border rounded-lg text-sm transition-all cursor-pointer ${open ? 'border-indigo-400 ring-2 ring-indigo-500/20 bg-white' : 'border-gray-200 bg-gray-50/60 hover:border-gray-300 hover:bg-white'}`}>
        <CalendarDaysIcon className="w-4 h-4 text-slate-300 shrink-0" />
        <span className={`flex-1 text-left ${label ? 'text-slate-900 font-medium' : 'text-gray-300'}`}>{label ?? 'Select month'}</span>
        <ChevronDownIcon className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${open ? '-rotate-180' : ''}`} />
      </button>
      {open && (
        <div ref={panelRef} style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="bg-white border border-gray-100 rounded-xl shadow-xl p-2">
          <div className="grid grid-cols-4 gap-1">
            {MONTHS.map((m, i) => {
              const v = String(i + 1);
              const isSel = value === v;
              return (
                <button key={m} type="button" onClick={() => { onChange(v); setOpen(false); }}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors ${isSel ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}`}>
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt$ = (v: number) => `$${(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fmt$2 = (v: number) => `$${(v ?? 0).toFixed(2)}`;
const posneg = (v: number) => v >= 0 ? 'text-emerald-600' : 'text-red-500';

function confidenceMeta(c: string) {
  switch (c) {
    case 'HIGH': return { label: 'High Confidence', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' };
    case 'MEDIUM': return { label: 'Med. Confidence', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' };
    default: return { label: 'Low Confidence', cls: 'bg-white/10 text-slate-400 border-white/10', dot: 'bg-slate-500' };
  }
}

// ── Range bar (KPI visual) ────────────────────────────────────────────────────

function RangeBar({ value, low, high }: { value: number; low: number; high: number }) {
  const span = high - low || 1;
  const pct = Math.min(100, Math.max(0, ((value - low) / span) * 100));
  const inRange = value >= low && value <= high;
  return (
    <div className="mt-4">
      <div className="relative h-1.5 bg-gray-200 rounded-full">
        <div className={`absolute h-full rounded-full transition-all ${inRange ? 'bg-emerald-400' : 'bg-amber-400'}`}
          style={{ width: `${pct}%` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm"
          style={{ left: `calc(${pct}% - 6px)`, background: inRange ? '#34d399' : '#fbbf24' }} />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[0.6rem] text-slate-400 font-medium">{low}</span>
        <span className="text-[0.6rem] text-slate-400 font-medium">{high}</span>
      </div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'performance' | 'forecast' | 'otb';
const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
  { id: 'overview',     label: 'Overview',      Icon: Squares2X2Icon },
  { id: 'performance',  label: 'Performance',   Icon: ChartBarIcon },
  { id: 'forecast',     label: 'Forecast',      Icon: BoltIcon },
  { id: 'otb',          label: 'On the Books',  Icon: BookOpenIcon },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PerformanceReportPage() {
  const [propertyId, setPropertyId] = useState('');
  const [month, setMonth] = useState('');
  const [report, setReport] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  useEffect(() => {
    getProperties()
      .then(data => {
        const arr: Property[] = Array.isArray(data) ? data : (data?.results ?? data?.data ?? []);
        setProperties(arr.filter((p: Property) => p.is_active));
      })
      .catch(() => {})
      .finally(() => setPropertiesLoading(false));
  }, []);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setReport(null);
    setActiveTab('overview');
    try {
      const year = new Date().getFullYear();
      const formattedMonth = `${year}-${month.padStart(2, '0')}-01`;
      const response = await getPropertyPerformanceReport({ property_id: propertyId, month: formattedMonth });
      if (response.data) setReport(response.data);
      else setError('No data found for the selected property and month.');
    } catch {
      setError('Failed to generate performance report. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  const conf = report ? confidenceMeta(report.confidence) : null;
  const selectedProp = properties.find(p => String(p.id) === propertyId);

  return (
    <DashboardLayout>
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-[1.6rem] font-bold text-slate-900 font-headline tracking-tight leading-none mb-1">
          Performance Reports
        </h1>
        <p className="text-sm text-slate-400">Revenue, KPI, and forecast analysis for your properties.</p>
      </div>

      {/* ── Filter bar ── */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-xl shadow-xs p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 min-w-0">
            <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Property</label>
            <PropertyDropdown properties={properties} loading={propertiesLoading} value={propertyId} onChange={setPropertyId} />
          </div>
          <div className="w-full sm:w-44 shrink-0">
            <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Month</label>
            <MonthPicker value={month} onChange={setMonth} />
          </div>
          <button type="submit" disabled={loading || !propertyId || !month}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating…
              </>
            ) : (
              <><MagnifyingGlassIcon className="w-4 h-4" />Generate</>
            )}
          </button>
        </div>
      </form>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
          <XCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />{error}
        </div>
      )}

      {/* ── Empty state ── */}
      {!report && !error && (
        <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 via-white to-indigo-50/60 overflow-hidden">
          <div className="px-6 py-6 sm:px-7">
            <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-[0.22em] mb-2">
              Performance Workspace
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-headline leading-tight max-w-2xl">
              Select a property and month to generate a full revenue, KPI, and forecast report.
            </h2>
            <p className="text-sm text-slate-500 mt-3 max-w-2xl">
              The report breaks down actual vs. expected performance, KPI thresholds, month-end
              forecast, and confirmed on-the-books revenue — all in one view.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-px bg-slate-200/70">
            {[
              {
                title: 'Revenue Overview',
                copy: 'Actual revenue and nights to date compared against expected targets.',
                Icon: CurrencyDollarIcon,
                tone: 'text-emerald-600 bg-emerald-50',
              },
              {
                title: 'KPI Analysis',
                copy: 'Pace ratio, ADR gap, and threshold bands that show where performance stands.',
                Icon: ChartBarIcon,
                tone: 'text-indigo-600 bg-indigo-50',
              },
              {
                title: 'Forecast',
                copy: 'Month-end revenue projection, forecast vs. target variance, and after-action estimate.',
                Icon: BoltIcon,
                tone: 'text-violet-600 bg-violet-50',
              },
              {
                title: 'On the Books',
                copy: 'Confirmed bookings — OTB nights and revenue locked in for the period.',
                Icon: BookOpenIcon,
                tone: 'text-amber-600 bg-amber-50',
              },
            ].map(({ title, copy, Icon, tone }) => (
              <div key={title} className="bg-white p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-slate-900 mt-4">{title}</p>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Report ── */}
      {report && (
        <div>
          {/* ── Dark header card ── */}
          <div className="bg-slate-900 rounded-t-2xl px-6 pt-6 pb-0 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-56 h-56 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-40 w-72 h-28 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />

            {/* Property info row */}
            <div className="relative flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-[0.6rem] font-semibold text-slate-500 uppercase tracking-widest mb-1">Performance Report</p>
                <h2 className="text-2xl font-bold text-white font-headline leading-tight">
                  {report.property?.name || selectedProp?.property_name || `Property #${propertyId}`}
                </h2>
                <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                  <span className="text-xs text-slate-400">
                    Period <span className="text-slate-200 font-medium">{report.month}</span>
                  </span>
                  {report.property?.id && <>
                    <span className="text-slate-700">·</span>
                    <span className="text-xs text-slate-400">ID <span className="text-slate-200 font-medium">#{report.property.id}</span></span>
                  </>}
                  <span className="text-slate-700">·</span>
                  <span className="text-xs text-slate-400">
                    Day <span className="text-slate-200 font-medium">{report.current_day}</span>
                    {' '}of{' '}
                    <span className="text-slate-200 font-medium">{report.days_in_month}</span>
                  </span>
                </div>
              </div>
              {conf && (
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${conf.cls} shrink-0`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                  {conf.label}
                </span>
              )}
            </div>

            {/* Month progress */}
            <div className="relative mb-5">
              <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-400 rounded-full transition-all"
                  style={{ width: `${Math.min(report.month_progress ?? 0, 100)}%` }} />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[0.6rem] text-slate-500">{(report.month_progress ?? 0).toFixed(1)}% complete</span>
                <span className="text-[0.6rem] text-slate-500">{Math.max(0, report.days_in_month - report.current_day)} days left</span>
              </div>
            </div>

            {/* ── Tab nav (inside dark card) ── */}
            <div className="relative flex overflow-x-auto">
              {TABS.map(({ id, label, Icon }) => (
                <button key={id} type="button" onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                    activeTab === id
                      ? 'border-indigo-400 text-white'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab content ── */}
          <div className="bg-white border border-gray-100 border-t-0 rounded-b-2xl overflow-hidden">

            {/* ╌ Overview ╌ */}
            {activeTab === 'overview' && (
              <div className="p-6 space-y-5">

                {/* 4 summary stat tiles */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Revenue to Date',  value: fmt$(report.actual?.revenue_to_date),              accent: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-100' },
                    { label: 'Nights to Date',   value: String(report.actual?.nights_to_date ?? 0),        accent: 'text-indigo-600',  bg: 'bg-indigo-50',   border: 'border-indigo-100' },
                    { label: 'Actual ADR',        value: fmt$2(report.actual?.adr),                         accent: 'text-violet-600',  bg: 'bg-violet-50',   border: 'border-violet-100' },
                    { label: 'Exp. Occupancy',   value: `${(report.expected?.occupancy ?? 0).toFixed(1)}%`, accent: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-100' },
                  ].map(({ label, value, accent, bg, border }) => (
                    <div key={label} className={`${bg} border ${border} rounded-xl p-4`}>
                      <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wide mb-2">{label}</p>
                      <p className={`text-2xl font-bold font-headline leading-none tabular-nums ${accent}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Data validation */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 flex items-center gap-3 flex-wrap">
                  <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wide mr-1">Data Checks</p>
                  {[
                    { label: 'Data Valid',  ok: report.data_validation?.is_valid },
                    { label: 'Has Nights', ok: report.data_validation?.has_nights_data },
                    { label: 'Has Revenue', ok: report.data_validation?.has_revenue_data },
                  ].map(({ label, ok }) => (
                    <span key={label} className={`inline-flex items-center gap-1 text-[0.65rem] font-semibold px-2.5 py-1 rounded-full border ${ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                      {ok ? <CheckCircleIcon className="w-3 h-3" /> : <XCircleIcon className="w-3 h-3" />}
                      {label}
                    </span>
                  ))}
                </div>

                {/* Actual vs Expected */}
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-3">Actual vs Expected</p>
                  <div className="space-y-2">
                    {[
                      {
                        label: 'ADR',
                        actual: fmt$2(report.actual?.adr),
                        expected: fmt$2(report.expected?.adr),
                        d: (report.actual?.adr ?? 0) - (report.expected?.adr ?? 0),
                        fmtD: (v: number) => `${v >= 0 ? '+' : ''}$${Math.abs(v).toFixed(2)}`,
                      },
                      {
                        label: 'Nights to Date',
                        actual: String(report.actual?.nights_to_date ?? 0),
                        expected: String(report.expected?.nights_to_date ?? 0),
                        d: (report.actual?.nights_to_date ?? 0) - (report.expected?.nights_to_date ?? 0),
                        fmtD: (v: number) => `${v >= 0 ? '+' : ''}${Math.round(v)}`,
                      },
                      {
                        label: 'Revenue to Date',
                        actual: fmt$(report.actual?.revenue_to_date),
                        expected: fmt$(report.expected?.revenue_to_date),
                        d: (report.actual?.revenue_to_date ?? 0) - (report.expected?.revenue_to_date ?? 0),
                        fmtD: (v: number) => `${v >= 0 ? '+' : '-'}${fmt$(Math.abs(v))}`,
                      },
                    ].map(row => (
                      <div key={row.label} className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                        <p className="flex-1 text-xs font-medium text-slate-600">{row.label}</p>
                        <div className="text-right">
                          <p className="text-[0.6rem] text-slate-400 mb-0.5">Actual</p>
                          <p className="text-sm font-bold text-slate-900 tabular-nums">{row.actual}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[0.6rem] text-slate-400 mb-0.5">Expected</p>
                          <p className="text-sm text-slate-500 tabular-nums">{row.expected}</p>
                        </div>
                        <div className="text-right w-16 shrink-0">
                          <p className="text-[0.6rem] text-slate-400 mb-0.5">Delta</p>
                          <p className={`text-xs font-bold tabular-nums ${posneg(row.d)}`}>{row.fmtD(row.d)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ╌ Performance ╌ */}
            {activeTab === 'performance' && (
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Pace Ratio */}
                  {(() => {
                    const v = report.kpis?.pace_ratio?.value ?? 0;
                    const t = report.kpis?.pace_ratio?.threshold ?? 1;
                    const ok = v >= t;
                    return (
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wide">Pace Ratio</p>
                          <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${ok ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {ok ? 'On Track' : 'Below Target'}
                          </span>
                        </div>
                        <p className={`text-4xl font-bold font-headline tabular-nums ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>{v.toFixed(3)}</p>
                        <p className="text-xs text-slate-400 mt-1">Threshold <span className="font-semibold text-slate-600">{t}</span></p>
                        <div className="mt-4">
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${ok ? 'bg-emerald-400' : 'bg-amber-400'}`}
                              style={{ width: `${Math.min(100, (v / (t * 1.5)) * 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ADR Gap */}
                  {(() => {
                    const v = report.kpis?.adr_gap ?? 0;
                    const ok = v >= 0;
                    return (
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wide">ADR Gap</p>
                          <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${ok ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                            {ok ? 'Above Expected' : 'Below Expected'}
                          </span>
                        </div>
                        <p className={`text-4xl font-bold font-headline tabular-nums ${posneg(v)}`}>
                          {v >= 0 ? '+' : ''}{fmt$2(v)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">vs expected ADR</p>
                      </div>
                    );
                  })()}

                  {/* Nights Pace Ratio */}
                  {(() => {
                    const v = report.kpis?.nights_pace_ratio?.value ?? 0;
                    const lo = report.kpis?.nights_pace_ratio?.low_threshold ?? 0;
                    const hi = report.kpis?.nights_pace_ratio?.high_threshold ?? 1;
                    const ok = v >= lo && v <= hi;
                    return (
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wide">Nights Pace Ratio</p>
                          <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${ok ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {ok ? 'In Range' : 'Out of Range'}
                          </span>
                        </div>
                        <p className={`text-4xl font-bold font-headline tabular-nums ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>{v.toFixed(3)}</p>
                        <p className="text-xs text-slate-400 mt-1">Range <span className="font-semibold text-slate-600">{lo} – {hi}</span></p>
                        <RangeBar value={v} low={lo} high={hi} />
                      </div>
                    );
                  })()}

                  {/* ADR Ratio */}
                  {(() => {
                    const v = report.kpis?.adr_ratio?.value ?? 0;
                    const lo = report.kpis?.adr_ratio?.low_threshold ?? 0;
                    const hi = report.kpis?.adr_ratio?.high_threshold ?? 1;
                    const ok = v >= lo && v <= hi;
                    return (
                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wide">ADR Ratio</p>
                          <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${ok ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {ok ? 'In Range' : 'Out of Range'}
                          </span>
                        </div>
                        <p className={`text-4xl font-bold font-headline tabular-nums ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>{v.toFixed(3)}</p>
                        <p className="text-xs text-slate-400 mt-1">Range <span className="font-semibold text-slate-600">{lo} – {hi}</span></p>
                        <RangeBar value={v} low={lo} high={hi} />
                      </div>
                    );
                  })()}

                </div>
              </div>
            )}

            {/* ╌ Forecast ╌ */}
            {activeTab === 'forecast' && (
              <div className="p-6 space-y-4">

                {/* Big three revenue figures */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Expected',  value: fmt$(report.expected?.revenue_month),     sub: 'Full-month target',   accent: 'text-slate-800',   bg: 'bg-gray-50',     border: 'border-gray-100' },
                    { label: 'Forecast',  value: fmt$(report.forecast?.forecast_revenue),  sub: 'Projected revenue',   accent: 'text-indigo-700',  bg: 'bg-indigo-50',   border: 'border-indigo-100' },
                    { label: 'Potential', value: fmt$(report.forecast?.potential_revenue), sub: 'Max upside',          accent: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-100' },
                  ].map(({ label, value, sub, accent, bg, border }) => (
                    <div key={label} className={`${bg} border ${border} rounded-xl p-5`}>
                      <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wide mb-3">{label}</p>
                      <p className={`text-xl font-bold font-headline tabular-nums leading-none ${accent}`}>{value}</p>
                      <p className="text-xs text-slate-400 mt-1.5">{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Forecast vs Target variance card */}
                {(() => {
                  const v = report.forecast?.forecast_vs_target ?? 0;
                  const pct = report.forecast?.forecast_vs_target_pct ?? 0;
                  const ok = v >= 0;
                  return (
                    <div className={`rounded-xl p-5 border ${ok ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                      <div className="flex items-end justify-between mb-4">
                        <div>
                          <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Forecast vs Target</p>
                          <p className={`text-3xl font-bold font-headline tabular-nums ${ok ? 'text-emerald-700' : 'text-red-600'}`}>
                            {v >= 0 ? '+' : ''}{fmt$(v)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Variance</p>
                          <p className={`text-3xl font-bold font-headline ${ok ? 'text-emerald-700' : 'text-red-600'}`}>
                            {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${ok ? 'bg-emerald-500' : 'bg-red-400'}`}
                          style={{ width: `${Math.min(100, Math.abs(pct))}%` }} />
                      </div>
                    </div>
                  );
                })()}

                {/* Remaining days + After action */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Remaining Days</p>
                      <p className="text-3xl font-bold font-headline text-slate-900 tabular-nums">{report.forecast?.remaining_free_days}</p>
                    </div>
                    <MoonIcon className="w-8 h-8 text-slate-100" />
                  </div>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <p className="text-[0.65rem] font-semibold text-indigo-300 uppercase tracking-wide mb-1.5">After Action</p>
                      <p className="text-3xl font-bold font-headline text-indigo-700 tabular-nums">{fmt$(report.forecast?.forecast_after_action)}</p>
                    </div>
                    <ArrowTrendingUpIcon className="w-8 h-8 text-indigo-200" />
                  </div>
                </div>
              </div>
            )}

            {/* ╌ On the Books ╌ */}
            {activeTab === 'otb' && (
              <div className="p-6">
                <p className="text-xs text-slate-400 mb-5">Currently confirmed bookings on the books.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-violet-50 border border-violet-100 rounded-2xl p-7 flex items-center gap-6">
                    <div className="p-4 bg-violet-100 rounded-2xl shrink-0">
                      <MoonIcon className="w-7 h-7 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-[0.65rem] font-semibold text-violet-400 uppercase tracking-wide mb-1.5">OTB Nights</p>
                      <p className="text-5xl font-bold font-headline text-violet-700 tabular-nums leading-none">{report.otb?.nights ?? 0}</p>
                      <p className="text-xs text-violet-400 mt-2">nights confirmed</p>
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-7 flex items-center gap-6">
                    <div className="p-4 bg-emerald-100 rounded-2xl shrink-0">
                      <CurrencyDollarIcon className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[0.65rem] font-semibold text-emerald-400 uppercase tracking-wide mb-1.5">OTB Revenue</p>
                      <p className="text-4xl font-bold font-headline text-emerald-700 tabular-nums leading-none">{fmt$(report.otb?.revenue)}</p>
                      <p className="text-xs text-emerald-400 mt-2">revenue confirmed</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
