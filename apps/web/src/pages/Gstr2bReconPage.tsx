import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  HelpCircle, 
  Check, 
  FileJson
} from '../components/icons';
import { useMutation } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { ReconciliationSummary, Gstr2bMatchStatus } from '@khatagenie/types';
import { useToast } from '../context/ToastContext';

export const Gstr2bReconPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const { showToast } = useToast();

  // Upload Mutation for GSTR-2B JSON
  const uploadMutation = useMutation({
    mutationFn: async (json: any) => {
      return await fetchApi<ReconciliationSummary>('/reconciliation/process', {
        method: 'POST',
        body: JSON.stringify(json),
      });
    },
    onSuccess: (res) => {
      setSummary(res);
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
    e.target.value = '';
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
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <ArrowRightLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>GSTR-2B 2-Way ITC Reconciliation</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automated 2-way comparison between digitized WhatsApp accounting books and GST Portal GSTR-2B filing returns.
          </p>
        </div>

        {/* Upload Portal JSON Button */}
        <div className="flex items-center space-x-3 shrink-0">
          <label className="btn-primary space-x-2 cursor-pointer">
            <UploadCloud className="w-4 h-4 stroke-[2.5]" />
            <span>{uploadMutation.isPending ? 'Reconciling...' : summary ? 'Reconcile Another File' : 'Upload GSTR-2B JSON'}</span>
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

      {/* Empty State: Prompt Upload when no reconciliation performed yet */}
      {!summary && (
        <div className="rounded-3xl p-1 bg-slate-200/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 max-w-4xl mx-auto my-8 shadow-sm">
          <div className="rounded-2xl bg-white dark:bg-slate-900/90 p-8 sm:p-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <FileJson className="w-8 h-8 stroke-[2]" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Upload GSTR-2B Portal JSON
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Download your client’s GSTR-2B JSON return from the GST Portal (<code className="text-[11px] font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">Returns Dashboard &rarr; GSTR-2B &rarr; Download JSON</code>) and upload it here to run 2-way verification.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-2xl mx-auto text-left pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">STEP 1</span>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Upload GSTR-2B</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Import the official monthly JSON file from GST portal.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400">STEP 2</span>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Auto 2-Way Match</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Cross-references supplier GSTINs, invoice numbers, and taxes.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">STEP 3</span>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Audit & Export</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Verify Section 16(2)(aa) eligibility and export clean ITC.</p>
              </div>
            </div>

            <label className="btn-primary inline-flex space-x-2 py-3 px-8 text-sm cursor-pointer shadow-lg shadow-emerald-500/20">
              <UploadCloud className="w-5 h-5 stroke-[2.5]" />
              <span>{uploadMutation.isPending ? 'Processing JSON...' : 'Select GSTR-2B JSON File'}</span>
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
      )}

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
                ITC Variance
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xl sm:text-2xl font-black font-mono ${summary.itcMismatchVariance === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  ₹{summary.itcMismatchVariance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 truncate">
                Books vs GSTR-2B Delta
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Content Section */}
      {summary && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 w-fit">
            {[
              { id: 'ALL', label: 'All Records', count: summary.items.length },
              { id: Gstr2bMatchStatus.MATCHED, label: 'Matched', count: summary.matchedCount },
              { id: Gstr2bMatchStatus.MISSING_IN_BOOKS, label: 'Missing in Books', count: summary.missingInBooksCount },
              { id: Gstr2bMatchStatus.MISSING_IN_GSTR2B, label: 'Missing in 2B', count: summary.missingInGstr2bCount },
              { id: Gstr2bMatchStatus.TAX_MISMATCH, label: 'Tax Mismatch', count: summary.taxMismatchCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterStatus === tab.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Desktop View Table */}
          <div className="hidden md:block rounded-2xl p-1 bg-slate-200/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
            <div className="rounded-xl bg-white dark:bg-slate-900 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-3.5 px-4">Status & Action</th>
                    <th className="py-3.5 px-4">Supplier & GSTIN</th>
                    <th className="py-3.5 px-4">Invoice # & Date</th>
                    <th className="py-3.5 px-4 text-right">Books Tax (₹)</th>
                    <th className="py-3.5 px-4 text-right">Portal Tax (₹)</th>
                    <th className="py-3.5 px-4">ITC Eligibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredItems?.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">{renderMatchBadge(item.matchStatus)}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                        <div>{item.gstr2bSupplierName || item.booksSupplierName || 'Unknown Vendor'}</div>
                        <div className="text-[11px] font-mono text-slate-500">{item.gstr2bSupplierGstin || item.booksSupplierGstin || 'N/A'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div>{item.gstr2bInvoiceNumber || item.booksInvoiceNumber || 'N/A'}</div>
                        <div className="text-[11px] text-slate-400">{item.gstr2bInvoiceDate || item.booksInvoiceDate || 'N/A'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                        {item.booksTaxAmount !== undefined ? `₹${item.booksTaxAmount.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {item.gstr2bTaxAmount !== undefined ? `₹${item.gstr2bTaxAmount.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3.5 px-4">{renderItcBadge(item.matchStatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile View Cards */}
          <div className="md:hidden space-y-3">
            {filteredItems?.map((item) => (
              <div key={item.id} className="rounded-2xl p-1 bg-slate-200/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                <div className="rounded-xl bg-white dark:bg-slate-900 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    {renderMatchBadge(item.matchStatus)}
                    {renderItcBadge(item.matchStatus)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.gstr2bSupplierName || item.booksSupplierName || 'Unknown Vendor'}
                    </h4>
                    <p className="text-xs font-mono text-slate-500">
                      {item.gstr2bSupplierGstin || item.booksSupplierGstin || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">INVOICE #</span>
                      {item.gstr2bInvoiceNumber || item.booksInvoiceNumber || 'N/A'}
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">PORTAL TAX</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {item.gstr2bTaxAmount !== undefined ? `₹${item.gstr2bTaxAmount.toFixed(2)}` : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
