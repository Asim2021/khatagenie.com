import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
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
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function AppLayout() {
  const location = useLocation();
  const isAuthRoute = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {!isAuthRoute && <Navbar />}
      <main className="flex-1 flex flex-col">
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
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <AppLayout />
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
