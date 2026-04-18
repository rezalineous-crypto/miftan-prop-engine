'use client';

import { useEffect, useState } from 'react';
import { getProperties, createProperty } from '../api/client';
import { useAuth } from '../auth/context';
import DashboardLayout from '../components/DashboardLayout';
import { BuildingOfficeIcon, PlusIcon, Cog6ToothIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
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

export default function PropertiesPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    company_id: 1,
    property_code: '',
    property_name: '',
    owner_id: 1,
    is_active: true,
    created_by: user?.id || 1,
    remarks: '',
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const data = await getProperties();
      const propertiesArray = Array.isArray(data) ? data : (data?.results || data?.data || []);
      setProperties(propertiesArray);
    } catch (err) {
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProperty(formData);
      setSuccess('Property created successfully!');
      setShowForm(false);
      setFormData({
        company_id: 1,
        property_code: '',
        property_name: '',
        owner_id: 1,
        is_active: true,
        created_by: user?.id || 1,
        remarks: '',
      });
      fetchProperties();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to create property');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-600">Loading properties...</span>
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
            <h1 className="text-3xl font-bold text-slate-900 font-headline mb-2">Properties</h1>
            <p className="text-slate-600">Manage your property portfolio and configurations.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>{showForm ? 'Cancel' : 'Add Property'}</span>
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

      {showForm && (
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-6 font-headline">Add New Property</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Property Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., PROP-001"
                    value={formData.property_code}
                    onChange={(e) => setFormData({ ...formData, property_code: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Property Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Downtown Office Complex"
                    value={formData.property_name}
                    onChange={(e) => setFormData({ ...formData, property_name: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Company ID
                  </label>
                  <input
                    type="number"
                    placeholder="1"
                    value={formData.company_id}
                    onChange={(e) => setFormData({ ...formData, company_id: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Owner ID
                  </label>
                  <input
                    type="number"
                    placeholder="1"
                    value={formData.owner_id}
                    onChange={(e) => setFormData({ ...formData, owner_id: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Remarks
                </label>
                <textarea
                  placeholder="Additional notes or description..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                    Property is active
                  </label>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105 font-semibold"
                  >
                    Create Property
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 font-headline">
            Your Properties ({properties.length})
          </h2>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="bg-slate-50 rounded-xl p-12 text-center border border-slate-200">
          <BuildingOfficeIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No properties yet</h3>
          <p className="text-slate-600 mb-6">Get started by adding your first property to the portfolio.</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 inline-flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add Your First Property</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                    <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    property.is_active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {property.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-slate-900 mb-2">{property.property_name}</h3>
                <p className="text-sm text-slate-600 mb-1">Code: <span className="font-medium">{property.property_code}</span></p>
                <p className="text-sm text-slate-600 mb-4">Company ID: <span className="font-medium">{property.company_id}</span></p>

                {property.remarks && (
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{property.remarks}</p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center space-x-1 text-xs text-slate-500">
                    <span>ID: {property.id}</span>
                  </div>
                  <Link
                    href={`/properties/${property.id}/config`}
                    className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                  >
                    <Cog6ToothIcon className="w-4 h-4" />
                    <span>Manage</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}