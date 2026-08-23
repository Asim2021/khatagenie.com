import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  Plus, 
  Building2, 
  MessageSquare, 
  Search,
  X,
  ExternalLink
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { useToast } from '../context/ToastContext';

export const ClientsPage: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Body scroll lock during modal
  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAddModal]);

  // New Client Form
  const [businessName, setBusinessName] = useState<string>('');
  const [tradeName, setTradeName] = useState<string>('');
  const [gstin, setGstin] = useState<string>('');
  const [whatsappPhone, setWhatsappPhone] = useState<string>('');
  const [tallyLedgerName, setTallyLedgerName] = useState<string>('');

  // 1. TanStack Query caching for Clients List
  const { data: clients = [], isLoading } = useQuery<any[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        const data = await fetchApi<any[]>('/clients');
        return data || [];
      } catch (err) {
        console.warn('Using mock clients:', err);
        return [
          {
            id: 'c1',
            businessName: 'Aggarwal Traders',
            tradeName: 'Aggarwal Wholesale Hub',
            gstin: '07AABCA1111A1Z0',
            pan: 'AABCA1111A',
            whatsappPhone: '919811223344',
            tallyLedgerName: 'Aggarwal Traders - Purchase A/c',
            isActive: true,
            _count: { invoices: 14 },
          },
          {
            id: 'c2',
            businessName: 'Sharma Electronics & Appliances',
            tradeName: 'Sharma Digital Store',
            gstin: '07BBCDE2222B1Z8',
            pan: 'BBCDE2222B',
            whatsappPhone: '919877665544',
            tallyLedgerName: 'Sharma Electronics - Purchase A/c',
            isActive: true,
            _count: { invoices: 8 },
          },
          {
            id: 'c3',
            businessName: 'Gupta Auto Components',
            tradeName: 'Gupta Motors Delhi',
            gstin: '07CCDEF3333C1Z6',
            pan: 'CCDEF3333C',
            whatsappPhone: '919899112233',
            tallyLedgerName: 'Gupta Auto - Raw Material A/c',
            isActive: true,
            _count: { invoices: 5 },
          },
        ];
      }
    },
  });

  // 2. Add Client Mutation
  const addClientMutation = useMutation({
    mutationFn: async (clientPayload: any) => {
      return await fetchApi('/clients', {
        method: 'POST',
        body: JSON.stringify(clientPayload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowAddModal(false);
      setBusinessName('');
      setTradeName('');
      setGstin('');
      setWhatsappPhone('');
      setTallyLedgerName('');
      showToast(`MSME Client ${businessName} registered successfully!`, 'success');
    },
    onError: (err: any) => {
      showToast(`Failed to add client: ${err.message}`, 'error');
    },
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    addClientMutation.mutate({
      businessName,
      tradeName,
      gstin: gstin.toUpperCase(),
      whatsappPhone,
      tallyLedgerName: tallyLedgerName || `${businessName} - Purchase A/c`,
    });
  };

  const filteredClients = clients.filter(
    (c) =>
      c.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.gstin || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.whatsappPhone.includes(searchQuery)
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>MSME Clients Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Map WhatsApp sender mobile numbers to MSME businesses and their corresponding Tally ledgers.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search business name, GSTIN, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input-field"
        />
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            Loading cached MSME clients...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 space-y-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
            <Building2 className="w-8 h-8 mx-auto opacity-40 text-emerald-500" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No Clients Found</p>
            <p className="text-xs">Click "Add New Client" to register an MSME business.</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className="rounded-2xl p-1 bg-slate-200/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-all duration-300 flex flex-col justify-between"
            >
              <div className="rounded-xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-slate-100 dark:border-slate-800/60 shadow-inner-glow space-y-4 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm shrink-0">
                      {client.businessName.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      ACTIVE
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-3 truncate">
                    {client.businessName}
                  </h3>
                  {client.tradeName && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{client.tradeName}</p>
                  )}

                  <div className="mt-3.5 space-y-2 text-xs border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>GSTIN:</span>
                      <span className="font-mono text-slate-900 dark:text-slate-200 font-bold">
                        {client.gstin || 'Unregistered'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>WhatsApp Phone:</span>
                      <a
                        href={`https://wa.me/${client.whatsappPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline"
                      >
                        <MessageSquare className="w-3 h-3" />
                        +{client.whatsappPhone}
                      </a>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Tally Ledger:</span>
                      <span className="text-slate-800 dark:text-slate-300 truncate max-w-[150px] font-medium">
                        {client.tallyLedgerName || 'Default Purchase'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-medium">{client._count?.invoices || 0} Invoices Received</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer hover:underline flex items-center gap-1">
                    <span>View Ledger</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Client Modal with React Portal for flawless top-level backdrop coverage */}
      {showAddModal &&
        createPortal(
          <div 
            className="fixed inset-0 z-[999] flex items-center justify-center p-3.5 sm:p-4 bg-slate-950/75 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAddModal(false);
            }}
          >
            <div className="doppelrand-shell max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 shadow-2xl">
              <div className="doppelrand-core p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Register New MSME Client
                  </h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateClient} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Legal Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bansal Electrical Works"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Trade / Brand Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bansal Lights Delhi"
                      value={tradeName}
                      onChange={(e) => setTradeName(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      GSTIN (15-Character)
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="e.g. 07AABCB1234A1Z5"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      className="input-field font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      WhatsApp Phone Number (with Country Code) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 919811000000"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      className="input-field font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tally Prime Ledger Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bansal Electrical - Purchase A/c"
                      value={tallyLedgerName}
                      onChange={(e) => setTallyLedgerName(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addClientMutation.isPending}
                      className="btn-primary"
                    >
                      {addClientMutation.isPending ? 'Saving...' : 'Save MSME Client'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
