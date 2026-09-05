import React from 'react';
import type { EmployeeProfile } from '../types/employee.types';

interface Props {
  profile: EmployeeProfile;
}

const ProfileCard: React.FC<Props> = ({ profile }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Avatar & Name */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 mb-3">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`
          )}
        </div>
        <h2 className="text-xl font-semibold text-gray-800">
          {profile.firstName || ''} {profile.lastName || ''}
        </h2>
        <p className="text-sm text-gray-500">{profile.jobTitle || profile.jobPosition || '—'}</p>
        <span className="mt-2 px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
          {profile.status || 'ACTIVE'}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-3 text-sm">
        <InfoRow label="Employee ID" value={profile.employeeCode || '—'} />
        <InfoRow label="Email" value={profile.email || '—'} />
        <InfoRow label="Phone" value={profile.phone || '—'} />
        <InfoRow label="Department" value={profile.department?.name || '—'} />
        <InfoRow
          label="Manager"
          value={
            profile.manager
              ? `${profile.manager.firstName} ${profile.manager.lastName}`
              : '—'
          }
        />
        <InfoRow label="Type" value={profile.employeeType ? profile.employeeType.replace('_', ' ') : '—'} />
        <InfoRow
          label="Joined"
          value={profile.hireDate ? new Date(profile.hireDate).toLocaleDateString() : '—'}
        />
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b border-gray-100">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-800">{value}</span>
  </div>
);

export default ProfileCard;