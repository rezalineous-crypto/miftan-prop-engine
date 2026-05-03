'use client';

import { useCallback, useEffect, useState } from 'react';
import { getPropertyPerformance, getProperties, createPropertyPerformanceEntry } from '../../api/client';
import DashboardLayout from '../../components/DashboardLayout';
import {
  MagnifyingGlassIcon,
  XCircleIcon,
  BuildingOffice2Icon,
  BanknotesIcon,
  MoonIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface PerformanceRecord {
  id: number;
  date: string;
  rooms: number;
  remarks: string | null;
  revenue: number;
  is_active: boolean;
  company_id: number;
  created_at: string;
  created_by: number;
  updated_at: string | null;
  updated_by: number | null;
  property_id: number;
  company_name: string;
  property_code: string;
  property_name: string;
  source_upload_id: number;
}

interface Property {
  id: number;
  company_id: number;
  property_code: string;
  property_name: string;
  is_active: boolean;
}

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

export default function DailyPerformancePage() {
  const [performance, setPerformance] = useState<PerformanceRecord[]>([]);
  const [filteredPerformance, setFilteredPerformance] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [error, setError] = useState('');
  const [entryError, setEntryError] = useState('');
  const [entrySuccess, setEntrySuccess] = useState('');
  const [creatingEntry, setCreatingEntry] = useState(false);
  const [entrySourceUploadId, setEntrySourceUploadId] = useState('');
  const [entryCompanyId, setEntryCompanyId] = useState('');
  const [entryPropertyId, setEntryPropertyId] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [entryRooms, setEntryRooms] = useState('');
  const [entryRevenue, setEntryRevenue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPerformanceData = useCallback(async () => {
    try {
      const data = await getPropertyPerformance();
      const records: PerformanceRecord[] = Array.isArray(data?.data) ? data.data : [];
      setPerformance(records);
      setFilteredPerformance(records);
    } catch {
      setError('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    setPropertiesLoading(true);
    try {
      const data = await getProperties();
      const arr = Array.isArray(data) ? data : data?.results ?? data?.data ?? [];
      setProperties(arr.filter((p: Property) => p.is_active));
    } catch {
      // Property list is optional for manual entry. Users can still provide IDs manually.
    } finally {
      setPropertiesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerformanceData();
    fetchProperties();
  }, [fetchPerformanceData, fetchProperties]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPerformance(performance);
    } else {
      const q = searchTerm.toLowerCase();
      setFilteredPerformance(
        performance.filter(
          (r) =>
            r.property_name.toLowerCase().includes(q) ||
            r.property_code.toLowerCase().includes(q) ||
            r.company_name.toLowerCase().includes(q),
        ),
      );
    }
  }, [searchTerm, performance]);

  const handlePropertySelect = (value: string) => {
    setEntryPropertyId(value);
    const property = properties.find((p) => String(p.id) === value);
    if (property) {
      setEntryCompanyId(String(property.company_id));
    }
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setEntryError('');
    setEntrySuccess('');

    if (!entryPropertyId || !entryCompanyId || !entryDate || !entryRooms || !entryRevenue) {
      setEntryError('Please complete all required entry fields.');
      return;
    }

    setCreatingEntry(true);
    try {
      await createPropertyPerformanceEntry({
        source_upload_id: parseInt(entrySourceUploadId || '0', 10),
        company_id: parseInt(entryCompanyId, 10),
        property_id: parseInt(entryPropertyId, 10),
        date: entryDate,
        rooms: parseInt(entryRooms, 10),
        revenue: parseFloat(entryRevenue),
      });
      setEntrySuccess('Daily performance entry created successfully.');
      setEntrySourceUploadId('');
      setEntryCompanyId('');
      setEntryPropertyId('');
      setEntryDate('');
      setEntryRooms('');
      setEntryRevenue('');
      await fetchPerformanceData();
      setTimeout(() => setEntrySuccess(''), 3000);
    } catch {
      setEntryError('Failed to create daily performance entry. Please try again.');
    } finally {
      setCreatingEntry(false);
    }
  };

  const totalRevenue = filteredPerformance.reduce((s, r) => s + r.revenue, 0);
  const totalRooms = filteredPerformance.reduce((s, r) => s + r.rooms, 0);
  const activeCount = filteredPerformance.filter((r) => r.is_active).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            Loading performance data…
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[1.6rem] font-bold text-slate-900 font-headline tracking-tight leading-none mb-1">
          Daily Performance
        </h1>
        <p className="text-sm text-slate-400">Daily revenue and occupancy metrics across all properties.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-xs p-5 mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 font-headline">Manual Daily Entry</h2>
            <p className="text-xs text-slate-400">Enter a single performance record using the property performance API.</p>
          </div>
        </div>

        {entrySuccess && (
          <div className="mb-4 flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-lg">
            <CheckCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
            {entrySuccess}
          </div>
        )}

        {entryError && (
          <div className="mb-4 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            <XCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
            {entryError}
          </div>
        )}

        <form onSubmit={handleCreateEntry} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Source Upload ID</label>
            <input
              type="number"
              value={entrySourceUploadId}
              onChange={(e) => setEntrySourceUploadId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Property</label>
            <select
              value={entryPropertyId}
              onChange={(e) => handlePropertySelect(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            >
              <option value="">Select a property</option>
              {properties.map((property) => (
                <option key={property.id} value={String(property.id)}>
                  {property.property_name} ({property.property_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Company ID</label>
            <input
              type="number"
              value={entryCompanyId}
              onChange={(e) => setEntryCompanyId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              placeholder="Company ID"
            />
          </div>

          <div>
            <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Date</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Rooms</label>
            <input
              type="number"
              value={entryRooms}
              onChange={(e) => setEntryRooms(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              placeholder="0"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-[0.65rem] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Revenue</label>
            <input
              type="number"
              step="0.01"
              value={entryRevenue}
              onChange={(e) => setEntryRevenue(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              placeholder="0.00"
              min="0"
              required
            />
          </div>

          <div className="lg:col-span-3 flex items-end justify-end">
            <button
              type="submit"
              disabled={creatingEntry}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingEntry ? 'Saving…' : 'Save Daily Entry'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          <XCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Summary strip */}
      {performance.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            {
              label: 'Records',
              value: filteredPerformance.length,
              icon: CheckBadgeIcon,
              accent: 'text-indigo-600',
              bg: 'bg-indigo-50',
            },
            {
              label: 'Total Rooms',
              value: totalRooms.toLocaleString(),
              icon: MoonIcon,
              accent: 'text-violet-600',
              bg: 'bg-violet-50',
            },
            {
              label: 'Total Revenue',
              value: formatCurrency(totalRevenue),
              icon: BanknotesIcon,
              accent: 'text-emerald-600',
              bg: 'bg-emerald-50',
            },
            {
              label: 'Active',
              value: activeCount,
              icon: BuildingOffice2Icon,
              accent: 'text-amber-600',
              bg: 'bg-amber-50',
            },
          ].map(({ label, value, icon: Icon, accent, bg }) => (
            <div
              key={label}
              className="bg-white border border-gray-100 rounded-xl px-5 py-4 shadow-xs flex items-center gap-4"
            >
              <div className={`p-2 rounded-lg ${bg} shrink-0`}>
                <Icon className={`w-4 h-4 ${accent}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                  {label}
                </p>
                <p className={`text-lg font-bold font-headline leading-none ${accent}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table card */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-xs overflow-hidden">
        {/* Table toolbar */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input
              type="text"
              placeholder="Search property, code, company…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm text-slate-900 placeholder:text-gray-300 bg-gray-50/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-xs text-slate-400 font-medium ml-auto shrink-0">
            {filteredPerformance.length} of {performance.length} records
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Date', 'Property', 'Company', 'Rooms', 'Revenue', 'Status', 'Remarks'].map(
                  (col, i) => (
                    <th
                      key={col}
                      className={`px-5 py-3 text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider bg-gray-50/50 ${
                        i >= 3 && i <= 4 ? 'text-right' : i === 5 ? 'text-center' : 'text-left'
                      }`}
                    >
                      {col}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPerformance.length > 0 ? (
                filteredPerformance.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-sm text-slate-600 whitespace-nowrap">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-slate-900 leading-snug">
                        {record.property_name}
                      </p>
                      <span className="text-[0.6rem] font-mono font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {record.property_code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                      {record.company_name}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-800 text-right tabular-nums">
                      {record.rooms}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-bold text-emerald-600 text-right tabular-nums whitespace-nowrap">
                      {formatCurrency(record.revenue)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-block text-[0.65rem] font-semibold px-2 py-1 rounded-full ${
                          record.is_active
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {record.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400 max-w-48 truncate">
                      {record.remarks || <span className="text-slate-200">—</span>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <MagnifyingGlassIcon className="w-8 h-8 text-slate-200" />
                      <p className="text-sm font-medium text-slate-400">
                        {searchTerm ? 'No records match your search.' : 'No performance data available.'}
                      </p>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium mt-1 transition-colors"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        {filteredPerformance.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Showing {filteredPerformance.length} record{filteredPerformance.length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Total:{' '}
              <span className="text-emerald-600">{formatCurrency(totalRevenue)}</span>
              {' · '}
              <span className="text-slate-700">{totalRooms.toLocaleString()} rooms</span>
            </span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
