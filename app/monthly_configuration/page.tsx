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
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ShieldCheckIcon,
  XCircleIcon,
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
const CURRENT_MONTH = new Date().getMonth() + 1;

const INPUT_CLS =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-gray-300 hover:border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20';
const CARD_CLS = 'rounded-2xl border border-gray-100 bg-white shadow-xs';

const EDITABLE_CONFIG_KEYS: (keyof FormState)[] = [
  'market_adr',
  'market_occupancy',
  'paf',
  'pace_threshold',
  'nights_low_threshold',
  'nights_high_threshold',
  'adr_low_threshold',
  'adr_high_threshold',
  'early_month_guard_days',
  'remarks',
];

const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
  { id: 'lookup', label: 'Look Up', Icon: MagnifyingGlassIcon },
  { id: 'create', label: 'Create Config', Icon: PlusIcon },
];

function createEmptyForm(overrides: Partial<FormState> = {}): FormState {
  return {
    property_id: '',
    year: String(CURRENT_YEAR),
    month: String(CURRENT_MONTH),
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
    ...overrides,
  };
}

function calcPos(el: HTMLElement): DropPos {
  const r = el.getBoundingClientRect();
  return { top: r.bottom + 4, left: r.left, width: r.width };
}

function formatInputNumber(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  if (Number.isInteger(value)) return String(value);
  return String(Number(value.toFixed(digits)));
}

function parseMonthlyConfigResponse(response: unknown): MonthlyConfig[] {
  if (Array.isArray(response)) return response;
  if (response && typeof response === 'object') {
    const record = response as { data?: unknown; results?: unknown };
    if (Array.isArray(record.data)) return record.data as MonthlyConfig[];
    if (Array.isArray(record.results)) return record.results as MonthlyConfig[];
    return [record as MonthlyConfig];
  }
  return [];
}

function getPeriodValue(year: number, month: number) {
  return year * 100 + month;
}

function getNextPeriod(year: number, month: number) {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}

function findExactConfig(configs: MonthlyConfig[], year: string, month: string) {
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);
  if (Number.isNaN(yearNum) || Number.isNaN(monthNum)) return null;
  return configs.find(config => config.year === yearNum && config.month === monthNum) ?? null;
}

function findSuggestedTemplate(configs: MonthlyConfig[], year: string, month: string) {
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);
  if (Number.isNaN(yearNum) || Number.isNaN(monthNum)) return null;

  const sorted = [...configs].sort(
    (a, b) => getPeriodValue(b.year, b.month) - getPeriodValue(a.year, a.month),
  );
  const previousPeriod = monthNum === 1 ? { year: yearNum - 1, month: 12 } : { year: yearNum, month: monthNum - 1 };
  const exactPrevious = sorted.find(
    config => config.year === previousPeriod.year && config.month === previousPeriod.month,
  );
  if (exactPrevious) return exactPrevious;

  const targetValue = getPeriodValue(yearNum, monthNum);
  const previousConfig = sorted.find(config => getPeriodValue(config.year, config.month) < targetValue);
  return previousConfig ?? sorted[0] ?? null;
}

function configToFormState(config: MonthlyConfig, overrides: Partial<FormState> = {}): FormState {
  return {
    property_id: String(config.property_id),
    year: String(config.year),
    month: String(config.month),
    market_adr: formatInputNumber(config.market_adr),
    market_occupancy: formatInputNumber((config.market_occupancy ?? 0) * 100, 1),
    paf: formatInputNumber(config.paf),
    pace_threshold: formatInputNumber(config.pace_threshold),
    nights_low_threshold: formatInputNumber(config.nights_low_threshold, 0),
    nights_high_threshold: formatInputNumber(config.nights_high_threshold, 0),
    adr_low_threshold: formatInputNumber(config.adr_low_threshold),
    adr_high_threshold: formatInputNumber(config.adr_high_threshold),
    early_month_guard_days: formatInputNumber(config.early_month_guard_days, 0),
    remarks: config.remarks ?? '',
    ...overrides,
  };
}

function parseOccupancyInput(value: string) {
  const parsed = parseFloat(value);
  if (Number.isNaN(parsed)) return NaN;
  return parsed > 1 ? parsed / 100 : parsed;
}

function isConfigDraftEmpty(form: FormState) {
  return EDITABLE_CONFIG_KEYS.every(key => String(form[key]).trim() === '');
}

function getTemplateSignature(propertyId: string, year: string, month: string, template: MonthlyConfig | null) {
  if (!propertyId || !year || !month || !template) return '';
  return `${propertyId}:${year}:${month}:${template.id ?? `${template.year}-${template.month}`}`;
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

function SectionHeader({
  Icon,
  title,
  subtitle,
  tone,
}: {
  Icon: React.ElementType;
  title: string;
  subtitle?: string;
  tone: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-700">{title}</p>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
  step,
  min,
  max,
  hint,
  prefix,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  step?: string;
  min?: string;
  max?: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
}) {
  const padLeft = prefix ? 'pl-8' : '';
  const padRight = suffix ? 'pr-12' : '';

  return (
    <div>
      <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-400">
            {prefix}
          </span>
        )}
        <input
          type="number"
          step={step}
          min={min}
          max={max}
          value={value}
          onChange={onChange}
          required
          placeholder={placeholder}
          className={`${INPUT_CLS} ${padLeft} ${padRight}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        rows={3}
        placeholder={placeholder}
        className={`${INPUT_CLS} resize-none`}
      />
      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
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
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState<DropPos>({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useFloatingClose(triggerRef, panelRef, open, () => setOpen(false));

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    setPos(calcPos(triggerRef.current));
    const id = window.requestAnimationFrame(() => searchRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  const toggle = () => {
    if (!open && triggerRef.current) setPos(calcPos(triggerRef.current));
    if (open) setQuery('');
    setOpen(v => !v);
  };

  const selected = properties.find(p => String(p.id) === value);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredProperties = normalizedQuery
    ? properties.filter(property => {
        const haystack = `${property.property_name} ${property.property_code} ${property.id}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
    : properties;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={loading}
        onClick={toggle}
        className={`w-full cursor-pointer rounded-xl border px-3.5 py-2.5 text-sm transition-all ${
          open
            ? 'border-indigo-400 bg-white ring-2 ring-indigo-500/20'
            : 'border-gray-200 bg-gray-50/60 hover:border-gray-300 hover:bg-white'
        } ${loading ? 'cursor-wait opacity-60' : ''}`}
      >
        <span className="flex items-center gap-2.5">
          <BuildingOffice2Icon className="h-4 w-4 shrink-0 text-slate-300" />
          {loading ? (
            <span className="flex flex-1 items-center gap-2 text-slate-400">
              <span className="h-3 w-3 animate-spin rounded-full border border-slate-300 border-t-transparent" />
              Loading properties...
            </span>
          ) : selected ? (
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate font-medium text-slate-900">{selected.property_name}</span>
              <span className="shrink-0 rounded border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[0.6rem] font-mono font-bold text-indigo-500">
                {selected.property_code}
              </span>
            </span>
          ) : (
            <span className="flex-1 text-left text-gray-300">Select a property</span>
          )}
          <ChevronDownIcon
            className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? '-rotate-180' : ''}`}
          />
        </span>
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl"
        >
          <div className="border-b border-gray-100 p-2.5">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by name, code, or ID"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/60 py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition-all placeholder:text-gray-300 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {filteredProperties.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-slate-400">
                No properties match &quot;{query}&quot;
              </p>
            ) : (
              filteredProperties.map(property => {
                const isSelected = String(property.id) === value;
                return (
                  <button
                    key={property.id}
                    type="button"
                    onClick={() => {
                      onChange(String(property.id));
                      setQuery('');
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`rounded-xl p-1.5 ${isSelected ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                      <BuildingOffice2Icon
                        className={`h-3.5 w-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                        {property.property_name}
                      </p>
                      <p className="mt-0.5 text-[0.65rem] text-slate-400">ID #{property.id}</p>
                    </div>
                    <span className="shrink-0 rounded border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[0.6rem] font-mono font-bold text-indigo-500">
                      {property.property_code}
                    </span>
                    {isSelected && <CheckIcon className="h-3.5 w-3.5 shrink-0 text-indigo-500" />}
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
        className={`w-full cursor-pointer rounded-xl border px-3.5 py-2.5 text-sm transition-all ${
          open
            ? 'border-indigo-400 bg-white ring-2 ring-indigo-500/20'
            : 'border-gray-200 bg-gray-50/60 hover:border-gray-300 hover:bg-white'
        }`}
      >
        <span className="flex items-center gap-2.5">
          <CalendarDaysIcon className="h-4 w-4 shrink-0 text-slate-300" />
          <span className={`flex-1 text-left ${label ? 'font-medium text-slate-900' : 'text-gray-300'}`}>
            {label ?? 'Select month'}
          </span>
          <ChevronDownIcon
            className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? '-rotate-180' : ''}`}
          />
        </span>
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="rounded-2xl border border-gray-100 bg-white p-2 shadow-xl"
        >
          <div className="grid grid-cols-4 gap-1">
            {MONTHS.map((monthName, i) => {
              const monthValue = String(i + 1);
              const isSelected = value === monthValue;
              return (
                <button
                  key={monthName}
                  type="button"
                  onClick={() => {
                    onChange(monthValue);
                    setOpen(false);
                  }}
                  className={`rounded-xl py-2 text-xs font-semibold transition-colors ${
                    isSelected ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  {monthName}
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
    <svg className="h-4 w-4 animate-spin opacity-80" fill="none" viewBox="0 0 24 24">
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
  const [lookupMonth, setLookupMonth] = useState(String(CURRENT_MONTH));
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [config, setConfig] = useState<MonthlyConfig | null>(null);
  const [lookupPropertyConfigs, setLookupPropertyConfigs] = useState<MonthlyConfig[]>([]);
  const [lookupPropertyConfigsLoading, setLookupPropertyConfigsLoading] = useState(false);
  const [lookupPropertyConfigsError, setLookupPropertyConfigsError] = useState('');

  const [form, setForm] = useState<FormState>(() => createEmptyForm());
  const [formDirty, setFormDirty] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [propertyConfigs, setPropertyConfigs] = useState<MonthlyConfig[]>([]);
  const [propertyConfigsLoading, setPropertyConfigsLoading] = useState(false);
  const [propertyConfigsError, setPropertyConfigsError] = useState('');
  const [lastAutofillSignature, setLastAutofillSignature] = useState('');

  useEffect(() => {
    getProperties()
      .then(data => {
        const arr: Property[] = Array.isArray(data) ? data : (data?.results ?? data?.data ?? []);
        setProperties(arr.filter((property: Property) => property.is_active));
      })
      .catch(() => {})
      .finally(() => setPropertiesLoading(false));
  }, []);

  useEffect(() => {
    if (!lookupPropertyId) {
      setLookupPropertyConfigs([]);
      setLookupPropertyConfigsError('');
      setLookupPropertyConfigsLoading(false);
      return;
    }

    let cancelled = false;
    setLookupPropertyConfigsLoading(true);
    setLookupPropertyConfigsError('');

    getPropertyMonthlyConfig({ property_id: lookupPropertyId })
      .then(response => {
        if (cancelled) return;
        setLookupPropertyConfigs(parseMonthlyConfigResponse(response));
      })
      .catch(() => {
        if (cancelled) return;
        setLookupPropertyConfigs([]);
        setLookupPropertyConfigsError('Saved configurations could not be loaded for this property.');
      })
      .finally(() => {
        if (!cancelled) setLookupPropertyConfigsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lookupPropertyId]);

  useEffect(() => {
    if (!form.property_id) {
      setPropertyConfigs([]);
      setPropertyConfigsError('');
      setPropertyConfigsLoading(false);
      return;
    }

    let cancelled = false;
    setPropertyConfigsLoading(true);
    setPropertyConfigsError('');

    getPropertyMonthlyConfig({ property_id: form.property_id })
      .then(response => {
        if (cancelled) return;
        setPropertyConfigs(parseMonthlyConfigResponse(response));
      })
      .catch(() => {
        if (cancelled) return;
        setPropertyConfigs([]);
        setPropertyConfigsError('Previous configurations could not be loaded for this property.');
      })
      .finally(() => {
        if (!cancelled) setPropertyConfigsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.property_id]);

  const existingCreateConfig = findExactConfig(propertyConfigs, form.year, form.month);
  const suggestedTemplate = findSuggestedTemplate(propertyConfigs, form.year, form.month);
  const templateSignature = getTemplateSignature(form.property_id, form.year, form.month, suggestedTemplate);
  const lookupExactConfig = findExactConfig(lookupPropertyConfigs, lookupYear, lookupMonth);
  const lookupSuggestedConfig = findSuggestedTemplate(lookupPropertyConfigs, lookupYear, lookupMonth);

  useEffect(() => {
    if (!templateSignature || !suggestedTemplate || existingCreateConfig) return;
    if (lastAutofillSignature === templateSignature) return;
    if (formDirty && !isConfigDraftEmpty(form)) return;

    setForm(prev =>
      configToFormState(suggestedTemplate, {
        property_id: prev.property_id,
        year: prev.year,
        month: prev.month,
      }),
    );
    setFormDirty(false);
    setLastAutofillSignature(templateSignature);
  }, [
    existingCreateConfig,
    form,
    formDirty,
    lastAutofillSignature,
    suggestedTemplate,
    templateSignature,
  ]);

  const handleLookup = async (e: { preventDefault(): void }) => {
    e.preventDefault();

    if (lookupExactConfig) {
      setLookupError('');
      setConfig(lookupExactConfig);
      return;
    }

    if (lookupPropertyId && !lookupPropertyConfigsLoading) {
      setConfig(null);
      if (lookupPropertyConfigs.length > 0) {
        setLookupError('No configuration exists for that exact month yet. Try one of the available periods on the right.');
        return;
      }
      if (!lookupPropertyConfigsError) {
        setLookupError('No configurations were found for the selected property.');
        return;
      }
    }

    setLookupLoading(true);
    setLookupError('');
    setConfig(null);
    try {
      const response = await getPropertyMonthlyConfig({
        property_id: lookupPropertyId,
        year: lookupYear,
        month: lookupMonth,
      });
      const list = parseMonthlyConfigResponse(response);
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

  const setCreateField =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setCreateError('');
      setCreateSuccess('');
      setFormDirty(true);
      setForm(prev => ({ ...prev, [key]: e.target.value }));
    };

  const setLookupTarget = (updates: Partial<{ property_id: string; year: string; month: string }>) => {
    if (updates.property_id !== undefined) setLookupPropertyId(updates.property_id);
    if (updates.year !== undefined) setLookupYear(updates.year);
    if (updates.month !== undefined) setLookupMonth(updates.month);
    setLookupError('');
    setConfig(null);
  };

  const setCreateTarget = (updates: Partial<Pick<FormState, 'property_id' | 'year' | 'month'>>) => {
    setCreateError('');
    setCreateSuccess('');
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleLookupPropertyChange = (propertyId: string) => {
    setLookupPropertyConfigs([]);
    setLookupPropertyConfigsError('');
    setLookupTarget({ property_id: propertyId });
  };

  const handleCreatePropertyChange = (propertyId: string) => {
    setPropertyConfigs([]);
    setPropertyConfigsError('');
    setCreateError('');
    setCreateSuccess('');
    setLastAutofillSignature('');
    setFormDirty(false);
    setForm(prev =>
      createEmptyForm({
        property_id: propertyId,
        year: prev.year,
        month: prev.month,
      }),
    );
  };

  const applyTemplateToForm = (template: MonthlyConfig) => {
    const signature = getTemplateSignature(form.property_id, form.year, form.month, template);
    setCreateError('');
    setCreateSuccess('');
    setForm(
      configToFormState(template, {
        property_id: form.property_id,
        year: form.year,
        month: form.month,
      }),
    );
    setFormDirty(false);
    setLastAutofillSignature(signature);
  };

  const resetCreateFields = () => {
    setCreateError('');
    setCreateSuccess('');
    setLastAutofillSignature('');
    setFormDirty(false);
    setForm(prev =>
      createEmptyForm({
        property_id: prev.property_id,
        year: prev.year,
        month: prev.month,
      }),
    );
  };

  const openCurrentConfigInLookup = (configToOpen: MonthlyConfig) => {
    setLookupPropertyId(String(configToOpen.property_id));
    setLookupYear(String(configToOpen.year));
    setLookupMonth(String(configToOpen.month));
    setLookupError('');
    setLookupLoading(false);
    setConfig(configToOpen);
    setActiveTab('lookup');
  };

  const openLookupConfig = (configToOpen: MonthlyConfig) => {
    setLookupTarget({
      property_id: String(configToOpen.property_id),
      year: String(configToOpen.year),
      month: String(configToOpen.month),
    });
    setConfig(configToOpen);
  };

  const handleCreate = async (e: { preventDefault(): void }) => {
    e.preventDefault();

    if (existingCreateConfig) {
      setCreateError('A configuration already exists for this property and period. Open it in Look Up instead of creating a duplicate.');
      return;
    }

    const marketOccupancy = parseOccupancyInput(form.market_occupancy);
    if (Number.isNaN(marketOccupancy) || marketOccupancy < 0 || marketOccupancy > 1) {
      setCreateError('Market occupancy must be between 0% and 100%.');
      return;
    }

    const payload: MonthlyConfig = {
      property_id: parseInt(form.property_id, 10),
      year: parseInt(form.year, 10),
      month: parseInt(form.month, 10),
      market_adr: parseFloat(form.market_adr),
      market_occupancy: marketOccupancy,
      paf: parseFloat(form.paf),
      pace_threshold: parseFloat(form.pace_threshold),
      nights_low_threshold: parseInt(form.nights_low_threshold, 10),
      nights_high_threshold: parseInt(form.nights_high_threshold, 10),
      adr_low_threshold: parseFloat(form.adr_low_threshold),
      adr_high_threshold: parseFloat(form.adr_high_threshold),
      early_month_guard_days: parseInt(form.early_month_guard_days, 10),
      created_by: userDataClient.getUserId() ?? 0,
      remarks: form.remarks.trim(),
    };

    setCreateLoading(true);
    setCreateError('');
    setCreateSuccess('');

    try {
      await createPropertyMonthlyConfig(payload);
      const nextPeriod = getNextPeriod(payload.year, payload.month);
      const createdLabel = `${MONTH_FULL[payload.month - 1]} ${payload.year}`;
      const nextLabel = `${MONTH_FULL[nextPeriod.month - 1]} ${nextPeriod.year}`;

      setPropertyConfigs(prev => [payload, ...prev]);
      setCreateSuccess(`Configuration created for ${createdLabel}. The form is now prepared for ${nextLabel}.`);
      setLastAutofillSignature('');
      setFormDirty(false);
      setForm(
        createEmptyForm({
          property_id: form.property_id,
          year: String(nextPeriod.year),
          month: String(nextPeriod.month),
        }),
      );
    } catch {
      setCreateError('Failed to create configuration. Please check your inputs and try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const selectedLookupProp = properties.find(property => String(property.id) === lookupPropertyId);
  const selectedCreateProp = properties.find(property => String(property.id) === form.property_id);
  const lookupTargetLabel = lookupMonth ? `${MONTH_FULL[parseInt(lookupMonth, 10) - 1]} ${lookupYear}` : 'Select month';
  const lookupLatestConfig = [...lookupPropertyConfigs].sort(
    (a, b) => getPeriodValue(b.year, b.month) - getPeriodValue(a.year, a.month),
  )[0];
  const lookupRecentConfigs = [...lookupPropertyConfigs]
    .sort((a, b) => getPeriodValue(b.year, b.month) - getPeriodValue(a.year, a.month))
    .slice(0, 6);
  const createTargetLabel = form.month ? `${MONTH_FULL[parseInt(form.month, 10) - 1]} ${form.year}` : 'Select month';
  const latestKnownConfig = [...propertyConfigs].sort(
    (a, b) => getPeriodValue(b.year, b.month) - getPeriodValue(a.year, a.month),
  )[0];
  const quickPeriods = [
    { label: 'This Month', year: CURRENT_YEAR, month: CURRENT_MONTH },
    { label: 'Next Month', ...getNextPeriod(CURRENT_YEAR, CURRENT_MONTH) },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="mb-1 text-[1.6rem] font-bold leading-none tracking-tight text-slate-900 font-headline">
          Monthly Configuration
        </h1>
        <p className="text-sm text-slate-400">
          Manage per-property market benchmarks and pricing thresholds for each month.
        </p>
      </div>

      <div className="mb-6 flex border-b border-gray-100">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
              activeTab === id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'lookup' && (
        <>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
            <div className="space-y-6">
              <form
                onSubmit={handleLookup}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs sm:p-6"
              >
                <SectionHeader
                  Icon={MagnifyingGlassIcon}
                  title="Lookup Target"
                  subtitle="Pick the property and month you want to inspect. If we already know that period, opening it is instant."
                  tone="bg-indigo-50 text-indigo-600"
                />

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-3">
                    <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
                      Property
                    </label>
                    <PropertyDropdown
                      properties={properties}
                      loading={propertiesLoading}
                      value={lookupPropertyId}
                      onChange={handleLookupPropertyChange}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
                      Year
                    </label>
                    <input
                      type="number"
                      value={lookupYear}
                      onChange={e => setLookupTarget({ year: e.target.value })}
                      min={2000}
                      max={2100}
                      required
                      className={INPUT_CLS}
                      placeholder="2026"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
                      Month
                    </label>
                    <MonthPicker value={lookupMonth} onChange={month => setLookupTarget({ month })} />
                  </div>
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-indigo-500">Looking For</p>
                    <p className="mt-1 text-sm font-semibold text-indigo-900">{lookupTargetLabel}</p>
                    <p className="mt-1 text-xs text-indigo-500">
                      {selectedLookupProp ? selectedLookupProp.property_code : 'Select a property to load saved periods'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {quickPeriods.map(period => {
                    const active = lookupYear === String(period.year) && lookupMonth === String(period.month);
                    return (
                      <button
                        key={`lookup-${period.label}-${period.year}-${period.month}`}
                        type="button"
                        onClick={() => setLookupTarget({ year: String(period.year), month: String(period.month) })}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          active
                            ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                        }`}
                      >
                        {period.label}
                      </button>
                    );
                  })}
                  {lookupLatestConfig && (
                    <button
                      type="button"
                      onClick={() => openLookupConfig(lookupLatestConfig)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
                    >
                      Latest Saved
                    </button>
                  )}
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="submit"
                    disabled={lookupLoading || !lookupPropertyId || !lookupYear || !lookupMonth}
                    className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {lookupLoading ? (
                      <>
                        <Spinner />
                        Fetching...
                      </>
                    ) : lookupExactConfig ? (
                      <>
                        <CheckCircleIcon className="h-4 w-4" />
                        Open Instantly
                      </>
                    ) : (
                      <>
                        <MagnifyingGlassIcon className="h-4 w-4" />
                        Look Up
                      </>
                    )}
                  </button>
                  {lookupExactConfig && (
                    <p className="text-sm text-emerald-600">
                      A saved configuration already matches this exact period.
                    </p>
                  )}
                  {!lookupExactConfig && lookupSuggestedConfig && lookupPropertyConfigs.length > 0 && (
                    <p className="text-sm text-slate-500">
                      Nearest saved period: {MONTH_FULL[lookupSuggestedConfig.month - 1]} {lookupSuggestedConfig.year}
                    </p>
                  )}
                </div>
              </form>

              {lookupError && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <XCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  {lookupError}
                </div>
              )}

              {!config && !lookupError && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-linear-to-br from-slate-50 via-white to-indigo-50/60">
                  <div className="px-6 py-6 sm:px-7">
                    <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Configuration Lookup
                    </p>
                    <h2 className="max-w-2xl text-xl font-bold leading-tight text-slate-900 font-headline sm:text-2xl">
                      {selectedLookupProp
                        ? `Browse saved months for ${selectedLookupProp.property_name}.`
                        : 'Select a property, year, and month to retrieve its monthly pricing configuration.'}
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm text-slate-500">
                      {selectedLookupProp
                        ? 'Use the recent-period shortcuts on the right to open a saved month in one tap, or choose any target period above.'
                        : 'Monthly configurations store market benchmarks and pricing thresholds used by the diagnosis engine to evaluate property performance.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-px bg-slate-200/70 md:grid-cols-3">
                    {[
                      {
                        title: 'Market Benchmarks',
                        copy: 'ADR and occupancy benchmarks for the target month and property.',
                        Icon: CurrencyDollarIcon,
                        tone: 'bg-emerald-50 text-emerald-600',
                      },
                      {
                        title: 'Performance Factors',
                        copy: 'PAF and pace threshold settings that drive the diagnosis engine.',
                        Icon: AdjustmentsHorizontalIcon,
                        tone: 'bg-indigo-50 text-indigo-600',
                      },
                      {
                        title: 'Threshold Bands',
                        copy: 'Night count and ADR ranges used to categorize performance level.',
                        Icon: ShieldCheckIcon,
                        tone: 'bg-amber-50 text-amber-600',
                      },
                    ].map(({ title, copy, Icon, tone }) => (
                      <div key={title} className="bg-white p-5">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="mt-4 text-sm font-semibold text-slate-900">{title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-500">{copy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {config && (
                <div className="overflow-hidden rounded-2xl border border-gray-100">
              <div className="relative overflow-hidden bg-slate-900 px-6 py-5">
                <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-indigo-600/20 blur-3xl" />
                <div className="relative">
                  <p className="mb-1 text-[0.6rem] font-semibold uppercase tracking-widest text-slate-500">
                    Monthly Configuration
                  </p>
                  <h2 className="text-2xl font-bold leading-tight text-white font-headline">
                    {selectedLookupProp?.property_name || `Property #${config.property_id}`}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="text-xs text-slate-400">
                      Period{' '}
                      <span className="font-medium text-slate-200">
                        {MONTH_FULL[(config.month ?? 1) - 1]} {config.year}
                      </span>
                    </span>
                    {selectedLookupProp?.property_code && (
                      <span className="rounded border border-indigo-700/30 bg-indigo-900/40 px-2 py-1 text-[0.6rem] font-mono font-bold text-indigo-400">
                        {selectedLookupProp.property_code}
                      </span>
                    )}
                    {config.id && (
                      <span className="text-xs text-slate-400">
                        Config ID <span className="font-medium text-slate-200">#{config.id}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6 bg-white p-6">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="rounded-lg bg-emerald-50 p-1.5">
                      <CurrencyDollarIcon className="h-4 w-4 text-emerald-600" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Market Benchmarks</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                      <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-500">
                        Market ADR
                      </p>
                      <p className="text-2xl font-bold text-emerald-700 font-headline">
                        $
                        {(config.market_adr ?? 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="rounded-xl border border-teal-100 bg-teal-50 p-4">
                      <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-teal-500">
                        Market Occupancy
                      </p>
                      <p className="text-2xl font-bold text-teal-700 font-headline">
                        {((config.market_occupancy ?? 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="rounded-lg bg-indigo-50 p-1.5">
                      <AdjustmentsHorizontalIcon className="h-4 w-4 text-indigo-600" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Performance Factors</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                      <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-indigo-500">PAF</p>
                      <p className="text-2xl font-bold text-indigo-700 font-headline">{config.paf}</p>
                    </div>
                    <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                      <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-violet-500">
                        Pace Threshold
                      </p>
                      <p className="text-2xl font-bold text-violet-700 font-headline">{config.pace_threshold}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="rounded-lg bg-amber-50 p-1.5">
                      <ShieldCheckIcon className="h-4 w-4 text-amber-600" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-700">Threshold Bands</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[
                      {
                        label: 'Nights Low',
                        value: String(config.nights_low_threshold),
                        cls: 'border-slate-100 bg-slate-50',
                        txt: 'text-slate-700',
                        lbl: 'text-slate-400',
                      },
                      {
                        label: 'Nights High',
                        value: String(config.nights_high_threshold),
                        cls: 'border-slate-100 bg-slate-50',
                        txt: 'text-slate-700',
                        lbl: 'text-slate-400',
                      },
                      {
                        label: 'ADR Low',
                        value: `$${(config.adr_low_threshold ?? 0).toLocaleString()}`,
                        cls: 'border-amber-100 bg-amber-50',
                        txt: 'text-amber-700',
                        lbl: 'text-amber-500',
                      },
                      {
                        label: 'ADR High',
                        value: `$${(config.adr_high_threshold ?? 0).toLocaleString()}`,
                        cls: 'border-amber-100 bg-amber-50',
                        txt: 'text-amber-700',
                        lbl: 'text-amber-500',
                      },
                    ].map(({ label, value, cls, txt, lbl }) => (
                      <div key={label} className={`rounded-xl border p-4 ${cls}`}>
                        <p className={`mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide ${lbl}`}>{label}</p>
                        <p className={`text-xl font-bold font-headline ${txt}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
                      Early Month Guard Days
                    </p>
                    <p className="text-xl font-bold text-slate-700 font-headline">
                      {config.early_month_guard_days} days
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
                      Remarks
                    </p>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {config.remarks || <span className="italic text-slate-300">No remarks</span>}
                    </p>
                  </div>
                </div>
              </div>
                </div>
              )}
            </div>

            <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
              <section className={`${CARD_CLS} overflow-hidden`}>
                <div className="border-b border-gray-100 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                      <CalendarDaysIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Saved Periods</p>
                      <p className="text-xs text-slate-400">Open a known month directly without typing the target again.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 px-5 py-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">Selected Property</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedLookupProp?.property_name ?? 'No property selected'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{lookupTargetLabel}</p>
                  </div>

                  {lookupPropertyConfigsLoading ? (
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      <Spinner />
                      Loading saved periods...
                    </div>
                  ) : lookupPropertyConfigsError ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {lookupPropertyConfigsError}
                    </div>
                  ) : !lookupPropertyId ? (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Choose a property to see its saved periods and latest configuration.
                    </div>
                  ) : lookupPropertyConfigs.length === 0 ? (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">No saved months yet</p>
                      <p className="mt-1 text-sm text-slate-500">
                        This property does not have any monthly configuration yet.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">Known Configs</p>
                          <p className="mt-1 text-lg font-bold text-slate-900">{lookupPropertyConfigs.length}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">Latest Saved</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {lookupLatestConfig ? `${MONTHS[lookupLatestConfig.month - 1]} ${lookupLatestConfig.year}` : 'None'}
                          </p>
                        </div>
                      </div>

                      {lookupSuggestedConfig && !lookupExactConfig && (
                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                          <div className="flex items-start gap-3">
                            <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                            <div>
                              <p className="text-sm font-semibold text-indigo-900">Nearest saved period</p>
                              <p className="mt-1 text-sm text-indigo-700">
                                {MONTH_FULL[lookupSuggestedConfig.month - 1]} {lookupSuggestedConfig.year} is the closest saved month for this property.
                              </p>
                              <button
                                type="button"
                                onClick={() => openLookupConfig(lookupSuggestedConfig)}
                                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                              >
                                <ArrowPathIcon className="h-3.5 w-3.5" />
                                Open Suggested
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">Recent Periods</p>
                        <div className="mt-3 space-y-2">
                          {lookupRecentConfigs.map(lookupConfig => {
                            const isActive =
                              lookupYear === String(lookupConfig.year) &&
                              lookupMonth === String(lookupConfig.month);

                            return (
                              <button
                                key={`lookup-period-${lookupConfig.id ?? `${lookupConfig.year}-${lookupConfig.month}`}`}
                                type="button"
                                onClick={() => openLookupConfig(lookupConfig)}
                                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${
                                  isActive
                                    ? 'border-indigo-200 bg-indigo-50'
                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                <div>
                                  <p className={`text-sm font-semibold ${isActive ? 'text-indigo-900' : 'text-slate-900'}`}>
                                    {MONTH_FULL[lookupConfig.month - 1]} {lookupConfig.year}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    ADR ${lookupConfig.market_adr.toLocaleString()} • Occ {(lookupConfig.market_occupancy * 100).toFixed(1)}%
                                  </p>
                                </div>
                                <span className={`text-xs font-semibold ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                                  Open
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </section>
            </aside>
          </div>
        </>
      )}

      {activeTab === 'create' && (
        <>
          {createSuccess && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {createSuccess}
            </div>
          )}

          {createError && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <XCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {createError}
            </div>
          )}

          <form onSubmit={handleCreate} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
            <div className="space-y-5">
              <section className={`${CARD_CLS} p-5 sm:p-6`}>
                <SectionHeader
                  Icon={BuildingOffice2Icon}
                  title="Target Setup"
                  subtitle="Choose the property and month first. The form will reuse the closest known configuration when available."
                  tone="bg-slate-100 text-slate-700"
                />

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-3">
                    <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
                      Property
                    </label>
                    <PropertyDropdown
                      properties={properties}
                      loading={propertiesLoading}
                      value={form.property_id}
                      onChange={handleCreatePropertyChange}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
                      Year
                    </label>
                    <input
                      type="number"
                      value={form.year}
                      onChange={e => setCreateTarget({ year: e.target.value })}
                      min={2000}
                      max={2100}
                      required
                      className={INPUT_CLS}
                      placeholder="2026"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
                      Month
                    </label>
                    <MonthPicker value={form.month} onChange={month => setCreateTarget({ month })} />
                  </div>
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-indigo-500">Target Period</p>
                    <p className="mt-1 text-sm font-semibold text-indigo-900">{createTargetLabel}</p>
                    <p className="mt-1 text-xs text-indigo-500">
                      {selectedCreateProp ? selectedCreateProp.property_code : 'Select a property to enable smart prefills'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {quickPeriods.map(period => {
                    const active = form.year === String(period.year) && form.month === String(period.month);
                    return (
                      <button
                        key={`${period.label}-${period.year}-${period.month}`}
                        type="button"
                        onClick={() => setCreateTarget({ year: String(period.year), month: String(period.month) })}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          active
                            ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                        }`}
                      >
                        {period.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={resetCreateFields}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
                  >
                    Clear Values
                  </button>
                </div>
              </section>

              <section className={`${CARD_CLS} p-5 sm:p-6`}>
                <SectionHeader
                  Icon={CurrencyDollarIcon}
                  title="Market & Pace"
                  subtitle="The highest-value inputs are grouped here so the core benchmarking values can be entered in one pass."
                  tone="bg-emerald-50 text-emerald-600"
                />

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <NumberField
                    label="Market ADR"
                    value={form.market_adr}
                    onChange={setCreateField('market_adr')}
                    placeholder="120"
                    step="0.01"
                    prefix="$"
                  />
                  <NumberField
                    label="Market Occupancy"
                    value={form.market_occupancy}
                    onChange={setCreateField('market_occupancy')}
                    placeholder="85"
                    step="0.1"
                    min="0"
                    max="100"
                    suffix="%"
                    hint="Enter 85 for 85%. Decimal values like 0.85 still work."
                  />
                  <NumberField
                    label="PAF"
                    value={form.paf}
                    onChange={setCreateField('paf')}
                    placeholder="1.2"
                    step="0.01"
                    hint="Property adjustment factor."
                  />
                  <NumberField
                    label="Pace Threshold"
                    value={form.pace_threshold}
                    onChange={setCreateField('pace_threshold')}
                    placeholder="0.9"
                    step="0.01"
                  />
                  <NumberField
                    label="Early Month Guard Days"
                    value={form.early_month_guard_days}
                    onChange={setCreateField('early_month_guard_days')}
                    placeholder="10"
                    step="1"
                    min="0"
                    suffix="days"
                  />
                </div>
              </section>

              <section className={`${CARD_CLS} p-5 sm:p-6`}>
                <SectionHeader
                  Icon={ShieldCheckIcon}
                  title="Threshold Bands"
                  subtitle="Keep the low and high ranges together so they are easier to compare while typing."
                  tone="bg-amber-50 text-amber-600"
                />

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <NumberField
                    label="Nights Low"
                    value={form.nights_low_threshold}
                    onChange={setCreateField('nights_low_threshold')}
                    placeholder="100"
                    step="1"
                    min="0"
                  />
                  <NumberField
                    label="Nights High"
                    value={form.nights_high_threshold}
                    onChange={setCreateField('nights_high_threshold')}
                    placeholder="200"
                    step="1"
                    min="0"
                  />
                  <NumberField
                    label="ADR Low"
                    value={form.adr_low_threshold}
                    onChange={setCreateField('adr_low_threshold')}
                    placeholder="90"
                    step="0.01"
                    prefix="$"
                  />
                  <NumberField
                    label="ADR High"
                    value={form.adr_high_threshold}
                    onChange={setCreateField('adr_high_threshold')}
                    placeholder="150"
                    step="0.01"
                    prefix="$"
                  />
                </div>
              </section>

              <section className={`${CARD_CLS} p-5 sm:p-6`}>
                <SectionHeader
                  Icon={DocumentTextIcon}
                  title="Notes"
                  subtitle="Optional context for why the benchmark or thresholds were adjusted this month."
                  tone="bg-slate-100 text-slate-700"
                />

                <div className="mt-5">
                  <TextAreaField
                    label="Remarks"
                    value={form.remarks}
                    onChange={setCreateField('remarks')}
                    placeholder="Optional notes about rate seasonality, a recent comp-set change, or any pricing context"
                  />
                </div>
              </section>
            </div>

            <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
              <section className={`${CARD_CLS} overflow-hidden`}>
                <div className="border-b border-gray-100 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
                      <ArrowPathIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Smart Prefill</p>
                      <p className="text-xs text-slate-400">Use an existing month as a template instead of typing everything again.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 px-5 py-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">Working On</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {selectedCreateProp?.property_name ?? 'No property selected'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{createTargetLabel}</p>
                  </div>

                  {propertyConfigsLoading ? (
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      <Spinner />
                      Loading previous configurations...
                    </div>
                  ) : propertyConfigsError ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {propertyConfigsError}
                    </div>
                  ) : !form.property_id ? (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Select a property to pull forward prior monthly values.
                    </div>
                  ) : existingCreateConfig ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start gap-3">
                        <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                        <div>
                          <p className="text-sm font-semibold text-amber-900">Config already exists</p>
                          <p className="mt-1 text-sm text-amber-700">
                            {selectedCreateProp?.property_name ?? 'This property'} already has a configuration for {createTargetLabel}.
                          </p>
                          <button
                            type="button"
                            onClick={() => openCurrentConfigInLookup(existingCreateConfig)}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                          >
                            <MagnifyingGlassIcon className="h-3.5 w-3.5" />
                            Open in Look Up
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : suggestedTemplate ? (
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                      <div className="flex items-start gap-3">
                        <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                        <div>
                          <p className="text-sm font-semibold text-indigo-900">Template ready</p>
                          <p className="mt-1 text-sm text-indigo-700">
                            Values are being copied from {MONTH_FULL[suggestedTemplate.month - 1]} {suggestedTemplate.year}.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => applyTemplateToForm(suggestedTemplate)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                            >
                              <ArrowPathIcon className="h-3.5 w-3.5" />
                              Reapply Template
                            </button>
                            <button
                              type="button"
                              onClick={resetCreateFields}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
                            >
                              Clear Fields
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">No template found yet</p>
                      <p className="mt-1 text-sm text-slate-500">
                        This looks like a fresh setup for the selected property, so the form stays blank.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">Known Configs</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{propertyConfigs.length}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">Latest Saved</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {latestKnownConfig ? `${MONTHS[latestKnownConfig.month - 1]} ${latestKnownConfig.year}` : 'None'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className={`${CARD_CLS} p-5`}>
                <SectionHeader
                  Icon={PlusIcon}
                  title="Create"
                  subtitle="Save the new configuration once the copied values and thresholds look right."
                  tone="bg-slate-900 text-white"
                />

                <div className="mt-5 space-y-3">
                  <button
                    type="submit"
                    disabled={createLoading || !form.property_id || !form.month || !!existingCreateConfig}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {createLoading ? (
                      <>
                        <Spinner />
                        Creating...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-4 w-4" />
                        Create Configuration
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetCreateFields}
                    className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    Reset Inputs
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">Why this is faster</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-slate-500">
                    <li>Property search is now filterable by name, code, or ID.</li>
                    <li>Target months default to the current period and can jump to next month with one tap.</li>
                    <li>Existing values are reused automatically whenever a nearby config exists.</li>
                  </ul>
                </div>
              </section>
            </aside>
          </form>
        </>
      )}
    </DashboardLayout>
  );
}
