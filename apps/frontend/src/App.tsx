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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

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
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
