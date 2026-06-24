import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Mail,
  ShieldCheck,
  Calendar,
  Building2,
  UserCircle,
  Pencil,
  Save,
  X,
  Loader2,
  Phone,
  MapPin,
} from 'lucide-react';
import { apiService } from '../../lib/api';

export default function ProfilePage() {
  const { user, customer, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state – initialised from user/customer
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    company_name: customer?.company_name || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    city: customer?.city || '',
    state: customer?.state || '',
    pincode: customer?.pincode || '',
    gst_number: customer?.gst_number || '',
  });

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    management: 'Management',
    warehouse_staff: 'Warehouse Staff',
    customer: 'Customer',
    production: 'Production',
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiService.updateProfile(formData);
      // Refresh auth context with updated user/customer
      await refreshUser();
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to current user/customer data
    setFormData({
      full_name: user?.full_name || '',
      company_name: customer?.company_name || '',
      phone: customer?.phone || '',
      address: customer?.address || '',
      city: customer?.city || '',
      state: customer?.state || '',
      pincode: customer?.pincode || '',
      gst_number: customer?.gst_number || '',
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-semibold">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm text-slate-500">Profile</p>
              <h1 className="text-2xl font-semibold text-slate-900">{user?.full_name || 'User'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              <ShieldCheck className="w-4 h-4" />
              {roleLabels[user?.role || ''] || 'User'}
            </span>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <Save className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* Profile content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Personal Information */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Full Name */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Full Name</p>
              {isEditing ? (
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-slate-900">{user?.full_name || 'Not available'}</p>
              )}
            </div>

            {/* Email (read-only) */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</p>
              <p className="flex items-center gap-2 text-sm text-slate-900">
                <Mail className="w-4 h-4 text-slate-400" />
                {user?.email || 'Not available'}
              </p>
            </div>

            {/* Company */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Company</p>
              {isEditing ? (
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-slate-900">{customer?.company_name || '—'}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Phone</p>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="flex items-center gap-2 text-sm text-slate-900">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {customer?.phone || '—'}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Address</p>
              {isEditing ? (
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="flex items-center gap-2 text-sm text-slate-900">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {customer?.address || '—'}
                </p>
              )}
            </div>

            {/* City, State, Pincode */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">City</p>
              {isEditing ? (
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-slate-900">{customer?.city || '—'}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">State</p>
              {isEditing ? (
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-slate-900">{customer?.state || '—'}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pincode</p>
              {isEditing ? (
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-slate-900">{customer?.pincode || '—'}</p>
              )}
            </div>

            {/* GST */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">GST Number</p>
              {isEditing ? (
                <input
                  type="text"
                  name="gst_number"
                  value={formData.gst_number}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-sm text-slate-900">{customer?.gst_number || '—'}</p>
              )}
            </div>

            {/* Member Since (read-only) */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Member Since</p>
              <p className="flex items-center gap-2 text-sm text-slate-900">
                <Calendar className="w-4 h-4 text-slate-400" />
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* Edit actions */}
          {isEditing && (
            <div className="mt-6 flex gap-3 border-t border-slate-200 pt-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Account Details (read-only) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Account Details</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <UserCircle className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Account Status</p>
                <p className="text-sm font-medium text-slate-900">{user?.is_active ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <Building2 className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Customer Type</p>
                <p className="text-sm font-medium text-slate-900">{customer?.customer_type || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <ShieldCheck className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Rating</p>
                <p className="text-sm font-medium text-slate-900 capitalize">{customer?.rating || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}