import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Construction } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmployeeDetail from "./pages/EmployeeDetail";
import Users from "./pages/Users";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import MyProfile from "./pages/MyProfile";
import AttendancePage from "./pages/AttendancePage";
import MyLeaves from "./pages/MyLeaves";
import MyPayslips from "./pages/MyPayslips";
import TeamDirectory from "./pages/TeamDirectory";
import AccountSettings from "./pages/AccountSettings";
import Sidebar from "./components/Sidebar";
import WorkingSchedulesPage from "./pages/WorkingSchedulesPage";
import ContractsPage from "./pages/ContractsPage";
import TimeOffManagementPage from "./pages/TimeOffManagementPage";
import SalaryStructuresPage from "./pages/SalaryStructuresPage";
import PayrollPage from "./pages/PayrollPage";
import PayrunDetailPage from "./pages/PayrunDetailPage";
import PayslipDetailPage from "./pages/PayslipDetailPage";
import ReportsPage from "./pages/ReportsPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin h-10 w-10 text-blue-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-gray-500 font-medium">Loading PeoplePay360...</p>
                </div>
            </div>
        );
    }
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return (
        <div className="min-h-screen flex bg-gray-50">
            <Sidebar />
            <main className="flex-1 min-w-0 overflow-y-auto">
                <div className="">{children}</div>
            </main>
        </div>
    );
}

function HomeRoute() {
    const { user } = useAuth();
    if (user?.role === "EMPLOYEE") return <EmployeeDashboard />;
    return <Dashboard />;
}

function AppRoutes() {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return null;
    return (
        <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/" element={<PrivateRoute><HomeRoute /></PrivateRoute>} />
            <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
            <Route path="/employees/:id" element={<PrivateRoute><EmployeeDetail /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><MyProfile /></PrivateRoute>} />
            <Route path="/attendance" element={<PrivateRoute><AttendancePage /></PrivateRoute>} />
            <Route path="/time-off" element={<PrivateRoute><MyLeaves /></PrivateRoute>} />
            <Route path="/admin/time-off" element={<PrivateRoute><TimeOffManagementPage /></PrivateRoute>} />
            <Route path="/payslips" element={<PrivateRoute><MyPayslips /></PrivateRoute>} />
            <Route path="/payslips/:id" element={<PrivateRoute><PayslipDetailPage /></PrivateRoute>} />
            <Route path="/directory" element={<PrivateRoute><TeamDirectory /></PrivateRoute>} />
            <Route path="/admin/employees" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><AccountSettings /></PrivateRoute>} />
            <Route path="/contracts" element={<PrivateRoute><ContractsPage /></PrivateRoute>} />
            <Route path="/working-schedules" element={<PrivateRoute><WorkingSchedulesPage /></PrivateRoute>} />
            <Route path="/salary" element={<PrivateRoute><SalaryStructuresPage /></PrivateRoute>} />
            <Route path="/payroll" element={<PrivateRoute><PayrollPage /></PrivateRoute>} />
            <Route path="/payroll/payruns/:id" element={<PrivateRoute><PayrunDetailPage /></PrivateRoute>} />
            <Route path="/reports" element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Toaster position="top-right" toastOptions={{ duration: 3000, style: { borderRadius: "12px", padding: "12px 16px", fontSize: "14px" } }} />
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
