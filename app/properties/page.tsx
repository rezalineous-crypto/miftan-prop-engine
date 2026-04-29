'use client';

import { useEffect, useState } from 'react';
import { getProperties, createProperty } from '../api/client';
import { useAuth } from '../auth/context';
import DashboardLayout from '../components/DashboardLayout';
import {
  BuildingOfficeIcon,
  PlusIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Property {
  id: number;
  company_id: number;
  property_code: string;
  property_name: string;
  owner_id: number;
  is_active: boolean;
  created_by: number;
  remarks: string;
}

const EMPTY_FORM = (userId: number) => ({
  company_id: 1,
  property_code: '',
  property_name: '',
  owner_id: 1,
  is_active: true,
  created_by: userId,
  remarks: '',
});

export default function PropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM(user?.id || 1));

  useEffect(() => { fetchProperties(); }, []);

  const fetchProperties = async () => {
    try {
      const data = await getProperties();
      const arr = Array.isArray(data) ? data : (data?.results || data?.data || []);
      setProperties(arr);
    } catch {
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createProperty(formData);
      setSuccess('Property created successfully');
      setShowForm(false);
      setFormData(EMPTY_FORM(user?.id || 1));
      fetchProperties();
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to create property');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData(EMPTY_FORM(user?.id || 1));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center gap-3 text-slate-500 text-sm">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            Loading properties…
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
            Properties
          </h1>
          <p className="text-sm text-slate-400">
            Manage your property portfolio and monthly configurations.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all shadow-sm shadow-indigo-100"
        >
          {showForm ? <XMarkIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Property'}
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

      {/* Add Property Form */}
      {showForm && (
        <div className="mb-7 bg-white border border-gray-100 rounded-xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 font-headline">New Property</h2>
            <button
              onClick={handleCancel}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {[
                  { label: 'Property Code', key: 'property_code', placeholder: 'e.g. PROP-001', type: 'text' },
                  { label: 'Property Name', key: 'property_name', placeholder: 'e.g. Downtown Complex', type: 'text' },
                  { label: 'Company ID', key: 'company_id', placeholder: '1', type: 'number' },
                  { label: 'Owner ID', key: 'owner_id', placeholder: '1', type: 'number' },
                ].map(({ label, key, placeholder, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                      {label}
                    </label>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={(formData as never)[key]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [key]: type === 'number' ? parseInt(e.target.value) || 0 : e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-slate-900 placeholder:text-gray-300 bg-gray-50/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Remarks
                </label>
                <textarea
                  placeholder="Additional notes or description…"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-slate-900 placeholder:text-gray-300 bg-gray-50/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none"
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-600 font-medium">Active property</span>
                </label>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-slate-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    Create Property
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Properties count */}
      <div className="flex items-center gap-2 mb-4">
        <p className="text-sm font-semibold text-slate-700">All Properties</p>
        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {properties.length}
        </span>
      </div>

      {/* Empty state */}
      {properties.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-14 text-center shadow-xs">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <BuildingOfficeIcon className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">No properties yet</h3>
          <p className="text-sm text-slate-400 mb-5">Add your first property to get started.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-white border border-gray-100 rounded-xl shadow-xs hover:shadow-sm transition-shadow overflow-hidden"
            >
              <div className="p-5">
                {/* Card top */}
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <BuildingOfficeIcon className="w-4.5 h-4.5 text-indigo-600" />
                  </div>
                  <span
                    className={`text-[0.65rem] font-semibold px-2 py-1 rounded-full ${
                      property.is_active
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {property.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Name & code */}
                <h3 className="text-sm font-semibold text-slate-900 leading-snug mb-1">
                  {property.property_name}
                </h3>
                <span className="inline-block text-[0.65rem] font-mono font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded mb-3">
                  {property.property_code}
                </span>

                {property.remarks && (
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">{property.remarks}</p>
                )}
              </div>

              {/* Card footer */}
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                <span className="text-[0.65rem] text-slate-400 font-medium">
                  ID #{property.id} · Co. {property.company_id}
                </span>
                {/* <Link
                  href={`/properties/${property.id}/config`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <Cog6ToothIcon className="w-3.5 h-3.5" />
                  Configure
                </Link> */}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
