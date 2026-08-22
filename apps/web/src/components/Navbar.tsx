import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  Download, 
  Sliders, 
  Sparkles, 
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FeatureGate } from './FeatureGate';
import { FEATURE_FLAGS } from '@khatagenie/types';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { label: 'Invoices Inbox', path: '/', icon: FileText },
    { label: 'MSME Clients', path: '/clients', icon: Users },
    { label: 'Export Center', path: '/exports', icon: Download },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  Khata<span className="text-emerald-400">Genie</span>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    CA PRO
                  </span>
                </span>
                <p className="text-[11px] text-slate-400 font-medium">WhatsApp Bill Digitizer & Tax Sync</p>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-800">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Status Badges & User Context */}
          <div className="flex items-center space-x-3">
            {/* Live WhatsApp Listener Status */}
            <FeatureGate flag={FEATURE_FLAGS.WHATSAPP_INGESTION}>
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Bot Active</span>
              </div>
            </FeatureGate>

            {/* Feature Flag Management for Root/Superadmins */}
            <Link
              to="/settings/feature-flags"
              title="Feature Flags Administration"
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
            >
              <Sliders className="w-4 h-4" />
            </Link>

            {/* User Profile Pill */}
            <div className="flex items-center space-x-2.5 pl-3 border-l border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
                CA
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-200 leading-tight">{user?.fullName || 'Bansal & Associates'}</p>
                <p className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Connaught Place, Delhi
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
