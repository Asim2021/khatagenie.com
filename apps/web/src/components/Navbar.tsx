import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  Download, 
  Sliders, 
  Sparkles, 
  MessageSquare, 
  ShieldCheck, 
  ArrowRightLeft, 
  LogOut, 
  LogIn,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FeatureGate } from './FeatureGate';
import { FEATURE_FLAGS } from '@khatagenie/types';
import { ThemeToggle } from './ThemeToggle';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Invoices Inbox', path: '/', icon: FileText },
    { label: 'GSTR-2B Match', path: '/reconciliation', icon: ArrowRightLeft, flag: FEATURE_FLAGS.GSTR2B_RECONCILIATION },
    { label: 'MSME Clients', path: '/clients', icon: Users },
    { label: 'Export Center', path: '/exports', icon: Download },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-4 lg:space-x-6">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  Khata<span className="text-emerald-600 dark:text-emerald-400">Genie</span>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    CA PRO
                  </span>
                </span>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden xs:block">
                  WhatsApp Bill Digitizer & Tax Sync
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            {user && (
              <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-200 dark:border-slate-800">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  const linkElement = (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );

                  if (item.flag) {
                    return (
                      <FeatureGate key={item.path} flag={item.flag}>
                        {linkElement}
                      </FeatureGate>
                    );
                  }
                  return linkElement;
                })}
              </nav>
            )}
          </div>

          {/* Desktop Right Controls */}
          <div className="hidden sm:flex items-center space-x-2.5 sm:space-x-3">
            {/* Theme Toggle (Desktop) */}
            <ThemeToggle />

            {user ? (
              <>
                {/* Live WhatsApp Listener Status */}
                <FeatureGate flag={FEATURE_FLAGS.WHATSAPP_INGESTION}>
                  <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
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
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <Sliders className="w-4 h-4" />
                </Link>

                {/* User Profile / Auth Pill */}
                <div className="flex items-center space-x-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                    CA
                  </div>
                  <div className="hidden xl:block text-left">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[150px]">
                      {user.fullName || 'Bansal & Associates'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono truncate max-w-[150px]">
                      <ShieldCheck className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                      {user.organizationName || 'Connaught Place, Delhi'}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors shadow-lg shadow-emerald-500/20"
              >
                <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile Right Bar: Theme Toggle & Hamburger Button */}
          <div className="flex items-center space-x-1 sm:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-2xl">
          {/* Navigation Links */}
          {user ? (
            <>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  const link = (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span>{item.label}</span>
                    </Link>
                  );

                  if (item.flag) {
                    return (
                      <FeatureGate key={item.path} flag={item.flag}>
                        {link}
                      </FeatureGate>
                    );
                  }
                  return link;
                })}

                <Link
                  to="/settings/feature-flags"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    location.pathname === '/settings/feature-flags'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Sliders className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Feature Flags Settings</span>
                </Link>
              </div>

              {/* Theme Switcher in Mobile Drawer */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-1">
                  Appearance
                </p>
                <ThemeToggle variant="segmented" />
              </div>

              {/* Mobile User Context & Sign Out */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    CA
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-200">
                      {user.fullName || 'Bansal & Associates'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {user.organizationName || 'Connaught Place'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <ThemeToggle variant="segmented" />
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-emerald-500/20"
              >
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                <span>Sign In to KhataGenie</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
