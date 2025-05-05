
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { getTelegramUser, initTelegramWebApp } from '../lib/telegram';
import { useToast } from '@/components/ui/use-toast';
import * as supabaseApi from '@/lib/supabase-api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  balance: number;
  walletConnected: boolean;
  connectWallet: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const { toast } = useToast();

  // Initialize the app and authenticate the user
  useEffect(() => {
    const initialize = async () => {
      try {
        initTelegramWebApp();
        await authenticateUser();
      } catch (error) {
        console.error('Failed to initialize app', error);
        toast({
          title: "Authentication Error",
          description: "Failed to authenticate with Telegram",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const authenticateUser = async () => {
    // Get user from Telegram WebApp data
    const telegramUser = getTelegramUser();
    
    if (!telegramUser) {
      console.error('No Telegram user found');
      return;
    }
    
    try {
      // Create or update user in Supabase
      const userData = await supabaseApi.createOrUpdateUser({
        telegramId: telegramUser.id,
        username: telegramUser.username || telegramUser.first_name,
        photoUrl: telegramUser.photo_url || 'https://via.placeholder.com/100',
      });
      
      if (userData) {
        setUser(userData);
        setWalletConnected(!!userData.walletAddress);
      } else {
        // Fallback to mock data if Supabase call fails
        const mockUser: User = {
          id: `user-${telegramUser.id}`,
          telegramId: telegramUser.id,
          username: telegramUser.username || telegramUser.first_name,
          photoUrl: telegramUser.photo_url || 'https://via.placeholder.com/100',
          balance: 100, // Mock balance
          role: telegramUser.id === 123456789 ? 'admin' : 'user', // Mock admin check
          referralCode: `REF${telegramUser.id.toString().substring(0, 6)}`,
          referralBalance: 0,
          referralCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        setUser(mockUser);
      }
    } catch (error) {
      console.error('Failed to authenticate user', error);
      throw error;
    }
  };

  const connectWallet = async () => {
    if (!user) return;
    
    try {
      // In a real app, this would connect to the TON wallet
      // For now, we'll simulate a successful connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update user record with wallet address
      const walletAddress = `ton-wallet-${Date.now()}`;
      const success = await supabaseApi.connectWallet(user.id, walletAddress);
      
      if (success) {
        setWalletConnected(true);
        toast({
          title: "Success",
          description: "TON wallet connected",
        });
      } else {
        throw new Error("Failed to connect wallet");
      }
    } catch (error) {
      console.error('Failed to connect wallet', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect TON wallet",
        variant: "destructive",
      });
    }
  };

  const refreshUser = async () => {
    setIsLoading(true);
    try {
      await authenticateUser();
    } catch (error) {
      console.error('Failed to refresh user', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    balance: user?.balance || 0,
    walletConnected,
    connectWallet,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
