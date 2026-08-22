import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { InboxPage } from './pages/InboxPage';
import { InvoiceReviewPage } from './pages/InvoiceReviewPage';
import { ClientsPage } from './pages/ClientsPage';
import { ExportsPage } from './pages/ExportsPage';
import { AdminFeatureFlags } from './pages/AdminFeatureFlags';
import { AuthProvider } from './context/AuthContext';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<InboxPage />} />
              <Route path="/invoices/:id/review" element={<InvoiceReviewPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/exports" element={<ExportsPage />} />
              <Route path="/settings/feature-flags" element={<AdminFeatureFlags />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
