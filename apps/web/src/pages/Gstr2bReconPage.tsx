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
import { Gstr2bMatchStatus, ReconciliationSummary } from '@khatagenie/types';
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
        showToast(
          `GSTR-2B Reconciled! Processed ${res.totalGstr2bRecords} portal records against ${res.totalBooksRecords} books entries.`,
          'success'
        );
      } catch (err: any) {
        showToast(`Reconciliation failed: ${err.message || 'Please upload a valid GST Portal JSON file.'}`, 'error');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const filteredItems = summary?.items.filter((item) => {
    if (filterStatus === 'ALL') return true;
    return item.matchStatus === filterStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 safe-pb">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <ArrowRightLeft className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>GSTR-2B 2-Way ITC Reconciliation</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Automated 2-way comparison between digitized WhatsApp accounting books and GST Portal GSTR-2B filing returns.
          </p>
        </div>

        {/* Upload Portal JSON Button */}
        <div className="flex items-center space-x-3">
          <label className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer">
            <UploadCloud className="w-4 h-4 stroke-[2.5]" />
            <span>Upload GSTR-2B JSON</span>
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isLoading}
            />
          </label>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-lg transition-all">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Matched Invoices
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {summary.matchedCount}
              </span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
              ITC 100% Eligible under Section 16(2)(aa)
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-lg transition-all">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Missing in Books
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {summary.missingInBooksCount}
              </span>
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
              Filed on Portal, but missing in WhatsApp scans
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-lg transition-all">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Missing in GSTR-2B
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                {summary.missingInGstr2bCount}
              </span>
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
              Supplier pending GSTR-1 filing
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-lg transition-all">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Books ITC
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
                ₹{summary.totalItcAvailableBooks.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
              Period: {summary.period}
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center mr-1">
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
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterStatus === tab.id
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-300 dark:border-slate-700 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reconciliation Comparison Table */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Status & Score</th>
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
                    <span>Reconciling GSTR-2B records...</span>
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
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full border ${
                          item.matchStatus === Gstr2bMatchStatus.MATCHED
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                            : item.matchStatus === Gstr2bMatchStatus.MISSING_IN_BOOKS
                            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
                            : item.matchStatus === Gstr2bMatchStatus.MISSING_IN_GSTR2B
                            ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                            : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'
                        }`}
                      >
                        {item.matchStatus}
                      </span>
                    </td>

                    {/* Books Entry */}
                    <td className="py-3.5 px-4">
                      {item.booksSupplierName ? (
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-200">
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
                          <p className="font-semibold text-slate-900 dark:text-slate-200">
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
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        ₹{(item.gstr2bTaxAmount || item.booksTaxAmount || 0).toFixed(2)}
                      </p>
                      {typeof item.taxVariance === 'number' && item.taxVariance > 0 && (
                        <p className="text-[10px] text-rose-500">Δ ₹{item.taxVariance.toFixed(2)}</p>
                      )}
                    </td>

                    {/* ITC Eligibility */}
                    <td className="py-3.5 px-4">
                      {item.matchStatus === Gstr2bMatchStatus.MATCHED ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 100% Eligible
                        </span>
                      ) : item.matchStatus === Gstr2bMatchStatus.MISSING_IN_GSTR2B ? (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold text-xs flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Ineligible (Rule 36(4))
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold text-xs flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5" /> Action Required
                        </span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 text-[11px] max-w-xs">
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
