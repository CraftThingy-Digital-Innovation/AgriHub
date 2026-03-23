import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';

const navItems = [
  { to: '/app', icon: '📊', label: 'Dashboard', end: true },
  { to: '/app/marketplace', icon: '🛒', label: 'Marketplace' },
  { to: '/app/matching', icon: '🔗', label: 'Matching Stok' },
  { to: '/app/harga', icon: '📈', label: 'Monitor Harga' },
  { to: '/app/pesanan', icon: '📦', label: 'Pesanan' },
  { to: '/app/toko', icon: '🏪', label: 'Toko Saya' },
  { to: '/app/dompet', icon: '💰', label: 'Dompet' },
  { to: '/app/chat', icon: '🤖', label: 'AI Chat' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="flex h-screen bg-[#f8faf9] overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-60 flex-shrink-0 bg-white border-r border-green-100 flex flex-col"
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-green-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center text-white text-lg">
              🌾
            </div>
            <div>
              <div className="font-bold text-sm text-green-900">AgriHub</div>
              <div className="text-[10px] text-green-600 font-medium">Indonesia</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
          {/* Admin-only link */}
          {user?.role === 'admin' && (
            <NavLink to="/app/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''} border-t border-red-100 mt-2 pt-2 text-red-600`}>
              <span className="text-base">⚙️</span>
              <span>Superadmin</span>
            </NavLink>
          )}
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-green-100">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-green-50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-green-900 truncate">{user?.name}</div>
              <div className="text-[10px] text-green-600 capitalize">{user?.role}</div>
            </div>
            <button onClick={handleLogout} className="text-green-500 hover:text-red-400 transition-colors text-sm" title="Logout">
              ⟵
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="p-6 min-h-full"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
