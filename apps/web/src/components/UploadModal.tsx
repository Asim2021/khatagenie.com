import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  X,
  Building2,
  FileText,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
} from './icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { useToast } from '../context/ToastContext';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: any[];
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, clients }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set default client if available
  useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  // Body scroll lock during modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setSelectedFile(null);
      setPreviewUrl(null);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle file preview URL
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, clientId }: { file: File; clientId: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (clientId) {
        formData.append('clientId', clientId);
      }
      return await fetchApi('/invoices/upload', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation'] });
      showToast('Invoice uploaded successfully! AI extraction initiated.', 'success');
      onClose();
    },
    onError: (err: any) => {
      showToast(`Upload failed: ${err.message}`, 'error');
    },
  });

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Please select an invoice file to upload.', 'error');
      return;
    }
    uploadMutation.mutate({ file: selectedFile, clientId: selectedClientId });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl p-1 bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-xl bg-white dark:bg-slate-900 p-5 sm:p-6 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <UploadCloud className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Upload Invoice / Bill
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gemini Flash AI OCR extraction & GST validation
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={uploadMutation.isPending}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* GATING: If No MSME Clients Exist */}
          {clients.length === 0 ? (
            <div className="py-6 space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <h4 className="text-sm font-bold">MSME Client Registration Required</h4>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  KhataGenie organizes all invoices, tax ledgers, and GSTR-2B reconciliations under specific MSME Clients. Please register your client first so bills are accurately linked.
                </p>
              </div>

              {/* 5-Step Workflow Guide Preview */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  KhataGenie Sequence Workflow
                </p>
                <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">1</span>
                    <span>Register MSME Client (Business Name, GSTIN, WhatsApp Phone)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px]">2</span>
                    <span>Upload Bills or receive from client WhatsApp bot</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px]">3</span>
                    <span>AI Vision OCR & CA Split-Screen Review</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px]">4</span>
                    <span>GSTR-2B 2-Way Portal Reconciliation</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px]">5</span>
                    <span>Export to Tally Prime XML & Excel Registers</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/clients');
                  }}
                  className="btn-primary space-x-2 px-5 py-2"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Register First Client</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Upload Form when Clients Exist */
            <form onSubmit={handleSubmit} className="py-5 space-y-4">
              {/* MSME Client Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Assign to MSME Client</span>
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="select-field"
                  disabled={uploadMutation.isPending}
                >
                  <option value="">-- Unassigned (General Ingestion) --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.businessName} {c.gstin ? `(${c.gstin})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Tax ledgers and GSTR-2B matching will automatically map to this client.
                </p>
              </div>

              {/* Drag and Drop Zone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Invoice File (Image or PDF)
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-500/10 scale-[0.99]'
                      : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 bg-slate-50 dark:bg-slate-950/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploadMutation.isPending}
                  />

                  {previewUrl ? (
                    <div className="relative w-full max-h-36 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-36 object-contain bg-black/5 dark:bg-black/40"
                      />
                    </div>
                  ) : selectedFile ? (
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <FileText className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                  )}

                  {selectedFile ? (
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-xs">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Click or drag to replace
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Click to browse or drag & drop invoice
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Supports JPEG, PNG, WebP, HEIC and PDF (up to 15MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit & Cancel Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={uploadMutation.isPending}
                  className="btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || uploadMutation.isPending}
                  className="btn-primary space-x-2 px-5 py-2"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading & Processing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 stroke-[2.5]" />
                      <span>Upload & Extract</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
