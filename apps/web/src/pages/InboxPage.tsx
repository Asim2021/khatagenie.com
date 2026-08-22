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
  Check
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { FeatureGate } from '../components/FeatureGate';
import { FEATURE_FLAGS } from '@khatagenie/types';
import { useToast } from '../context/ToastContext';

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 safe-pb">
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl relative overflow-hidden shadow-sm dark:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Needs CA Review
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono mt-1">
                {counts.NEEDS_REVIEW || 0}
              </h3>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-2 sm:mt-3 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
            AI Extracted • Ready for 1-click review
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl relative overflow-hidden shadow-sm dark:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Approved Invoices
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {counts.APPROVED || 0}
              </h3>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-2 sm:mt-3">
            Ready for Tally XML export
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl relative overflow-hidden shadow-sm dark:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                WhatsApp Ingested
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-sky-600 dark:text-sky-400 font-mono mt-1">
                {invoices.length}
              </h3>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-2 sm:mt-3 font-mono">
            Meta Graph API v19.0
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl relative overflow-hidden shadow-sm dark:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Exported to Tally
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                {counts.EXPORTED || 0}
              </h3>
            </div>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Download className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-2 sm:mt-3">
            Vouchers synchronized
          </p>
        </div>
      </div>

      {/* Main Inbox Filter & Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 bg-slate-200/70 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-300 dark:border-slate-800 overflow-x-auto">
          {[
            { id: 'NEEDS_REVIEW', label: 'Needs Review', count: counts.NEEDS_REVIEW },
            { id: 'APPROVED', label: 'Approved', count: counts.APPROVED },
            { id: 'ALL', label: 'All Invoices' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Direct Upload */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vendor, GSTIN, bill #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors shadow-sm dark:shadow-none"
            />
          </div>

          <FeatureGate flag={FEATURE_FLAGS.DIRECT_UPLOAD}>
            <label className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-emerald-500/20 shrink-0">
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

      {/* Invoices List / Table Container */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl transition-all">
        {/* Desktop Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="p-3 sm:p-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length > 0 && selectedIds.length === invoices.length}
                    className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-500 focus:ring-0"
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
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      No Invoices in this view
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Send bill photos or PDF receipts to your WhatsApp Bot, or use the Direct Upload button above.
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      selectedIds.includes(inv.id) ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    <td className="p-3 sm:p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(inv.id)}
                        onChange={() => handleSelectOne(inv.id)}
                        className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-500 focus:ring-0"
                      />
                    </td>

                    {/* Client */}
                    <td className="py-3 sm:py-4 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
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
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                        {inv.supplierName || 'Extracting...'}
                      </div>
                      <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {inv.supplierGstin || 'No GSTIN Detected'}
                      </p>
                    </td>

                    {/* Invoice # & Date */}
                    <td className="py-3 sm:py-4 px-3 font-mono">
                      <div className="text-slate-800 dark:text-slate-200 font-medium">
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
                    <td className="py-3 sm:py-4 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      ₹{(inv.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Math Parity */}
                    <td className="py-3 sm:py-4 px-3">
                      {inv.isMathValid ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" />
                          Balanced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          Check Taxes
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 sm:py-4 px-3">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full border ${
                          inv.status === 'APPROVED'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                            : inv.status === 'EXPORTED'
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'
                            : inv.status === 'REJECTED'
                            ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                            : 'bg-amber-50 dark:bg-slate-800 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-slate-700'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 sm:py-4 px-3 text-right">
                      <Link
                        to={`/invoices/${inv.id}/review`}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all border border-slate-300 dark:border-slate-700 hover:border-emerald-600 shadow-sm"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
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
