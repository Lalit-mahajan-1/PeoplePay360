import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Construction } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmployeeDetail from "./pages/EmployeeDetail";
import Sidebar from "./components/Sidebar";

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <svg
                        className="animate-spin h-10 w-10 text-blue-600"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                    <p className="text-gray-500 font-medium">
                        Loading PeoplePay360...
                    </p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen flex bg-gray-50">
            <Sidebar />
            {/* min-w-0 lets the content area shrink/scroll instead of pushing the sidebar off-screen */}
            <main className="flex-1 min-w-0 overflow-y-auto">
                <div className="">{children}</div>
            </main>
        </div>
    );
}

function AppRoutes() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return null;

    return (
        <Routes>
            <Route
                path="/login"
                element={
                    isAuthenticated ? <Navigate to="/" replace /> : <Login />
                }
            />
            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                }
            />
            <Route
                path="/employees/:id"
                element={
                    <PrivateRoute>
                        <EmployeeDetail />
                    </PrivateRoute>
                }
            />
            {/* Placeholder routes for future modules */}
            <Route
                path="/contracts"
                element={
                    <PrivateRoute>
                        <PlaceholderPage title="Contracts" />
                    </PrivateRoute>
                }
            />
            <Route
                path="/attendance"
                element={
                    <PrivateRoute>
                        <PlaceholderPage title="Attendance" />
                    </PrivateRoute>
                }
            />
            <Route
                path="/time-off"
                element={
                    <PrivateRoute>
                        <PlaceholderPage title="Time Off" />
                    </PrivateRoute>
                }
            />
            <Route
                path="/payroll"
                element={
                    <PrivateRoute>
                        <PlaceholderPage title="Payroll" />
                    </PrivateRoute>
                }
            />
            <Route
                path="/reports"
                element={
                    <PrivateRoute>
                        <PlaceholderPage title="Reports" />
                    </PrivateRoute>
                }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function PlaceholderPage({ title }: { title: string }) {
    return (
        <div className="py-16 [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Inter',sans-serif]">
            <div className="w-14 h-14 rounded-[16px] bg-blue-500/10 text-blue-600 flex items-center justify-center mb-5">
                <Construction className="w-7 h-7" strokeWidth={1.75} />
            </div>
            <h1 className="text-[22px] font-semibold text-gray-900 tracking-[-0.015em] mb-1.5">
                {title}
            </h1>
            <p className="text-gray-500 text-[14px] tracking-[-0.005em]">
                This module is coming soon.
            </p>
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3000,
                        style: {
                            borderRadius: "12px",
                            padding: "12px 16px",
                            fontSize: "14px",
                        },
                    }}
                />
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
