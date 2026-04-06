import { create } from 'zustand';

interface ModalState {
  alert: {
    isOpen: boolean;
    title: string;
    message: string;
  };
  confirm: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  };
  profile: {
    isOpen: boolean;
  };
  showAlert: (message: string, title?: string) => void;
  showConfirm: (message: string, onConfirm: () => void, title?: string) => void;
  showProfile: () => void;
  closeAlert: () => void;
  closeConfirm: () => void;
  closeProfile: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  alert: { isOpen: false, title: 'Informasi', message: '' },
  confirm: {
    isOpen: false,
    title: 'Konfirmasi',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  },
  profile: { isOpen: false },
  showAlert: (message, title = 'Informasi') =>
    set({ alert: { isOpen: true, message, title } }),
  showConfirm: (message, onConfirm, title = 'Konfirmasi') =>
    set({
      confirm: {
        isOpen: true,
        message,
        title,
        onConfirm,
        onCancel: () => set((state) => ({ confirm: { ...state.confirm, isOpen: false } })),
      },
    }),
  showProfile: () => set({ profile: { isOpen: true } }),
  closeAlert: () => set((state) => ({ alert: { ...state.alert, isOpen: false } })),
  closeConfirm: () => set((state) => ({ confirm: { ...state.confirm, isOpen: false } })),
  closeProfile: () => set({ profile: { isOpen: false } }),
}));
