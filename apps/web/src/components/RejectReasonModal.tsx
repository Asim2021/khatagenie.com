import React, { useState } from 'react';
import { XCircle, X, AlertTriangle, Loader2 } from './icons';

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title?: string;
  invoiceNumber?: string;
  initialReason?: string;
  isPending?: boolean;
}

const PRESET_REASONS = [
  { id: 'BLURRY', label: 'Illegible / Blurry Bill', desc: 'Scan or photo cannot be clearly read.' },
  { id: 'DUPLICATE', label: 'Duplicate Invoice', desc: 'Already processed or recorded earlier.' },
  { id: 'PERSONAL', label: 'Non-GST / Personal Expense', desc: 'Not allowable as business purchase.' },
  { id: 'GSTIN_INVALID', label: 'GSTIN Cancelled / Mismatch', desc: 'Vendor GSTIN is inactive or invalid.' },
  { id: 'MATH_MISMATCH', label: 'Tax Math / Rate Error', desc: 'Incorrect calculation or wrong GST slab.' },
  { id: 'WRONG_CLIENT', label: 'Wrong Client Assigned', desc: 'Bill belongs to a different MSME entity.' },
  { id: 'OTHER', label: 'Other Reason', desc: 'Specify custom reason below.' },
];

export const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  invoiceNumber,
  initialReason,
  isPending = false,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('BLURRY');
  const [customNotes, setCustomNotes] = useState<string>(initialReason || '');
  const [error, setError] = useState<string>('');

  React.useEffect(() => {
    if (initialReason) {
      setCustomNotes(initialReason);
    }
  }, [initialReason]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const presetObj = PRESET_REASONS.find((p) => p.id === selectedPreset);
    const presetLabel = presetObj ? presetObj.label : 'Rejected';
    
    let finalReason = presetLabel;
    if (customNotes.trim()) {
      finalReason = `${presetLabel}: ${customNotes.trim()}`;
    }

    if (!finalReason.trim()) {
      setError('Please provide a rejection reason.');
      return;
    }

    setError('');
    onConfirm(finalReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg rounded-2xl p-1 bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-xl bg-white dark:bg-slate-900 p-5 sm:p-6 border border-slate-100 dark:border-slate-800/80 shadow-inner-glow">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {title || (invoiceNumber ? `Reject Invoice #${invoiceNumber}` : 'Reject Invoice')}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Provide an audit-logged reason for this rejection.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isPending}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Preset Selection Grid */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                Select Reason Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_REASONS.map((preset) => {
                  const isSelected = selectedPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedPreset(preset.id);
                        setError('');
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 dark:border-rose-600 ring-1 ring-rose-400 dark:ring-rose-600'
                          : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <p className={`text-xs font-bold ${isSelected ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-slate-200'}`}>
                        {preset.label}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight line-clamp-1">
                        {preset.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Additional Remarks / Notes */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Detailed Remarks & Notes <span className="text-slate-400 font-normal">(Optional context for CA client)</span>
              </label>
              <textarea
                rows={3}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. Total tax does not match 18% slab, request supplier for updated credit note."
                className="input-field text-xs resize-none"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="btn-secondary px-3.5 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="btn-danger px-4 py-2 text-xs space-x-1.5 shadow-sm"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>{isPending ? 'Rejecting...' : 'Confirm Rejection'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
