import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  AlertCircle, 
  UploadCloud, 
  FileSpreadsheet, 
  RefreshCw, 
  Clock, 
  History,
  User,
  Bot
} from './icons';
import { InvoiceAuditLog } from '@khatagenie/types';

interface InvoiceAuditTimelineProps {
  auditLogs?: InvoiceAuditLog[];
  createdAt?: string;
  senderPhone?: string;
}

export const InvoiceAuditTimeline: React.FC<InvoiceAuditTimelineProps> = ({
  auditLogs = [],
}) => {
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'APPROVED':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
          bgColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
          label: 'Approved & Verified',
        };
      case 'REJECTED':
        return {
          icon: <XCircle className="w-3.5 h-3.5 text-rose-500" />,
          bgColor: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400',
          label: 'Invoice Rejected',
        };
      case 'OCR_PROCESSED':
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-amber-500" />,
          bgColor: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
          label: 'AI OCR Extracted',
        };
      case 'OCR_FAILED':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-500" />,
          bgColor: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400',
          label: 'OCR Extraction Failed',
        };
      case 'UPLOADED':
        return {
          icon: <UploadCloud className="w-3.5 h-3.5 text-purple-500" />,
          bgColor: 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400',
          label: 'Invoice Ingested',
        };
      case 'UPDATED':
        return {
          icon: <Clock className="w-3.5 h-3.5 text-blue-500" />,
          bgColor: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400',
          label: 'Manual Edit',
        };
      case 'EXPORTED':
        return {
          icon: <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />,
          bgColor: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-400',
          label: 'Tally / Excel Exported',
        };
      case 'OCR_RETRIED':
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 text-sky-500" />,
          bgColor: 'bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-400',
          label: 'OCR Re-Queued',
        };
      case 'RE_REVIEWED':
        return {
          icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
          bgColor: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
          label: 'Re-Opened for Review',
        };
      default:
        return {
          icon: <History className="w-3.5 h-3.5 text-slate-500" />,
          bgColor: 'bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-400',
          label: action,
        };
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  if (!auditLogs || auditLogs.length === 0) {
    return (
      <div className="rounded-2xl p-1 bg-slate-200/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow text-center py-6 text-slate-400 text-xs">
          <History className="w-6 h-6 mx-auto mb-2 opacity-40 text-slate-500" />
          <p>No audit trail recorded yet for this invoice.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-1 bg-slate-200/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
      <div className="rounded-xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Activity & Audit Trail ({auditLogs.length})
          </h3>
          <span className="text-[10px] font-mono text-slate-400">
            Immutable log
          </span>
        </div>

        <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {auditLogs.map((log) => {
            const badge = getActionBadge(log.action);
            const isSystem = !log.userId && !log.user;
            const actorName = log.user?.fullName || (isSystem ? 'Gemini Flash AI Engine' : 'System Bot');

            return (
              <div key={log.id} className="relative group">
                {/* Node indicator */}
                <div className="absolute -left-5 top-1 w-3.5 h-3.5 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 group-hover:border-emerald-500 transition-colors flex items-center justify-center" />

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bgColor}`}>
                      {badge.icon}
                      <span>{badge.label}</span>
                    </span>

                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      {formatTimestamp(log.createdAt)}
                    </span>
                  </div>

                  {/* Actor details */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                    {isSystem ? (
                      <Bot className="w-3 h-3 text-amber-500 shrink-0" />
                    ) : (
                      <User className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    )}
                    <span className="font-bold">{actorName}</span>
                    {log.user?.email && (
                      <span className="text-[10px] text-slate-400 font-normal truncate">
                        ({log.user.email})
                      </span>
                    )}
                  </div>

                  {/* Details / Reason */}
                  {log.details && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800/80 leading-relaxed font-sans">
                      {log.details}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
