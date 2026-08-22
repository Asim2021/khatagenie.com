import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileCode, 
  FileSpreadsheet, 
  Info
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Download className="w-5 h-5 text-emerald-400" />
          Export Center (Tally Prime & Tax Registers)
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Export approved invoices directly into Tally Prime XML accounting vouchers or standard GSTR-2 Excel purchase registers.
        </p>
      </div>

      {/* Filter by MSME Client */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl max-w-xl space-y-3">
        <label className="block text-xs font-semibold text-slate-300">
          Filter by Specific MSME Client
        </label>
        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
        >
          <option value="">-- All Clients (Consolidated Export) --</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.businessName} (GSTIN: {c.gstin || 'N/A'})
            </option>
          ))}
        </select>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tally Prime XML Export Card */}
        <FeatureGate flag={FEATURE_FLAGS.TALLY_XML_EXPORT}>
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <FileCode className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Tally Prime XML Accounting Vouchers</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generates a clean <code className="text-amber-400">&lt;ENVELOPE&gt;</code> XML file formatted for Tally Prime purchase vouchers. Correctly debits purchase ledgers and credits supplier accounts with CGST/SGST/IGST tax heads.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-amber-400" />
                  How to Import in Tally Prime:
                </p>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-400 pl-1">
                  <li>Open company in Tally Prime</li>
                  <li>Press <kbd className="bg-slate-800 px-1 rounded font-mono">Alt + O</kbd> (Import) &rarr; Select <strong>Transactions</strong></li>
                  <li>Choose the downloaded XML file & press <strong>Enter</strong></li>
                </ol>
              </div>
            </div>

            <button
              onClick={handleExportTally}
              disabled={isExportingTally}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>{isExportingTally ? 'Generating XML...' : 'Download Tally Prime XML'}</span>
            </button>
          </div>
        </FeatureGate>

        {/* Excel GSTR-2 Purchase Register Card */}
        <FeatureGate flag={FEATURE_FLAGS.EXCEL_EXPORT}>
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Excel GSTR-2 Purchase Register</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Exports all verified purchase bills into a standardized, beautifully-formatted Excel workbook (.xlsx) ready for GST return filing, audit trails, and reconciliation against GSTR-2B.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Columns Included:</p>
                <p className="text-slate-500 font-mono text-[10px]">
                  Client Name, Supplier GSTIN, Invoice No, Invoice Date, Taxable, CGST, SGST, IGST, Round Off, Grand Total, RCM
                </p>
              </div>
            </div>

            <button
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>{isExportingExcel ? 'Exporting Excel...' : 'Download Excel Register (.xlsx)'}</span>
            </button>
          </div>
        </FeatureGate>
      </div>
    </div>
  );
};
