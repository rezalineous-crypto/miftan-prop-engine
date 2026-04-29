'use client';

import {
  XMarkIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  BanknotesIcon,
  MoonIcon,
  UserGroupIcon,
  ArrowRightEndOnRectangleIcon,
  ArrowLeftEndOnRectangleIcon,
} from '@heroicons/react/24/outline';

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

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    COMPLETED: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-600', icon: <CheckCircleIcon className="w-3 h-3" /> },
    PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-600', icon: <ExclamationTriangleIcon className="w-3 h-3" /> },
    FAILED: { label: 'Failed', cls: 'bg-red-50 text-red-600', icon: <XCircleIcon className="w-3 h-3" /> },
  };
  const s = map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-500', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 text-[0.65rem] font-semibold px-2 py-1 rounded-full ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
}

export default function UploadDetailsModal({ isOpen, onClose, upload, loading = false }: UploadDetailsModalProps) {
  if (!isOpen || !upload) return null;

  const totals = {
    rooms: upload.item_details.reduce((s, i) => s + i.rooms, 0),
    arrivals: upload.item_details.reduce((s, i) => s + i.arrivals, 0),
    departures: upload.item_details.reduce((s, i) => s + i.departures, 0),
    bedNights: upload.item_details.reduce((s, i) => s + i.bed_nights, 0),
    income: upload.item_details.reduce((s, i) => s + i.total_income, 0),
    avgOcc:
      upload.item_details.length > 0
        ? upload.item_details.reduce((s, i) => s + i.occupancy_percentage, 0) / upload.item_details.length
        : 0,
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-gray-100">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between z-10">
          <div>
            <h2 className="text-sm font-bold text-slate-900 font-headline">Upload Details</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{upload.file_name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 mt-0.5"
            aria-label="Close"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-64">
            <div className="flex items-center gap-3 text-slate-500 text-sm">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              Loading details…
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Meta row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Property', icon: BuildingOffice2Icon, primary: upload.property_name, secondary: upload.property_code },
                { label: 'Company', icon: BuildingOffice2Icon, primary: upload.company_name, secondary: null },
                { label: 'Period', icon: CalendarDaysIcon, primary: `${MONTHS[upload.upload_month]} ${upload.upload_year}`, secondary: null },
                { label: 'Status', icon: null, primary: null, secondary: null, badge: upload.status },
              ].map(({ label, icon: Icon, primary, secondary, badge }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-[0.6rem] font-semibold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                  {badge ? (
                    <StatusBadge status={badge} />
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-slate-900 leading-snug">{primary}</p>
                      {secondary && (
                        <span className="text-[0.6rem] font-mono font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                          {secondary}
                        </span>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: 'Rooms', value: totals.rooms, icon: MoonIcon, accent: 'text-indigo-600', bg: 'bg-indigo-50' },
                { label: 'Arrivals', value: totals.arrivals, icon: ArrowRightEndOnRectangleIcon, accent: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Departures', value: totals.departures, icon: ArrowLeftEndOnRectangleIcon, accent: 'text-rose-500', bg: 'bg-rose-50' },
                { label: 'Bed Nights', value: totals.bedNights, icon: UserGroupIcon, accent: 'text-violet-600', bg: 'bg-violet-50' },
                { label: 'Income', value: formatCurrency(totals.income), icon: BanknotesIcon, accent: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Avg Occ.', value: `${totals.avgOcc.toFixed(1)}%`, icon: CheckCircleIcon, accent: 'text-amber-600', bg: 'bg-amber-50' },
              ].map(({ label, value, icon: Icon, accent, bg }) => (
                <div key={label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex flex-col items-center text-center shadow-xs">
                  <div className={`p-1.5 rounded-lg ${bg} mb-2`}>
                    <Icon className={`w-3.5 h-3.5 ${accent}`} />
                  </div>
                  <p className={`text-base font-bold font-headline leading-none ${accent} mb-1`}>{value}</p>
                  <p className="text-[0.6rem] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>

            {/* Detail table */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-xs">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700">Daily Breakdown</p>
                <span className="text-xs text-slate-400">{upload.item_details.length} rows</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Date', 'Hotel', 'Rooms', 'Arrivals', 'Dep.', 'Bed Nights', 'Income', 'Avg Rate', 'Occ %'].map(
                        (col, i) => (
                          <th
                            key={col}
                            className={`px-4 py-2.5 text-[0.6rem] font-semibold text-slate-400 uppercase tracking-wider bg-gray-50/50 ${
                              i >= 2 ? 'text-right' : 'text-left'
                            }`}
                          >
                            {col}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {upload.item_details.length > 0 ? (
                      upload.item_details.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-2.5 text-xs text-slate-600 whitespace-nowrap">
                            {formatDate(item.stay_date)}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-800 font-medium whitespace-nowrap">
                            {item.hotel_name}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-700 text-right tabular-nums">{item.rooms}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-700 text-right tabular-nums">{item.arrivals}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-700 text-right tabular-nums">{item.departures}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-700 text-right tabular-nums">{item.bed_nights}</td>
                          <td className="px-4 py-2.5 text-xs font-semibold text-emerald-600 text-right tabular-nums whitespace-nowrap">
                            {formatCurrency(item.total_income)}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-700 text-right tabular-nums whitespace-nowrap">
                            {formatCurrency(item.average_room_rate)}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span
                              className={`inline-block text-[0.6rem] font-bold px-1.5 py-0.5 rounded ${
                                item.occupancy_percentage >= 75
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : item.occupancy_percentage >= 50
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-red-50 text-red-500'
                              }`}
                            >
                              {item.occupancy_percentage.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-400">
                          No item details available.
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
