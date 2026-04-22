'use client';

import { useState } from 'react';
import { getPropertyDiagnosisReport } from '../../api/client';
import DashboardLayout from '../../components/DashboardLayout';
import {
  DocumentChartBarIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

interface DiagnosisData {
  month: string;
  status: string;
  property: {
    id: number;
    name: string;
  };
  action_type: string;
  recommended_adr: number;
  diagnosis_reference: {
    [key: string]: {
      action: string;
      condition: string;
      description: string;
    };
  };
}

interface ApiResponse {
  status: string;
  message: string;
  data: DiagnosisData[];
}

export default function DiagnosisReportPage() {
  const [propertyId, setPropertyId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData[] | null>(null);
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
      const response = await getPropertyDiagnosisReport({ property_id: propertyId, month: monthParam }) as ApiResponse;
      if (response.status === 'success') {
        setDiagnosisData(response.data);
        setSuccess('Diagnosis report generated successfully!');
      } else {
        setError(response.message || 'No data found');
      }
    } catch (err) {
      setError('Failed to generate diagnosis report. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ON_TRACK':
        return {
          color: 'emerald',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          textColor: 'text-emerald-700',
          icon: CheckCircleIcon,
          label: 'On Track'
        };
      case 'OFF_TRACK':
      case 'CRITICAL':
        return {
          color: 'red',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          icon: XCircleIcon,
          label: 'Off Track'
        };
      case 'AT_RISK':
      case 'OUT_OF_RANGE':
        return {
          color: 'amber',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-700',
          icon: ExclamationTriangleIcon,
          label: 'At Risk'
        };
      default:
        return {
          color: 'slate',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          textColor: 'text-slate-700',
          icon: DocumentChartBarIcon,
          label: status.replace('_', ' ')
        };
    }
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getActionConfig = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case 'increase_price':
        return {
          icon: ArrowTrendingUpIcon,
          color: 'emerald',
          label: 'Increase Price',
          description: 'Recommended to raise ADR for better revenue'
        };
      case 'decrease_price':
        return {
          icon: ArrowTrendingDownIcon,
          color: 'red',
          label: 'Decrease Price',
          description: 'Recommended to lower ADR to boost occupancy'
        };
      case 'promote':
        return {
          icon: LightBulbIcon,
          color: 'blue',
          label: 'Promote',
          description: 'Low booking pace - consider promotional activities'
        };
      case 'investigate':
        return {
          icon: ExclamationTriangleIcon,
          color: 'amber',
          label: 'Investigate',
          description: 'Performance needs manual review'
        };
      case 'no_action':
      default:
        return {
          icon: CheckCircleIcon,
          color: 'emerald',
          label: 'No Action Needed',
          description: 'Performance is healthy'
        };
    }
  };

  const getDiagnosisInfo = (diagnosis: DiagnosisData) => {
    return diagnosis.diagnosis_reference[diagnosis.status.toLowerCase()] || {
      action: 'unknown',
      condition: '',
      description: 'No description available'
    };
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 font-headline mb-2">Property Diagnosis</h1>
        <p className="text-slate-600">AI-powered property performance analysis and recommendations</p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Search Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                <MagnifyingGlassIcon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-headline">Analyze Property Performance</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Property ID
                </label>
                <input
                  type="text"
                  placeholder="Enter property ID"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50/50 focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Analysis Month
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
            </div>

            <button
              type="submit"
              disabled={loading || !propertyId || !selectedMonth}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>Generate Diagnosis Report</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-5 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
            <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 font-medium leading-relaxed">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-5 bg-emerald-50 border-2 border-emerald-200 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
            <CheckCircleIcon className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-700 font-medium leading-relaxed">{success}</p>
          </div>
        )}

        {/* Results */}
        {diagnosisData && diagnosisData.length > 0 && (
          <div className="space-y-6">
            {diagnosisData.map((diagnosis, index) => {
              const statusConfig = getStatusConfig(diagnosis.status);
              const actionConfig = getActionConfig(diagnosis.action_type);
              const diagnosisInfo = getDiagnosisInfo(diagnosis);
              const IconComponent = statusConfig.icon;

              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Header */}
                  <div className={`px-8 py-6 border-b ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
                          <IconComponent className={`w-8 h-8 ${statusConfig.textColor}`} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 font-headline">
                            {diagnosis.property.name}
                          </h3>
                          <p className="text-slate-600 flex items-center gap-2 mt-1">
                            <BuildingOfficeIcon className="w-4 h-4" />
                            Property ID: {diagnosis.property.id}
                            <span className="text-slate-400">•</span>
                            <CalendarIcon className="w-4 h-4" />
                            {formatMonth(diagnosis.month)}
                          </p>
                        </div>
                      </div>
                      <div className={`px-5 py-3 rounded-xl border-2 flex items-center gap-2 ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
                        <IconComponent className={`w-6 h-6 ${statusConfig.textColor}`} />
                        <span className={`font-bold text-lg ${statusConfig.textColor}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 space-y-6">
                    {/* Diagnosis Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Diagnosis Details */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <DocumentChartBarIcon className="w-5 h-5 text-blue-600" />
                          Diagnosis Details
                        </h4>
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200">
                          <div className="mb-4">
                            <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Condition</span>
                            <p className="text-slate-900 font-mono text-sm mt-1 bg-white/50 px-3 py-2 rounded-lg">
                              {diagnosisInfo.condition}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Analysis</span>
                            <p className="text-slate-700 mt-1 leading-relaxed">{diagnosisInfo.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* Recommended Action */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <LightBulbIcon className="w-5 h-5 text-amber-500" />
                          Recommended Action
                        </h4>
                        <div className={`rounded-xl p-5 border-2 ${actionConfig.color === 'emerald' ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200' : actionConfig.color === 'red' ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' : actionConfig.color === 'amber' ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200' : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'}`}>
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl bg-white shadow-sm border ${actionConfig.color === 'emerald' ? 'border-emerald-200' : actionConfig.color === 'red' ? 'border-red-200' : actionConfig.color === 'amber' ? 'border-amber-200' : 'border-blue-200'}`}>
                              <actionConfig.icon className={`w-7 h-7 ${actionConfig.color === 'emerald' ? 'text-emerald-600' : actionConfig.color === 'red' ? 'text-red-600' : actionConfig.color === 'amber' ? 'text-amber-600' : 'text-blue-600'}`} />
                            </div>
                            <div className="flex-1">
                              <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-2 ${actionConfig.color === 'emerald' ? 'bg-emerald-200 text-emerald-800' : actionConfig.color === 'red' ? 'bg-red-200 text-red-800' : actionConfig.color === 'amber' ? 'bg-amber-200 text-amber-800' : 'bg-blue-200 text-blue-800'}`}>
                                {actionConfig.label}
                              </div>
                              <p className="text-slate-700 leading-relaxed">{actionConfig.description}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ADR Card */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <h4 className="text-lg font-bold text-slate-900 mb-4">ADR Adjustment</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <span className="text-sm text-slate-600">Current ADR</span>
                          <p className="text-2xl font-bold text-slate-900">
                            ${diagnosis.action_type === 'no_action' ? diagnosis.recommended_adr.toFixed(2) : '---'}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <span className="text-sm text-slate-600">Recommended ADR</span>
                          <p className="text-2xl font-bold text-blue-600">
                            ${diagnosis.recommended_adr.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <span className="text-sm text-slate-600">Change</span>
                          <p className={`text-2xl font-bold ${diagnosis.action_type === 'no_action' ? 'text-emerald-600' : diagnosis.action_type === 'increase_price' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {diagnosis.action_type === 'no_action' ? '0%' : '+'}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <span className="text-sm text-slate-600">Action</span>
                          <p className={`text-lg font-bold capitalize ${diagnosis.action_type === 'no_action' ? 'text-emerald-600' : diagnosis.action_type === 'increase_price' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {diagnosis.action_type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Raw Data Toggle */}
            <details className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <summary className="p-6 font-semibold text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors flex items-center gap-2">
                <DocumentChartBarIcon className="w-5 h-5" />
                View Raw API Response
              </summary>
              <div className="px-6 pb-6">
                <pre className="bg-slate-950 text-slate-300 p-6 rounded-xl text-sm overflow-x-auto font-moose">
                  {JSON.stringify(diagnosisData, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}

        {/* No Data State */}
        {diagnosisData && diagnosisData.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-slate-200">
            <DocumentChartBarIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Data Available</h3>
            <p className="text-slate-600">No diagnosis data found for the selected property and month.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
