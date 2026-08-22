import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  Check, 
  AlertTriangle, 
  Building2, 
  Hash
} from 'lucide-react';
import { ImageViewer } from '../components/ImageViewer';
import { fetchApi } from '../lib/api';
import { validateGstin, getStateFromGstin, verifyInvoiceMath } from '@khatagenie/shared';
import { InvoiceStatus } from '@khatagenie/types';

export const InvoiceReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

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

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [invRes, clientsRes] = await Promise.all([
        fetchApi<any>(`/invoices/${id}`),
        fetchApi<any[]>('/clients'),
      ]);

      setInvoice(invRes);
      setClients(clientsRes || []);

      // Populate form
      setSupplierName(invRes.supplierName || '');
      setSupplierGstin(invRes.supplierGstin || '');
      setInvoiceNumber(invRes.invoiceNumber || '');
      setInvoiceDate(invRes.invoiceDate ? new Date(invRes.invoiceDate).toISOString().split('T')[0] : '');
      setInvoiceType(invRes.invoiceType || 'B2B_TAX_INVOICE');
      setClientId(invRes.clientId || '');
      setTaxableAmount(Number(invRes.taxableAmount || 0));
      setCgstAmount(Number(invRes.cgstAmount || 0));
      setSgstAmount(Number(invRes.sgstAmount || 0));
      setIgstAmount(Number(invRes.igstAmount || 0));
      setRoundOffAmount(Number(invRes.roundOffAmount || 0));
      setTotalAmount(Number(invRes.totalAmount || 0));
      setReviewNotes(invRes.reviewNotes || '');
      setLineItems(invRes.lineItems || []);
    } catch (err) {
      console.warn('Fallback mock invoice for split screen preview:', err);
      const mockInv = {
        id: id || 'inv-delhi-01',
        senderPhone: '919877665544',
        fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1200',
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
        confidenceScore: 0.91,
        lineItems: [
          {
            description: 'Industrial Heavy Duty Inverter 5kVA',
            hsnCode: '8504',
            quantity: 1,
            unit: 'PCS',
            unitPrice: 25000.0,
            taxableAmount: 25000.0,
            gstRate: 18.0,
            cgstAmount: 0,
            sgstAmount: 0,
            igstAmount: 4500.0,
            totalAmount: 29500.0,
          },
        ],
      };
      setInvoice(mockInv);
      setSupplierName(mockInv.supplierName);
      setSupplierGstin(mockInv.supplierGstin);
      setInvoiceNumber(mockInv.invoiceNumber);
      setInvoiceDate(mockInv.invoiceDate);
      setTaxableAmount(mockInv.taxableAmount);
      setIgstAmount(mockInv.igstAmount);
      setTotalAmount(mockInv.totalAmount);
      setLineItems(mockInv.lineItems);
    } finally {
      setIsLoading(false);
    }
  };

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

  // Keyboard Shortcuts (Cmd/Ctrl + Enter to Approve)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleApprove();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [supplierName, supplierGstin, taxableAmount, cgstAmount, sgstAmount, igstAmount, totalAmount, clientId]);

  const handleSave = async (status: InvoiceStatus) => {
    setIsSaving(true);
    try {
      await fetchApi(`/invoices/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          supplierName,
          supplierGstin,
          invoiceNumber,
          invoiceDate,
          invoiceType,
          clientId: clientId || null,
          taxableAmount,
          cgstAmount,
          sgstAmount,
          igstAmount,
          roundOffAmount,
          totalAmount,
          reviewNotes,
          status,
          lineItems,
        }),
      });
      navigate('/');
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = () => handleSave(InvoiceStatus.APPROVED);
  const handleReject = () => handleSave(InvoiceStatus.REJECTED);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-slate-950 text-slate-400 text-xs font-medium">
        Loading invoice scan & structured data...
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-950 overflow-hidden">
      {/* Top Header Bar with Breadcrumb & Quick Actions */}
      <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Bill Review: <span className="font-mono text-emerald-400">{invoiceNumber || 'Untitled Bill'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                +{invoice?.senderPhone}
              </span>
            </h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleReject}
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reject Bill</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={isSaving}
            title="Shortkey: Ctrl+Enter or Cmd+Enter"
            className="flex items-center space-x-2 px-5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
          >
            <CheckCircle className="w-4 h-4 stroke-[2.5]" />
            <span>{isSaving ? 'Approving...' : 'Approve & Sync'}</span>
            <kbd className="hidden sm:inline text-[9px] bg-slate-950/30 text-slate-950 font-mono px-1.5 py-0.5 rounded font-bold">
              ⌘ ↵
            </kbd>
          </button>
        </div>
      </div>

      {/* Main Split Screen Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden">
        {/* Left Half: Zoomable & Pannable Document Viewer (50%) */}
        <div className="h-full p-4 overflow-hidden border-r border-slate-800 bg-slate-950 flex flex-col">
          <ImageViewer src={invoice?.fileUrl || ''} alt="Invoice Scan" />
        </div>

        {/* Right Half: Live Extracted Structured Form (50%) */}
        <div className="h-full overflow-y-auto p-6 space-y-6 bg-slate-900/40">
          {/* Live Mathematical Parity Check Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between shadow-lg transition-colors ${
              mathCheck.isValid
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              {mathCheck.isValid ? (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                </div>
              )}
              <div>
                <p className="text-xs font-bold">
                  {mathCheck.isValid ? 'Mathematical Balance Verified' : 'Tax Math Mismatch Detected'}
                </p>
                <p className="text-[11px] opacity-80 font-mono mt-0.5">
                  Taxable (₹{taxableAmount}) + Taxes (₹{cgstAmount + sgstAmount + igstAmount}) = ₹
                  {(taxableAmount + cgstAmount + sgstAmount + igstAmount + roundOffAmount).toFixed(2)}
                  {!mathCheck.isValid && ` (Expected Total: ₹${totalAmount})`}
                </p>
              </div>
            </div>

            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-slate-950/60 border border-current">
              Δ ₹{mathCheck.delta.toFixed(2)}
            </span>
          </div>

          {/* Core Metadata Card */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              Vendor & Client Assignment
            </h3>

            {/* MSME Client Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Assign to MSME Client
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
              >
                <option value="">-- Unassigned (Select Client) --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName} (GSTIN: {c.gstin || 'Unregistered'} • +{c.whatsappPhone})
                  </option>
                ))}
              </select>
            </div>

            {/* Supplier Name */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                Supplier Legal Name
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Supplier GSTIN with Live State Lookup */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-300">
                  Supplier GSTIN (15-Characters)
                </label>
                {supplierState && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    State: {supplierState}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={supplierGstin}
                onChange={(e) => setSupplierGstin(e.target.value.toUpperCase())}
                placeholder="07AAAAA0000A1Z5"
                className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none ${
                  isGstinValid
                    ? 'border-slate-800 focus:border-emerald-500/50'
                    : 'border-amber-500/50 focus:border-amber-500'
                }`}
              />
            </div>

            {/* Bill Number & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Invoice / Bill No
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-emerald-400" />
              Tax & Amount Breakdown (INR)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Taxable Value (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={taxableAmount}
                  onChange={(e) => setTaxableAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  CGST (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={cgstAmount}
                  onChange={(e) => setCgstAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  SGST (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={sgstAmount}
                  onChange={(e) => setSgstAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  IGST (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={igstAmount}
                  onChange={(e) => setIgstAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Round Off (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={roundOffAmount}
                  onChange={(e) => setRoundOffAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-400 mb-1">
                  Grand Total (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Line Items Card */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Extracted Line Items ({lineItems.length})
              </h3>
            </div>

            {lineItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-slate-500 border-b border-slate-800">
                    <tr>
                      <th className="pb-2">Description</th>
                      <th className="pb-2">HSN</th>
                      <th className="pb-2 text-right">Qty</th>
                      <th className="pb-2 text-right">Taxable</th>
                      <th className="pb-2 text-right">Tax %</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {lineItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 pr-2 font-sans font-medium text-slate-200">
                          {item.description}
                        </td>
                        <td className="py-2.5 text-slate-400">{item.hsnCode || '—'}</td>
                        <td className="py-2.5 text-right">{item.quantity || 1}</td>
                        <td className="py-2.5 text-right">₹{Number(item.taxableAmount).toFixed(2)}</td>
                        <td className="py-2.5 text-right">{item.gstRate}%</td>
                        <td className="py-2.5 text-right font-bold text-slate-100">
                          ₹{Number(item.totalAmount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No line items extracted.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
