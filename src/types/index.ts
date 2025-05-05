export interface User {
  id: string;
  telegramId: number;
  username: string;
  photoUrl: string;
  balance: number;
  role: 'user' | 'admin';
  referralCode: string;
  referredBy?: string;
  referralBalance: number;
  referralCount: number;
  walletAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Gift {
  id: string;
  name: string;
  imageUrl: string;
  value: number;
  isWithdrawn: boolean;
  createdAt: Date;
}

// Add isActive property to Case interface
export interface Case {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  description: string;
  isActive?: boolean;
  possibleGifts: PossibleGift[];
}

export interface PossibleGift {
  giftId: string;
  name: string;
  imageUrl: string;
  value: number;
  chance: number; // Percentage chance, e.g. 5.5 means 5.5%
}

export interface LiveWin {
  id: string;
  userId: string;
  username: string;
  photoUrl: string;
  giftName: string;
  giftImageUrl: string;
  giftValue: number;
  caseId: string;
  caseName: string;
  timestamp: Date;
}

export interface RatingItem {
  userId: string;
  username: string;
  photoUrl: string;
  totalWinnings: number;
}

export interface UserInventory {
  userId: string;
  gifts: Gift[];
}

export type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<any>;
};
