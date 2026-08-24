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
  Trash2,
  Loader2,
  RefreshCw,
  XCircle,
  TrendingUp
} from '../components/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { FeatureGate } from '../components/FeatureGate';
import { FEATURE_FLAGS } from '@khatagenie/types';
import { useToast } from '../context/ToastContext';
import { getStateFromGstin } from '@khatagenie/shared';
import { UploadModal } from '../components/UploadModal';
import { RejectReasonModal } from '../components/RejectReasonModal';

export const InboxPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('NEEDS_REVIEW');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isBulkRejectModalOpen, setIsBulkRejectModalOpen] = useState<boolean>(false);
  const [isWorkflowGuideOpen, setIsWorkflowGuideOpen] = useState<boolean>(true);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // 1. TanStack Query for Cached Invoices & Counts with Smart Polling on Processing status
  const { data, isLoading } = useQuery<{ invoices: any[]; counts: Record<string, number>; total?: number }>({
    queryKey: ['invoices', activeTab, searchQuery],
    queryFn: async () => {
      const statusParam = activeTab === 'ALL' ? '' : `&status=${activeTab}`;
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      return await fetchApi<{ invoices: any[]; counts: Record<string, number>; total?: number }>(
        `/invoices?limit=50${statusParam}${searchParam}`
      );
    },
    refetchInterval: (query) => {
      const hasProcessing = query.state.data?.invoices?.some(
        (inv: any) => inv.status === 'PROCESSING'
      );
      return hasProcessing ? 2500 : false;
    },
  });

  const invoices = data?.invoices || [];
  const counts = data?.counts || {};

  // 2. Fetch MSME Clients for Client Gating & Association
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await fetchApi<any[]>('/clients');
      return res || [];
    },
  });

  // 3. Single Invoice Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return await fetchApi(`/invoices/${invoiceId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: (_, deletedId) => {
      setSelectedIds((prev) => prev.filter((id) => id !== deletedId));
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation'] });
      showToast('Invoice deleted successfully.', 'info');
    },
    onError: (err: any) => {
      showToast(`Delete failed: ${err.message}`, 'error');
    },
  });

  // 4. Bulk Delete Mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return await fetchApi<{ message: string; count: number }>('/invoices/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ invoiceIds: ids }),
      });
    },
    onSuccess: (res) => {
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation'] });
      showToast(res.message || 'Selected invoices deleted successfully.', 'info');
    },
    onError: (err: any) => {
      showToast(`Bulk delete failed: ${err.message}`, 'error');
    },
  });

  // 5. Bulk Status Mutation (Approve / Reject)
  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status, rejectionReason }: { ids: string[]; status: string; rejectionReason?: string }) => {
      return await fetchApi<{ message: string; count: number }>('/invoices/bulk-status', {
        method: 'POST',
        body: JSON.stringify({ invoiceIds: ids, status, rejectionReason }),
      });
    },
    onSuccess: (res, vars) => {
      setSelectedIds([]);
      setIsBulkRejectModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation'] });
      showToast(
        vars.status === 'APPROVED'
          ? `Successfully approved ${res.count} invoice(s)!`
          : `Marked ${res.count} invoice(s) as rejected.`,
        vars.status === 'APPROVED' ? 'success' : 'info'
      );
    },
    onError: (err: any) => {
      showToast(`Bulk status update failed: ${err.message}`, 'error');
    },
  });

  // 6. Retry OCR Mutation
  const retryOcrMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      return await fetchApi(`/invoices/${invoiceId}/retry-ocr`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      showToast('AI OCR extraction re-queued with Gemini Flash!', 'info');
    },
    onError: (err: any) => {
      showToast(`Failed to retry OCR: ${err.message}`, 'error');
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

  const handleDeleteSingle = (id: string, invoiceNum?: string) => {
    const name = invoiceNum ? `bill #${invoiceNum}` : 'this invoice';
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (
      window.confirm(
        `Are you sure you want to delete all ${selectedIds.length} selected invoices? This action cannot be undone.`
      )
    ) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    bulkStatusMutation.mutate({ ids: selectedIds, status: 'APPROVED' });
  };

  const handleBulkReject = () => {
    if (selectedIds.length === 0) return;
    setIsBulkRejectModalOpen(true);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/30 animate-pulse">
            <Loader2 className="w-3 h-3 text-sky-500 animate-spin" />
            Extracting OCR...
          </span>
        );
      case 'EXTRACTION_FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3 text-rose-500" />
            OCR Failed
          </span>
        );
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
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3 text-amber-500" />
            Needs Review
          </span>
        );
    }
  };

  const reviewTabCount = counts.NEEDS_REVIEW_TOTAL !== undefined ? counts.NEEDS_REVIEW_TOTAL : (counts.NEEDS_REVIEW || 0);

  return (
    <div className="page-container">
      {/* 5-Step Workflow Onboarding Banner */}
      {isWorkflowGuideOpen && (
        <div className="rounded-2xl p-1 bg-slate-200/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm animate-in fade-in duration-300">
          <div className="rounded-xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    KhataGenie End-to-End CA Workflow
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Follow the standard 5-step operational lifecycle for paperless GST compliance.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWorkflowGuideOpen(false)}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Dismiss
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-3">
              {/* Step 1 */}
              <Link
                to="/clients"
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 transition-all group"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mb-1">
                  <span>STEP 1</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                  1. Register Client
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Add MSME trade name, GSTIN & WhatsApp phone number.
                </p>
              </Link>

              {/* Step 2 */}
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 transition-all text-left group"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-sky-600 dark:text-sky-400 font-bold mb-1">
                  <span>STEP 2</span>
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 transition-colors">
                  2. Ingest Bills
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Direct file upload or automated WhatsApp bot receipt.
                </p>
              </button>

              {/* Step 3 */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold mb-1">
                  <span>STEP 3</span>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  3. AI Review
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Gemini OCR extraction, tax math parity & 1-click approval.
                </p>
              </div>

              {/* Step 4 */}
              <Link
                to="/reconciliation"
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 hover:border-purple-500/40 transition-all group"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-purple-600 dark:text-purple-400 font-bold mb-1">
                  <span>STEP 4</span>
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                  4. GSTR-2B Recon
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Match digitized books with GST Portal JSON data.
                </p>
              </Link>

              {/* Step 5 */}
              <Link
                to="/exports"
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/40 transition-all group"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold mb-1">
                  <span>STEP 5</span>
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                  5. Tally Export
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  1-click Tally Prime XML vouchers & Excel GSTR-2 sheets.
                </p>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner & KPI Stat Cards with Double-Bezel Architecture */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* Needs Review Card */}
        <div className="rounded-2xl p-1 bg-slate-200/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all duration-300">
          <div className="rounded-xl bg-white dark:bg-slate-900/90 p-3 sm:p-4 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Needs Review
                </p>
                <h3 className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5 sm:mt-1">
                  {reviewTabCount}
                </h3>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 sm:mt-3 flex items-center gap-1 truncate">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">Gemini OCR • 1-click review</span>
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

        {/* Rejected Card */}
        <div className="rounded-2xl p-1 bg-slate-200/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all duration-300">
          <div className="rounded-xl bg-white dark:bg-slate-900/90 p-3 sm:p-4 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Rejected
                </p>
                <h3 className="text-lg sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5 sm:mt-1">
                  {counts.REJECTED || 0}
                </h3>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 sm:mt-3 truncate">
              Reason recorded in audit
            </p>
          </div>
        </div>

        {/* Total Invoices Card */}
        <div className="rounded-2xl p-1 bg-slate-200/50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all duration-300">
          <div className="rounded-xl bg-white dark:bg-slate-900/90 p-3 sm:p-4 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Digitized
                </p>
                <h3 className="text-lg sm:text-2xl font-black text-sky-600 dark:text-sky-400 font-mono mt-0.5 sm:mt-1">
                  {data?.total || invoices.length}
                </h3>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 sm:mt-3 font-mono truncate">
              Upload & WhatsApp
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
            { id: 'NEEDS_REVIEW', label: 'Needs Review', count: reviewTabCount },
            { id: 'APPROVED', label: 'Approved', count: counts.APPROVED },
            { id: 'REJECTED', label: 'Rejected', count: counts.REJECTED },
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

        {/* Search & Direct Upload Trigger */}
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
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="btn-primary space-x-2 shrink-0"
            >
              <UploadCloud className="w-4 h-4 stroke-[2.5]" />
              <span>Upload Bill</span>
            </button>
          </FeatureGate>
        </div>
      </div>

      {/* Selected Bulk Action Toolbar (When 1+ items checked) */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2.5 text-xs font-bold">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono">
              {selectedIds.length}
            </span>
            <span>Invoice(s) Selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Approve */}
            <FeatureGate flag={FEATURE_FLAGS.BULK_APPROVAL}>
              <button
                onClick={handleBulkApprove}
                disabled={bulkStatusMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve ({selectedIds.length})</span>
              </button>
            </FeatureGate>

            {/* Bulk Reject */}
            <button
              onClick={handleBulkReject}
              disabled={bulkStatusMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>

            {/* Bulk Delete */}
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            {/* Clear Selection */}
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 font-medium underline"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* MOBILE VIEW: Dedicated Interactive Double-Bezel Cards (md:hidden) */}
      <div className="block md:hidden space-y-3.5">
        {isLoading ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Loading invoices...</span>
            </div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <FileText className="w-10 h-10 mx-auto opacity-40 text-emerald-500" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Invoices in this view
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload bills using the button above or receive directly from your MSME clients on WhatsApp.
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="btn-primary space-x-1.5 text-xs mx-auto mt-2"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload First Bill</span>
            </button>
          </div>
        ) : (
          invoices.map((inv) => {
            const isSelected = selectedIds.includes(inv.id);
            const supplierState = inv.supplierGstin ? getStateFromGstin(inv.supplierGstin) : '';

            return (
              <div
                key={inv.id}
                className={`rounded-2xl p-1 transition-all duration-300 border ${
                  isSelected
                    ? 'bg-emerald-500/20 border-emerald-500/40 shadow-md'
                    : 'bg-slate-200/50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800/80 shadow-sm'
                }`}
              >
                <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow space-y-3">
                  {/* Top Row: Checkbox, Supplier & Status */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start space-x-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(inv.id)}
                        className="checkbox-custom mt-0.5 shrink-0"
                        aria-label={`Select invoice ${inv.invoiceNumber}`}
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {inv.supplierName || (inv.status === 'PROCESSING' ? 'AI Extracting...' : 'Pending Extraction')}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
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

                    <div className="shrink-0 flex items-center gap-1.5">
                      {renderStatusBadge(inv.status)}
                      <button
                        onClick={() => handleDeleteSingle(inv.id, inv.invoiceNumber)}
                        title="Delete invoice"
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                        {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN') : 'Today'}
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

                  {/* Rejection / Review Note Callout if Rejected */}
                  {inv.status === 'REJECTED' && (
                    <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-[11px] text-rose-800 dark:text-rose-300">
                      <div className="flex items-center gap-1 font-bold">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Rejection Reason:</span>
                      </div>
                      <p className="mt-0.5 ml-4.5 font-sans leading-tight">
                        {inv.rejectionReason || 'No specific reason entered.'}
                      </p>
                      {inv.reviewedBy && (
                        <p className="mt-1 ml-4.5 text-[10px] text-rose-600/80 dark:text-rose-400/80 font-mono">
                          By: {inv.reviewedBy.fullName}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 1-Tap Action Button */}
                  {inv.status === 'EXTRACTION_FAILED' ? (
                    <button
                      onClick={() => retryOcrMutation.mutate(inv.id)}
                      disabled={retryOcrMutation.isPending}
                      className="btn-secondary w-full justify-center py-2.5 text-xs text-rose-600 dark:text-rose-400 border-rose-200"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      <span>Retry AI OCR Extraction</span>
                    </button>
                  ) : (
                    <Link
                      to={`/invoices/${inv.id}/review`}
                      className="btn-primary w-full justify-between py-3 shadow-md"
                    >
                      <span>{inv.status === 'REJECTED' ? 'View / Re-evaluate Bill' : 'Open CA Review Studio'}</span>
                      <div className="w-6 h-6 rounded-full bg-black/15 dark:bg-black/20 flex items-center justify-center transition-colors">
                        <ArrowRight className="w-3.5 h-3.5 text-current" />
                      </div>
                    </Link>
                  )}
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
                    checked={invoices.length > 0 && selectedIds.length === invoices.length}
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
                <th className="py-3 sm:py-4 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>Loading invoices...</span>
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
                    <button
                      onClick={() => setIsUploadModalOpen(true)}
                      className="btn-primary space-x-1.5 text-xs mx-auto mt-2"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload First Bill</span>
                    </button>
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
                          {inv.supplierName || (inv.status === 'PROCESSING' ? 'AI Extracting...' : 'Pending Extraction')}
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
                          {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN') : 'Today'}
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

                      {/* Status + Rejection Reason Preview */}
                      <td className="py-3 sm:py-4 px-3">
                        <div className="space-y-1">
                          {renderStatusBadge(inv.status)}
                          {inv.status === 'REJECTED' && inv.rejectionReason && (
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 truncate max-w-[150px] font-sans" title={inv.rejectionReason}>
                              {inv.rejectionReason}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 sm:py-4 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.status === 'EXTRACTION_FAILED' ? (
                            <button
                              onClick={() => retryOcrMutation.mutate(inv.id)}
                              disabled={retryOcrMutation.isPending}
                              title="Retry AI OCR Extraction"
                              className="btn-action space-x-1 text-rose-600 hover:text-rose-700 border-rose-200"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Retry</span>
                            </button>
                          ) : (
                            <Link
                              to={`/invoices/${inv.id}/review`}
                              className="btn-action space-x-1.5"
                            >
                              <span>{inv.status === 'REJECTED' ? 'View' : 'Review'}</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                          )}
                          <button
                            onClick={() => handleDeleteSingle(inv.id, inv.invoiceNumber)}
                            disabled={deleteMutation.isPending}
                            title="Delete Invoice"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Invoice Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        clients={clients}
      />

      {/* Bulk Reject Reason Modal */}
      <RejectReasonModal
        isOpen={isBulkRejectModalOpen}
        onClose={() => setIsBulkRejectModalOpen(false)}
        onConfirm={(reason) => {
          bulkStatusMutation.mutate({ ids: selectedIds, status: 'REJECTED', rejectionReason: reason });
        }}
        title={`Reject ${selectedIds.length} Selected Invoice(s)`}
        isPending={bulkStatusMutation.isPending}
      />
    </div>
  );
};
