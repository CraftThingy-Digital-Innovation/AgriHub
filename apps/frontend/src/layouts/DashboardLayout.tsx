import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useModalStore } from '../store/useModalStore';
import logo from '../assets/agrihub-logo.png';

// ✅ LUCIDE ICONS
import {
  LayoutDashboard,
  ShoppingCart,
  Link2,
  BarChart3,
  Package,
  Store,
  Wallet,
  Bot,
  Settings
} from "lucide-react";

const navItems = [
  { to: '/app', icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
  { to: '/app/marketplace', icon: <ShoppingCart size={18} />, label: 'Marketplace' },
  { to: '/app/matching', icon: <Link2 size={18} />, label: 'Matching Stok' },
  { to: '/app/harga', icon: <BarChart3 size={18} />, label: 'Monitor Harga' },
  { to: '/app/pesanan', icon: <Package size={18} />, label: 'Pesanan' },
  { to: '/app/toko', icon: <Store size={18} />, label: 'Toko Saya' },
  { to: '/app/dompet', icon: <Wallet size={18} />, label: 'Dompet' },
  { to: '/app/chat', icon: <Bot size={18} />, label: 'AI Chat' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const { showProfile } = useModalStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-green-50 via-white to-green-100 overflow-hidden relative">

      {/* BACKDROP MOBILE */}
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

      {/* HAMBURGER */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-xl bg-white border border-green-100 shadow-sm flex items-center justify-center text-green-700"
        >
          {isOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* SIDEBAR */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -240 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-green-100 flex flex-col z-50 ${
          isOpen ? 'shadow-2xl' : ''
        }`}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @media (min-width: 1024px) {
            aside { transform: translateX(0) !important; }
          }
        `}} />

        {/* 🔥 LOGO */}
        <div className="px-5 py-5 border-b border-green-100">
          <div className="flex items-center gap-3">

            <div className="w-11 h-11 flex items-center justify-center rounded-xl 
            bg-white shadow-md border border-green-100 hover:scale-105 transition duration-300">

              <img 
                src={logo}
                alt="AgriHub Logo"
                className="w-7 h-7 object-contain"
              />

            </div>

            <div>
              <div className="font-bold text-green-900">AgriHub</div>
              <div className="text-xs text-green-600 font-medium">Indonesia</div>
            </div>

          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition duration-200 group
                ${isActive 
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md' 
                  : 'text-green-700 hover:bg-green-100'}`
              }
            >
              <div className="group-hover:scale-110 transition">
                {item.icon}
              </div>
              <span>{item.label}</span>
            </NavLink>
          ))}

          {/* ADMIN */}
          {user?.role === 'admin' && (
            <NavLink
              to="/app/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl mt-2 pt-2 transition
                ${isActive 
                  ? 'bg-red-500 text-white' 
                  : 'text-red-500 hover:bg-red-100'}`
              }
            >
              <Settings size={18} />
              <span>Superadmin</span>
            </NavLink>
          )}
        </nav>

        {/* USER PROFILE */}
        <div className="p-3 border-t border-green-100">
          <div 
            onClick={showProfile}
            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-green-50 hover:bg-green-100 cursor-pointer shadow-sm active:scale-95 transition-all group/profile"
          >

            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-600 to-green-400 flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0) || '?'}
            </div>

            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-bold text-green-900 truncate group-hover/profile:text-emerald-700 transition-colors">{user?.name}</div>
              <div className="text-[10px] text-green-600 font-bold uppercase tracking-wider opacity-60">@{user?.username || user?.role}</div>
            </div>

            <button
              onClick={handleLogout}
              className="text-green-500 hover:text-red-500 transition"
            >
              ⟵
            </button>

          </div>
        </div>

      </motion.aside>

      {/* MAIN CONTENT */}
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