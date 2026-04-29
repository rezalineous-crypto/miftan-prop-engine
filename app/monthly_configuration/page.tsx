'use client';

import { useEffect, useRef, useState } from 'react';
import {
  getPropertyMonthlyConfig,
  createPropertyMonthlyConfig,
  getProperties,
  userDataClient,
} from '../api/client';
import DashboardLayout from '../components/DashboardLayout';
import {
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ChevronDownIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
  CheckCircleIcon,
  PlusIcon,
  CurrencyDollarIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';

interface Property {
  id: number;
  property_code: string;
  property_name: string;
  is_active: boolean;
}

interface MonthlyConfig {
  id?: number;
  property_id: number;
  year: number;
  month: number;
  market_adr: number;
  market_occupancy: number;
  paf: number;
  pace_threshold: number;
  nights_low_threshold: number;
  nights_high_threshold: number;
  adr_low_threshold: number;
  adr_high_threshold: number;
  early_month_guard_days: number;
  created_by: number;
  remarks: string;
}

interface FormState {
  property_id: string;
  year: string;
  month: string;
  market_adr: string;
  market_occupancy: string;
  paf: string;
  pace_threshold: string;
  nights_low_threshold: string;
  nights_high_threshold: string;
  adr_low_threshold: string;
  adr_high_threshold: string;
  early_month_guard_days: string;
  remarks: string;
}

type TabId = 'lookup' | 'create';
type DropPos = { top: number; left: number; width: number };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const CURRENT_YEAR = new Date().getFullYear();

const INPUT_CLS =
  'w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50/60 hover:border-gray-300 hover:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white outline-none transition-all';

const EMPTY_FORM: FormState = {
  property_id: '',
  year: String(CURRENT_YEAR),
  month: '',
  market_adr: '',
  market_occupancy: '',
  paf: '',
  pace_threshold: '',
  nights_low_threshold: '',
  nights_high_threshold: '',
  adr_low_threshold: '',
  adr_high_threshold: '',
  early_month_guard_days: '',
  remarks: '',
};

const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
  { id: 'lookup', label: 'Look Up', Icon: MagnifyingGlassIcon },
  { id: 'create', label: 'Create Config', Icon: PlusIcon },
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
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${open ? '-rotate-180' : ''}`}
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
                      <BuildingOffice2Icon className={`w-3.5 h-3.5 ${isSel ? 'text-indigo-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate leading-tight ${isSel ? 'text-indigo-900' : 'text-slate-800'}`}>
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
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${open ? '-rotate-180' : ''}`}
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

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function MonthlyConfigurationPage() {
  const [activeTab, setActiveTab] = useState<TabId>('lookup');
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);

  const [lookupPropertyId, setLookupPropertyId] = useState('');
  const [lookupYear, setLookupYear] = useState(String(CURRENT_YEAR));
  const [lookupMonth, setLookupMonth] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [config, setConfig] = useState<MonthlyConfig | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState(false);

  useEffect(() => {
    getProperties()
      .then(data => {
        const arr: Property[] = Array.isArray(data) ? data : (data?.results ?? data?.data ?? []);
        setProperties(arr.filter((p: Property) => p.is_active));
      })
      .catch(() => {})
      .finally(() => setPropertiesLoading(false));
  }, []);

  const handleLookup = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLookupLoading(true);
    setLookupError('');
    setConfig(null);
    try {
      const response = await getPropertyMonthlyConfig({
        property_id: lookupPropertyId,
        year: lookupYear,
        month: lookupMonth,
      });
      const list: MonthlyConfig[] = Array.isArray(response)
        ? response
        : (response?.data ?? response?.results ?? (response && typeof response === 'object' ? [response] : []));
      if (list.length > 0) {
        setConfig(list[0]);
      } else {
        setLookupError('No configuration found for the selected property, year, and month.');
      }
    } catch {
      setLookupError('Failed to fetch configuration. Please check your inputs and try again.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCreate = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    setCreateSuccess(false);
    try {
      await createPropertyMonthlyConfig({
        property_id: parseInt(form.property_id),
        year: parseInt(form.year),
        month: parseInt(form.month),
        market_adr: parseFloat(form.market_adr),
        market_occupancy: parseFloat(form.market_occupancy),
        paf: parseFloat(form.paf),
        pace_threshold: parseFloat(form.pace_threshold),
        nights_low_threshold: parseInt(form.nights_low_threshold),
        nights_high_threshold: parseInt(form.nights_high_threshold),
        adr_low_threshold: parseFloat(form.adr_low_threshold),
        adr_high_threshold: parseFloat(form.adr_high_threshold),
        early_month_guard_days: parseInt(form.early_month_guard_days),
        created_by: userDataClient.getUserId() ?? 0,
        remarks: form.remarks,
      });
      setCreateSuccess(true);
      setForm(EMPTY_FORM);
    } catch {
      setCreateError('Failed to create configuration. Please check your inputs and try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const setField =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  const selectedLookupProp = properties.find(p => String(p.id) === lookupPropertyId);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-[1.6rem] font-bold text-slate-900 font-headline tracking-tight leading-none mb-1">
          Monthly Configuration
        </h1>
        <p className="text-sm text-slate-400">
          Manage per-property market benchmarks and pricing thresholds for each month.
        </p>
      </div>

      <div className="flex border-b border-gray-100 mb-6">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'lookup' && (
        <>
          <form
            onSubmit={handleLookup}
            className="bg-white border border-gray-100 rounded-xl shadow-xs p-4 mb-6"
          >
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 min-w-0">
                <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Property
                </label>
                <PropertyDropdown
                  properties={properties}
                  loading={propertiesLoading}
                  value={lookupPropertyId}
                  onChange={setLookupPropertyId}
                />
              </div>
              <div className="w-full sm:w-32 shrink-0">
                <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Year
                </label>
                <input
                  type="number"
                  value={lookupYear}
                  onChange={e => setLookupYear(e.target.value)}
                  min={2000}
                  max={2100}
                  required
                  className={INPUT_CLS}
                  placeholder="2025"
                />
              </div>
              <div className="w-full sm:w-40 shrink-0">
                <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Month
                </label>
                <MonthPicker value={lookupMonth} onChange={setLookupMonth} />
              </div>
              <button
                type="submit"
                disabled={lookupLoading || !lookupPropertyId || !lookupYear || !lookupMonth}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {lookupLoading ? (
                  <><Spinner /> Fetching...</>
                ) : (
                  <><MagnifyingGlassIcon className="w-4 h-4" /> Look Up</>
                )}
              </button>
            </div>
          </form>

          {lookupError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
              <XCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
              {lookupError}
            </div>
          )}

          {!config && !lookupError && (
            <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 via-white to-indigo-50/60 overflow-hidden">
              <div className="px-6 py-6 sm:px-7">
                <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-[0.22em] mb-2">
                  Configuration Lookup
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-headline leading-tight max-w-2xl">
                  Select a property, year, and month to retrieve its monthly pricing configuration.
                </h2>
                <p className="text-sm text-slate-500 mt-3 max-w-2xl">
                  Monthly configurations store market benchmarks and pricing thresholds used by the diagnosis engine
                  to evaluate property performance.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-200/70">
                {[
                  {
                    title: 'Market Benchmarks',
                    copy: 'ADR and occupancy benchmarks for the target month and property.',
                    Icon: CurrencyDollarIcon,
                    tone: 'text-emerald-600 bg-emerald-50',
                  },
                  {
                    title: 'Performance Factors',
                    copy: 'PAF and pace threshold settings that drive the diagnosis engine.',
                    Icon: AdjustmentsHorizontalIcon,
                    tone: 'text-indigo-600 bg-indigo-50',
                  },
                  {
                    title: 'Threshold Bands',
                    copy: 'Night count and ADR ranges used to categorize performance level.',
                    Icon: ShieldCheckIcon,
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

          {config && (
            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              <div className="bg-slate-900 px-6 py-5 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-56 h-56 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                  <p className="text-[0.6rem] font-semibold text-slate-500 uppercase tracking-widest mb-1">
                    Monthly Configuration
                  </p>
                  <h2 className="text-2xl font-bold text-white font-headline leading-tight">
                    {selectedLookupProp?.property_name || `Property #${config.property_id}`}
                  </h2>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-slate-400">
                      Period{' '}
                      <span className="text-slate-200 font-medium">
                        {MONTH_FULL[(config.month ?? 1) - 1]} {config.year}
                      </span>
                    </span>
                    {selectedLookupProp?.property_code && (
                      <span className="text-[0.6rem] font-mono font-bold text-indigo-400 bg-indigo-900/40 border border-indigo-700/30 px-2 py-1 rounded">
                        {selectedLookupProp.property_code}
                      </span>
                    )}
                    {config.id && (
                      <span className="text-xs text-slate-400">
                        Config ID <span className="text-slate-200 font-medium">#{config.id}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-emerald-50">
                      <CurrencyDollarIcon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Market Benchmarks</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                      <p className="text-[0.65rem] font-semibold text-emerald-500 uppercase tracking-wide mb-1.5">
                        Market ADR
                      </p>
                      <p className="text-2xl font-bold font-headline text-emerald-700">
                        ${(config.market_adr ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
                      <p className="text-[0.65rem] font-semibold text-teal-500 uppercase tracking-wide mb-1.5">
                        Market Occupancy
                      </p>
                      <p className="text-2xl font-bold font-headline text-teal-700">
                        {((config.market_occupancy ?? 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-indigo-50">
                      <AdjustmentsHorizontalIcon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Performance Factors</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                      <p className="text-[0.65rem] font-semibold text-indigo-500 uppercase tracking-wide mb-1.5">PAF</p>
                      <p className="text-2xl font-bold font-headline text-indigo-700">{config.paf}</p>
                    </div>
                    <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
                      <p className="text-[0.65rem] font-semibold text-violet-500 uppercase tracking-wide mb-1.5">
                        Pace Threshold
                      </p>
                      <p className="text-2xl font-bold font-headline text-violet-700">{config.pace_threshold}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-amber-50">
                      <ShieldCheckIcon className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Threshold Bands</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Nights Low', value: String(config.nights_low_threshold), cls: 'bg-slate-50 border-slate-100', txt: 'text-slate-700', lbl: 'text-slate-400' },
                      { label: 'Nights High', value: String(config.nights_high_threshold), cls: 'bg-slate-50 border-slate-100', txt: 'text-slate-700', lbl: 'text-slate-400' },
                      { label: 'ADR Low', value: `$${(config.adr_low_threshold ?? 0).toLocaleString()}`, cls: 'bg-amber-50 border-amber-100', txt: 'text-amber-700', lbl: 'text-amber-500' },
                      { label: 'ADR High', value: `$${(config.adr_high_threshold ?? 0).toLocaleString()}`, cls: 'bg-amber-50 border-amber-100', txt: 'text-amber-700', lbl: 'text-amber-500' },
                    ].map(({ label, value, cls, txt, lbl }) => (
                      <div key={label} className={`border rounded-xl p-4 ${cls}`}>
                        <p className={`text-[0.65rem] font-semibold uppercase tracking-wide mb-1.5 ${lbl}`}>{label}</p>
                        <p className={`text-xl font-bold font-headline ${txt}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                      Early Month Guard Days
                    </p>
                    <p className="text-xl font-bold font-headline text-slate-700">
                      {config.early_month_guard_days} days
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Remarks</p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {config.remarks || <span className="text-slate-300 italic">No remarks</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'create' && (
        <>
          {createSuccess && (
            <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl mb-6">
              <CheckCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
              Configuration created successfully.
            </div>
          )}

          {createError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
              <XCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
              {createError}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-5">
            <div className="bg-white border border-gray-100 rounded-xl shadow-xs p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-slate-100">
                  <BuildingOffice2Icon className="w-4 h-4 text-slate-600" />
                </div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Target</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Property
                  </label>
                  <PropertyDropdown
                    properties={properties}
                    loading={propertiesLoading}
                    value={form.property_id}
                    onChange={id => setForm(prev => ({ ...prev, property_id: id }))}
                  />
                </div>
                <div>
                  <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Year
                  </label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={setField('year')}
                    min={2000}
                    max={2100}
                    required
                    className={INPUT_CLS}
                    placeholder="2025"
                  />
                </div>
                <div>
                  <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Month
                  </label>
                  <MonthPicker value={form.month} onChange={v => setForm(prev => ({ ...prev, month: v }))} />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl shadow-xs p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-emerald-50">
                  <CurrencyDollarIcon className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Market Benchmarks</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Market ADR ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.market_adr}
                    onChange={setField('market_adr')}
                    required
                    className={INPUT_CLS}
                    placeholder="120.50"
                  />
                </div>
                <div>
                  <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Market Occupancy (0–1)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={form.market_occupancy}
                    onChange={setField('market_occupancy')}
                    required
                    className={INPUT_CLS}
                    placeholder="0.85"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl shadow-xs p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-indigo-50">
                  <AdjustmentsHorizontalIcon className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Performance Factors</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    PAF
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.paf}
                    onChange={setField('paf')}
                    required
                    className={INPUT_CLS}
                    placeholder="1.20"
                  />
                </div>
                <div>
                  <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Pace Threshold
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.pace_threshold}
                    onChange={setField('pace_threshold')}
                    required
                    className={INPUT_CLS}
                    placeholder="0.90"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl shadow-xs p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-slate-100">
                  <MoonIcon className="w-4 h-4 text-slate-600" />
                </div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Night Thresholds</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Nights Low Threshold
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={form.nights_low_threshold}
                    onChange={setField('nights_low_threshold')}
                    required
                    className={INPUT_CLS}
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Nights High Threshold
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={form.nights_high_threshold}
                    onChange={setField('nights_high_threshold')}
                    required
                    className={INPUT_CLS}
                    placeholder="200"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl shadow-xs p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-amber-50">
                  <ShieldCheckIcon className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">ADR Thresholds</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    ADR Low Threshold ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.adr_low_threshold}
                    onChange={setField('adr_low_threshold')}
                    required
                    className={INPUT_CLS}
                    placeholder="90.00"
                  />
                </div>
                <div>
                  <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    ADR High Threshold ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.adr_high_threshold}
                    onChange={setField('adr_high_threshold')}
                    required
                    className={INPUT_CLS}
                    placeholder="150.00"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl shadow-xs p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-slate-100">
                  <DocumentTextIcon className="w-4 h-4 text-slate-600" />
                </div>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Guard & Notes</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Early Month Guard Days
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={form.early_month_guard_days}
                    onChange={setField('early_month_guard_days')}
                    required
                    className={INPUT_CLS}
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Remarks
                  </label>
                  <input
                    type="text"
                    value={form.remarks}
                    onChange={setField('remarks')}
                    className={INPUT_CLS}
                    placeholder="Optional notes about this configuration"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pb-2">
              <button
                type="submit"
                disabled={createLoading || !form.property_id || !form.month}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createLoading ? (
                  <><Spinner /> Creating...</>
                ) : (
                  <><PlusIcon className="w-4 h-4" /> Create Configuration</>
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </DashboardLayout>
  );
}
