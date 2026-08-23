import React, { useState } from 'react';
import { 
  Sliders, 
  ShieldAlert, 
  Filter
} from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { 
  FEATURE_FLAGS, 
  FEATURE_FLAG_METADATA, 
  FeatureFlagKey 
} from '@khatagenie/types';

export const AdminFeatureFlags: React.FC = () => {
  const { user, isFeatureEnabled, toggleFeatureOverride } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const flagKeys = Object.values(FEATURE_FLAGS) as FeatureFlagKey[];

  const categories = ['ALL', 'ingestion', 'ai', 'review', 'export', 'reconciliation', 'admin'];

  const filteredKeys = flagKeys.filter((key) => {
    if (selectedCategory === 'ALL') return true;
    const meta = FEATURE_FLAG_METADATA[key];
    return meta?.category === selectedCategory;
  });

  return (
    <div className="page-container max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Superadmin Feature Flags & Gating</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Mandated Repository Protocol: Toggle feature flags for testing and tenant overrides.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 uppercase">
            Role: {user?.role || 'CA_ADMIN'}
          </span>
          <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Tenant: {user?.organizationName || 'Bansal & Associates CA'}
          </span>
        </div>
      </div>

      {/* Info Banner with Double-Bezel */}
      <div className="rounded-2xl p-1 bg-slate-200/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow text-xs text-slate-600 dark:text-slate-400 flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-slate-900 dark:text-slate-200">Zero Ungated Features Policy</p>
            <p className="leading-relaxed">
              Every feature in this platform is protected by both backend Fastify route middleware (<code className="text-emerald-600 dark:text-emerald-400 font-mono">requireFeature</code>) and frontend React gates (<code className="text-emerald-600 dark:text-emerald-400 font-mono">&lt;FeatureGate&gt;</code>). Toggling flags here immediately updates the reactive UI state.
            </p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center mr-1 whitespace-nowrap shrink-0">
          <Filter className="w-3.5 h-3.5 mr-1" /> Category:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Flags List with Double-Bezel Card Container */}
      <div className="rounded-2xl p-1 bg-slate-200/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-xl">
        <div className="rounded-xl bg-white dark:bg-slate-900 overflow-hidden border border-slate-100 dark:border-slate-800/60 divide-y divide-slate-200 dark:divide-slate-800/80">
          {filteredKeys.map((key) => {
            const meta = FEATURE_FLAG_METADATA[key];
            const isEnabled = isFeatureEnabled(key);

            return (
              <div
                key={key}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="space-y-1 sm:pr-6 min-w-0">
                  <div className="flex items-center space-x-2.5 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{meta?.label || key}</h3>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {meta?.category || 'general'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{meta?.description}</p>
                  <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">Key: {key}</p>
                </div>

                {/* Toggle Switch */}
                <div className="flex items-center space-x-3 self-end sm:self-auto shrink-0">
                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                    {isEnabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleFeatureOverride(key, !isEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
