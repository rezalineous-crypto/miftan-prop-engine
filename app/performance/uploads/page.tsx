'use client';

import { useCallback, useEffect, useState } from 'react';
import { uploadPerformance, getPerformanceUploads, getPerformanceUploadDetails } from '../../api/client';
import { useAuth } from '../../auth/context';
import DashboardLayout from '../../components/DashboardLayout';
import UploadModal from '../UploadModal';
import UploadDetailsModal from '../UploadDetailsModal';
import {
  DocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';

interface Upload {
  id: number;
  status: string;
  remarks: string | null;
  file_name: string;
  is_active: boolean;
  company_id: number;
  created_at: string;
  created_by: number;
  updated_at: string | null;
  updated_by: number | null;
  property_id: number;
  upload_date: string;
  upload_year: number;
  company_name: string;
  item_details: never[];
  upload_month: number;
  property_code: string;
  property_name: string;
}

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    COMPLETED: {
      label: 'Completed',
      cls: 'bg-emerald-50 text-emerald-600',
      icon: <CheckCircleIcon className="w-3 h-3" />,
    },
    PENDING: {
      label: 'Pending',
      cls: 'bg-amber-50 text-amber-600',
      icon: <ExclamationTriangleIcon className="w-3 h-3" />,
    },
    FAILED: {
      label: 'Failed',
      cls: 'bg-red-50 text-red-600',
      icon: <XCircleIcon className="w-3 h-3" />,
    },
  };
  const s = map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-500', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 text-[0.65rem] font-semibold px-2 py-1 rounded-full ${s.cls}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

export default function PerformanceUploadsPage() {
  const { getUserId } = useAuth();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [companyId, setCompanyId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [uploadMonth, setUploadMonth] = useState('');
  const [uploadYear, setUploadYear] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const fetchUploads = useCallback(async () => {
    try {
      const data = await getPerformanceUploads();
      setUploads(Array.isArray(data?.data) ? data.data : []);
    } catch {
      setError('Failed to load uploads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUploads(); }, [fetchUploads]);

  const handleViewDetails = async (uploadId: number) => {
    setLoadingDetails(true);
    try {
      const response = await getPerformanceUploadDetails(uploadId);
      const uploadData = Array.isArray(response?.data) ? response.data[0] : response?.data;
      if (uploadData) {
        setSelectedUpload(uploadData);
        setDetailsModalOpen(true);
      }
    } catch {
      setError('Failed to load upload details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!file) { setError('Please select a file'); return; }
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const userId = getUserId();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('company_id', companyId);
      formData.append('property_id', propertyId);
      formData.append('uploaded_by', String(userId || 1));
      formData.append('upload_month', uploadMonth);
      formData.append('upload_year', uploadYear);
      await uploadPerformance(formData);
      setSuccess('File uploaded successfully');
      setFile(null);
      setCompanyId(''); setPropertyId(''); setUploadMonth(''); setUploadYear('');
      setModalOpen(false);
      fetchUploads();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const completed = uploads.filter((u) => u.status === 'COMPLETED').length;
  const pending = uploads.filter((u) => u.status === 'PENDING').length;
  const failed = uploads.filter((u) => u.status === 'FAILED').length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            Loading uploads…
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
          <h1 className="text-[1.6rem] font-bold text-slate-900 font-headline tracking-tight leading-none mb-1">
            Performance Uploads
          </h1>
          <p className="text-sm text-slate-400">Upload and track performance data files.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all shadow-sm shadow-indigo-100"
        >
          <PlusIcon className="w-4 h-4" />
          New Upload
        </button>
      </div>

      {/* Banners */}
      {error && (
        <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          <XCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-5 flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-lg">
          <CheckCircleIcon className="w-4 h-4 shrink-0 mt-0.5" />
          {success}
        </div>
      )}

      {/* Summary strip */}
      {uploads.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Uploads', value: uploads.length, icon: CloudArrowUpIcon, accent: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Completed', value: completed, icon: CheckCircleIcon, accent: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Pending', value: pending, icon: ExclamationTriangleIcon, accent: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Failed', value: failed, icon: XCircleIcon, accent: 'text-red-500', bg: 'bg-red-50' },
          ].map(({ label, value, icon: Icon, accent, bg }) => (
            <div key={label} className="bg-white border border-gray-100 rounded-xl px-5 py-4 shadow-xs flex items-center gap-4">
              <div className={`p-2 rounded-lg ${bg} shrink-0`}>
                <Icon className={`w-4 h-4 ${accent}`} />
              </div>
              <div>
                <p className="text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className={`text-lg font-bold font-headline leading-none ${accent}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table card */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Upload History</p>
          <span className="text-xs text-slate-400 font-medium">{uploads.length} record{uploads.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['File', 'Property', 'Company', 'Period', 'Uploaded', 'Status', 'Action'].map((col, i) => (
                  <th
                    key={col}
                    className={`px-5 py-3 text-[0.65rem] font-semibold text-slate-400 uppercase tracking-wider bg-gray-50/50 ${i === 6 ? 'text-center' : 'text-left'}`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {uploads.length > 0 ? (
                uploads.map((upload) => (
                  <tr key={upload.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5 max-w-52">
                        <DocumentIcon className="w-4 h-4 text-slate-300 shrink-0" />
                        <span className="text-sm text-slate-800 font-medium truncate">{upload.file_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-slate-900 leading-snug">{upload.property_name}</p>
                      <span className="text-[0.6rem] font-mono font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {upload.property_code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">{upload.company_name}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 whitespace-nowrap">
                      {MONTH_NAMES[upload.upload_month]} {upload.upload_year}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">{formatDate(upload.created_at)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={upload.status} /></td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleViewDetails(upload.id)}
                        disabled={loadingDetails}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <DocumentCheckIcon className="w-8 h-8 text-slate-200" />
                      <p className="text-sm font-medium text-slate-400">No uploads yet</p>
                      <button
                        onClick={() => setModalOpen(true)}
                        className="text-xs text-indigo-500 hover:text-indigo-700 font-medium mt-1 transition-colors"
                      >
                        Upload your first file
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UploadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        file={file}
        onFileSelect={handleFileSelect}
        onDrag={handleDrag}
        onDrop={handleDrop}
        companyId={companyId}
        onCompanyIdChange={setCompanyId}
        propertyId={propertyId}
        onPropertyIdChange={setPropertyId}
        uploadMonth={uploadMonth}
        onUploadMonthChange={setUploadMonth}
        uploadYear={uploadYear}
        onUploadYearChange={setUploadYear}
        dragActive={dragActive}
        uploading={uploading}
      />

      <UploadDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        upload={selectedUpload}
        loading={loadingDetails}
      />
    </DashboardLayout>
  );
}
