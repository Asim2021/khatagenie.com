import React, { useState, useEffect } from 'react';
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
  Check
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import { FeatureGate } from '../components/FeatureGate';
import { FEATURE_FLAGS } from '@khatagenie/types';

export const InboxPage: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<string>('NEEDS_REVIEW');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    loadInvoices();
  }, [activeTab, searchQuery]);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      let statusParam = activeTab === 'ALL' ? '' : `&status=${activeTab}`;
      let searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      
      const res = await fetchApi<{ invoices: any[]; counts: Record<string, number> }>(
        `/invoices?limit=50${statusParam}${searchParam}`
      );
      setInvoices(res.invoices || []);
      setCounts(res.counts || {});
    } catch (err) {
      console.warn('Using mock sample data for offline preview:', err);
      // Realistic Delhi CA mock invoices
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
          client: null, // Unassigned WhatsApp sender
        },
      ];
      setInvoices(mockData);
      setCounts({ NEEDS_REVIEW: 2, APPROVED: 1, EXPORTED: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(invoices.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await fetchApi('/invoices/upload', {
        method: 'POST',
        body: formData,
      });
      loadInvoices();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Needs CA Review</p>
              <h3 className="text-2xl font-bold text-amber-400 font-mono mt-1">
                {counts.NEEDS_REVIEW || 0}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            AI Extracted • Ready for 1-click review
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Approved Invoices</p>
              <h3 className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                {counts.APPROVED || 0}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">Ready for Tally XML export</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">WhatsApp Ingested</p>
              <h3 className="text-2xl font-bold text-sky-400 font-mono mt-1">
                {invoices.length}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 font-mono text-[10px]">Meta Graph API v19.0</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Exported to Tally</p>
              <h3 className="text-2xl font-bold text-indigo-400 font-mono mt-1">
                {counts.EXPORTED || 0}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Download className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">Vouchers synchronized</p>
        </div>
      </div>

      {/* Main Inbox Header with Search & Direct Upload */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          {[
            { id: 'NEEDS_REVIEW', label: 'Needs Review' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'ALL', label: 'All Invoices' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vendor, GSTIN, bill #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 w-64"
            />
          </div>

          <FeatureGate flag={FEATURE_FLAGS.DIRECT_UPLOAD}>
            <label className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-emerald-500/20">
              <UploadCloud className="w-4 h-4 stroke-[2.5]" />
              <span>{isUploading ? 'Extracting...' : 'Upload Bill'}</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleDirectUpload}
                disabled={isUploading}
              />
            </label>
          </FeatureGate>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length > 0 && selectedIds.length === invoices.length}
                    className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                </th>
                <th className="py-4 px-3">MSME Client</th>
                <th className="py-4 px-3">Supplier Name & GSTIN</th>
                <th className="py-4 px-3">Bill Number</th>
                <th className="py-4 px-3">Date</th>
                <th className="py-4 px-3 text-right">Taxable</th>
                <th className="py-4 px-3 text-right">Taxes</th>
                <th className="py-4 px-3 text-right">Total (₹)</th>
                <th className="py-4 px-3 text-center">Math Check</th>
                <th className="py-4 px-3 text-center">Status</th>
                <th className="py-4 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-slate-500">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-16">
                    <FileText className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                    <p className="text-slate-400 font-medium">No invoices found in this filter</p>
                    <p className="text-slate-500 text-[11px] mt-1">
                      MSME clients can snap & send bills to your WhatsApp bot number to start auto-extracting.
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isSelected = selectedIds.includes(inv.id);
                  const taxes = Number(inv.cgstAmount || 0) + Number(inv.sgstAmount || 0) + Number(inv.igstAmount || 0);

                  return (
                    <tr
                      key={inv.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(inv.id)}
                          className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                        />
                      </td>

                      {/* Client */}
                      <td className="py-4 px-3">
                        {inv.client ? (
                          <div>
                            <span className="font-semibold text-slate-200 flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {inv.client.businessName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              +{inv.senderPhone}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-amber-400 font-medium text-[11px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                              Unmapped WhatsApp
                            </span>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              +{inv.senderPhone}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Supplier */}
                      <td className="py-4 px-3">
                        <p className="font-medium text-slate-200">{inv.supplierName || 'Unknown Vendor'}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {inv.supplierGstin || 'No GSTIN'}
                        </p>
                      </td>

                      {/* Bill No */}
                      <td className="py-4 px-3 font-mono font-medium text-slate-300">
                        {inv.invoiceNumber || '—'}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-3 text-slate-400 font-mono text-[11px]">
                        {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN') : '—'}
                      </td>

                      {/* Taxable */}
                      <td className="py-4 px-3 text-right font-mono text-slate-300">
                        ₹{Number(inv.taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Taxes */}
                      <td className="py-4 px-3 text-right font-mono text-slate-400">
                        ₹{taxes.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Total */}
                      <td className="py-4 px-3 text-right font-mono font-bold text-slate-100">
                        ₹{Number(inv.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Math Check */}
                      <td className="py-4 px-3 text-center">
                        {inv.isMathValid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" />
                            Balanced
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            Mismatch
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-3 text-center">
                        <span
                          className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                            inv.status === 'APPROVED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : inv.status === 'NEEDS_REVIEW'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {inv.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Review Action */}
                      <td className="py-4 px-4 text-right">
                        <Link
                          to={`/invoices/${inv.id}/review`}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-slate-950 text-slate-200 font-semibold text-xs transition-all border border-slate-700 hover:border-emerald-500"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3.5 h-3.5" />
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
