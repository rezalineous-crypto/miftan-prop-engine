'use client';

import { useEffect, useState } from 'react';
import { uploadPerformance, getPerformanceUploads, getPerformanceUploadDetails } from '../../api/client';
import { useAuth } from '../../auth/context';
import DashboardLayout from '../../components/DashboardLayout';
import UploadModal from '../UploadModal';
import UploadDetailsModal from '../UploadDetailsModal';
import { DocumentIcon, CheckCircleIcon, XCircleIcon, PlusIcon, DocumentCheckIcon, ExclamationTriangleIcon, EyeIcon } from '@heroicons/react/24/outline';

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
  item_details: any[];
  upload_month: number;
  property_code: string;
  property_name: string;
}


export default function PerformanceUploadsPage() {
  const { user, getUserId } = useAuth();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Details view states
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form states
  const [file, setFile] = useState<File | null>(null);
  const [companyId, setCompanyId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [uploadMonth, setUploadMonth] = useState('');
  const [uploadYear, setUploadYear] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    try {
      const data = await getPerformanceUploads();
      const uploadsArray = Array.isArray(data?.data) ? data.data : [];
      setUploads(uploadsArray);
    } catch (err) {
      setError('Failed to load uploads');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (uploadId: number) => {
    setLoadingDetails(true);
    try {
      const response = await getPerformanceUploadDetails(uploadId);
      // The API returns an array, get the first item
      const uploadData = Array.isArray(response?.data) ? response.data[0] : response?.data;
      if (uploadData) {
        setSelectedUpload(uploadData);
        setDetailsModalOpen(true);
      }
    } catch (err) {
      setError('Failed to load upload details');
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

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
      setSuccess('File uploaded successfully!');
      setFile(null);
      setCompanyId('');
      setPropertyId('');
      setUploadMonth('');
      setUploadYear('');
      setModalOpen(false);
      fetchUploads();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <XCircleIcon className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-600">Loading uploads...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 font-headline mb-2">Performance Uploads</h1>
            <p className="text-slate-600">View upload history and manage performance data.</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>New Upload</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
          <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3">
          <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-emerald-700 font-medium">{success}</p>
        </div>
      )}

      {/* Uploads Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">File Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Property</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Company</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Period</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Upload Date</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Remarks</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {uploads.length > 0 ? (
                uploads.map((upload) => (
                  <tr key={upload.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      <div className="flex items-center space-x-2">
                        <DocumentIcon className="w-4 h-4 text-slate-400" />
                        <span>{upload.file_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {upload.property_name}
                      <p className="text-xs text-slate-500">{upload.property_code}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {upload.company_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {monthNames[upload.upload_month]} {upload.upload_year}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(upload.created_at)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(upload.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                      {upload.remarks || '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleViewDetails(upload.id)}
                        className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        title="View details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    <DocumentCheckIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p>No uploads yet. Click "New Upload" to get started.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
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

      {/* Upload Details Modal */}
      <UploadDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        upload={selectedUpload}
        loading={loadingDetails}
      />
    </DashboardLayout>
  );
}