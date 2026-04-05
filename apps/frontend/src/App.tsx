import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import DashboardLayout from './layouts/DashboardLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MarketplacePage from './pages/MarketplacePage';
import ChatPage from './pages/ChatPage';
import PriceMonitorPage from './pages/PriceMonitorPage';
import MatchingPage from './pages/MatchingPage';
import OrdersPage from './pages/OrdersPage';
import WalletPage from './pages/WalletPage';
import SellerPage from './pages/SellerPage';
import AdminPage from './pages/AdminPage';
import WaSetupPage from './pages/WaSetupPage';
import { GlobalModals } from './components/GlobalModals';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;

  // Enforce verification: Nominal phone and email MUST be verified
  const needsPhoneVerify = user && !user.phone_verified;
  const needsEmailVerify = user && user.email && !user.email_verified;

  if (needsPhoneVerify || needsEmailVerify) {
    return <Navigate to="/login?step=verify" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <GlobalModals />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/wa-setup" element={<WaSetupPage />} />

        {/* Protected (Dashboard Layout) */}
        <Route path="/app" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="marketplace" element={<MarketplacePage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="harga" element={<PriceMonitorPage />} />
          <Route path="matching" element={<MatchingPage />} />
          <Route path="pesanan" element={<OrdersPage />} />
          <Route path="dompet" element={<WalletPage />} />
          <Route path="toko" element={<SellerPage />} />
          <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
