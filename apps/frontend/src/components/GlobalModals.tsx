import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalStore } from '../store/useModalStore';
import { ProfileModal } from './ProfileModal';

export const GlobalModals: React.FC = () => {
  const { alert, confirm, profile, closeAlert, closeConfirm } = useModalStore();

  return (
    <AnimatePresence>
      {/* Alert Modal */}
      {alert.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-gray-100"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">{alert.title}</h3>
            <p className="text-gray-600 text-sm mb-6">{alert.message}</p>
            <div className="flex justify-end">
              <button
                onClick={closeAlert}
                className="btn-primary w-full sm:w-auto px-6 py-2"
              >
                Mengerti
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirm.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-gray-100"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">{confirm.title}</h3>
            <p className="text-gray-600 text-sm mb-6">{confirm.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                   confirm.onCancel();
                   closeConfirm();
                }}
                className="px-5 py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  confirm.onConfirm();
                  closeConfirm();
                }}
                className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-md shadow-red-600/20"
              >
                Ya, Konfirmasi
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Profile Modal */}
      {profile.isOpen && <ProfileModal />}
    </AnimatePresence>
  );
};
