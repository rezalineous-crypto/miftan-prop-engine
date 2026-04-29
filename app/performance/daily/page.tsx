'use client';

import { useCallback, useEffect, useState } from 'react';
import { getPropertyPerformance } from '../../api/client';
import DashboardLayout from '../../components/DashboardLayout';
import {
  MagnifyingGlassIcon,
  XCircleIcon,
  BuildingOffice2Icon,
  BanknotesIcon,
  MoonIcon,
  CheckBadgeIcon,
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

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

export default function DailyPerformancePage() {
  const [performance, setPerformance] = useState<PerformanceRecord[]>([]);
  const [filteredPerformance, setFilteredPerformance] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  useEffect(() => { fetchPerformanceData(); }, [fetchPerformanceData]);

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
