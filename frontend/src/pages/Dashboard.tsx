import EmployeeList from '../components/EmployeeList';

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your organization's workforce</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <EmployeeList />
      </div>
    </div>
  );
}