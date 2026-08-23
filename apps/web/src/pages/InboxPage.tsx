import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  UploadCloud, 
  Search, 
  Download, 
  ArrowRight,
  Sparkles,
  MessageSquare,
  Building2,
  Check,
  CheckSquare,
  Square
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { FeatureGate } from '../components/FeatureGate';
import { FEATURE_FLAGS } from '@khatagenie/types';
import { useToast } from '../context/ToastContext';
import { getStateFromGstin } from '@khatagenie/shared';

export const InboxPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('NEEDS_REVIEW');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // 1. TanStack Query for Cached Invoices & Counts
  const { data, isLoading } = useQuery<{ invoices: any[]; counts: Record<string, number> }>({
    queryKey: ['invoices', activeTab, searchQuery],
    queryFn: async () => {
      try {
        const statusParam = activeTab === 'ALL' ? '' : `&status=${activeTab}`;
        const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
        return await fetchApi<{ invoices: any[]; counts: Record<string, number> }>(
          `/invoices?limit=50${statusParam}${searchParam}`
        );
      } catch (err) {
        console.warn('Using mock sample data for offline preview:', err);
        const mockData = [
          {
            id: 'inv-delhi-01',
            senderPhone: '919877665544',
            fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1000',
            status: 'NEEDS_REVIEW',
            invoiceNumber: 'DEL-HGN-4412',
            invoiceDate: '2026-08-20',
            supplierName: 'Cybertronics Hardware Gurgaon',
            supplierGstin: '06EEEFF5555E1Z9',
            taxableAmount: 25000.0,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 4500.0,
            totalAmount: 29500.0,
            isMathValid: true,
            confidenceScore: 0.91,
            client: { businessName: 'Sharma Electronics & Appliances', gstin: '07BBCDE2222B1Z8' },
          },
          {
            id: 'inv-delhi-02',
            senderPhone: '919811223344',
            fileUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=1000',
            status: 'APPROVED',
            invoiceNumber: 'INV-2026-0891',
            invoiceDate: '2026-08-15',
            supplierName: 'Om Prakash Stationery & Supplies',
            supplierGstin: '07DDDDE4444D1Z2',
            taxableAmount: 10000.0,
            cgstAmount: 900.0,
            sgstAmount: 900.0,
            igstAmount: 0,
            totalAmount: 11800.0,
            isMathValid: true,
            confidenceScore: 0.96,
            client: { businessName: 'Aggarwal Traders', gstin: '07AABCA1111A1Z0' },
          },
          {
            id: 'inv-delhi-03',
            senderPhone: '919891002233',
            fileUrl: 'https://images.unsplash.com/photo-1607344645866-009c320b5ab8?auto=format&fit=crop&q=80&w=1000',
            status: 'NEEDS_REVIEW',
            invoiceNumber: 'RCPT-8821',
            invoiceDate: '2026-08-21',
            supplierName: 'Haldiram Snacks Connaught Place',
            supplierGstin: '07AAACH1234A1Z0',
            taxableAmount: 1500.0,
            cgstAmount: 37.5,
            sgstAmount: 37.5,
            igstAmount: 0,
            totalAmount: 1575.0,
            isMathValid: true,
            confidenceScore: 0.88,
            client: { businessName: 'Gupta Auto Components', gstin: '07CCDEF3333C1Z6' },
          },
          {
            id: 'inv-delhi-04',
            senderPhone: '919810112233',
            fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1000',
            status: 'EXPORTED',
            invoiceNumber: 'SBI-2026/0412',
            invoiceDate: '2026-08-19',
            supplierName: 'Shree Balaji Industrial Hardware',
            supplierGstin: '07AAAFB1234F1Z3',
            taxableAmount: 18000.0,
            cgstAmount: 1620.0,
            sgstAmount: 1620.0,
            igstAmount: 0,
            totalAmount: 21240.0,
            isMathValid: true,
            confidenceScore: 0.98,
            client: { businessName: 'Aggarwal Traders', gstin: '07AABCA1111A1Z0' },
          },
        ];

        const filtered = mockData.filter((item) => {
          const matchesTab = activeTab === 'ALL' || item.status === activeTab;
          const matchesSearch =
            !searchQuery ||
            item.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.client?.businessName || '').toLowerCase().includes(searchQuery.toLowerCase());
          return matchesTab && matchesSearch;
        });

        return {
          invoices: filtered,
          counts: {
            NEEDS_REVIEW: mockData.filter((i) => i.status === 'NEEDS_REVIEW').length,
            APPROVED: mockData.filter((i) => i.status === 'APPROVED').length,
            EXPORTED: mockData.filter((i) => i.status === 'EXPORTED').length,
          },
        };
      }
    },
  });

  const invoices = data?.invoices || [];
  const counts = data?.counts || {};

  // 2. Direct Bill Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('senderPhone', '919811000000');
      return await fetch('/api/v1/invoices/upload', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation'] });
      showToast('Invoice uploaded successfully! Extracted fields are ready.', 'success');
    },
    onError: (err: any) => {
      showToast(`Upload failed: ${err.message}`, 'error');
    },
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(invoices.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDirectUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Approved
          </span>
        );
      case 'EXPORTED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
            <Download className="w-3 h-3 text-indigo-500" />
            Exported
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3 text-rose-500" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 animate-pulse">
            <Clock className="w-3 h-3 text-amber-500" />
            Needs Review
          </span>
        );
    }
  };

  return (
    <div className="page-container">
      {/* Top Banner & KPI Stat Cards with Double-Bezel Architecture */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Needs Review Card */}
        <div className="rounded-2xl p-1 bg-slate-200/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all duration-300">
          <div className="rounded-xl bg-white dark:bg-slate-900/90 p-3 sm:p-4 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Needs Review
                </p>
                <h3 className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5 sm:mt-1">
                  {counts.NEEDS_REVIEW || 0}
                </h3>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 sm:mt-3 flex items-center gap-1 truncate">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">AI Extracted • 1-click review</span>
            </p>
          </div>
        </div>

        {/* Approved Card */}
        <div className="rounded-2xl p-1 bg-slate-200/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all duration-300">
          <div className="rounded-xl bg-white dark:bg-slate-900/90 p-3 sm:p-4 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Approved
                </p>
                <h3 className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 sm:mt-1">
                  {counts.APPROVED || 0}
                </h3>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 sm:mt-3 truncate">
              Ready for Tally XML sync
            </p>
          </div>
        </div>

        {/* Ingested Card */}
        <div className="rounded-2xl p-1 bg-slate-200/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all duration-300">
          <div className="rounded-xl bg-white dark:bg-slate-900/90 p-3 sm:p-4 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  WhatsApp Bills
                </p>
                <h3 className="text-lg sm:text-2xl font-black text-sky-600 dark:text-sky-400 font-mono mt-0.5 sm:mt-1">
                  {invoices.length}
                </h3>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 sm:mt-3 font-mono truncate">
              Meta Graph Ingested
            </p>
          </div>
        </div>

        {/* Exported Card */}
        <div className="rounded-2xl p-1 bg-slate-200/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all duration-300">
          <div className="rounded-xl bg-white dark:bg-slate-900/90 p-3 sm:p-4 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Tally Vouchers
                </p>
                <h3 className="text-lg sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-0.5 sm:mt-1">
                  {counts.EXPORTED || 0}
                </h3>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 sm:mt-3 truncate">
              Ledger synchronized
            </p>
          </div>
        </div>
      </div>

      {/* Main Filter & Search Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        {/* Filter Tabs (Segmented Floating Island) */}
        <div className="flex items-center space-x-1 bg-slate-200/70 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-300/80 dark:border-slate-800/80 overflow-x-auto scrollbar-none">
          {[
            { id: 'NEEDS_REVIEW', label: 'Needs Review', count: counts.NEEDS_REVIEW },
            { id: 'APPROVED', label: 'Approved', count: counts.APPROVED },
            { id: 'ALL', label: 'All Invoices' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id 
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' 
                    : 'bg-slate-300/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Direct Upload */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search vendor, GSTIN, bill #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-field w-full sm:w-72"
            />
          </div>

          <FeatureGate flag={FEATURE_FLAGS.DIRECT_UPLOAD}>
            <label className="btn-primary space-x-2 shrink-0">
              <UploadCloud className="w-4 h-4 stroke-[2.5]" />
              <span>{uploadMutation.isPending ? 'Extracting...' : 'Upload Bill'}</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleDirectUpload}
                disabled={uploadMutation.isPending}
              />
            </label>
          </FeatureGate>
        </div>
      </div>

      {/* Selected Action Bar (When 1+ items checked) */}
      {selectedIds.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{selectedIds.length} invoice(s) selected</span>
          </div>
          <button
            onClick={() => setSelectedIds([])}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline font-medium"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* MOBILE VIEW: Dedicated Interactive Double-Bezel Cards (md:hidden) */}
      <div className="block md:hidden space-y-3.5">
        {isLoading ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-medium">Loading cached invoices...</span>
            </div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 space-y-3 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <FileText className="w-10 h-10 mx-auto opacity-40 text-emerald-500" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Invoices in this view
            </p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Send bill photos or PDF receipts to your WhatsApp Bot, or use the Direct Upload button above.
            </p>
          </div>
        ) : (
          invoices.map((inv) => {
            const isSelected = selectedIds.includes(inv.id);
            const supplierState = inv.supplierGstin ? getStateFromGstin(inv.supplierGstin) : '';

            return (
              <div
                key={inv.id}
                className={`rounded-2xl p-1 transition-all duration-200 ${
                  isSelected
                    ? 'bg-emerald-500/20 border border-emerald-500/40 shadow-md'
                    : 'bg-slate-200/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm'
                }`}
              >
                <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow space-y-3.5">
                  {/* Card Header: Checkbox + Vendor Name + Status */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start space-x-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleSelectOne(inv.id)}
                        className="mt-0.5 text-slate-400 hover:text-emerald-500 transition-colors shrink-0"
                        aria-label="Select invoice"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate leading-snug">
                          {inv.supplierName || 'Vendor Extracting...'}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded">
                            {inv.supplierGstin || 'No GSTIN'}
                          </span>
                          {supplierState && (
                            <span className="text-[9px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              {supplierState}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">{renderStatusBadge(inv.status)}</div>
                  </div>

                  {/* Metadata Row: Bill # & Date + Client */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans block">
                        Bill & Date
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {inv.invoiceNumber || 'Pending'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {inv.invoiceDate || 'Today'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans block">
                        MSME Client
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                        {inv.client?.businessName || 'Unassigned'}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block truncate">
                        +{inv.senderPhone}
                      </span>
                    </div>
                  </div>

                  {/* Financial Grid (Taxable, Taxes, Total, Math Check) */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        Taxable: ₹{(inv.taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-base font-black font-mono text-slate-950 dark:text-white block mt-0.5">
                        ₹{(inv.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="text-right space-y-1">
                      {inv.isMathValid ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" />
                          Balanced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          Check Tax
                        </span>
                      )}
                      <p className="text-[9px] font-mono text-slate-400">
                        Confidence: {Math.round((inv.confidenceScore || 0.9) * 100)}%
                      </p>
                    </div>
                  </div>

                  {/* 1-Tap Full Width Action Button */}
                  <Link
                    to={`/invoices/${inv.id}/review`}
                    className="btn-primary w-full justify-between py-3 shadow-md"
                  >
                    <span>Open CA Review Studio</span>
                    <div className="w-6 h-6 rounded-full bg-black/15 dark:bg-black/20 flex items-center justify-center transition-colors">
                      <ArrowRight className="w-3.5 h-3.5 text-current" />
                    </div>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP VIEW: High-Density Table (hidden md:block) */}
      <div className="hidden md:block rounded-2xl p-1 bg-slate-200/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-xl">
        <div className="rounded-xl bg-white dark:bg-slate-900 overflow-hidden border border-slate-100 dark:border-slate-800/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 dark:bg-slate-950/70 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
              <tr>
                <th className="p-3 sm:p-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length > 0 && selectedIds.length === invoices.length}
                    className="checkbox-custom"
                    aria-label="Select all invoices"
                  />
                </th>
                <th className="py-3 sm:py-4 px-3">MSME Client</th>
                <th className="py-3 sm:py-4 px-3">Supplier Legal Name</th>
                <th className="py-3 sm:py-4 px-3">Bill / Invoice #</th>
                <th className="py-3 sm:py-4 px-3">Taxable Val</th>
                <th className="py-3 sm:py-4 px-3">Total Amount</th>
                <th className="py-3 sm:py-4 px-3">Math Check</th>
                <th className="py-3 sm:py-4 px-3">Status</th>
                <th className="py-3 sm:py-4 px-3 text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>Loading cached invoices...</span>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
                    <FileText className="w-10 h-10 mx-auto opacity-40 text-emerald-500" />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      No Invoices in this view
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Send bill photos or PDF receipts to your WhatsApp Bot, or use the Direct Upload button above.
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isSelected = selectedIds.includes(inv.id);
                  const supplierState = inv.supplierGstin ? getStateFromGstin(inv.supplierGstin) : '';

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-emerald-50/60 dark:bg-emerald-950/25' : ''
                      }`}
                    >
                      <td className="p-3 sm:p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(inv.id)}
                          className="checkbox-custom"
                          aria-label={`Select invoice ${inv.invoiceNumber}`}
                        />
                      </td>

                      {/* Client */}
                      <td className="py-3 sm:py-4 px-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate max-w-[140px]">
                            {inv.client?.businessName || 'Unassigned Client'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          +{inv.senderPhone}
                        </p>
                      </td>

                      {/* Supplier */}
                      <td className="py-3 sm:py-4 px-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                          {inv.supplierName || 'Extracting...'}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          <span>{inv.supplierGstin || 'No GSTIN'}</span>
                          {supplierState && (
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-sans">
                              ({supplierState})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Invoice # & Date */}
                      <td className="py-3 sm:py-4 px-3 font-mono">
                        <div className="text-slate-800 dark:text-slate-200 font-bold">
                          {inv.invoiceNumber || 'Pending'}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {inv.invoiceDate || 'Today'}
                        </p>
                      </td>

                      {/* Taxable */}
                      <td className="py-3 sm:py-4 px-3 font-mono text-slate-700 dark:text-slate-300">
                        ₹{(inv.taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Total */}
                      <td className="py-3 sm:py-4 px-3 font-mono font-black text-slate-900 dark:text-white">
                        ₹{(inv.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Math Parity */}
                      <td className="py-3 sm:py-4 px-3">
                        {inv.isMathValid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" />
                            Balanced
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            Check Taxes
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 sm:py-4 px-3">{renderStatusBadge(inv.status)}</td>

                      {/* Action */}
                      <td className="py-3 sm:py-4 px-3 text-right">
                        <Link
                          to={`/invoices/${inv.id}/review`}
                          className="btn-action space-x-1.5"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
