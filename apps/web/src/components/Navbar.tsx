import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  Download, 
  Sliders, 
  Sparkles, 
  ShieldCheck, 
  ArrowRightLeft, 
  LogOut, 
  LogIn,
  Menu,
  X,
  ChevronDown,
  UserCheck,
  WhatsApp as WhatsAppIcon
} from './icons';
import { useAuth } from '../context/AuthContext';
import { FeatureGate } from './FeatureGate';
import { FEATURE_FLAGS } from '@khatagenie/types';
import { ThemeToggle } from './ThemeToggle';
import { useWhatsAppStatus } from '../hooks/useWhatsAppStatus';



export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Live WhatsApp Connection Health Probe
  const { data: waStatus } = useWhatsAppStatus();
  const statusState = waStatus?.status || 'unconfigured';

  const statusConfig = {
    connected: {
      pillClass: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400',
      pingClass: 'bg-emerald-400',
      dotClass: 'bg-emerald-500',
      badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
      label: 'Connected',
      title: 'WhatsApp Cloud API webhook receiver is online and connected',
    },
    unconfigured: {
      pillClass: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400',
      pingClass: 'bg-amber-400',
      dotClass: 'bg-amber-500',
      badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
      label: 'Setup Required',
      title: 'Meta WhatsApp Cloud API credentials (PHONE_NUMBER_ID, API_TOKEN) not set in .env',
    },
    error: {
      pillClass: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-400',
      pingClass: 'bg-rose-400',
      dotClass: 'bg-rose-500',
      badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
      label: 'Disconnected',
      title: 'Unable to verify WhatsApp webhook connection',
    },
  }[statusState];

  // Close user dropdown on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userMenuOpen]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { label: 'Invoices Inbox', path: '/', icon: FileText },
    { label: 'GSTR-2B Match', path: '/reconciliation', icon: ArrowRightLeft, flag: FEATURE_FLAGS.GSTR2B_RECONCILIATION },
    { label: 'MSME Clients', path: '/clients', icon: Users },
    { label: 'Export Center', path: '/exports', icon: Download },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-150 shadow-sm">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* 1. Far-Left Brand Logo & CA PRO Tier */}
          <div className="flex items-center space-x-3 sm:space-x-4 shrink-0">
            <Link to="/" className="flex items-center space-x-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Sparkles className="w-4.5 h-4.5 text-slate-950 stroke-[2.5]" />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-none whitespace-nowrap">
                  Khata<span className="text-emerald-600 dark:text-emerald-400">Genie</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap uppercase tracking-wide">
                  CA PRO
                </span>
              </div>
            </Link>
          </div>

          {/* 2. Center / Left-Center Desktop Navigation Tabs */}
          {user && (
            <nav className="hidden lg:flex items-center space-x-1 flex-1 justify-center max-w-2xl">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const linkElement = (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-transparent'
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

          {/* 3. Far-Right Desktop Controls & User Profile Popover */}
          <div className="hidden lg:flex items-center space-x-3 shrink-0">
            {user ? (
              <>
                {/* Live WhatsApp Bot Status Indicator */}
                <FeatureGate flag={FEATURE_FLAGS.WHATSAPP_INGESTION}>
                  <div 
                    className={`hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-help transition-all duration-200 ${statusConfig.pillClass}`}
                    title={statusConfig.title}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusConfig.pingClass}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${statusConfig.dotClass}`}></span>
                    </span>
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                    <span>{statusConfig.label}</span>
                  </div>
                </FeatureGate>

                {/* User Profile Trigger Button with Chevron */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={`flex items-center space-x-2.5 p-1.5 pr-3 rounded-2xl border transition-all duration-150 ${
                      userMenuOpen
                        ? 'bg-slate-100 dark:bg-slate-800 border-emerald-500/40 ring-2 ring-emerald-500/10'
                        : 'bg-slate-50/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'
                    }`}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center text-xs font-black shadow-sm shrink-0">
                      CA
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight truncate max-w-[130px]">
                        {user.fullName || 'Bansal & Associates'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[130px] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        {user.organizationName || 'Connaught Place'}
                      </p>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180 text-emerald-500' : ''}`} />
                  </button>

                  {/* Floating User Info Popover Card */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2.5 w-80 rounded-2xl p-1 bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800/70 shadow-inner-glow space-y-4">
                        
                        {/* Profile Header */}
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-sm font-black text-emerald-700 dark:text-emerald-400 shrink-0">
                            CA
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                                {user.fullName || 'Bansal & Associates'}
                              </h4>
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase shrink-0">
                                CA PRO
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1 font-medium">
                              <UserCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>{user.organizationName || 'Connaught Place, Delhi'}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                              {user.email || 'ca.bansal@khatagenie.com'}
                            </p>
                          </div>
                        </div>

                        {/* WhatsApp Status inside Card */}
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                            <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            WhatsApp Ingestion
                          </span>
                          <span 
                            className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${statusConfig.badgeClass}`}
                            title={statusConfig.title}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${statusConfig.dotClass}`}></span>
                            {statusConfig.label}
                          </span>
                        </div>

                        {/* Quick Settings & Navigation */}
                        <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <Link
                            to="/settings/feature-flags"
                            onClick={() => setUserMenuOpen(false)}
                            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
                          >
                            <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                            <div className="text-left flex-1">
                              <p className="font-bold">Feature Flags Settings</p>
                              <p className="text-[10px] text-slate-400 font-normal">Manage tenant switches & gates</p>
                            </div>
                          </Link>
                        </div>

                        {/* Appearance / Theme Toggle Inside Popover Card */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-1.5 px-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Appearance
                            </span>
                          </div>
                          <ThemeToggle variant="segmented" />
                        </div>

                        {/* Sign Out Button in Card Footer */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              setUserMenuOpen(false);
                              logout();
                            }}
                            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-800/60 transition-colors cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out of Account</span>
                          </button>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20"
              >
                <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* 4. Mobile & Tablet Trigger Bar (Visible at < lg: 1024px) */}
          <div className="flex items-center space-x-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors focus:outline-none border border-slate-200 dark:border-slate-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-rose-500" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* 5. Mobile & Tablet Collapsible Drawer (Synchronized for all widths < lg) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200 shadow-2xl">
          {user ? (
            <>
              {/* User Profile Card in Mobile Drawer */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center text-xs font-black shadow-sm shrink-0">
                    CA
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {user.fullName || 'Bansal & Associates'}
                      </p>
                      <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
                        CA PRO
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {user.organizationName || 'Connaught Place, Delhi'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  title="Sign Out"
                  className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors border border-rose-200 dark:border-rose-800/60"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Links in Mobile Drawer */}
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  const link = (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    location.pathname === '/settings/feature-flags'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Feature Flags Settings</span>
                </Link>
              </div>

              {/* Theme Switcher in Mobile Drawer */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-1">
                  Appearance
                </p>
                <ThemeToggle variant="segmented" />
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

