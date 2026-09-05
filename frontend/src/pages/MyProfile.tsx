import React, { useEffect, useRef, useState } from 'react';
import { deleteMyAvatar, getMyProfile, updateMyProfile, uploadMyAvatar } from '../api/employeeApi';
import type { EmployeeProfile } from '../types/employee.types';
import ProfileCard from '../components/ProfileCard';
import toast from 'react-hot-toast';
import { User, CreditCard, Edit3 } from 'lucide-react';

export default function MyProfile() {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    bankName: '',
    bankAccountNo: '',
    bankIFSC: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getMyProfile();
      const data = res.data?.data || res.data;
      if (data) {
        setProfile(data);
        setFormData({
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || '',
          postalCode: data.postalCode || '',
          bankName: data.bankName || '',
          bankAccountNo: data.bankAccountNo || '',
          bankIFSC: data.bankIFSC || '',
        });
      }
    } catch {
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) { toast.error('Choose a JPEG, PNG, WebP, or GIF image.'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Profile images must be 5 MB or smaller.'); return; }
    setAvatarUploading(true);
    try {
      const response = await uploadMyAvatar(file);
      setProfile(response.data.data);
      toast.success('Profile image updated.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload profile image.');
    } finally { setAvatarUploading(false); }
  };

  const handleAvatarDelete = async () => {
    setAvatarUploading(true);
    try {
      const response = await deleteMyAvatar();
      setProfile(response.data.data);
      toast.success('Profile image removed.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove profile image.');
    } finally { setAvatarUploading(false); }
  };
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMyProfile(formData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      fetchProfile();
    } catch {
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your personal details, contact info, and bank information</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition shadow-sm"
        >
          <Edit3 className="w-4 h-4" />
          {isEditing ? 'Cancel Edit' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {profile && <ProfileCard profile={profile} />}
          <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
            <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => { handleAvatarUpload(e.target.files?.[0]); e.target.value = ''; }} />
            <p className="mb-3 text-xs text-gray-500">JPEG, PNG, WebP, or GIF · up to 5 MB</p>
            <div className="flex gap-2">
              <button type="button" disabled={avatarUploading} onClick={() => avatarInputRef.current?.click()} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-60">{avatarUploading ? 'Saving…' : profile?.avatarUrl ? 'Replace photo' : 'Upload photo'}</button>
              {profile?.avatarUrl && <button type="button" disabled={avatarUploading} onClick={handleAvatarDelete} className="rounded-lg border px-3 py-2 text-xs font-medium text-red-600 disabled:opacity-60">Remove</button>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {isEditing ? (
            <form onSubmit={handleUpdate} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-3">Edit Personal Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <h4 className="text-md font-semibold text-gray-800 border-b pt-4 pb-2">Bank Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={formData.bankAccountNo}
                    onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.bankIFSC}
                    onChange={(e) => setFormData({ ...formData, bankIFSC: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Personal Info Overview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div className="flex items-center gap-2 border-b pb-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Employment Overview</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs">Job Position</span>
                    <span className="font-semibold text-gray-800">{profile?.jobPosition || profile?.jobTitle || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Department</span>
                    <span className="font-semibold text-gray-800">{profile?.department?.name || '—'} ({profile?.department?.code || '—'})</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Reporting Manager</span>
                    <span className="font-semibold text-gray-800">
                      {profile?.manager ? `${profile.manager.firstName} ${profile.manager.lastName}` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Employee Status</span>
                    <span className="font-semibold text-green-600">{profile?.status || 'ACTIVE'}</span>
                  </div>
                </div>
              </div>

              {/* Contact & Banking Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div className="flex items-center gap-2 border-b pb-3">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Banking & Direct Deposit</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs">Bank Name</span>
                    <span className="font-semibold text-gray-800">{profile?.bankName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Account Number</span>
                    <span className="font-semibold text-gray-800">{profile?.bankAccountNo ? `•••• ${profile.bankAccountNo.slice(-4)}` : '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">IFSC Code</span>
                    <span className="font-semibold text-gray-800">{profile?.bankIFSC || '—'}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
