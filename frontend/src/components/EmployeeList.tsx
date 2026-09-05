import { useEffect, useState } from 'react';
import { employeeApi, Employee } from '../services/api';

const statusColors: Record<string, string> = {
  ACTIVE: '#22c55e',
  INACTIVE: '#ef4444',
  ARCHIVED: '#6b7280',
};

const typeLabels: Record<string, string> = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
  INTERN: 'Intern',
};

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'kanban'>('list');

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const response = await employeeApi.getAll(params);
      setEmployees(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch employees');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '1.2rem', color: '#6b7280' }}>Loading employees...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#ef4444', fontSize: '1.1rem' }}>{error}</p>
        <button onClick={fetchEmployees} style={retryBtnStyle}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={toolbarStyle}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={searchInputStyle}
          />
          <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            {employees.length} employee{employees.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button
            onClick={() => setView('list')}
            style={view === 'list' ? activeViewBtn : viewBtnStyle}
          >
            ☰ List
          </button>
          <button
            onClick={() => setView('kanban')}
            style={view === 'kanban' ? activeViewBtn : viewBtnStyle}
          >
            ▦ Kanban
          </button>
        </div>
      </div>

      {/* List View */}
      {view === 'list' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th style={thStyle}>Employee</th>
                <th style={thStyle}>Code</th>
                <th style={thStyle}>Department</th>
                <th style={thStyle}>Job Position</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Hire Date</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} style={trStyle}>
                  <td style={tdStyle}>
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{emp.email}</div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <code style={codeStyle}>{emp.employeeCode}</code>
                  </td>
                  <td style={tdStyle}>{emp.department?.name || '—'}</td>
                  <td style={tdStyle}>{emp.jobPosition || '—'}</td>
                  <td style={tdStyle}>
                    <span style={typeBadgeStyle}>
                      {typeLabels[emp.employeeType] || emp.employeeType}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        ...statusBadgeStyle,
                        backgroundColor: statusColors[emp.status] + '20',
                        color: statusColors[emp.status],
                      }}
                    >
                      ● {emp.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {new Date(emp.hireDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <div style={kanbanContainerStyle}>
          {['ACTIVE', 'INACTIVE', 'ARCHIVED'].map((status) => {
            const filtered = employees.filter((e) => e.status === status);
            return (
              <div key={status} style={kanbanColumnStyle}>
                <h3 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%',
                    backgroundColor: statusColors[status], display: 'inline-block',
                  }} />
                  {status} ({filtered.length})
                </h3>
                {filtered.map((emp) => (
                  <div key={emp.id} style={kanbanCardStyle}>
                    <div style={{ fontWeight: 600 }}>{emp.firstName} {emp.lastName}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{emp.jobPosition || 'No position'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                      {emp.department?.name || 'No department'}
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div style={{ color: '#9ca3af', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                    No employees
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Inline styles
const toolbarStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem',
};
const searchInputStyle: React.CSSProperties = {
  padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '6px',
  fontSize: '0.9rem', width: '280px', outline: 'none',
};
const viewBtnStyle: React.CSSProperties = {
  padding: '0.4rem 0.8rem', border: '1px solid #d1d5db', backgroundColor: '#fff',
  borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem',
};
const activeViewBtn: React.CSSProperties = {
  ...viewBtnStyle, backgroundColor: '#2563eb', color: '#fff', borderColor: '#2563eb',
};
const retryBtnStyle: React.CSSProperties = {
  marginTop: '1rem', padding: '0.5rem 1.5rem', backgroundColor: '#2563eb',
  color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer',
};
const tableStyle: React.CSSProperties = {
  width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem',
};
const thStyle: React.CSSProperties = {
  padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600,
  borderBottom: '2px solid #e5e7eb', fontSize: '0.85rem', color: '#374151',
};
const tdStyle: React.CSSProperties = {
  padding: '0.75rem 1rem', borderBottom: '1px solid #f3f4f6',
};
const trStyle: React.CSSProperties = { cursor: 'pointer' };
const codeStyle: React.CSSProperties = {
  backgroundColor: '#f3f4f6', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem',
};
const typeBadgeStyle: React.CSSProperties = {
  backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.2rem 0.5rem',
  borderRadius: '4px', fontSize: '0.8rem',
};
const statusBadgeStyle: React.CSSProperties = {
  padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 500,
};
const kanbanContainerStyle: React.CSSProperties = {
  display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem',
};
const kanbanColumnStyle: React.CSSProperties = {
  flex: 1, minWidth: '250px', backgroundColor: '#f9fafb',
  borderRadius: '8px', padding: '1rem',
};
const kanbanCardStyle: React.CSSProperties = {
  backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px',
  padding: '0.75rem', marginBottom: '0.5rem',
};