'use client';

import { useState } from 'react';
import { getPropertyPerformanceReport } from '../../api/client';
import DashboardLayout from '../../components/DashboardLayout';
import {
  MagnifyingGlassIcon,
  XCircleIcon,
  CheckCircleIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface PerformanceData {
  otb: {
    nights: number;
    revenue: number;
  };
  kpis: {
    adr_gap: number;
    adr_ratio: {
      value: number;
      low_threshold: number;
      high_threshold: number;
    };
    pace_ratio: {
      value: number;
      threshold: number;
    };
    nights_pace_ratio: {
      value: number;
      low_threshold: number;
      high_threshold: number;
    };
  };
  month: string;
  actual: {
    adr: number;
    nights_to_date: number;
    revenue_to_date: number;
  };
  expected: {
    adr: number;
    occupancy: number;
    nights_month: number;
    revenue_month: number;
    nights_to_date: number;
    revenue_to_date: number;
  };
  forecast: {
    forecast_revenue: number;
    potential_revenue: number;
    forecast_vs_target: number;
    remaining_free_days: number;
    forecast_after_action: number;
    forecast_vs_target_pct: number;
  };
  property: {
    id: number;
    name: string;
  };
  confidence: string;
  current_day: number;
  days_in_month: number;
  month_progress: number;
  data_validation: {
    is_valid: boolean;
    has_nights_data: boolean;
    has_revenue_data: boolean;
  };
}

interface ApiResponse {
  status: string;
  message: string;
  data: PerformanceData;
}

export default function PropertyPerformanceReportPage() {
  const [propertyId, setPropertyId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const monthParam = `${selectedMonth}-01`;
      const response = await getPropertyPerformanceReport({ property_id: propertyId, month: monthParam }) as ApiResponse;
      if (response.status === 'success') {
        setPerformanceData(response.data);
        setSuccess('Performance report loaded successfully!');
      } else {
        setError(response.message || 'No data found for the selected criteria');
      }
    } catch {
      setError('Failed to load performance report. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toUpperCase()) {
      case 'HIGH':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'LOW':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Helper to determine ADR ratio status
  const getAdrRatioStatus = (value: number) => {
    if (value < 0.9) return { color: 'amber', label: 'Low' };
    if (value > 1.2) return { color: 'red', label: 'High' };
    return { color: 'emerald', label: 'Optimal' };
  };

  // Helper to determine Nights Pace status
  const getNightsPaceStatus = (value: number) => {
    if (value < 0.9 || value > 1.1) return { color: 'amber', label: 'Out of Range' };
    return { color: 'emerald', label: 'On Track' };
  };

  // Helper to determine Pace status
  const getPaceStatus = (value: number, threshold: number) => {
    if (value < threshold) return { color: 'red', label: 'Below Threshold' };
    return { color: 'emerald', label: 'Above Threshold' };
  };

  // Generate full month data for trajectory chart
  const generateFullMonthTrajectory = () => {
    if (!performanceData) return [];

    const daysInMonth = performanceData.days_in_month;
    const currentDay = performanceData.current_day;
    const targetRevenueMonthly = performanceData.expected.revenue_month;
    const expectedDailyRevenue = targetRevenueMonthly / daysInMonth;
    const actualRevenueToDate = performanceData.actual.revenue_to_date;
    const forecastRevenue = performanceData.forecast.forecast_revenue;
    const potentialRevenue = performanceData.forecast.potential_revenue;

    const data: Array<{
      day: number;
      expectedRevenue: number;
      actualCumulative: number | null;
      forecastCumulative: number;
      potentialCumulative: number;
    }> = [];

    const actualDailyAvg = actualRevenueToDate / Math.max(1, currentDay);

    for (let day = 1; day <= daysInMonth; day++) {
      const expectedCum = expectedDailyRevenue * day;
      const actualCum = actualDailyAvg * day;

       // Forecast trajectory
       let forecastCum: number;
       if (day <= currentDay) {
         forecastCum = actualCum;
       } else {
         const avgForecastDaily = (forecastRevenue - actualRevenueToDate) / (daysInMonth - currentDay);
         forecastCum = actualRevenueToDate + (avgForecastDaily * (day - currentDay));
       }

       // Potential cumulative (optimistic)
       let potentialCum: number;
       if (day <= currentDay) {
         potentialCum = actualRevenueToDate;
       } else {
         const avgPotentialDaily = (potentialRevenue - actualRevenueToDate) / (daysInMonth - currentDay);
         potentialCum = actualRevenueToDate + (avgPotentialDaily * (day - currentDay));
       }

      data.push({
        day,
        expectedRevenue: Math.round(expectedCum),
        actualCumulative: day <= currentDay ? Math.round(actualCum) : null,
        forecastCumulative: Math.round(forecastCum),
        potentialCumulative: Math.round(potentialCum)
      });
    }

    return data;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-4">
          <p className="font-semibold text-slate-900 mb-2">Day {label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? formatCurrency(entry.value) : 'N/A'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 font-headline mb-2">Property Performance</h1>
        <p className="text-slate-600">Comprehensive analytics and AI-driven performance insights</p>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Top Section: Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-8">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col lg:flex-row gap-6 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Property ID
                </label>
                <input
                  type="number"
                  placeholder="Enter property ID (e.g., 1)"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50/50 focus:bg-white"
                  required
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Month
                </label>
                <div className="relative">
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50/50 focus:bg-white [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    required
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !propertyId || !selectedMonth}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <MagnifyingGlassIcon className="w-5 h-5" />
                    <span>Analyze</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-5 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-4">
            <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 font-medium leading-relaxed">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-5 bg-emerald-50 border-2 border-emerald-200 rounded-xl flex items-start gap-4">
            <CheckCircleIcon className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-700 font-medium leading-relaxed">{success}</p>
          </div>
        )}

        {/* Results */}
        {performanceData && (
          <div className="space-y-8">
            {/* Section 1: Property Overview Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl border border-blue-200">
                      <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900 font-headline">
                        {performanceData.property.name}
                      </h2>
                      <p className="text-slate-600 flex items-center gap-2 mt-2 text-lg">
                        <CalendarIcon className="w-5 h-5" />
                        {formatMonth(performanceData.month)}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        Property ID: {performanceData.property.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Confidence Badge */}
                    <div className={`px-5 py-3 rounded-xl border-2 flex items-center gap-2 ${getConfidenceColor(performanceData.confidence)}`}>
                      <ExclamationTriangleIcon className="w-5 h-5" />
                      <span className="font-bold text-lg">{performanceData.confidence} Confidence</span>
                    </div>

                    {/* Data Validation */}
                    <div className={`px-5 py-3 rounded-xl border-2 flex items-center gap-2 ${
                      performanceData.data_validation.is_valid
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                      <CheckCircleIcon className="w-5 h-5" />
                      <span className="font-bold text-lg">
                        {performanceData.data_validation.is_valid ? 'Valid Data' : 'Invalid Data'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Month Progress Bar */}
                <div className="mt-8 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Month Progress</span>
                    <span className="text-sm font-bold text-slate-900">
                      Day {performanceData.current_day} of {performanceData.days_in_month}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 rounded-full transition-all duration-1000 ease-out shadow-sm"
                      style={{ width: `${(performanceData.current_day / performanceData.days_in_month) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                    <span>{formatMonth(performanceData.month)}</span>
                    <span>{Math.round((performanceData.current_day / performanceData.days_in_month) * 100)}% complete</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: KPI Cards (4 in a row) */}
            <div>
              <h3 className="text-2xl font-bold text-slate-900 font-headline mb-6">Key Performance Indicators</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* KPI 1: ADR Gap */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <CurrencyDollarIcon className="w-6 h-6 text-red-600" />
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      performanceData.kpis.adr_gap < 0
                        ? 'bg-red-100 text-red-700'
                        : performanceData.kpis.adr_gap > 0
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {performanceData.kpis.adr_gap < 0 ? 'Below Target' : performanceData.kpis.adr_gap > 0 ? 'Above Target' : 'On Target'}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">ADR Gap</div>
                  <div className={`text-3xl font-bold ${performanceData.kpis.adr_gap < 0 ? 'text-red-600' : performanceData.kpis.adr_gap > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {formatCurrency(performanceData.kpis.adr_gap)}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Difference from expected ADR</p>
                </div>

                {/* KPI 2: ADR Ratio */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <ChartBarIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      performanceData.kpis.adr_ratio.value < 0.9
                        ? 'bg-amber-100 text-amber-700'
                        : performanceData.kpis.adr_ratio.value > 1.2
                        ? 'bg-red-100 text-red-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {getAdrRatioStatus(performanceData.kpis.adr_ratio.value).label}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">ADR Ratio</div>
                  <div className={`text-3xl font-bold ${
                    performanceData.kpis.adr_ratio.value < 0.9
                      ? 'text-amber-600'
                      : performanceData.kpis.adr_ratio.value > 1.2
                      ? 'text-red-600'
                      : 'text-emerald-600'
                  }`}>
                    {performanceData.kpis.adr_ratio.value.toFixed(3)}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Range: {performanceData.kpis.adr_ratio.low_threshold} – {performanceData.kpis.adr_ratio.high_threshold}</p>
                </div>

                {/* KPI 3: Pace Ratio */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <ChartBarIcon className="w-6 h-6 text-amber-600" />
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      performanceData.kpis.pace_ratio.value < performanceData.kpis.pace_ratio.threshold
                        ? 'bg-red-100 text-red-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {getPaceStatus(performanceData.kpis.pace_ratio.value, performanceData.kpis.pace_ratio.threshold).label}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Pace Ratio</div>
                  <div className={`text-3xl font-bold ${
                    performanceData.kpis.pace_ratio.value < performanceData.kpis.pace_ratio.threshold
                      ? 'text-red-600'
                      : 'text-emerald-600'
                  }`}>
                    {performanceData.kpis.pace_ratio.value.toFixed(3)}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Threshold: {performanceData.kpis.pace_ratio.threshold}</p>
                </div>

                {/* KPI 4: Nights Pace Ratio */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <UserGroupIcon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      performanceData.kpis.nights_pace_ratio.value < 0.9 || performanceData.kpis.nights_pace_ratio.value > 1.1
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {getNightsPaceStatus(performanceData.kpis.nights_pace_ratio.value).label}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Nights Pace Ratio</div>
                  <div className={`text-3xl font-bold ${
                    performanceData.kpis.nights_pace_ratio.value < 0.9 || performanceData.kpis.nights_pace_ratio.value > 1.1
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}>
                    {performanceData.kpis.nights_pace_ratio.value.toFixed(3)}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Range: {performanceData.kpis.nights_pace_ratio.low_threshold} – {performanceData.kpis.nights_pace_ratio.high_threshold}</p>
                </div>
              </div>
            </div>

            {/* Section 3: Actual vs Expected */}
            <div>
              <h3 className="text-2xl font-bold text-slate-900 font-headline mb-6">Actual vs Expected Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Actual Performance */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900">Actual Performance</h4>
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Average Daily Rate</span>
                      <span className="text-2xl font-bold text-slate-900">{formatCurrency(performanceData.actual.adr)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Revenue to Date</span>
                      <span className="text-2xl font-bold text-slate-900">{formatCurrency(performanceData.actual.revenue_to_date)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">Nights to Date</span>
                      <span className="text-2xl font-bold text-slate-900">{performanceData.actual.nights_to_date}</span>
                    </div>
                  </div>
                </div>

                {/* Expected Performance */}
                <div className="bg-white rounded-2xl shadow-lg border border-blue-200 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <ChartBarIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900">Expected Performance</h4>
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Target ADR</span>
                      <span className="text-2xl font-bold text-blue-600">{formatCurrency(performanceData.expected.adr)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Target Revenue</span>
                      <span className="text-2xl font-bold text-blue-600">{formatCurrency(performanceData.expected.revenue_to_date)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <span className="text-slate-600 font-medium">Expected Nights</span>
                      <span className="text-2xl font-bold text-blue-600">{performanceData.expected.nights_to_date}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-600 font-medium">Month Target</span>
                      <span className="text-lg font-semibold text-blue-600">
                        {formatCurrency(performanceData.expected.revenue_month)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">Target Occupancy</span>
                      <span className="text-lg font-semibold text-blue-600">
                        {formatPercentage(performanceData.expected.occupancy)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Forecast Insights */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-lg border-2 border-blue-200 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-white rounded-lg shadow-md border border-blue-200">
                  <LightBulbIcon className="w-7 h-7 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 font-headline">Forecast Insights</h3>
                  <p className="text-slate-600">Revenue projections and performance outlook</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                  <div className="text-sm font-semibold text-slate-600 uppercase mb-2">Forecast Revenue</div>
                  <div className="text-2xl font-bold text-indigo-600">{formatCurrency(performanceData.forecast.forecast_revenue)}</div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-emerald-200">
                  <div className="text-sm font-semibold text-emerald-600 uppercase mb-2">Potential Revenue</div>
                  <div className="text-2xl font-bold text-emerald-600">{formatCurrency(performanceData.forecast.potential_revenue)}</div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                  <div className="text-sm font-semibold text-slate-600 uppercase mb-2">Forecast vs Target</div>
                  <div className={`text-2xl font-bold ${performanceData.forecast.forecast_vs_target < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {formatCurrency(performanceData.forecast.forecast_vs_target)}
                  </div>
                  <div className={`text-sm mt-1 ${performanceData.forecast.forecast_vs_target_pct < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {formatPercentage(performanceData.forecast.forecast_vs_target_pct)}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-200">
                  <div className="text-sm font-semibold text-blue-600 uppercase mb-2">Forecast After Action</div>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(performanceData.forecast.forecast_after_action)}</div>
                  <div className="text-sm text-slate-500 mt-1">{performanceData.forecast.remaining_free_days} days remaining</div>
                </div>
              </div>

              {/* Forecast Progress */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-slate-600">Target Progress</span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(performanceData.forecast.forecast_revenue)} / {formatCurrency(performanceData.expected.revenue_month)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      performanceData.forecast.forecast_vs_target < 0
                        ? 'bg-gradient-to-r from-red-500 to-red-600'
                        : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                    }`}
                    style={{
                      width: `${Math.max(0, Math.min(100, (performanceData.forecast.forecast_revenue / performanceData.expected.revenue_month) * 100))}%`
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
                {performanceData.forecast.forecast_vs_target < 0 && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-red-800">Revenue Gap Detected</div>
                        <div className="text-sm text-red-700 mt-1">
                          Forecast is <strong>{formatCurrency(Math.abs(performanceData.forecast.forecast_vs_target))}</strong> below target.
                          Recommended action could bridge {formatCurrency(performanceData.forecast.forecast_after_action - performanceData.forecast.forecast_revenue)}.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 5: OTB (On The Books) */}
            {performanceData.otb.nights > 0 || performanceData.otb.revenue > 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <CalendarIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Open To Buy (OTB)</h3>
                    <p className="text-sm text-slate-600">Available inventory for remaining days</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                    <div className="text-sm font-semibold text-slate-600 uppercase mb-2">Available Nights</div>
                    <div className="text-3xl font-bold text-purple-600">{performanceData.otb.nights.toLocaleString()}</div>
                    <p className="text-xs text-slate-500 mt-2">Room nights still available to sell</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <div className="text-sm font-semibold text-slate-600 uppercase mb-2">Available Revenue</div>
                    <div className="text-3xl font-bold text-blue-600">{formatCurrency(performanceData.otb.revenue)}</div>
                    <p className="text-xs text-slate-500 mt-2">Potential revenue from available inventory</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
                <CalendarIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Open Inventory</h3>
                <p className="text-slate-600">All room nights for this month have been booked.</p>
              </div>
            )}

            {/* Section 6: Performance Chart */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <ChartBarIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Revenue Performance Trajectory</h3>
                  <p className="text-sm text-slate-600">Actual vs Expected revenue progression throughout the month</p>
                </div>
              </div>

              {performanceData && (
                <div className="space-y-6">
                  {/* Chart Controls */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 rounded bg-emerald-500"></div>
                      <span className="text-slate-600">Actual Revenue</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 rounded bg-blue-500"></div>
                      <span className="text-slate-600">Target Revenue</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 rounded bg-indigo-500"></div>
                      <span className="text-slate-600">Forecast Trajectory</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 rounded bg-red-500"></div>
                      <span className="text-slate-600">Potential Gap</span>
                    </div>
                  </div>

                  {/* Revenue Trajectory Chart */}
                  <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={generateFullMonthTrajectory()} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="expectedGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="day" 
                          stroke="#64748b"
                          tick={{ fill: '#64748b', fontSize: 12 }}
                          tickLine={{ stroke: '#64748b' }}
                        />
                        <YAxis 
                          stroke="#64748b"
                          tick={{ fill: '#64748b', fontSize: 12 }}
                          tickLine={{ stroke: '#64748b' }}
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />

                        {/* Target Revenue Area */}
                        <Area
                          type="monotone"
                          dataKey="expectedRevenue"
                          name="Target Revenue"
                          stroke="#3b82f6"
                          fill="url(#expectedGradient)"
                          strokeWidth={2}
                          dot={false}
                        />

                        {/* Actual Revenue Line */}
                        <Line
                          type="monotone"
                          dataKey="actualCumulative"
                          name="Actual Revenue"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />

                        {/* Forecast Trajectory Line (dashed) */}
                        <Line
                          type="monotone"
                          dataKey="forecastCumulative"
                          name="Forecast Trajectory"
                          stroke="#6366f1"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                        />

                        {/* Potential Revenue Line (dotted) */}
                        <Line
                          type="monotone"
                          dataKey="potentialCumulative"
                          name="Potential Revenue"
                          stroke="#f59e0b"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          dot={false}
                        />

                        {/* Gap indicator line (if forecast below target) */}
                        {performanceData.forecast.forecast_vs_target < 0 && (
                          <Line
                            type="linear"
                            dataKey="expectedRevenue"
                            name="Revenue Gap"
                            stroke="#ef4444"
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            dot={false}
                            connectNulls={false}
                          />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Chart Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-200 rounded-lg">
                          <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-700" />
                        </div>
                        <span className="text-sm font-semibold text-emerald-800">Actual Performance</span>
                      </div>
                      <div className="text-2xl font-bold text-emerald-700">{formatCurrency(performanceData.actual.revenue_to_date)}</div>
                      <p className="text-xs text-emerald-600 mt-1">
                        Revenue collected to date ({performanceData.actual.nights_to_date} nights)
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-200 rounded-lg">
                          <ChartBarIcon className="w-5 h-5 text-blue-700" />
                        </div>
                        <span className="text-sm font-semibold text-blue-800">Monthly Target</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-700">{formatCurrency(performanceData.expected.revenue_month)}</div>
                      <p className="text-xs text-blue-600 mt-1">
                        Expected for full month ({formatPercentage(performanceData.expected.occupancy)} occupancy)
                      </p>
                    </div>

                    <div className={`bg-gradient-to-br ${performanceData.forecast.forecast_vs_target < 0 ? 'from-red-50 to-red-100 border-red-200' : 'from-emerald-50 to-emerald-100 border-emerald-200'} rounded-xl p-6 border`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 ${performanceData.forecast.forecast_vs_target < 0 ? 'bg-red-200' : 'bg-emerald-200'} rounded-lg`}>
                          {performanceData.forecast.forecast_vs_target < 0 ? (
                            <ExclamationTriangleIcon className="w-5 h-5 text-red-700" />
                          ) : (
                            <CheckCircleIcon className="w-5 h-5 text-emerald-700" />
                          )}
                        </div>
                        <span className={`text-sm font-semibold ${performanceData.forecast.forecast_vs_target < 0 ? 'text-red-800' : 'text-emerald-800'}`}>
                          Variance
                        </span>
                      </div>
                      <div className={`text-2xl font-bold ${performanceData.forecast.forecast_vs_target < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                        {formatCurrency(Math.abs(performanceData.forecast.forecast_vs_target))}
                      </div>
                      <p className={`text-xs ${performanceData.forecast.forecast_vs_target < 0 ? 'text-red-600' : 'text-emerald-600'} mt-1`}>
                        {performanceData.forecast.forecast_vs_target < 0 ? 'Below' : 'Above'} target ({formatPercentage(performanceData.forecast.forecast_vs_target_pct)})
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 7: Data Validation Badge */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Data Validation Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-5 rounded-xl border-2 ${
                  performanceData.data_validation.is_valid
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {performanceData.data_validation.is_valid ? (
                      <CheckCircleIcon className="w-8 h-8 text-emerald-600" />
                    ) : (
                      <XCircleIcon className="w-8 h-8 text-red-600" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-slate-600">Validation</div>
                      <div className={`text-2xl font-bold ${performanceData.data_validation.is_valid ? 'text-emerald-700' : 'text-red-700'}`}>
                        {performanceData.data_validation.is_valid ? 'Valid' : 'Invalid'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-5 rounded-xl border-2 ${
                  performanceData.data_validation.has_nights_data
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {performanceData.data_validation.has_nights_data ? (
                      <CheckCircleIcon className="w-8 h-8 text-emerald-600" />
                    ) : (
                      <ExclamationTriangleIcon className="w-8 h-8 text-amber-600" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-slate-600">Nights Data</div>
                      <div className={`text-2xl font-bold ${performanceData.data_validation.has_nights_data ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {performanceData.data_validation.has_nights_data ? 'Present' : 'Missing'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-5 rounded-xl border-2 ${
                  performanceData.data_validation.has_revenue_data
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {performanceData.data_validation.has_revenue_data ? (
                      <CheckCircleIcon className="w-8 h-8 text-emerald-600" />
                    ) : (
                      <ExclamationTriangleIcon className="w-8 h-8 text-amber-600" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-slate-600">Revenue Data</div>
                      <div className={`text-2xl font-bold ${performanceData.data_validation.has_revenue_data ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {performanceData.data_validation.has_revenue_data ? 'Present' : 'Missing'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Raw JSON Response (Collapsible) */}
            <details className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <summary className="p-6 font-semibold text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors flex items-center gap-2">
                <DocumentChartBarIcon className="w-5 h-5" />
                <span>View Raw API Response</span>
              </summary>
              <div className="px-6 pb-6">
                <pre className="bg-slate-950 text-slate-300 p-6 rounded-xl text-sm overflow-x-auto font-mono leading-relaxed">
                  {JSON.stringify(performanceData, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}

        {/* No Data State */}
        {performanceData === null && !loading && !error && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-lg border border-slate-200">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-6">
              <ChartBarIcon className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Ready to Analyze</h3>
            <p className="text-slate-600 max-w-md mx-auto">
              Enter a property ID and select a month to generate a comprehensive performance report with AI-powered insights.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 animate-pulse">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-slate-200 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-8 bg-slate-200 rounded w-1/3 mb-3"></div>
                  <div className="h-5 bg-slate-200 rounded w-1/4"></div>
                </div>
              </div>
              <div className="h-4 bg-slate-200 rounded-full w-full mb-6"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                  <div className="h-10 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
