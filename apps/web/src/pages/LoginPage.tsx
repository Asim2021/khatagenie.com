import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Sparkles, Building2, Lock, Mail, User, Phone, ArrowRight, ShieldCheck } from 'lucide-react';
import { fetchApi } from '../lib/api';

export const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('admin@khatagenie.com');
  const [password, setPassword] = useState('KhataGenie#2026');
  const [firmName, setFirmName] = useState('Bansal & Associates CA');
  const [fullName, setFullName] = useState('CA Rajesh Bansal, FCA');
  const [phone, setPhone] = useState('919811000000');
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
        const res = await fetchApi<{ token: string; user: any }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ firmName, fullName, email, password, phone }),
        });
        login(res.token, res.user);
        showToast({
          type: 'success',
          title: 'CA Firm Registered!',
          message: `Welcome ${res.user.fullName} to KhataGenie.`,
        });
      } else {
        const res = await fetchApi<{ token: string; user: any }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        login(res.token, res.user);
        showToast({
          type: 'success',
          title: 'Signed In Successfully',
          message: `Logged in as ${res.user.fullName}`,
        });
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: isRegister ? 'Registration Failed' : 'Authentication Failed',
        message: err.message || 'Please check your credentials.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    setEmail('admin@khatagenie.com');
    setPassword('KhataGenie#2026');
    setIsRegister(false);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20 mb-4">
            <Sparkles className="w-8 h-8 text-slate-950" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">KhataGenie</h2>
          <p className="mt-2 text-sm text-slate-400">
            {isRegister
              ? 'Onboard your Chartered Accountancy firm'
              : 'Sign in to access your automated CA review dashboard'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    CA Firm / Practice Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={firmName}
                      onChange={(e) => setFirmName(e.target.value)}
                      placeholder="e.g. Bansal & Associates CA"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    CA Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. CA Rajesh Bansal, FCA"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    WhatsApp Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="919811000000"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Official Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ca@example.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 transition-all transform active:scale-[0.98] disabled:opacity-50"
            >
              <span>{isLoading ? 'Authenticating...' : isRegister ? 'Register CA Firm' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Fill Button */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
            <button
              onClick={handleQuickDemoFill}
              type="button"
              className="inline-flex items-center space-x-1.5 text-xs text-emerald-400/90 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Fill Seed CA Admin Credentials</span>
            </button>
          </div>

          {/* Mode Switch */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              {isRegister
                ? 'Already have an account? Sign in here'
                : "Don't have an account? Register your CA Firm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
