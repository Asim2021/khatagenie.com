import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Sparkles, 
  Building2, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  MessageSquare, 
  ArrowRightLeft, 
  FileSpreadsheet, 
  ShieldCheck, 
  Zap,
  TrendingUp,
  Eye,
  EyeOff,
  Loader2,
  KeyRound,
  UserPlus
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import { ThemeToggle } from '../components/ThemeToggle';

export const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('admin@khatagenie.com');
  const [password, setPassword] = useState('KhataGenie#2026');
  const [firmName, setFirmName] = useState('Bansal & Associates CA');
  const [fullName, setFullName] = useState('CA Rajesh Bansal, FCA');
  const [phone, setPhone] = useState('9811000000');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isRegister) {
        // Auto-prefix 91 if user entered standard 10 digit Indian mobile
        const cleanPhone = phone.trim().startsWith('91') ? phone.trim() : `91${phone.trim()}`;
        const res = await fetchApi<{ token: string; user: any }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ firmName, fullName, email, password, phone: cleanPhone }),
        });
        login(res.token, res.user);
        showToast(`Welcome ${res.user.fullName} to KhataGenie!`, 'success');
      } else {
        const res = await fetchApi<{ token: string; user: any }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        login(res.token, res.user);
        showToast(`Signed in as ${res.user.fullName}`, 'success');
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      showToast(err.message || 'Please check your credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    setEmail('admin@khatagenie.com');
    setPassword('KhataGenie#2026');
    setIsRegister(false);
    showToast('Demo CA credentials loaded!', 'info');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-150">
      {/* Left Column: Brand Story, Tagline & Value Props (Desktop Only - Hidden on Mobile for Instant Login UX) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white p-8 lg:p-14 flex-col justify-between relative overflow-hidden border-r border-slate-800 shrink-0">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/25">
              <Sparkles className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Khata<span className="text-emerald-400">Genie</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CA PRO
                </span>
              </span>
              <p className="text-xs text-emerald-400/80 font-medium tracking-wide">
                WhatsApp Bill Digitizer & Tax Sync for Indian CA Practices
              </p>
            </div>
          </div>

          <div className="mt-8 sm:mt-12 space-y-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Turn client WhatsApp bills into{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                audit-ready Tally entries
              </span>{' '}
              in seconds.
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
              Automated AI extraction, 2-way GSTR-2B ITC matching, and Section 43B(h) compliance tracking purpose-built for Chartered Accountants and tax consultants.
            </p>
          </div>
        </div>

        {/* Feature Value Cards Grid */}
        <div className="my-8 sm:my-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5 relative z-10">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold text-white">WhatsApp Ingestion</h2>
            <p className="text-[11px] text-slate-400 leading-snug">
              Clients snap receipts on WhatsApp; Vision AI extracts GSTIN, items & taxes.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold text-white">GSTR-2B 2-Way Match</h2>
            <p className="text-[11px] text-slate-400 leading-snug">
              Instant reconciliation against GST Portal JSON with Section 16(2)(aa) verification.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold text-white">1-Click Tally Prime</h2>
            <p className="text-[11px] text-slate-400 leading-snug">
              Direct XML voucher and Excel purchase register exports with zero manual data entry.
            </p>
          </div>
        </div>

        {/* Trust Badges Footer */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 relative z-10">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Multi-Tenant Bank-Grade Security</span>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Section 43B(h) 45-Day MSME Alert</span>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Card & Theme Control (Full-Width on Mobile for Instant Access) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-4 sm:p-8 lg:p-14 relative bg-slate-50 dark:bg-slate-950 min-h-screen">
        {/* Top Control Bar with Brand Badge on Mobile */}
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <div className="lg:hidden flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20">
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1">
                Khata<span className="text-emerald-600 dark:text-emerald-400">Genie</span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  CA PRO
                </span>
              </span>
            </div>
          </div>
          <div className="ml-auto flex items-center space-x-2 sm:space-x-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
              Appearance:
            </span>
            <ThemeToggle />
          </div>
        </div>

        {/* Auth Form Box */}
        <div className="max-w-md w-full mx-auto my-auto space-y-6">
          {/* Segmented Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-200/80 dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                !isRegister
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>CA Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isRegister
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Practice</span>
            </button>
          </div>

          {/* Header text */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isRegister ? 'Register your CA Practice' : 'Welcome Back'}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {isRegister
                ? 'Create a firm organization to manage multiple MSME clients and staff.'
                : 'Sign in to access your firm’s automated invoice review inbox.'}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-2xl space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      CA Firm / Practice Name *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        autoComplete="organization"
                        value={firmName}
                        onChange={(e) => setFirmName(e.target.value)}
                        placeholder="e.g. Bansal & Associates CA"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Full Name (CA Partner) *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. CA Rajesh Bansal, FCA"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Office WhatsApp Phone *
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-xs font-mono font-bold text-slate-500 dark:text-slate-400 border-r border-slate-300 dark:border-slate-700 pr-2">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        autoComplete="tel"
                        value={phone.replace(/^91/, '')}
                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="9811000000"
                        maxLength={10}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-16 pr-4 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      10-digit Indian WhatsApp mobile number for alerts.
                    </p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@firm.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-3 rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 mt-3 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isRegister ? 'Registering CA Firm...' : 'Authenticating...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isRegister ? 'Register CA Practice' : 'Sign In to KhataGenie'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Pre-fill */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
              <button
                type="button"
                onClick={handleQuickDemoFill}
                className="inline-flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-mono font-medium"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Quick Fill Pre-Configured Demo Credentials</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="text-center mt-6 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
          KhataGenie CA PRO • GSTIN & Section 16(2)(aa) Automated ITC Sync
        </div>
      </div>
    </div>
  );
};
