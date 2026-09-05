import EmployeeList from '../components/EmployeeList';

export default function Dashboard() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Header */}
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>💼</span>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#1f2937' }}>
            PeoplePay360
          </h1>
        </div>
        <nav style={{ display: 'flex', gap: '0.25rem' }}>
          {['Employees', 'Contracts', 'Attendance', 'Time Off', 'Payroll', 'Reports'].map(
            (item) => (
              <button
                key={item}
                style={{
                  ...navBtnStyle,
                  ...(item === 'Employees'
                    ? { backgroundColor: '#2563eb', color: '#fff' }
                    : {}),
                }}
              >
                {item}
              </button>
            )
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
              Employees
            </h2>
            <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
              Manage your organization's workforce
            </p>
          </div>
          <button style={addBtnStyle}>+ New Employee</button>
        </div>

        <div style={cardStyle}>
          <EmployeeList />
        </div>
      </main>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderBottom: '1px solid #e5e7eb',
  padding: '0.75rem 2rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  position: 'sticky',
  top: 0,
  zIndex: 10,
};

const navBtnStyle: React.CSSProperties = {
  padding: '0.4rem 0.9rem',
  border: 'none',
  backgroundColor: 'transparent',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 500,
  color: '#4b5563',
};

const addBtnStyle: React.CSSProperties = {
  padding: '0.6rem 1.2rem',
  backgroundColor: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 600,
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  padding: '1.5rem',
};