'use client';

import { useEffect, useRef, useState } from 'react';
import { getPropertyDiagnosisReport, getProperties } from '../../api/client';
import DashboardLayout from '../../components/DashboardLayout';
import {
  MagnifyingGlassIcon,
  XCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChevronDownIcon,
  CheckIcon,
  CurrencyDollarIcon,
  BoltIcon,
  DocumentChartBarIcon,
  Squares2X2Icon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

interface DiagnosisEntry {
  action: string;
  condition: string;
  description: string;
}

interface DiagnosisData {
  month: string;
  status: string;
  property: { id: number; name: string };
  action_type: string;
  recommended_adr: number;
  diagnosis_reference: Record<string, DiagnosisEntry>;
}

interface Property {
  id: number;
  property_code: string;
  property_name: string;
  is_active: boolean;
}

type DropPos = { top: number; left: number; width: number };
type TabId = 'summary' | 'playbook';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
  { id: 'summary', label: 'Summary', Icon: Squares2X2Icon },
  { id: 'playbook', label: 'Reference Playbook', Icon: BookOpenIcon },
];

function calcPos(el: HTMLElement): DropPos {
  const r = el.getBoundingClientRect();
  return { top: r.bottom + 4, left: r.left, width: r.width };
}

function useFloatingClose(
  a: React.RefObject<HTMLElement | null>,
  b: React.RefObject<HTMLElement | null>,
  open: boolean,
  close: () => void,
) {
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!a.current?.contains(e.target as Node) && !b.current?.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, a, b, close]);
}

function PropertyDropdown({
  properties,
  loading,
  value,
  onChange,
}: {
  properties: Property[];
  loading: boolean;
  value: string;
  onChange: (id: string) => void;
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
      <button
        ref={triggerRef}
        type="button"
        disabled={loading}
        onClick={toggle}
        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 border rounded-lg text-sm transition-all ${
          open
            ? 'border-indigo-400 ring-2 ring-indigo-500/20 bg-white'
            : 'border-gray-200 bg-gray-50/60 hover:border-gray-300 hover:bg-white'
        } ${loading ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
      >
        <BuildingOffice2Icon className="w-4 h-4 text-slate-300 shrink-0" />
        {loading ? (
          <span className="flex items-center gap-2 text-slate-400 flex-1">
            <span className="w-3 h-3 border border-slate-300 border-t-transparent rounded-full animate-spin" />
            Loading...
          </span>
        ) : selected ? (
          <span className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-slate-900 font-medium truncate">{selected.property_name}</span>
            <span className="text-[0.6rem] font-mono font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded shrink-0">
              {selected.property_code}
            </span>
          </span>
        ) : (
          <span className="text-gray-300 flex-1">Select a property</span>
        )}
        <ChevronDownIcon
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            open ? '-rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden py-1"
        >
          <div className="max-h-52 overflow-y-auto">
            {properties.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-5">No properties available</p>
            ) : (
              properties.map(p => {
                const isSel = String(p.id) === value;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onChange(String(p.id));
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSel ? 'bg-indigo-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${isSel ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                      <BuildingOffice2Icon
                        className={`w-3.5 h-3.5 ${isSel ? 'text-indigo-600' : 'text-slate-400'}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold truncate leading-tight ${
                          isSel ? 'text-indigo-900' : 'text-slate-800'
                        }`}
                      >
                        {p.property_name}
                      </p>
                      <p className="text-[0.6rem] text-slate-400 mt-0.5">ID #{p.id}</p>
                    </div>
                    <span className="text-[0.6rem] font-mono font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded shrink-0">
                      {p.property_code}
                    </span>
                    {isSel && <CheckIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </>
  );
}

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

  const label = value ? MONTHS[parseInt(value, 10) - 1] : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 border rounded-lg text-sm transition-all cursor-pointer ${
          open
            ? 'border-indigo-400 ring-2 ring-indigo-500/20 bg-white'
            : 'border-gray-200 bg-gray-50/60 hover:border-gray-300 hover:bg-white'
        }`}
      >
        <CalendarDaysIcon className="w-4 h-4 text-slate-300 shrink-0" />
        <span className={`flex-1 text-left ${label ? 'text-slate-900 font-medium' : 'text-gray-300'}`}>
          {label ?? 'Select month'}
        </span>
        <ChevronDownIcon
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            open ? '-rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="bg-white border border-gray-100 rounded-xl shadow-xl p-2"
        >
          <div className="grid grid-cols-4 gap-1">
            {MONTHS.map((m, i) => {
              const v = String(i + 1);
              const isSel = value === v;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    onChange(v);
                    setOpen(false);
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                    isSel ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
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

function statusTheme(status: string) {
  switch (status?.toLowerCase()) {
    case 'on_track':
    case 'good':
      return {
        badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        tile: 'bg-emerald-50 border-emerald-100',
        accent: 'text-emerald-700',
        icon: CheckCircleIcon,
      };
    case 'at_risk':
    case 'out_of_range':
      return {
        badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
        tile: 'bg-amber-50 border-amber-100',
        accent: 'text-amber-700',
        icon: ExclamationTriangleIcon,
      };
    case 'off_track':
    case 'critical':
      return {
        badge: 'bg-red-500/10 text-red-300 border-red-500/20',
        tile: 'bg-red-50 border-red-100',
        accent: 'text-red-700',
        icon: XCircleIcon,
      };
    default:
      return {
        badge: 'bg-white/10 text-slate-300 border-white/10',
        tile: 'bg-slate-50 border-slate-100',
        accent: 'text-slate-700',
        icon: DocumentChartBarIcon,
      };
  }
}


function fmt(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function fmtMoney(value: number | null | undefined, digits = 0) {
  return `$${(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

function formatReportMonth(value: string) {
  const match = value?.match(/^(\d{4})-(\d{2})/);
  if (!match) return value;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const date = new Date(year, month, 1);

  return date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export default function DiagnosisReportPage() {
  const [propertyId, setPropertyId] = useState('');
  const [month, setMonth] = useState('');
  const [report, setReport] = useState<DiagnosisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('summary');

  useEffect(() => {
    getProperties()
      .then(data => {
        const arr: Property[] = Array.isArray(data) ? data : (data?.results ?? data?.data ?? []);
        setProperties(arr.filter(p => p.is_active));
      })
      .catch(() => {})
      .finally(() => setPropertiesLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setReport(null);
    setActiveTab('summary');

    try {
      const year = new Date().getFullYear();
      const formattedMonth = `${year}-${month.padStart(2, '0')}-01`;
      const response = await getPropertyDiagnosisReport({ property_id: propertyId, month: formattedMonth });
      if (response.data?.length > 0) {
        setReport(response.data[0]);
      } else {
        setError('No data found for the selected property and month.');
      }
    } catch {
      setError('Failed to generate report. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedProp = properties.find(p => String(p.id) === propertyId);
  const diagnosisEntries = Object.entries(report?.diagnosis_reference ?? {});
  const activeKey = report?.action_type?.toLowerCase() ?? '';
  const activeDiagnosis = activeKey ? report?.diagnosis_reference?.[activeKey] : undefined;
  const theme = report ? statusTheme(report.status) : null;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-[1.6rem] font-bold text-slate-900 font-headline tracking-tight leading-none mb-1">
          Diagnosis Reports
        </h1>
        <p className="text-sm text-slate-400">
          Review pricing health, active signals, and the next recommended move for each property.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-xl shadow-xs p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 min-w-0">
            <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Property
            </label>
            <PropertyDropdown
              properties={properties}
              loading={propertiesLoading}
              value={propertyId}
              onChange={setPropertyId}
            />
          </div>
          <div className="w-full sm:w-44 shrink-0">
            <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Month
            </label>
            <MonthPicker value={month} onChange={setMonth} />
          </div>
          <button
            type="submit"
            disabled={loading || !propertyId || !month}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <MagnifyingGlassIcon className="w-4 h-4" />
                Generate
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
          <XCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {!report && !error && (
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50/60 overflow-hidden">
          <div className="px-6 py-6 sm:px-7">
            <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-[0.22em] mb-2">
              Diagnosis Workspace
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-headline leading-tight max-w-2xl">
              Generate a report to see the active pricing signal, the recommended action, and the full diagnosis playbook.
            </h2>
            <p className="text-sm text-slate-500 mt-3 max-w-2xl">
              The diagnosis view is designed for fast decisions: a single report header for context, summary tiles for the
              key takeaways, and a reference tab for every available signal.
            </p>
          </div>

        </div>
      )}

      {report && theme && (
        <div>
          <div className="bg-slate-900 rounded-t-2xl px-6 pt-6 pb-0 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-56 h-56 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-32 w-72 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-[0.6rem] font-semibold text-slate-500 uppercase tracking-widest mb-1">
                  Diagnosis Report
                </p>
                <h2 className="text-2xl font-bold text-white font-headline leading-tight">
                  {report.property?.name || selectedProp?.property_name || `Property #${propertyId}`}
                </h2>
                <div className="flex items-center gap-2.5 mt-2 flex-wrap text-xs text-slate-400">
                  <span>
                    Period <span className="text-slate-200 font-medium">{formatReportMonth(report.month)}</span>
                  </span>
                  {report.property?.id ? (
                    <span>
                      Property ID <span className="text-slate-200 font-medium">#{report.property.id}</span>
                    </span>
                  ) : null}
                  {selectedProp?.property_code ? (
                    <span>
                      Code <span className="text-slate-200 font-medium">{selectedProp.property_code}</span>
                    </span>
                  ) : null}
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border shrink-0 ${theme.badge}`}
              >
                <theme.icon className="w-3.5 h-3.5" />
                {fmt(report.status)}
              </span>
            </div>

            <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-4 mb-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
                    <DocumentChartBarIcon className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      Active Condition
                    </p>
                    <p className="text-base font-semibold text-white">
                      {activeDiagnosis?.condition || fmt(report.action_type) || 'No active diagnosis matched'}
                    </p>
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                      {activeDiagnosis?.description ||
                        'The report returned an action type, but no matching diagnosis reference entry was found.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-400/20 shrink-0">
                      <BoltIcon className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                      <p className="text-[0.65rem] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        Action Type
                      </p>
                      <p className="text-lg font-bold text-white font-headline">{fmt(report.action_type)}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-400/20 shrink-0">
                      <CurrencyDollarIcon className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div>
                      <p className="text-[0.65rem] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                        Recommended ADR
                      </p>
                      <p className="text-lg font-bold text-white font-headline">{fmtMoney(report.recommended_adr, 2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex overflow-x-auto">
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                    activeTab === id
                      ? 'border-indigo-400 text-white'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 border-t-0 rounded-b-2xl overflow-hidden">
            {activeTab === 'summary' && (
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      label: 'Current Status',
                      value: fmt(report.status),
                      accent: theme.accent,
                      panel: theme.tile,
                    },
                    {
                      label: 'Action Type',
                      value: fmt(report.action_type),
                      accent: 'text-indigo-700',
                      panel: 'bg-indigo-50 border-indigo-100',
                    },
                    {
                      label: 'Recommended ADR',
                      value: fmtMoney(report.recommended_adr, 2),
                      accent: 'text-emerald-700',
                      panel: 'bg-emerald-50 border-emerald-100',
                    },
                    {
                      label: 'Signals Available',
                      value: String(diagnosisEntries.length),
                      accent: 'text-violet-700',
                      panel: 'bg-violet-50 border-violet-100',
                    },
                  ].map(({ label, value, accent, panel }) => (
                    <div key={label} className={`rounded-xl border p-4 ${panel}`}>
                      <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wide mb-2">{label}</p>
                      <p className={`text-xl sm:text-2xl font-bold font-headline leading-none ${accent}`}>{value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                        Active Diagnosis
                      </p>
                      <p className="text-lg font-bold text-slate-900 font-headline">
                        {activeDiagnosis?.condition || fmt(report.action_type)}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${theme.tile} ${theme.accent}`}>
                      <theme.icon className="w-3.5 h-3.5" />
                      Live signal
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {activeDiagnosis?.description ||
                      'No matching diagnosis reference entry was returned for the current action type.'}
                  </p>

                  <div className="mt-5 pt-4 border-t border-slate-200">
                    <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                      Recommended Action
                    </p>
                    <p className="text-sm font-semibold text-slate-900">{fmt(activeDiagnosis?.action || report.action_type)}</p>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'playbook' && (
              <div className="p-6">
                <div className="mb-5">
                  <p className="text-xs font-bold text-slate-700">Diagnosis Reference</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Compare each signal and use the highlighted card as the current recommendation anchor.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {diagnosisEntries.map(([key, val]) => {
                    const isActive = key === activeKey;
                    return (
                      <div
                        key={key}
                        className={`rounded-2xl border p-5 transition-all ${
                          isActive
                            ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200 shadow-sm'
                            : 'bg-white border-gray-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <span className={`text-sm font-bold ${isActive ? 'text-indigo-800' : 'text-slate-800'}`}>
                            {fmt(key)}
                          </span>
                          {isActive ? (
                            <span className="text-[0.6rem] font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                              Active signal
                            </span>
                          ) : (
                            <span className="text-[0.6rem] font-semibold text-slate-400 uppercase tracking-wide">
                              Reference
                            </span>
                          )}
                        </div>

                        <p className={`text-sm font-medium mb-2 ${isActive ? 'text-indigo-700' : 'text-slate-600'}`}>
                          {val.condition}
                        </p>
                        <p className={`text-sm leading-relaxed mb-4 ${isActive ? 'text-indigo-900' : 'text-slate-500'}`}>
                          {val.description}
                        </p>

                        <div className={`pt-4 border-t ${isActive ? 'border-indigo-200' : 'border-gray-100'}`}>
                          <p
                            className={`text-[0.65rem] font-semibold uppercase tracking-wide mb-1 ${
                              isActive ? 'text-indigo-400' : 'text-slate-400'
                            }`}
                          >
                            Action
                          </p>
                          <p className={`text-sm font-semibold ${isActive ? 'text-indigo-700' : 'text-slate-700'}`}>
                            {fmt(val.action)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
