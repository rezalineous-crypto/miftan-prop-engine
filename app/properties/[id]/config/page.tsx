'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getPropertyMonthlyConfig, createPropertyMonthlyConfig } from '../../../api/client';
import { useAuth } from '../../../auth/context';
import DashboardLayout from '../../../components/DashboardLayout';
import {
  PlusIcon,
  XMarkIcon,
  XCircleIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Config {
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

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const emptyForm = (propertyId: number, userId: number): Config => ({
  property_id: propertyId,
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  market_adr: 0,
  market_occupancy: 0,
  paf: 0,
  pace_threshold: 0,
  nights_low_threshold: 0,
  nights_high_threshold: 0,
  adr_low_threshold: 0,
  adr_high_threshold: 0,
  early_month_guard_days: 0,
  created_by: userId,
  remarks: '',
});

function InputField({
  label,
  value,
  onChange,
  placeholder,
  step,
  required = true,
}: {
  label: string;
  value: number | string;
  onChange: (v: string) => void;
  placeholder?: string;
  step?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <input
        type="number"
        step={step}
        placeholder={placeholder ?? '0'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-slate-900 placeholder:text-gray-300 bg-gray-50/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
        required={required}
      />
    </div>
  );
}

export default function PropertyConfigPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const propertyId = parseInt(id as string);

  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Config>(emptyForm(propertyId, user?.id || 1));

  const fetchConfigs = useCallback(async () => {
    try {
      const data = await getPropertyMonthlyConfig({ property_id: id as string });
      setConfigs(data);
    } catch {
      setError('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createPropertyMonthlyConfig(formData);
      setShowForm(false);
      setFormData(emptyForm(propertyId, user?.id || 1));
      fetchConfigs();
    } catch {
      setError('Failed to create configuration');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData(emptyForm(propertyId, user?.id || 1));
  };

  const num = (v: string, float = false) =>
    float ? parseFloat(v) || 0 : parseInt(v) || 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            Loading configurations…
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/properties"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-600 transition-colors mb-2"
          >
            <ArrowLeftIcon className="w-3 h-3" />
            Back to Properties
          </Link>
          <h1 className="text-[1.6rem] font-bold text-slate-900 font-headline tracking-tight leading-none mb-1">
            Monthly Configuration
          </h1>
          <p className="text-sm text-slate-400">
            Property #{propertyId} — market benchmarks and thresholds per period
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all shadow-sm shadow-indigo-100"
        >
          {showForm ? <XMarkIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Config'}
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          <XCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Add Config Form */}
      {showForm && (
        <div className="mb-7 bg-white border border-gray-100 rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 font-headline">New Monthly Configuration</h2>
            <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Period */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CalendarDaysIcon className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Period</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Year
                  </label>
                  <input
                    type="number"
                    placeholder="2026"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: num(e.target.value) })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-slate-900 placeholder:text-gray-300 bg-gray-50/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Month
                  </label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: num(e.target.value) })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-slate-900 bg-gray-50/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all appearance-none"
                    required
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Market Benchmarks */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ChartBarIcon className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Market Benchmarks</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InputField
                  label="Market ADR"
                  value={formData.market_adr}
                  onChange={(v) => setFormData({ ...formData, market_adr: num(v, true) })}
                  step="0.01"
                />
                <InputField
                  label="Market Occupancy"
                  value={formData.market_occupancy}
                  onChange={(v) => setFormData({ ...formData, market_occupancy: num(v, true) })}
                  step="0.01"
                />
                <InputField
                  label="PAF"
                  value={formData.paf}
                  onChange={(v) => setFormData({ ...formData, paf: num(v, true) })}
                  step="0.01"
                />
              </div>
            </div>

            {/* Thresholds */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AdjustmentsHorizontalIcon className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Thresholds</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InputField
                  label="Pace Threshold"
                  value={formData.pace_threshold}
                  onChange={(v) => setFormData({ ...formData, pace_threshold: num(v, true) })}
                  step="0.01"
                />
                <InputField
                  label="Nights Low"
                  value={formData.nights_low_threshold}
                  onChange={(v) => setFormData({ ...formData, nights_low_threshold: num(v) })}
                />
                <InputField
                  label="Nights High"
                  value={formData.nights_high_threshold}
                  onChange={(v) => setFormData({ ...formData, nights_high_threshold: num(v) })}
                />
                <InputField
                  label="ADR Low"
                  value={formData.adr_low_threshold}
                  onChange={(v) => setFormData({ ...formData, adr_low_threshold: num(v, true) })}
                  step="0.01"
                />
                <InputField
                  label="ADR High"
                  value={formData.adr_high_threshold}
                  onChange={(v) => setFormData({ ...formData, adr_high_threshold: num(v, true) })}
                  step="0.01"
                />
                <InputField
                  label="Early Guard Days"
                  value={formData.early_month_guard_days}
                  onChange={(v) => setFormData({ ...formData, early_month_guard_days: num(v) })}
                />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Remarks
              </label>
              <textarea
                placeholder="Optional notes…"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-slate-900 placeholder:text-gray-300 bg-gray-50/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none"
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Save Configuration
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Config count */}
      <div className="flex items-center gap-2 mb-4">
        <p className="text-sm font-semibold text-slate-700">Configurations</p>
        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {configs.length}
        </span>
      </div>

      {/* Empty state */}
      {configs.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-14 text-center shadow-xs">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <CalendarDaysIcon className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">No configurations yet</h3>
          <p className="text-sm text-slate-400 mb-5">Add a monthly configuration to define market benchmarks.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add Configuration
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {configs.map((config) => (
            <div
              key={`${config.year}-${config.month}`}
              className="bg-white border border-gray-100 rounded-xl shadow-xs hover:shadow-sm transition-shadow overflow-hidden"
            >
              {/* Config header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <CalendarDaysIcon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 font-headline leading-none">
                      {MONTH_SHORT[config.month - 1]} {config.year}
                    </p>
                    <p className="text-[0.65rem] text-slate-400 mt-0.5">Period config</p>
                  </div>
                </div>
                {config.id && (
                  <span className="text-[0.65rem] font-medium text-slate-400">#{config.id}</span>
                )}
              </div>

              {/* Config body */}
              <div className="p-5 space-y-4">
                {/* Market row */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <ChartBarIcon className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">
                      Market
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'ADR', value: config.market_adr },
                      { label: 'Occ.', value: `${config.market_occupancy}%` },
                      { label: 'PAF', value: config.paf },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-lg px-2.5 py-2">
                        <p className="text-[0.6rem] text-slate-400 font-medium mb-0.5">{label}</p>
                        <p className="text-xs font-bold text-slate-800">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Thresholds row */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <AdjustmentsHorizontalIcon className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[0.6rem] font-bold text-slate-400 uppercase tracking-widest">
                      Thresholds
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Pace', value: config.pace_threshold },
                      { label: 'Guard Days', value: config.early_month_guard_days },
                      { label: 'Nights', value: `${config.nights_low_threshold}–${config.nights_high_threshold}` },
                      { label: 'ADR Range', value: `${config.adr_low_threshold}–${config.adr_high_threshold}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-lg px-2.5 py-2">
                        <p className="text-[0.6rem] text-slate-400 font-medium mb-0.5">{label}</p>
                        <p className="text-xs font-bold text-slate-800">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {config.remarks && (
                  <p className="text-xs text-slate-400 border-t border-gray-100 pt-3 line-clamp-2">
                    {config.remarks}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
