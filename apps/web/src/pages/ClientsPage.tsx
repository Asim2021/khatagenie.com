import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Building2, 
  MessageSquare, 
  Search
} from 'lucide-react';
import { fetchApi } from '../lib/api';
import { useToast } from '../context/ToastContext';

export const ClientsPage: React.FC = () => {
  const { showToast } = useToast();
  const [clients, setClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // New Client Form
  const [businessName, setBusinessName] = useState<string>('');
  const [tradeName, setTradeName] = useState<string>('');
  const [gstin, setGstin] = useState<string>('');
  const [whatsappPhone, setWhatsappPhone] = useState<string>('');
  const [tallyLedgerName, setTallyLedgerName] = useState<string>('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const data = await fetchApi<any[]>('/clients');
      setClients(data || []);
    } catch (err) {
      console.warn('Using mock clients:', err);
      setClients([
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
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/clients', {
        method: 'POST',
        body: JSON.stringify({
          businessName,
          tradeName,
          gstin: gstin.toUpperCase(),
          whatsappPhone,
          tallyLedgerName: tallyLedgerName || `${businessName} - Purchase A/c`,
        }),
      });

      setShowAddModal(false);
      setBusinessName('');
      setTradeName('');
      setGstin('');
      setWhatsappPhone('');
      setTallyLedgerName('');
      showToast(`MSME Client ${businessName} registered successfully!`, 'success');
      loadClients();
    } catch (err: any) {
      showToast(`Failed to add client: ${err.message}`, 'error');
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.gstin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.whatsappPhone?.includes(searchQuery)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            MSME Client Directory & WhatsApp Mappings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Map WhatsApp phone numbers to your clients so incoming receipt photos are automatically routed to the right firm.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add MSME Client</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search client name, GSTIN, phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      {/* Clients Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-500 text-xs font-medium">Loading MSME clients...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => (
          <div
            key={client.id}
            className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4 hover:border-slate-700 transition-colors shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{client.businessName}</h3>
                  <p className="text-[11px] text-slate-400">{client.tradeName || 'General Enterprise'}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">GSTIN</span>
                <span className="font-mono font-semibold text-slate-200">
                  {client.gstin || 'Unregistered'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-emerald-400" />
                  WhatsApp Ingest
                </span>
                <span className="font-mono font-semibold text-emerald-400">
                  +{client.whatsappPhone}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Tally Purchase Ledger</span>
                <span className="text-[11px] font-mono text-slate-300 truncate max-w-[180px]">
                  {client.tallyLedgerName || 'Default'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span>{client._count?.invoices || 0} Bills Digitized</span>
              <span className="text-emerald-400 font-medium cursor-pointer hover:underline">
                View Invoices →
              </span>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Add New MSME Client</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Business Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bansal Steels & Pipes"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Client GSTIN (15-Characters)
                </label>
                <input
                  type="text"
                  placeholder="07AAAAA0000A1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 font-mono text-slate-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  WhatsApp Phone Number (with Country Code) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="919811000000"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 font-mono text-slate-100 focus:outline-none focus:border-emerald-500/50"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Photos sent from this number will automatically be routed to this client.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Default Tally Purchase Ledger Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. GST Purchase @ 18%"
                  value={tallyLedgerName}
                  onChange={(e) => setTallyLedgerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
