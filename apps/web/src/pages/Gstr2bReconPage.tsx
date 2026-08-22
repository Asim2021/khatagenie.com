import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  UploadCloud, 
  ArrowRightLeft,
  Sparkles,
  ShieldAlert,
  Filter,
  Loader2
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import { FeatureGate } from '../components/FeatureGate';
import { FEATURE_FLAGS, Gstr2bMatchStatus, ReconciliationSummary } from '@khatagenie/types';
import { useToast } from '../context/ToastContext';


export const Gstr2bReconPage: React.FC = () => {
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const { showToast } = useToast();

  useEffect(() => {
    loadSampleReconciliation();
  }, []);

  const loadSampleReconciliation = async () => {
    setIsLoading(true);
    try {
      const res = await fetchApi<ReconciliationSummary>('/reconciliation/sample');
      setSummary(res);
    } catch (err: any) {
      console.warn('Reconciliation sample load fallback:', err);
      // Client-side fallback mock if server not running with DB
      setSummary({
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
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setIsLoading(true);
        const res = await fetchApi<ReconciliationSummary>('/reconciliation/process', {
          method: 'POST',
          body: JSON.stringify(json),
        });
        setSummary(res);
        showToast({
          type: 'success',
          title: 'GSTR-2B Reconciled',
          message: `Processed ${res.totalGstr2bRecords} portal records against ${res.totalBooksRecords} books entries.`,
        });
      } catch (err: any) {
        showToast({
          type: 'error',
          title: 'Invalid JSON File',
          message: err.message || 'Please upload a valid GST Portal GSTR-2B JSON file.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const filteredItems = summary?.items.filter((item) => {
    if (filterStatus === 'ALL') return true;
    return item.matchStatus === filterStatus;
  }) || [];

  return (
    <FeatureGate
      flag={FEATURE_FLAGS.GSTR2B_RECONCILIATION}
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">GSTR-2B Reconciliation Gated</h2>
          <p className="text-slate-400 mt-2 max-w-md mx-auto text-sm">
            Automated 2-Way GSTR-2B ITC Matching is an Enterprise & Pro feature. Enable it in Superadmin Feature Flags.
          </p>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                Rule 36(4) Compliant
              </span>
              <span className="text-xs text-slate-500">Period: August 2026</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">GSTR-2B vs Books 2-Way ITC Reconciliation</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Cross-verify client WhatsApp bills against GST portal supplier filings to guarantee 100% accurate Input Tax Credit.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <label className="cursor-pointer inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm px-4 py-2 rounded-xl shadow-lg shadow-emerald-900/30 transition-all">
              <UploadCloud className="w-4 h-4" />
              <span>Upload GSTR-2B JSON</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              onClick={loadSampleReconciliation}
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-sm px-3.5 py-2 rounded-xl border border-slate-700 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-400" />
              )}
              <span>{isLoading ? 'Reconciling...' : 'Reload Demo'}</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 my-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Matched ITC</p>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-2xl font-bold text-emerald-400">{summary.matchedCount}</span>
                <span className="text-xs text-emerald-500/80">Invoices</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">100% Eligible to Claim</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tax Mismatches</p>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-2xl font-bold text-amber-400">{summary.taxMismatchCount}</span>
                <span className="text-xs text-amber-500/80">Needs Review</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Variance &gt; ₹2.00</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Missing in Books</p>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-2xl font-bold text-purple-400">{summary.missingInBooksCount}</span>
                <span className="text-xs text-purple-500/80">Unclaimed</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Filed by Supplier in GSTR-1</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Missing in GSTR-2B</p>
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-2xl font-bold text-rose-400">{summary.missingInGstr2bCount}</span>
                <span className="text-xs text-rose-500/80">Supplier Default</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Rule 36(4) ITC Restricted</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm col-span-2 lg:col-span-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Claimable ITC</p>
              <div className="flex items-baseline space-x-1 mt-2">
                <span className="text-xl font-bold text-white">₹{summary.totalItcAvailableGstr2b.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <p className="text-[11px] text-emerald-400 mt-1">Matched 2B Balance</p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-2">
          <span className="text-xs text-slate-400 flex items-center mr-2">
            <Filter className="w-3.5 h-3.5 mr-1" /> Filter:
          </span>
          {[
            { key: 'ALL', label: 'All Records' },
            { key: Gstr2bMatchStatus.MATCHED, label: 'Matched' },
            { key: Gstr2bMatchStatus.TAX_MISMATCH, label: 'Tax Mismatch' },
            { key: Gstr2bMatchStatus.MISSING_IN_BOOKS, label: 'Missing in Books' },
            { key: Gstr2bMatchStatus.MISSING_IN_GSTR2B, label: 'Missing in 2B' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === tab.key
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Reconciliation Comparison Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Match Status</th>
                  <th className="py-3 px-4">Supplier & GSTIN</th>
                  <th className="py-3 px-4">Invoice No & Date</th>
                  <th className="py-3 px-4 text-right">Books Tax (₹)</th>
                  <th className="py-3 px-4 text-right">GSTR-2B Tax (₹)</th>
                  <th className="py-3 px-4 text-right">Variance</th>
                  <th className="py-3 px-4">Audit Action / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.matchStatus === Gstr2bMatchStatus.MATCHED && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Matched
                        </span>
                      )}
                      {item.matchStatus === Gstr2bMatchStatus.TAX_MISMATCH && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Tax Mismatch
                        </span>
                      )}
                      {item.matchStatus === Gstr2bMatchStatus.MISSING_IN_BOOKS && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <ArrowRightLeft className="w-3 h-3 mr-1" /> Missing in Books
                        </span>
                      )}
                      {item.matchStatus === Gstr2bMatchStatus.MISSING_IN_GSTR2B && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <HelpCircle className="w-3 h-3 mr-1" /> Missing in 2B
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white truncate max-w-xs">
                        {item.booksSupplierName || item.gstr2bSupplierName || 'Unknown Vendor'}
                      </p>
                      <p className="text-[11px] font-mono text-slate-400">
                        {item.booksSupplierGstin || item.gstr2bSupplierGstin}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <p className="text-white">{item.booksInvoiceNumber || item.gstr2bInvoiceNumber}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.booksInvoiceDate || item.gstr2bInvoiceDate}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-200">
                      {item.booksTaxAmount !== undefined ? `₹${item.booksTaxAmount.toFixed(2)}` : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-medium text-emerald-400">
                      {item.gstr2bTaxAmount !== undefined ? `₹${item.gstr2bTaxAmount.toFixed(2)}` : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono">
                      {item.taxVariance !== undefined && item.taxVariance > 0 ? (
                        <span className="text-amber-400 font-semibold">+₹{item.taxVariance.toFixed(2)}</span>
                      ) : (
                        <span className="text-slate-500">₹0.00</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {item.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </FeatureGate>
  );
};
