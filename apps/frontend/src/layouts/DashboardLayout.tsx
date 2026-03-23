import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="flex h-screen bg-[#f8faf9] overflow-hidden relative">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Hamburger Menu (Mobile Only) */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-xl bg-white border border-green-100 shadow-sm flex items-center justify-center text-green-700"
        >
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          x: isOpen ? 0 : -240, 
          // Always visible on desktop (lg)
          transition: { type: 'spring', damping: 25, stiffness: 200 }
        }}
        className={`fixed lg:static inset-y-0 left-0 w-60 flex-shrink-0 bg-white border-r border-green-100 flex flex-col z-50 transform lg:translate-x-0 ${
          isOpen ? 'shadow-2xl' : ''
        }`}
        style={{
          // Use CSS Media Query for LG breakpoint visibility override
          visibility: undefined 
        }}
      >
        <div className="hidden lg:block absolute lg:hidden" /> {/* Dummy to force rerender if needed */}
        
        {/* Style hack for responsive sidebar visibility */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media (min-width: 1024px) {
            aside { transform: translateX(0) !important; }
          }
        `}} />

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
      <main className="flex-1 overflow-y-auto lg:mt-0 mt-16">
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
