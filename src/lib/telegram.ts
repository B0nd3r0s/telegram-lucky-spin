
// This file integrates with the Telegram Mini Apps API

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

interface TelegramWebAppInitData {
  query_id?: string;
  user?: TelegramUser;
  auth_date: number;
  hash: string;
}

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string;
        initDataUnsafe: TelegramWebAppInitData;
        ready: () => void;
        expand: () => void;
        close: () => void;
        showAlert: (message: string) => void;
        showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          setText: (text: string) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

export const isTelegramWebAppAvailable = (): boolean => {
  return window.Telegram?.WebApp !== undefined;
};

export const getTelegramUser = (): TelegramUser | null => {
  if (!isTelegramWebAppAvailable()) {
    console.warn("Telegram WebApp is not available");
    return null;
  }
  
  return window.Telegram.WebApp.initDataUnsafe.user || null;
};

export const initTelegramWebApp = (): void => {
  if (!isTelegramWebAppAvailable()) {
    console.warn("Telegram WebApp is not available");
    return;
  }
  
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
};

export const showAlert = (message: string): void => {
  if (!isTelegramWebAppAvailable()) {
    alert(message);
    return;
  }
  
  window.Telegram.WebApp.showAlert(message);
};

export const showConfirm = (message: string, callback: (confirmed: boolean) => void): void => {
  if (!isTelegramWebAppAvailable()) {
    const result = confirm(message);
    callback(result);
    return;
  }
  
  window.Telegram.WebApp.showConfirm(message, callback);
};

export const triggerHapticFeedback = (type: 'success' | 'warning' | 'error'): void => {
  if (!isTelegramWebAppAvailable()) {
    return;
  }
  
  window.Telegram.WebApp.HapticFeedback.notificationOccurred(type);
};

export default {
  isTelegramWebAppAvailable,
  getTelegramUser,
  initTelegramWebApp,
  showAlert,
  showConfirm,
  triggerHapticFeedback
};
