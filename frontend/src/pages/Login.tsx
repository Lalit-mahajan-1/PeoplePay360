import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f2ee] flex items-center justify-center p-4 [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Text','Inter',sans-serif]">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center ">
            <span className="text-3xl leading-none"></span>
          </div>
          <h1 className="text-[28px] font-semibold text-gray-900 tracking-[-0.02em] leading-tight">
            <img src="/logo-name.png"  alt="" />
          </h1>
          <p className="text-[15px] text-gray-500 mt-1 tracking-[-0.005em]">HR &amp; Payroll Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_20px_40px_-12px_rgba(0,0,0,0.12)] p-8">
          <h2 className="text-[17px] font-semibold text-gray-900 tracking-[-0.01em] mb-6">
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5 tracking-[-0.005em]">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50/80 border border-black/[0.08] rounded-[12px] text-[15px] text-gray-900 outline-none transition-all duration-150 ease-out focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/60"
                placeholder="you@peoplepay360.com"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-600 mb-1.5 tracking-[-0.005em]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50/80 border border-black/[0.08] rounded-[12px] text-[15px] text-gray-900 outline-none transition-all duration-150 ease-out focus:bg-white focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500/60"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-semibold text-[15px] tracking-[-0.005em] py-3 px-4 rounded-[14px] transition-all duration-150 ease-out hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_16px_-4px_rgba(37,99,235,0.35)]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 bg-white/70 backdrop-blur-xl rounded-[24px] border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_24px_-8px_rgba(0,0,0,0.08)] p-6">
          <h3 className="text-[13px] font-semibold text-gray-900 tracking-[-0.005em] mb-3">
            Demo Credentials
          </h3>
          <div className="space-y-1">
            {[
              { role: 'Admin', email: 'admin@peoplepay360.com', password: 'admin123' },
              { role: 'HR Manager', email: 'amit@peoplepay360.com', password: 'hr123456' },
              { role: 'Employee', email: 'rahul@peoplepay360.com', password: 'emp12345' },
            ].map((cred) => (
              <button
                key={cred.email}
                onClick={() => {
                  setEmail(cred.email);
                  setPassword(cred.password);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-[12px] transition-all duration-150 ease-out hover:bg-black/[0.03] active:scale-[0.98] text-left group"
              >
                <div>
                  <span className="text-[13px] font-medium text-gray-900 tracking-[-0.005em]">{cred.role}</span>
                  <span className="text-[12px] text-gray-500 ml-2">{cred.email}</span>
                </div>
                <span className="text-[12px] text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  Use →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
