import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  UploadCloud, 
  ArrowRightLeft, 
  Sparkles, 
  ShieldAlert, 
  Filter, 
  Loader2,
  FileCheck,
  Globe,
  Check
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { Gstr2bMatchStatus, ReconciliationSummary } from '@khatagenie/types';
import { useToast } from '../context/ToastContext';

export const Gstr2bReconPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // 1. TanStack Query caching for Reconciliation Data
  const { data: summary, isLoading, isFetching } = useQuery<ReconciliationSummary>({
    queryKey: ['reconciliation', 'sample'],
    queryFn: async () => {
      try {
        return await fetchApi<ReconciliationSummary>('/reconciliation/sample');
      } catch (err: any) {
        console.warn('Reconciliation sample load fallback:', err);
        return {
          period: '082026',
          totalGstr2bRecords: 3,
          totalBooksRecords: 4,
          matchedCount: 2,
          taxMismatchCount: 1,
          missingInBooksCount: 1,
          missingInGstr2bCount: 1,
          totalItcAvailableBooks: 7740.0,
          totalItcAvailableGstr2b: 7740.0,
          itcMismatchVariance: 0.0,
          items: [
            {
              id: 'recon_01',
              matchStatus: Gstr2bMatchStatus.MATCHED,
              confidenceScore: 1.0,
              booksInvoiceNumber: 'SBI-2026/0412',
              booksInvoiceDate: '2026-08-20',
              booksSupplierGstin: '07AAAFB1234F1Z3',
              booksSupplierName: 'Shree Balaji Industrial Hardware',
              booksTaxAmount: 3240.0,
              booksTotalAmount: 21240.0,
              gstr2bSupplierGstin: '07AAAFB1234F1Z3',
              gstr2bSupplierName: 'Shree Balaji Industrial Hardware',
              gstr2bInvoiceNumber: 'SBI-2026/0412',
              gstr2bInvoiceDate: '2026-08-20',
              gstr2bTaxAmount: 3240.0,
              gstr2bTotalAmount: 21240.0,
              gstr2bItcEligible: true,
              taxVariance: 0.0,
              valueVariance: 0.0,
              notes: 'Exact GSTIN and tax match.',
            },
            {
              id: 'recon_02',
              matchStatus: Gstr2bMatchStatus.MATCHED,
              confidenceScore: 1.0,
              booksInvoiceNumber: 'DEL-HGN-4412',
              booksInvoiceDate: '2026-08-20',
              booksSupplierGstin: '06EEEFF5555E1Z9',
              booksSupplierName: 'Cybertronics Hardware Gurgaon',
              booksTaxAmount: 4500.0,
              booksTotalAmount: 29500.0,
              gstr2bSupplierGstin: '06EEEFF5555E1Z9',
              gstr2bSupplierName: 'Cybertronics Hardware Gurgaon',
              gstr2bInvoiceNumber: 'DEL-HGN-4412',
              gstr2bInvoiceDate: '2026-08-20',
              gstr2bTaxAmount: 4500.0,
              gstr2bTotalAmount: 29500.0,
              gstr2bItcEligible: true,
              taxVariance: 0.0,
              valueVariance: 0.0,
              notes: 'Exact IGST match.',
            },
            {
              id: 'recon_03',
              matchStatus: Gstr2bMatchStatus.MISSING_IN_BOOKS,
              confidenceScore: 0.0,
              gstr2bSupplierGstin: '07KLLMN8899K1Z5',
              gstr2bSupplierName: 'Kailash Offset Printers Okhla',
              gstr2bInvoiceNumber: 'KOP-8891',
              gstr2bInvoiceDate: '2026-08-18',
              gstr2bTaxAmount: 1350.0,
              gstr2bTotalAmount: 8850.0,
              gstr2bItcEligible: true,
              notes: 'Invoice filed by supplier on GST portal, but missing in digitized books.',
            },
            {
              id: 'recon_04',
              matchStatus: Gstr2bMatchStatus.MISSING_IN_GSTR2B,
              confidenceScore: 0.0,
              booksInvoiceNumber: 'INV-2026-0891',
              booksInvoiceDate: '2026-08-15',
              booksSupplierGstin: '07DDDDE4444D1Z2',
              booksSupplierName: 'Om Prakash Stationery & Supplies',
              booksTaxAmount: 1800.0,
              booksTotalAmount: 11800.0,
              notes: 'Supplier has not filed GSTR-1 yet. Provisional ITC restricted under Rule 36(4).',
            },
          ],
        };
      }
    },
  });

  // 2. Upload Mutation for GSTR-2B JSON
  const uploadMutation = useMutation({
    mutationFn: async (json: any) => {
      return await fetchApi<ReconciliationSummary>('/reconciliation/process', {
        method: 'POST',
        body: JSON.stringify(json),
      });
    },
    onSuccess: (res) => {
      queryClient.setQueryData(['reconciliation', 'sample'], res);
      showToast(
        `GSTR-2B Reconciled! Processed ${res.totalGstr2bRecords} portal records against ${res.totalBooksRecords} books entries.`,
        'success'
      );
    },
    onError: (err: any) => {
      showToast(`Reconciliation failed: ${err.message || 'Please upload a valid GST Portal JSON file.'}`, 'error');
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        uploadMutation.mutate(json);
      } catch {
        showToast('Invalid JSON file format. Please upload valid GST portal data.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const filteredItems = summary?.items.filter((item) => {
    if (filterStatus === 'ALL') return true;
    return item.matchStatus === filterStatus;
  });

  const renderMatchBadge = (status: Gstr2bMatchStatus) => {
    switch (status) {
      case Gstr2bMatchStatus.MATCHED:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <Check className="w-3 h-3" />
            MATCHED
          </span>
        );
      case Gstr2bMatchStatus.MISSING_IN_BOOKS:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" />
            MISSING IN BOOKS
          </span>
        );
      case Gstr2bMatchStatus.MISSING_IN_GSTR2B:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-3 h-3" />
            MISSING IN 2B
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
            <HelpCircle className="w-3 h-3" />
            TAX MISMATCH
          </span>
        );
    }
  };

  const renderItcBadge = (status: Gstr2bMatchStatus) => {
    if (status === Gstr2bMatchStatus.MATCHED) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" /> 100% Eligible
        </span>
      );
    }
    if (status === Gstr2bMatchStatus.MISSING_IN_GSTR2B) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
          <AlertTriangle className="w-3.5 h-3.5" /> Ineligible (Rule 36(4))
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
        <HelpCircle className="w-3.5 h-3.5" /> Action Required
      </span>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 safe-pb overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <ArrowRightLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>GSTR-2B 2-Way ITC Reconciliation</span>
            {isFetching && !isLoading && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-pulse">
                Syncing...
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automated 2-way comparison between digitized WhatsApp accounting books and GST Portal GSTR-2B filing returns.
          </p>
        </div>

        {/* Upload Portal JSON Button */}
        <div className="flex items-center space-x-3 shrink-0">
          <label className="btn-primary space-x-2">
            <UploadCloud className="w-4 h-4 stroke-[2.5]" />
            <span>{uploadMutation.isPending ? 'Reconciling...' : 'Upload GSTR-2B JSON'}</span>
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploadMutation.isPending}
            />
          </label>
        </div>
      </div>

      {/* Summary KPI Cards Grid with Double-Bezel Architecture */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="rounded-2xl p-1 bg-slate-200/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all duration-300">
            <div className="rounded-xl bg-white dark:bg-slate-900/90 p-3 sm:p-4 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow h-full flex flex-col justify-between">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Matched Invoices
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {summary.matchedCount}
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 truncate">
                100% Eligible under Sec 16(2)(aa)
              </p>
            </div>
          </div>

          <div className="rounded-2xl p-1 bg-slate-200/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all duration-300">
            <div className="rounded-xl bg-white dark:bg-slate-900/90 p-3 sm:p-4 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow h-full flex flex-col justify-between">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Missing in Books
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                  {summary.missingInBooksCount}
                </span>
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 truncate">
                On Portal, missing in WhatsApp
              </p>
            </div>
          </div>

          <div className="rounded-2xl p-1 bg-slate-200/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all duration-300">
            <div className="rounded-xl bg-white dark:bg-slate-900/90 p-3 sm:p-4 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow h-full flex flex-col justify-between">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Missing in 2B
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                  {summary.missingInGstr2bCount}
                </span>
                <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 truncate">
                Pending supplier GSTR-1
              </p>
            </div>
          </div>

          <div className="rounded-2xl p-1 bg-slate-200/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all duration-300">
            <div className="rounded-xl bg-white dark:bg-slate-900/90 p-3 sm:p-4 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow h-full flex flex-col justify-between">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Books ITC
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-lg sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                  ₹{summary.totalItcAvailableBooks.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-mono truncate">
                Period: {summary.period}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center mr-1 shrink-0">
          <Filter className="w-3.5 h-3.5 mr-1" /> Filter:
        </span>
        {[
          { id: 'ALL', label: 'All Items' },
          { id: Gstr2bMatchStatus.MATCHED, label: 'Matched' },
          { id: Gstr2bMatchStatus.MISSING_IN_BOOKS, label: 'Missing in Books' },
          { id: Gstr2bMatchStatus.MISSING_IN_GSTR2B, label: 'Missing in 2B' },
          { id: Gstr2bMatchStatus.TAX_MISMATCH, label: 'Tax Mismatch' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterStatus === tab.id
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-300 dark:border-slate-700 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MOBILE VIEW: Dedicated 2-Way Comparison Cards (md:hidden) */}
      <div className="block md:hidden space-y-3.5">
        {isLoading ? (
          <div className="py-12 text-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
            <span className="text-xs font-medium">Loading cached GSTR-2B records...</span>
          </div>
        ) : filteredItems?.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <p className="text-xs font-medium">No reconciliation items matching filter.</p>
          </div>
        ) : (
          filteredItems?.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl p-1 bg-slate-200/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3"
            >
              <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow space-y-3">
                {/* Header: Status & ITC Eligibility */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                  <div>{renderMatchBadge(item.matchStatus)}</div>
                  <div>{renderItcBadge(item.matchStatus)}</div>
                </div>

                {/* Comparative Section: Books vs Portal */}
                <div className="space-y-2 text-xs">
                  {/* Digitized Books Entry */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                      <span className="flex items-center gap-1">
                        <FileCheck className="w-3 h-3" /> Digitized Books
                      </span>
                      {item.booksTaxAmount && (
                        <span className="font-mono">Tax: ₹{item.booksTaxAmount.toFixed(2)}</span>
                      )}
                    </div>
                    {item.booksSupplierName ? (
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {item.booksSupplierName}
                        </p>
                        <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          {item.booksSupplierGstin} • Bill: {item.booksInvoiceNumber} ({item.booksInvoiceDate})
                        </p>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic text-[11px]">Not found in digitized books</p>
                    )}
                  </div>

                  {/* GSTR-2B Portal Entry */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-sky-700 dark:text-sky-400">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" /> GST Portal GSTR-2B
                      </span>
                      {item.gstr2bTaxAmount && (
                        <span className="font-mono">Tax: ₹{item.gstr2bTaxAmount.toFixed(2)}</span>
                      )}
                    </div>
                    {item.gstr2bSupplierName ? (
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {item.gstr2bSupplierName}
                        </p>
                        <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          {item.gstr2bSupplierGstin} • Bill: {item.gstr2bInvoiceNumber} ({item.gstr2bInvoiceDate})
                        </p>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic text-[11px]">Not filed on GST portal return</p>
                    )}
                  </div>
                </div>

                {/* Tax & Variance Summary */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Reconciled Tax</span>
                    <span className="font-black font-mono text-sm text-slate-900 dark:text-white">
                      ₹{(item.gstr2bTaxAmount || item.booksTaxAmount || 0).toFixed(2)}
                    </span>
                  </div>
                  {typeof item.taxVariance === 'number' && item.taxVariance > 0 && (
                    <span className="text-xs font-mono font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/20">
                      Δ ₹{item.taxVariance.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* CA Audit Notes */}
                {item.notes && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 leading-relaxed">
                    {item.notes}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP VIEW: Reconciliation Comparison Table (hidden md:block) */}
      <div className="hidden md:block rounded-2xl p-1 bg-slate-200/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-xl">
        <div className="rounded-xl bg-white dark:bg-slate-900 overflow-hidden border border-slate-100 dark:border-slate-800/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 dark:bg-slate-950/70 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
              <tr>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Digitized Books Entry</th>
                <th className="py-3.5 px-4">GSTR-2B Portal Entry</th>
                <th className="py-3.5 px-4 font-mono">Tax Amount</th>
                <th className="py-3.5 px-4 font-mono">ITC Eligibility</th>
                <th className="py-3.5 px-4">CA Reconciliation Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                    <span>Loading cached GSTR-2B records...</span>
                  </td>
                </tr>
              ) : filteredItems?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No reconciliation items matching filter.
                  </td>
                </tr>
              ) : (
                filteredItems?.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Status */}
                    <td className="py-3.5 px-4">{renderMatchBadge(item.matchStatus)}</td>

                    {/* Books Entry */}
                    <td className="py-3.5 px-4">
                      {item.booksSupplierName ? (
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {item.booksSupplierName}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            GSTIN: {item.booksSupplierGstin} • Bill: {item.booksInvoiceNumber}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Not found in Books</span>
                      )}
                    </td>

                    {/* GSTR-2B Entry */}
                    <td className="py-3.5 px-4">
                      {item.gstr2bSupplierName ? (
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {item.gstr2bSupplierName}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            GSTIN: {item.gstr2bSupplierGstin} • Bill: {item.gstr2bInvoiceNumber}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Not on GST Portal</span>
                      )}
                    </td>

                    {/* Tax Amount */}
                    <td className="py-3.5 px-4 font-mono">
                      <p className="font-black text-slate-900 dark:text-slate-100">
                        ₹{(item.gstr2bTaxAmount || item.booksTaxAmount || 0).toFixed(2)}
                      </p>
                      {typeof item.taxVariance === 'number' && item.taxVariance > 0 && (
                        <p className="text-[10px] text-rose-500 font-bold">Δ ₹{item.taxVariance.toFixed(2)}</p>
                      )}
                    </td>

                    {/* ITC Eligibility */}
                    <td className="py-3.5 px-4">{renderItcBadge(item.matchStatus)}</td>

                    {/* Notes */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-[11px] max-w-xs leading-relaxed">
                      {item.notes}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

