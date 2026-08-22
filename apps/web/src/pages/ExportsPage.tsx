import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileCode, 
  FileSpreadsheet, 
  CheckCircle2,
  Building2
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import { FeatureGate } from '../components/FeatureGate';
import { FEATURE_FLAGS } from '@khatagenie/types';
import { useToast } from '../context/ToastContext';

export const ExportsPage: React.FC = () => {
  const { showToast } = useToast();
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isExportingTally, setIsExportingTally] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  useEffect(() => {
    fetchApi<any[]>('/clients')
      .then((data) => setClients(data || []))
      .catch(() => {});
  }, []);

  const handleExportTally = async () => {
    setIsExportingTally(true);
    try {
      const clientParam = selectedClientId ? `?clientId=${selectedClientId}` : '';
      const blob = await fetchApi<Blob>(`/exports/tally${clientParam}`);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tally_vouchers_${Date.now()}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('Tally Prime XML vouchers exported successfully!', 'success');
    } catch (err: any) {
      showToast(`Tally export failed: ${err.message}`, 'error');
    } finally {
      setIsExportingTally(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const clientParam = selectedClientId ? `?clientId=${selectedClientId}` : '';
      const blob = await fetchApi<Blob>(`/exports/excel${clientParam}`);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gstr2_purchase_register_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('GSTR-2 Purchase Register Excel exported successfully!', 'success');
    } catch (err: any) {
      showToast(`Excel export failed: ${err.message}`, 'error');
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 safe-pb overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <Download className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Export Center (Tally Prime & Tax Registers)</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Export approved invoices directly into Tally Prime XML accounting vouchers or standard GSTR-2 Excel purchase registers.
        </p>
      </div>

      {/* Filter by MSME Client */}
      <div className="rounded-2xl p-1 bg-slate-200/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 max-w-xl shadow-sm">
        <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Filter by Specific MSME Client</span>
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="">-- All Clients (Consolidated Export) --</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.businessName} (GSTIN: {c.gstin || 'N/A'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Export Format Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Tally Prime XML Card */}
        <FeatureGate flag={FEATURE_FLAGS.TALLY_XML_EXPORT}>
          <div className="rounded-2xl p-1 bg-slate-200/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-xl transition-all duration-300 flex flex-col justify-between hover:border-emerald-500/40">
            <div className="rounded-xl bg-white dark:bg-slate-900 p-5 sm:p-6 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow space-y-5 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <FileCode className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                    <span>Tally Prime XML Vouchers</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      VOUCHER XML
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Generates full Tally XML purchase vouchers with ledger allocations (Party A/c, Purchase Ledger, Input CGST, SGST, IGST, Round Off). Ready for <code>Import Data &rarr; Vouchers</code> in Tally Prime 3.0+.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Auto-creates Party Ledgers if missing
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> High-precision debit/credit balance
                  </div>
                </div>
              </div>

              <button
                onClick={handleExportTally}
                disabled={isExportingTally}
                className="btn-primary w-full space-x-2 py-3 mt-4"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>{isExportingTally ? 'Generating Tally XML...' : 'Download Tally Prime XML'}</span>
              </button>
            </div>
          </div>
        </FeatureGate>

        {/* Excel Purchase Register Card */}
        <FeatureGate flag={FEATURE_FLAGS.EXCEL_EXPORT}>
          <div className="rounded-2xl p-1 bg-slate-200/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-xl transition-all duration-300 flex flex-col justify-between hover:border-sky-500/40">
            <div className="rounded-xl bg-white dark:bg-slate-900 p-5 sm:p-6 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow space-y-5 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                    <span>GSTR-2 Purchase Register Excel</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
                      .XLSX
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Standard Indian GST format purchase register spreadsheet with distinct columns for GSTIN, Invoice #, Date, Taxable Value, CGST, SGST, IGST, and Total Amount.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Formatted header and cell numbers
                  </div>
                  <div className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> GSTR-3B & GSTR-2B reconciliation ready
                  </div>
                </div>
              </div>

              <button
                onClick={handleExportExcel}
                disabled={isExportingExcel}
                className="btn-sky w-full space-x-2 py-3 mt-4"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>{isExportingExcel ? 'Building Spreadsheet...' : 'Download GSTR-2 Excel Register'}</span>
              </button>
            </div>
          </div>
        </FeatureGate>
      </div>
    </div>
  );
};
