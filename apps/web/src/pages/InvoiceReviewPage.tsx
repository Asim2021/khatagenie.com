import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  Check, 
  AlertTriangle, 
  Building2, 
  Hash,
  Image as ImageIcon,
  FileSpreadsheet,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle
} from '../components/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ImageViewer } from '../components/ImageViewer';
import { fetchApi } from '../lib/api';
import { validateGstin, getStateFromGstin, verifyInvoiceMath } from '@khatagenie/shared';
import { InvoiceStatus } from '@khatagenie/types';
import { useToast } from '../context/ToastContext';

export const InvoiceReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [mobileActiveView, setMobileActiveView] = useState<'scan' | 'form'>('form');

  // Form State
  const [supplierName, setSupplierName] = useState<string>('');
  const [supplierGstin, setSupplierGstin] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>('');
  const [invoiceType, setInvoiceType] = useState<string>('B2B_TAX_INVOICE');
  const [clientId, setClientId] = useState<string>('');
  const [taxableAmount, setTaxableAmount] = useState<number>(0);
  const [cgstAmount, setCgstAmount] = useState<number>(0);
  const [sgstAmount, setSgstAmount] = useState<number>(0);
  const [igstAmount, setIgstAmount] = useState<number>(0);
  const [roundOffAmount, setRoundOffAmount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [lineItems, setLineItems] = useState<any[]>([]);

  // 1. TanStack Query for Invoice Data (with smart polling if processing)
  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      return await fetchApi<any>(`/invoices/${id}`);
    },
    enabled: !!id,
    refetchInterval: (query) => (query.state.data?.status === 'PROCESSING' ? 2000 : false),
  });

  // 2. TanStack Query for MSME Clients
  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        const data = await fetchApi<any[]>('/clients');
        return data || [];
      } catch {
        return [];
      }
    },
  });

  // Populate local form state when query data loads
  useEffect(() => {
    if (invoice) {
      setSupplierName(invoice.supplierName || '');
      setSupplierGstin(invoice.supplierGstin || '');
      setInvoiceNumber(invoice.invoiceNumber || '');
      setInvoiceDate(invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : '');
      setInvoiceType(invoice.invoiceType || 'B2B_TAX_INVOICE');
      setClientId(invoice.clientId || '');
      setTaxableAmount(Number(invoice.taxableAmount || 0));
      setCgstAmount(Number(invoice.cgstAmount || 0));
      setSgstAmount(Number(invoice.sgstAmount || 0));
      setIgstAmount(Number(invoice.igstAmount || 0));
      setRoundOffAmount(Number(invoice.roundOffAmount || 0));
      setTotalAmount(Number(invoice.totalAmount || 0));
      setReviewNotes(invoice.reviewNotes || '');
      setLineItems(invoice.lineItems || []);
    }
  }, [invoice]);

  // Live Math Parity Check
  const mathCheck = verifyInvoiceMath({
    taxableAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    roundOffAmount,
    totalAmount,
  });

  const isGstinValid = validateGstin(supplierGstin);
  const supplierState = getStateFromGstin(supplierGstin);

  // 3. Save / Approve Mutation
  const saveMutation = useMutation({
    mutationFn: async (status: InvoiceStatus) => {
      return await fetchApi(`/invoices/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          supplierName,
          supplierGstin,
          invoiceNumber,
          invoiceDate: invoiceDate ? new Date(invoiceDate).toISOString() : undefined,
          invoiceType,
          clientId: clientId || null,
          taxableAmount,
          cgstAmount,
          sgstAmount,
          igstAmount,
          roundOffAmount,
          totalAmount,
          status,
          reviewNotes,
          lineItems,
        }),
      });
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });

      showToast(
        status === InvoiceStatus.APPROVED
          ? 'Invoice verified, approved & queued for Tally export!'
          : 'Invoice marked as rejected.',
        status === InvoiceStatus.APPROVED ? 'success' : 'info'
      );

      navigate('/');
    },
    onError: (err: any) => {
      showToast(`Save failed: ${err.message}`, 'error');
    },
  });

  // 4. Delete Invoice Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await fetchApi(`/invoices/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation'] });
      showToast('Invoice deleted successfully.', 'info');
      navigate('/');
    },
    onError: (err: any) => {
      showToast(`Delete failed: ${err.message}`, 'error');
    },
  });

  // 5. Retry OCR Mutation
  const retryOcrMutation = useMutation({
    mutationFn: async () => {
      return await fetchApi(`/invoices/${id}/retry-ocr`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      showToast('AI OCR extraction re-queued with Gemini Flash!', 'info');
    },
    onError: (err: any) => {
      showToast(`Retry failed: ${err.message}`, 'error');
    },
  });

  // Keyboard Shortcuts (Cmd/Ctrl + Enter to Approve)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        saveMutation.mutate(InvoiceStatus.APPROVED);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [supplierName, supplierGstin, taxableAmount, cgstAmount, sgstAmount, igstAmount, totalAmount, clientId, saveMutation]);

  const handleApprove = () => saveMutation.mutate(InvoiceStatus.APPROVED);
  const handleReject = () => saveMutation.mutate(InvoiceStatus.REJECTED);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to permanently delete this invoice? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs font-medium">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Loading invoice scan & structured data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-150">
      {/* Top Header Bar with Breadcrumb, Mobile Switcher & Quick Actions */}
      <div className="px-3 sm:px-6 py-2.5 sm:py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 z-10 shrink-0 shadow-sm">
        <div className="flex items-center space-x-2.5 sm:space-x-4 min-w-0">
          <Link
            to="/"
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 sm:gap-2 flex-wrap truncate">
              <span>Review:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 truncate max-w-[120px] sm:max-w-none">
                {invoiceNumber || 'Untitled Bill'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                +{invoice?.senderPhone}
              </span>
            </h2>
          </div>
        </div>

        {/* Mobile View Toggle Switch (Hidden on Desktop) */}
        <div className="flex lg:hidden items-center p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-xl border border-slate-300 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setMobileActiveView('scan')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              mobileActiveView === 'scan'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Scan</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileActiveView('form')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              mobileActiveView === 'form'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Form</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 ml-auto">
          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            title="Delete this invoice"
            className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Reject */}
          <button
            onClick={handleReject}
            disabled={saveMutation.isPending}
            className="btn-danger space-x-1.5 px-3 py-1.5"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Reject</span>
          </button>

          {/* Approve */}
          <button
            onClick={handleApprove}
            disabled={saveMutation.isPending}
            title="Shortkey: Ctrl+Enter or Cmd+Enter"
            className="btn-primary space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5"
          >
            <CheckCircle className="w-4 h-4 stroke-[2.5]" />
            <span>{saveMutation.isPending ? 'Approving...' : 'Approve & Sync'}</span>
            <kbd className="hidden md:inline text-[9px] bg-black/20 dark:bg-black/30 text-current font-mono px-1.5 py-0.5 rounded font-bold">
              ⌘ ↵
            </kbd>
          </button>
        </div>
      </div>

      {/* Main Review Workspace Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
        {/* Left Half: Zoomable & Pannable Document Viewer */}
        <div
          className={`h-full p-2.5 sm:p-4 overflow-hidden border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex flex-col ${
            mobileActiveView === 'scan' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <ImageViewer src={invoice?.fileUrl || ''} alt="Invoice Scan" />
        </div>

        {/* Right Half: Extracted Structured Form */}
        <div
          className={`h-full overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6 bg-slate-50 dark:bg-slate-900/40 ${
            mobileActiveView === 'form' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Status Processing Alert */}
          {invoice?.status === 'PROCESSING' && (
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 text-sky-600 dark:text-sky-400 animate-spin shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-sky-900 dark:text-sky-200">
                    Gemini Flash AI OCR In Progress
                  </h4>
                  <p className="text-[11px] text-sky-700 dark:text-sky-300 mt-0.5">
                    Analyzing tax heads, line items, and math parity. This screen will update automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status Failed Alert with Retry */}
          {invoice?.status === 'EXTRACTION_FAILED' && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    AI OCR Extraction Failed
                  </h4>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                    {invoice?.errorMessage || 'Vision model could not parse bill. You can edit fields manually or retry extraction.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => retryOcrMutation.mutate()}
                disabled={retryOcrMutation.isPending}
                className="btn-primary space-x-1.5 text-xs py-1.5 px-3 shrink-0"
              >
                {retryOcrMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Retry Gemini OCR</span>
              </button>
            </div>
          )}

          {/* Live Mathematical Parity Check Banner */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-sm transition-colors ${
              mathCheck.isValid
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              {mathCheck.isValid ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                  <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">
                  {mathCheck.isValid ? 'Mathematical Balance Verified' : 'Tax Math Mismatch Detected'}
                </p>
                <p className="text-[10px] opacity-85 font-mono truncate mt-0.5">
                  Taxable (₹{taxableAmount}) + Taxes (₹{cgstAmount + sgstAmount + igstAmount}) = ₹
                  {(taxableAmount + cgstAmount + sgstAmount + igstAmount + roundOffAmount).toFixed(2)}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-950/60 border border-current shrink-0 ml-2">
              Δ ₹{mathCheck.delta.toFixed(2)}
            </span>
          </div>

          {/* Core Metadata Card with Double-Bezel */}
          <div className="rounded-2xl p-1 bg-slate-200/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="rounded-xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow space-y-3.5">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Vendor & Client Assignment
              </h3>

              {/* MSME Client Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Assign to MSME Client
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="select-field"
                >
                  <option value="">-- Unassigned (Select Client) --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.businessName} (GSTIN: {c.gstin || 'Unregistered'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Supplier Legal Name
                </label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="input-field font-bold"
                  placeholder="e.g. Sunrise Enterprise"
                />
              </div>

              {/* Supplier GSTIN */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Supplier GSTIN (15-Digit)
                  </label>
                  {supplierGstin && (
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        isGstinValid
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                          : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                      }`}
                    >
                      {isGstinValid ? `State: ${supplierState}` : 'Invalid GSTIN'}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={15}
                  value={supplierGstin}
                  onChange={(e) => setSupplierGstin(e.target.value.toUpperCase())}
                  className="input-field font-mono uppercase"
                  placeholder="07AAAAA0000A1Z5"
                />
              </div>

              {/* Invoice Number & Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Bill / Invoice #
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="input-field font-mono font-bold"
                    placeholder="INV-2026/01"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Invoice Type */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Voucher / Invoice Classification
                </label>
                <select
                  value={invoiceType}
                  onChange={(e) => setInvoiceType(e.target.value)}
                  className="select-field"
                >
                  <option value="B2B_TAX_INVOICE">B2B Tax Invoice (Standard ITC)</option>
                  <option value="B2C_RETAIL_INVOICE">B2C Retail Invoice (Consumer Bill)</option>
                  <option value="BILL_OF_SUPPLY">Bill of Supply (Exempt / Composition)</option>
                  <option value="EXPENSE_VOUCHER">Expense / Petty Cash Voucher</option>
                  <option value="CREDIT_NOTE">Credit Note</option>
                  <option value="DEBIT_NOTE">Debit Note</option>
                </select>
              </div>
            </div>
          </div>

          {/* Financial Breakdown Card with Double-Bezel */}
          <div className="rounded-2xl p-1 bg-slate-200/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="rounded-xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow space-y-3.5">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Tax Amounts & Totals (INR)
              </h3>

              {/* Taxable Amount */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Taxable Value (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={taxableAmount || ''}
                  onChange={(e) => setTaxableAmount(parseFloat(e.target.value) || 0)}
                  className="input-field font-mono font-bold"
                />
              </div>

              {/* Tax Heads (CGST, SGST, IGST) */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    CGST (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={cgstAmount || ''}
                    onChange={(e) => setCgstAmount(parseFloat(e.target.value) || 0)}
                    className="input-field font-mono text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    SGST (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={sgstAmount || ''}
                    onChange={(e) => setSgstAmount(parseFloat(e.target.value) || 0)}
                    className="input-field font-mono text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    IGST (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={igstAmount || ''}
                    onChange={(e) => setIgstAmount(parseFloat(e.target.value) || 0)}
                    className="input-field font-mono text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Round Off & Total */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Round Off (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={roundOffAmount || ''}
                    onChange={(e) => setRoundOffAmount(parseFloat(e.target.value) || 0)}
                    className="input-field font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1.5">
                    Total Bill Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={totalAmount || ''}
                    onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                    className="input-field font-mono font-black text-base bg-emerald-500/5 border-emerald-500/30 text-emerald-900 dark:text-emerald-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CA Review Notes */}
          <div className="rounded-2xl p-1 bg-slate-200/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                CA Review Notes / Tally Ledger Remarks
              </label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add optional notes for your audit trail or ledger mapping..."
                className="input-field text-xs resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
