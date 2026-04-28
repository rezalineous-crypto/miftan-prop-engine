'use client';

import { CloudArrowUpIcon, DocumentIcon, BuildingOfficeIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  file: File | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  companyId: string;
  onCompanyIdChange: (value: string) => void;
  propertyId: string;
  onPropertyIdChange: (value: string) => void;
  uploadMonth: string;
  onUploadMonthChange: (value: string) => void;
  uploadYear: string;
  onUploadYearChange: (value: string) => void;
  dragActive: boolean;
  uploading: boolean;
}

const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function UploadModal({
  isOpen,
  onClose,
  onSubmit,
  file,
  onFileSelect,
  onDrag,
  onDrop,
  companyId,
  onCompanyIdChange,
  propertyId,
  onPropertyIdChange,
  uploadMonth,
  onUploadMonthChange,
  uploadYear,
  onUploadYearChange,
  dragActive,
  uploading,
}: UploadModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/20 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900 font-headline">Upload Performance Data</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-8">
          {/* File Upload Section */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Performance Data File
            </label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                dragActive
                  ? 'border-blue-400 bg-blue-50'
                  : file
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
              }`}
              onDragEnter={onDrag}
              onDragLeave={onDrag}
              onDragOver={onDrag}
              onDrop={onDrop}
            >
              <input
                type="file"
                onChange={onFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".csv,.xlsx,.xls"
              />
              <div className="flex flex-col items-center">
                {file ? (
                  <>
                    <DocumentIcon className="w-12 h-12 text-emerald-500 mb-4" />
                    <p className="text-lg font-semibold text-slate-900 mb-1">{file.name}</p>
                    <p className="text-sm text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                    </p>
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="w-12 h-12 text-slate-400 mb-4" />
                    <p className="text-lg font-semibold text-slate-900 mb-1">Drop your file here</p>
                    <p className="text-sm text-slate-500 mb-4">
                      or <span className="text-blue-600 font-medium">browse to choose a file</span>
                    </p>
                    <p className="text-xs text-slate-400">Supports CSV, Excel files (max 50MB)</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Company ID
              </label>
              <div className="relative">
                <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={companyId}
                  onChange={(e) => onCompanyIdChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter company ID"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Property ID
              </label>
              <div className="relative">
                <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={propertyId}
                  onChange={(e) => onPropertyIdChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter property ID"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Upload Month
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={uploadMonth}
                  onChange={(e) => onUploadMonthChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
                  required
                >
                  <option value="">Select month</option>
                  {monthNames.slice(1).map((month, index) => (
                    <option key={index + 1} value={String(index + 1)}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Upload Year
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="number"
                  value={uploadYear}
                  onChange={(e) => onUploadYearChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="2026"
                  min="2020"
                  max="2030"
                  required
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={uploading || !file}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
            >
              {uploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="w-5 h-5" />
                  <span>Upload</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
