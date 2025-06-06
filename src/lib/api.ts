
import { Case, Gift, LiveWin, RatingItem, User } from '@/types';
import * as supabaseApi from './supabase-api';

// For development, we'll decide whether to use the mock API or the Supabase API
const USE_MOCK_API = false;

// Helper function to handle fetch requests
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const API_BASE_URL = 'https://api.example.com'; // Replace with your API URL
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'An error occurred');
  }

  return response.json();
}

// API endpoints
export const api = {
  // Cases
  getCases: () => USE_MOCK_API ? mockApi.getCases() : supabaseApi.getCases(),
  getCaseById: (id: string) => USE_MOCK_API ? mockApi.getCaseById(id) : supabaseApi.getCaseById(id),
  
  // User
  getCurrentUser: () => USE_MOCK_API ? mockApi.getCurrentUser() : supabaseApi.getCurrentUser(123456789), // Replace with actual Telegram ID
  updateUser: (data: Partial<User>) => USE_MOCK_API ? mockApi.updateUser(data) : Promise.resolve(null),
  
  // Wallet
  connectWallet: (walletAddress: string) => USE_MOCK_API ? mockApi.connectWallet(walletAddress) : supabaseApi.connectWallet('current-user-id', walletAddress),
  
  // Transactions
  deposit: (amount: number) => USE_MOCK_API ? mockApi.deposit(amount) : Promise.resolve({ success: true, transaction: { id: 'tx-id' } }),
  withdraw: (giftId: string) => USE_MOCK_API ? mockApi.withdraw(giftId) : supabaseApi.withdrawGift('current-user-id', giftId, 'mock-tx-hash'),
  
  // Cases
  openCase: (caseId: string) => USE_MOCK_API ? mockApi.openCase(caseId) : supabaseApi.openCase('current-user-id', caseId),
  
  // Live feed
  getLiveWins: () => USE_MOCK_API ? mockApi.getLiveWins() : supabaseApi.getLiveWins(),
  
  // Ratings
  getTopPlayers: () => USE_MOCK_API ? mockApi.getTopPlayers() : supabaseApi.getTopPlayers(),
  
  // Inventory
  getUserInventory: () => USE_MOCK_API ? mockApi.getUserInventory() : supabaseApi.getUserInventory('current-user-id'),
  upgradeGift: (giftIds: string[]) => USE_MOCK_API ? mockApi.upgradeGift(giftIds) : Promise.resolve({ newGift: { id: 'new-gift-id', name: 'Upgraded Gift', imageUrl: '/placeholder.svg', value: 100, isWithdrawn: false, createdAt: new Date() } }),
  
  // Referrals
  getReferralStats: () => USE_MOCK_API ? mockApi.getReferralStats() : Promise.resolve({ code: 'REF123', count: 5, earnings: 50 }),
};

// For the demo, let's implement the mock API functions
export const mockApi = {
  getCases: (): Promise<Case[]> => {
    const mockCases: Case[] = [
      {
        id: '1',
        name: 'Basic Case',
        imageUrl: '/placeholder.svg',
        price: 5,
        description: 'A basic case with common gifts',
        possibleGifts: [
          { giftId: '1', name: 'TON x1', imageUrl: '/placeholder.svg', value: 1, chance: 70 },
          { giftId: '2', name: 'TON x5', imageUrl: '/placeholder.svg', value: 5, chance: 20 },
          { giftId: '3', name: 'TON x10', imageUrl: '/placeholder.svg', value: 10, chance: 10 }
        ]
      },
      {
        id: '2',
        name: 'Premium Case',
        imageUrl: '/placeholder.svg',
        price: 20,
        description: 'A premium case with better gifts',
        possibleGifts: [
          { giftId: '4', name: 'TON x10', imageUrl: '/placeholder.svg', value: 10, chance: 60 },
          { giftId: '5', name: 'TON x20', imageUrl: '/placeholder.svg', value: 20, chance: 30 },
          { giftId: '6', name: 'TON x50', imageUrl: '/placeholder.svg', value: 50, chance: 10 }
        ]
      },
      {
        id: '3',
        name: 'Luxury Case',
        imageUrl: '/placeholder.svg',
        price: 50,
        description: 'A luxury case with rare gifts',
        possibleGifts: [
          { giftId: '7', name: 'TON x25', imageUrl: '/placeholder.svg', value: 25, chance: 50 },
          { giftId: '8', name: 'TON x75', imageUrl: '/placeholder.svg', value: 75, chance: 40 },
          { giftId: '9', name: 'TON x200', imageUrl: '/placeholder.svg', value: 200, chance: 10 }
        ]
      },
    ];
    return Promise.resolve(mockCases);
  },
  
  getCaseById: (id: string): Promise<Case | null> => {
    return mockApi.getCases().then(cases => cases.find(c => c.id === id) || null);
  },
  
  getCurrentUser: (): Promise<User> => {
    return Promise.resolve({
      id: 'user1',
      telegramId: 12345678,
      username: 'testuser',
      photoUrl: '/placeholder.svg',
      balance: 100,
      role: 'user',
      referralCode: 'REF123456',
      referralBalance: 10,
      referralCount: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  },
  
  updateUser: (data: Partial<User>): Promise<User> => {
    return mockApi.getCurrentUser().then(user => ({ ...user, ...data }));
  },
  
  connectWallet: (walletAddress: string): Promise<boolean> => {
    return Promise.resolve(true);
  },
  
  deposit: (amount: number): Promise<{ success: boolean, transaction: { id: string } }> => {
    return Promise.resolve({ success: true, transaction: { id: `tx-${Date.now()}` } });
  },
  
  withdraw: (giftId: string): Promise<boolean> => {
    return Promise.resolve(true);
  },
  
  getLiveWins: (): Promise<LiveWin[]> => {
    const mockLiveWins: LiveWin[] = [
      {
        id: '1',
        userId: 'user1',
        username: 'telegramuser1',
        photoUrl: '/placeholder.svg',
        giftName: 'TON x10',
        giftImageUrl: '/placeholder.svg',
        giftValue: 10,
        caseId: '1',
        caseName: 'Basic Case',
        timestamp: new Date(Date.now() - 1000 * 60)
      },
      {
        id: '2',
        userId: 'user2',
        username: 'telegramuser2',
        photoUrl: '/placeholder.svg',
        giftName: 'TON x50',
        giftImageUrl: '/placeholder.svg',
        giftValue: 50,
        caseId: '2',
        caseName: 'Premium Case',
        timestamp: new Date(Date.now() - 1000 * 60 * 5)
      },
      {
        id: '3',
        userId: 'user3',
        username: 'telegramuser3',
        photoUrl: '/placeholder.svg',
        giftName: 'TON x200',
        giftImageUrl: '/placeholder.svg',
        giftValue: 200,
        caseId: '3',
        caseName: 'Luxury Case',
        timestamp: new Date(Date.now() - 1000 * 60 * 10)
      }
    ];
    return Promise.resolve(mockLiveWins);
  },
  
  getTopPlayers: (): Promise<RatingItem[]> => {
    const mockTopPlayers: RatingItem[] = [
      {
        userId: 'user3',
        username: 'telegramuser3',
        photoUrl: '/placeholder.svg',
        totalWinnings: 500
      },
      {
        userId: 'user2',
        username: 'telegramuser2',
        photoUrl: '/placeholder.svg',
        totalWinnings: 300
      },
      {
        userId: 'user1',
        username: 'telegramuser1',
        photoUrl: '/placeholder.svg',
        totalWinnings: 150
      }
    ];
    return Promise.resolve(mockTopPlayers);
  },
  
  getUserInventory: (): Promise<Gift[]> => {
    const mockInventory: Gift[] = [
      {
        id: '1',
        name: 'TON x10',
        imageUrl: '/placeholder.svg',
        value: 10,
        isWithdrawn: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
      },
      {
        id: '2',
        name: 'TON x5',
        imageUrl: '/placeholder.svg',
        value: 5,
        isWithdrawn: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48)
      }
    ];
    return Promise.resolve(mockInventory);
  },
  
  openCase: (caseId: string): Promise<{ gift: Gift }> => {
    // Simulate case opening - in production this would be determined by the server
    const mockGifts: Gift[] = [
      {
        id: (Math.random() * 1000).toFixed(0),
        name: `TON x${Math.floor(Math.random() * 20) + 1}`,
        imageUrl: '/placeholder.svg',
        value: Math.floor(Math.random() * 50) + 1,
        isWithdrawn: false,
        createdAt: new Date()
      }
    ];
    
    return Promise.resolve({ gift: mockGifts[0] });
  },
  
  upgradeGift: (giftIds: string[]): Promise<{ newGift: Gift }> => {
    return Promise.resolve({
      newGift: {
        id: `new-${Date.now()}`,
        name: 'Upgraded Gift',
        imageUrl: '/placeholder.svg',
        value: 50,
        isWithdrawn: false,
        createdAt: new Date()
      }
    });
  },
  
  getReferralStats: (): Promise<{ code: string; count: number; earnings: number }> => {
    return Promise.resolve({ code: 'REF123456', count: 2, earnings: 10 });
  },
  
  admin: {
    getCases: (): Promise<Case[]> => mockApi.getCases(),
    createCase: (caseData: Partial<Case>): Promise<Case | null> => {
      const newCase: Case = {
        id: `new-${Date.now()}`,
        name: caseData.name || 'New Case',
        imageUrl: caseData.imageUrl || '/placeholder.svg',
        price: caseData.price || 10,
        description: caseData.description || 'A new case',
        possibleGifts: caseData.possibleGifts || []
      };
      return Promise.resolve(newCase);
    },
    updateCase: (id: string, caseData: Partial<Case>): Promise<Case | null> => {
      return mockApi.getCaseById(id).then(originalCase => {
        if (!originalCase) return null;
        return { ...originalCase, ...caseData };
      });
    },
    deleteCase: (id: string): Promise<boolean> => Promise.resolve(true),
    getUsers: (): Promise<User[]> => Promise.resolve([]),
    updateUser: (id: string, userData: Partial<User>): Promise<User | null> => Promise.resolve(null),
    deleteUser: (id: string): Promise<{ success: boolean }> => Promise.resolve({ success: true }),
  }
};

// Use the real Supabase API by default
export default api;
