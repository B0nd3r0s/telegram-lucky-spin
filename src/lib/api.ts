
import { Case, Gift, LiveWin, RatingItem, User } from '@/types';

// Base API URL - in production this would be your server URL
const API_BASE_URL = 'https://api.example.com'; // Replace with your API URL

// Helper function to handle fetch requests
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
  getCases: () => fetchAPI<Case[]>('/cases'),
  getCaseById: (id: string) => fetchAPI<Case>(`/cases/${id}`),
  
  // User
  getCurrentUser: () => fetchAPI<User>('/user'),
  updateUser: (data: Partial<User>) => fetchAPI<User>('/user', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  
  // Wallet
  connectWallet: (walletAddress: string) => fetchAPI<{ success: boolean }>('/wallet/connect', {
    method: 'POST',
    body: JSON.stringify({ walletAddress }),
  }),
  
  // Transactions
  deposit: (amount: number) => fetchAPI<{ success: boolean, transaction: any }>('/transactions/deposit', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  }),
  withdraw: (giftId: string) => fetchAPI<{ success: boolean, transaction: any }>('/transactions/withdraw', {
    method: 'POST',
    body: JSON.stringify({ giftId }),
  }),
  
  // Cases
  openCase: (caseId: string) => fetchAPI<{ gift: Gift }>('/cases/open', {
    method: 'POST',
    body: JSON.stringify({ caseId }),
  }),
  
  // Live feed
  getLiveWins: () => fetchAPI<LiveWin[]>('/live-wins'),
  
  // Ratings
  getTopPlayers: () => fetchAPI<RatingItem[]>('/ratings/top-players'),
  
  // Inventory
  getUserInventory: () => fetchAPI<Gift[]>('/inventory'),
  upgradeGift: (giftIds: string[]) => fetchAPI<{ newGift: Gift }>('/inventory/upgrade', {
    method: 'POST',
    body: JSON.stringify({ giftIds }),
  }),
  
  // Referrals
  getReferralStats: () => fetchAPI<{ code: string, count: number, earnings: number }>('/referrals/stats'),
  
  // Admin endpoints
  admin: {
    getCases: () => fetchAPI<Case[]>('/admin/cases'),
    createCase: (caseData: Partial<Case>) => fetchAPI<Case>('/admin/cases', {
      method: 'POST',
      body: JSON.stringify(caseData),
    }),
    updateCase: (id: string, caseData: Partial<Case>) => fetchAPI<Case>(`/admin/cases/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(caseData),
    }),
    deleteCase: (id: string) => fetchAPI<{ success: boolean }>(`/admin/cases/${id}`, {
      method: 'DELETE',
    }),
    getUsers: () => fetchAPI<User[]>('/admin/users'),
    updateUser: (id: string, userData: Partial<User>) => fetchAPI<User>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    }),
    deleteUser: (id: string) => fetchAPI<{ success: boolean }>(`/admin/users/${id}`, {
      method: 'DELETE',
    }),
  },
};

// For the demo, let's create mock data functions
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
  }
};

// Use mockApi for now
export default mockApi;
