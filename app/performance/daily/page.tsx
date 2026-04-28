'use client';

import { useEffect, useState } from 'react';
import { getPropertyPerformance } from '../../api/client';
import { useAuth } from '../../auth/context';
import DashboardLayout from '../../components/DashboardLayout';
import { MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

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

export default function DailyPerformancePage() {
  const { user } = useAuth();
  const [performance, setPerformance] = useState<PerformanceRecord[]>([]);
  const [filteredPerformance, setFilteredPerformance] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  useEffect(() => {
    // Filter based on search term
    if (searchTerm.trim() === '') {
      setFilteredPerformance(performance);
    } else {
      const filtered = performance.filter(
        (record) =>
          record.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.property_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.company_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPerformance(filtered);
    }
  }, [searchTerm, performance]);

  const fetchPerformanceData = async () => {
    try {
      const data = await getPropertyPerformance();
      const recordsArray = Array.isArray(data?.data) ? data.data : [];
      setPerformance(recordsArray);
      setFilteredPerformance(recordsArray);
    } catch (err) {
      setError('Failed to load performance data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-600">Loading performance data...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-headline mb-2">Daily Performance</h1>
          <p className="text-slate-600">View daily performance metrics for all properties.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
          <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Search Box */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by property name, code, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        {searchTerm && (
          <p className="mt-2 text-sm text-slate-600">
            Found <span className="font-semibold text-slate-900">{filteredPerformance.length}</span> record(s)
          </p>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Property</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Property Code</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Company</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Rooms</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">Revenue</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredPerformance.length > 0 ? (
                filteredPerformance.map((record) => (
                  <tr key={record.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {record.property_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {record.property_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {record.company_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium text-right">
                      {record.rooms}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium text-right">
                      {formatCurrency(record.revenue)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {record.is_active ? (
                        <div className="flex items-center justify-center">
                          <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <XCircleIcon className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                      {record.remarks || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    {searchTerm ? 'No performance records match your search.' : 'No performance data available.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      {filteredPerformance.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-slate-600 text-sm font-medium mb-2">Total Records</p>
            <p className="text-3xl font-bold text-slate-900">{filteredPerformance.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-slate-600 text-sm font-medium mb-2">Total Rooms</p>
            <p className="text-3xl font-bold text-slate-900">
              {filteredPerformance.reduce((sum, record) => sum + record.rooms, 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-slate-600 text-sm font-medium mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-slate-900">
              {formatCurrency(
                filteredPerformance.reduce((sum, record) => sum + record.revenue, 0)
              )}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <p className="text-slate-600 text-sm font-medium mb-2">Active Records</p>
            <p className="text-3xl font-bold text-slate-900">
              {filteredPerformance.filter((record) => record.is_active).length}
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
