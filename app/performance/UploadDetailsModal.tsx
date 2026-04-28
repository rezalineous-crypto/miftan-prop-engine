'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';

interface ItemDetail {
  id: number;
  rooms: number;
  remarks: string | null;
  arrivals: number;
  is_active: boolean;
  stay_date: string;
  stay_over: number;
  upload_id: number;
  bed_nights: number;
  created_at: string;
  created_by: number;
  departures: number;
  hotel_name: string;
  updated_at: string | null;
  updated_by: number | null;
  total_income: number;
  guest_per_room: number;
  average_room_rate: number;
  average_guest_rate: number;
  occupancy_percentage: number;
}

interface UploadDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  upload: {
    id: number;
    file_name: string;
    company_name: string;
    property_name: string;
    property_code: string;
    upload_month: number;
    upload_year: number;
    status: string;
    created_at: string;
    item_details: ItemDetail[];
  } | null;
  loading?: boolean;
}

export default function UploadDetailsModal({
  isOpen,
  onClose,
  upload,
  loading = false,
}: UploadDetailsModalProps) {
  if (!isOpen || !upload) return null;

  const monthNames = [
    '',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const calculateTotals = () => {
    return {
      totalRooms: upload.item_details.reduce((sum, item) => sum + item.rooms, 0),
      totalArrivals: upload.item_details.reduce((sum, item) => sum + item.arrivals, 0),
      totalDepartures: upload.item_details.reduce((sum, item) => sum + item.departures, 0),
      totalBedNights: upload.item_details.reduce((sum, item) => sum + item.bed_nights, 0),
      totalIncome: upload.item_details.reduce((sum, item) => sum + item.total_income, 0),
      averageOccupancy:
        upload.item_details.length > 0
          ? upload.item_details.reduce((sum, item) => sum + item.occupancy_percentage, 0) /
            upload.item_details.length
          : 0,
    };
  };

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-gray-900/20 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 flex items-center justify-between border-b border-slate-200">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-white mb-2">Upload Details</h2>
            <p className="text-blue-100">{upload.file_name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-96">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-600">Loading details...</span>
            </div>
          </div>
        ) : (
          <div className="p-8">
            {/* Upload Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Property</p>
                <p className="text-sm font-semibold text-slate-900">{upload.property_name}</p>
                <p className="text-xs text-slate-600">{upload.property_code}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Company</p>
                <p className="text-sm font-semibold text-slate-900">{upload.company_name}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Period</p>
                <p className="text-sm font-semibold text-slate-900">
                  {monthNames[upload.upload_month]} {upload.upload_year}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Status</p>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      upload.status === 'COMPLETED'
                        ? 'bg-emerald-500'
                        : upload.status === 'PENDING'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                  ></span>
                  <p className="text-sm font-semibold text-slate-900">{upload.status}</p>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{totals.totalRooms}</p>
                <p className="text-xs text-slate-600 mt-1">Total Rooms</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{totals.totalArrivals}</p>
                <p className="text-xs text-slate-600 mt-1">Arrivals</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{totals.totalDepartures}</p>
                <p className="text-xs text-slate-600 mt-1">Departures</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-pink-600">{totals.totalBedNights}</p>
                <p className="text-xs text-slate-600 mt-1">Bed Nights</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totals.totalIncome)}</p>
                <p className="text-xs text-slate-600 mt-1">Total Income</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{totals.averageOccupancy.toFixed(1)}%</p>
                <p className="text-xs text-slate-600 mt-1">Avg Occupancy</p>
              </div>
            </div>

            {/* Details Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Hotel</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Rooms</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Arrivals</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Departures</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700">Bed Nights</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Total Income</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Avg Room Rate</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Occupancy %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upload.item_details.length > 0 ? (
                      upload.item_details.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                            {formatDate(item.stay_date)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-900">{item.hotel_name}</td>
                          <td className="px-4 py-3 text-center text-sm text-slate-600">
                            {item.rooms}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-slate-600">
                            {item.arrivals}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-slate-600">
                            {item.departures}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-slate-600">
                            {item.bed_nights}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-slate-900 font-medium">
                            {formatCurrency(item.total_income)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-slate-900 font-medium">
                            {formatCurrency(item.average_room_rate)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm">
                            <span
                              className={`inline-block px-2 py-1 rounded font-medium ${
                                item.occupancy_percentage >= 75
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.occupancy_percentage >= 50
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {item.occupancy_percentage.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                          No item details available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
