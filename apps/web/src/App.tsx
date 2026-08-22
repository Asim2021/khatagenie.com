import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { InboxPage } from './pages/InboxPage';
import { InvoiceReviewPage } from './pages/InvoiceReviewPage';
import { ClientsPage } from './pages/ClientsPage';
import { ExportsPage } from './pages/ExportsPage';
import { AdminFeatureFlags } from './pages/AdminFeatureFlags';
import { Gstr2bReconPage } from './pages/Gstr2bReconPage';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import { ProtectedRoute } from './components/ProtectedRoute';

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <InboxPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/invoices/:id/review"
                  element={
                    <ProtectedRoute>
                      <InvoiceReviewPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/clients"
                  element={
                    <ProtectedRoute>
                      <ClientsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/exports"
                  element={
                    <ProtectedRoute>
                      <ExportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reconciliation"
                  element={
                    <ProtectedRoute>
                      <Gstr2bReconPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/feature-flags"
                  element={
                    <ProtectedRoute>
                      <AdminFeatureFlags />
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

