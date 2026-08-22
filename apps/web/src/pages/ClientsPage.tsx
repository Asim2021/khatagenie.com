import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Building2, 
  MessageSquare, 
  Search,
  X 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { useToast } from '../context/ToastContext';

export const ClientsPage: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 safe-pb">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>MSME Clients Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Map WhatsApp sender mobile numbers to MSME businesses and their corresponding Tally ledgers.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search business name, GSTIN, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors shadow-sm dark:shadow-none"
        />
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
            Loading cached MSME clients...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
            <Building2 className="w-8 h-8 mx-auto opacity-40 text-emerald-500" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Clients Found</p>
            <p className="text-xs">Click "Add New Client" to register an MSME business.</p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 hover:border-emerald-500/40 transition-all shadow-sm dark:shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    {client.businessName.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                    Active
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-3 truncate">
                  {client.businessName}
                </h3>
                {client.tradeName && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{client.tradeName}</p>
                )}

                <div className="mt-4 space-y-2 text-xs border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>GSTIN:</span>
                    <span className="font-mono text-slate-900 dark:text-slate-200 font-medium">
                      {client.gstin || 'Unregistered'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>WhatsApp Phone:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      +{client.whatsappPhone}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Tally Ledger:</span>
                    <span className="text-slate-800 dark:text-slate-300 truncate max-w-[150px]">
                      {client.tallyLedgerName || 'Default Purchase'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>{client._count?.invoices || 0} Invoices Received</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer hover:underline">
                  View Ledger &rarr;
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Register New MSME Client
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Legal Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bansal Electrical Works"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trade / Brand Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bansal Lights Delhi"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  GSTIN (15-Character)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="e.g. 07AABCB1234A1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  WhatsApp Phone Number (with Country Code) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 919811000000"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tally Prime Ledger Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bansal Electrical - Purchase A/c"
                  value={tallyLedgerName}
                  onChange={(e) => setTallyLedgerName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addClientMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {addClientMutation.isPending ? 'Saving...' : 'Save MSME Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
