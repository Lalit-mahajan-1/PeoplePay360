import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    ArrowRight,
    CheckCircle2,
    ShieldCheck,
    Users,
    WalletCards,
    BarChart3,
    Mail,
    LockKeyhole,
} from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await login(email, password);
            toast.success("Welcome back!");
            navigate("/");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    const demoCredentials = [
        {
            role: "Admin",
            email: "admin@peoplepay360.com",
            password: "admin123",
            description: "Full system access",
        },
        {
            role: "HR Manager",
            email: "amit@peoplepay360.com",
            password: "hr123456",
            description: "HR & employee management",
        },
        {
            role: "Employee",
            email: "rahul@peoplepay360.com",
            password: "emp12345",
            description: "Employee self-service",
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Inter',sans-serif]">
            <div className="flex min-h-screen">
                {/* =========================================================
                    LEFT BRAND PANEL
                ========================================================== */}
                <aside className="relative hidden overflow-hidden bg-[#eef2ff] lg:flex lg:w-[48%] xl:w-[52%]">
                    {/* Decorative background */}
                    <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
                    <div className="absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full bg-blue-200/30 blur-3xl" />

                    <div className="relative flex w-full flex-col justify-between p-10 xl:p-14">
                        {/* Logo */}
                        <div>
                            <img
                                src="/logo-name.png"
                                alt="PeoplePay360"
                                className="h-20 w-auto object-contain object-left"
                            />
                        </div>

                        {/* Main content */}
                        <div className="max-w-xl">
                            <h1 className="max-w-lg text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-slate-900 xl:text-5xl">
                                Everything your people need,
                                <span className="text-indigo-600">
                                    {" "}
                                    in one place.
                                </span>
                            </h1>

                            <p className="mt-5 max-w-lg text-[15px] leading-7 text-slate-600">
                                Manage employees, payroll, attendance and HR
                                operations through one simple and connected
                                workspace.
                            </p>

                            {/* Feature cards */}
                            <div className="mt-9 grid max-w-lg grid-cols-2 gap-3">
                                <FeatureCard
                                    icon={<Users />}
                                    title="Employee management"
                                    description="Keep employee information organized."
                                />

                                <FeatureCard
                                    icon={<WalletCards />}
                                    title="Payroll"
                                    description="Simplify salary and payment workflows."
                                />

                                <FeatureCard
                                    icon={<BarChart3 />}
                                    title="HR insights"
                                    description="Understand your workforce at a glance."
                                />

                                <FeatureCard
                                    icon={<ShieldCheck />}
                                    title="Secure access"
                                    description="Role-based access for every user."
                                />
                            </div>
                        </div>

                        {/* Bottom statement */}
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                            <div className="flex -space-x-1">
                                <div className="h-6 w-6 rounded-full border-2 border-[#eef2ff] bg-indigo-200" />
                                <div className="h-6 w-6 rounded-full border-2 border-[#eef2ff] bg-blue-200" />
                                <div className="h-6 w-6 rounded-full border-2 border-[#eef2ff] bg-slate-300" />
                            </div>

                            <span>A simple workspace for modern teams</span>
                        </div>
                    </div>
                </aside>

                {/* =========================================================
                    RIGHT LOGIN PANEL
                ========================================================== */}
                <main className="flex min-h-screen w-full flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:w-[52%] lg:px-10 xl:w-[48%]">
                    <div className="w-full max-w-[440px]">
                        {/* Mobile branding */}
                        <div className="mb-8 text-center lg:hidden">
                            <img
                                src="/logo-name.png"
                                alt="PeoplePay360"
                                className="mx-auto h-9 w-auto object-contain"
                            />

                            <p className="mt-2 text-sm text-slate-500">
                                HR & Payroll Platform
                            </p>
                        </div>

                        {/* =================================================
                            LOGIN CARD
                        ================================================== */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_35px_-18px_rgba(15,23,42,0.25)] sm:p-7">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Email */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                                        Email address
                                    </label>

                                    <div className="relative">
                                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                                            placeholder="you@peoplepay360.com"
                                            required
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <label className="block text-xs font-semibold text-slate-600">
                                            Password
                                        </label>
                                    </div>

                                    <div className="relative">
                                        <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                                            placeholder="Enter your password"
                                            required
                                            autoComplete="current-password"
                                        />
                                    </div>
                                </div>

                                {/* Sign in */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-all duration-150 hover:bg-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg
                                                className="h-4 w-4 animate-spin"
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
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            Sign in
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* =================================================
                                DEMO CREDENTIALS
                            ================================================== */}
                            <div className="mt-6 border-t border-slate-100 pt-5">
                                <div className="mb-3 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-semibold text-slate-800">
                                            Demo accounts
                                        </h3>

                                        <p className="mt-0.5 text-[11px] text-slate-400">
                                            Click an account to fill the form
                                        </p>
                                    </div>

                                    <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700">
                                        Development
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {demoCredentials.map((cred) => (
                                        <button
                                            key={cred.email}
                                            type="button"
                                            onClick={() => {
                                                setEmail(cred.email);
                                                setPassword(cred.password);
                                            }}
                                            className="group flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-left transition-all hover:border-indigo-100 hover:bg-indigo-50/60 active:scale-[0.99]"
                                        >
                                            {/* Role icon */}
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-100 transition-colors group-hover:text-indigo-600">
                                                {cred.role === "Admin" ? (
                                                    <ShieldCheck className="h-4 w-4" />
                                                ) : cred.role ===
                                                  "HR Manager" ? (
                                                    <Users className="h-4 w-4" />
                                                ) : (
                                                    <UserIcon />
                                                )}
                                            </div>

                                            {/* Account details */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-slate-800">
                                                        {cred.role}
                                                    </span>

                                                    <span className="hidden rounded-full bg-slate-200/70 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 sm:inline">
                                                        Demo
                                                    </span>
                                                </div>

                                                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                                    {cred.email}
                                                </p>
                                            </div>

                                            {/* Use action */}
                                            <div className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
                                                Use
                                                <ArrowRight className="h-3 w-3" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Security note */}
                        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />

                            <span>
                                Secure role-based access to your workspace
                            </span>
                        </div>

                        {/* Mobile footer */}
                        <p className="mt-6 text-center text-[11px] text-slate-400 lg:hidden">
                            PeoplePay360 · HR & Payroll Platform
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
}

/* ========================================================================
   FEATURE CARD
======================================================================== */

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="group rounded-xl border border-white/70 bg-white/55 p-3.5 backdrop-blur-sm transition-all hover:bg-white/80">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100/60">
                {React.cloneElement(
                    icon as React.ReactElement,
                    {
                        className: "h-4 w-4",
                    } as any,
                )}
            </div>

            <h3 className="text-xs font-semibold text-slate-800">{title}</h3>

            <p className="mt-1 text-[11px] leading-4 text-slate-500">
                {description}
            </p>
        </div>
    );
}

/* ========================================================================
   USER ICON
======================================================================== */

function UserIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
        >
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}
