
import { supabase } from '@/integrations/supabase/client';
import { Case, Gift, LiveWin, RatingItem, User } from '@/types';

// Users
export async function getCurrentUser(telegramId: number): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();
  
  if (error || !data) return null;
  
  return {
    id: data.id,
    telegramId: data.telegram_id,
    username: data.username,
    photoUrl: data.photo_url,
    balance: data.balance,
    role: data.role as 'user' | 'admin',
    referralCode: data.referral_code,
    referredBy: data.referred_by,
    referralBalance: data.referral_balance,
    referralCount: data.referral_count,
    walletAddress: data.wallet_address,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

export async function createOrUpdateUser(userData: Partial<User> & { telegramId: number }): Promise<User | null> {
  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', userData.telegramId)
    .maybeSingle();
  
  if (existingUser) {
    // Update user
    const { data, error } = await supabase
      .from('users')
      .update({
        username: userData.username,
        photo_url: userData.photoUrl,
        first_name: userData.username, // Assuming first_name is similar to username
        last_login: new Date().toISOString(),
      })
      .eq('telegram_id', userData.telegramId)
      .select('*')
      .single();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      telegramId: data.telegram_id,
      username: data.username,
      photoUrl: data.photo_url,
      balance: data.balance,
      role: data.role as 'user' | 'admin',
      referralCode: data.referral_code,
      referredBy: data.referred_by,
      referralBalance: data.referral_balance,
      referralCount: data.referral_count,
      walletAddress: data.wallet_address,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  } else {
    // Create user
    const { data, error } = await supabase
      .from('users')
      .insert({
        telegram_id: userData.telegramId,
        username: userData.username || `user_${userData.telegramId}`,
        first_name: userData.username || `user_${userData.telegramId}`,
        photo_url: userData.photoUrl || '',
        referral_code: `REF${userData.telegramId.toString().substring(0, 6)}`,
        role: 'user',
      })
      .select('*')
      .single();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      telegramId: data.telegram_id,
      username: data.username,
      photoUrl: data.photo_url,
      balance: data.balance,
      role: data.role as 'user' | 'admin',
      referralCode: data.referral_code,
      referredBy: data.referred_by,
      referralBalance: data.referral_balance,
      referralCount: data.referral_count,
      walletAddress: data.wallet_address,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

export async function connectWallet(userId: string, walletAddress: string): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .update({ wallet_address: walletAddress })
    .eq('id', userId);
  
  return !error;
}

// Cases
export async function getCases(): Promise<Case[]> {
  const { data: casesData, error: casesError } = await supabase
    .from('cases')
    .select('*')
    .eq('is_active', true);
  
  if (casesError || !casesData) return [];
  
  const cases: Case[] = [];
  
  for (const caseItem of casesData) {
    // Get possible gifts for each case
    const { data: giftsData } = await supabase
      .from('possible_gifts')
      .select('*')
      .eq('case_id', caseItem.id);
    
    const possibleGifts = (giftsData || []).map(gift => ({
      giftId: gift.id,
      name: gift.name,
      imageUrl: gift.image_url,
      value: gift.value,
      chance: gift.chance,
    }));
    
    cases.push({
      id: caseItem.id,
      name: caseItem.name,
      imageUrl: caseItem.image_url,
      price: caseItem.price,
      description: caseItem.description,
      isActive: caseItem.is_active,
      possibleGifts,
    });
  }
  
  return cases;
}

export async function getCaseById(id: string): Promise<Case | null> {
  const { data: caseData, error: caseError } = await supabase
    .from('cases')
    .select('*')
    .eq('id', id)
    .single();
  
  if (caseError || !caseData) return null;
  
  // Get possible gifts for the case
  const { data: giftsData } = await supabase
    .from('possible_gifts')
    .select('*')
    .eq('case_id', caseData.id);
  
  const possibleGifts = (giftsData || []).map(gift => ({
    giftId: gift.id,
    name: gift.name,
    imageUrl: gift.image_url,
    value: gift.value,
    chance: gift.chance,
  }));
  
  return {
    id: caseData.id,
    name: caseData.name,
    imageUrl: caseData.image_url,
    price: caseData.price,
    description: caseData.description,
    isActive: caseData.is_active,
    possibleGifts,
  };
}

// Open case and get gift
export async function openCase(userId: string, caseId: string): Promise<{ gift: Gift } | null> {
  // Get the case
  const { data: caseData } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .single();
  
  if (!caseData) return null;
  
  // Get user
  const { data: userData } = await supabase
    .from('users')
    .select('balance')
    .eq('id', userId)
    .single();
  
  if (!userData || userData.balance < caseData.price) return null;
  
  // Get possible gifts
  const { data: giftsData } = await supabase
    .from('possible_gifts')
    .select('*')
    .eq('case_id', caseId);
  
  if (!giftsData || giftsData.length === 0) return null;
  
  // Select a gift based on probability (simplified)
  const selectedGift = selectGiftByProbability(giftsData);
  
  // Create transaction for case purchase
  const { error: transactionError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type: 'case_purchase',
      amount: -caseData.price, // Negative for spending
      status: 'completed',
      case_id: caseId
    });
  
  if (transactionError) return null;
  
  // Create gift in user's inventory
  const { data: newGift, error: giftError } = await supabase
    .from('gifts')
    .insert({
      user_id: userId,
      case_id: caseId,
      name: selectedGift.name,
      image_url: selectedGift.image_url,
      value: selectedGift.value,
    })
    .select('*')
    .single();
  
  if (giftError || !newGift) return null;
  
  // Update user balance
  const { error: userError } = await supabase
    .from('users')
    .update({ balance: userData.balance - caseData.price })
    .eq('id', userId);
  
  if (userError) return null;
  
  return {
    gift: {
      id: newGift.id,
      name: newGift.name,
      imageUrl: newGift.image_url,
      value: newGift.value,
      isWithdrawn: false,
      createdAt: new Date(newGift.created_at),
    }
  };
}

// Helper to select a gift based on probability
function selectGiftByProbability(gifts: any[]): any {
  // Calculate cumulative probabilities
  const cumulativeProbabilities = [];
  let cumulativeProbability = 0;
  
  for (const gift of gifts) {
    cumulativeProbability += gift.chance;
    cumulativeProbabilities.push(cumulativeProbability);
  }
  
  // Generate a random number between 0 and the total probability (should be 100)
  const random = Math.random() * cumulativeProbability;
  
  // Find the gift that corresponds to the random number
  for (let i = 0; i < gifts.length; i++) {
    if (random <= cumulativeProbabilities[i]) {
      return gifts[i];
    }
  }
  
  // Default to the last gift if something went wrong
  return gifts[gifts.length - 1];
}

// Live feed
export async function getLiveWins(): Promise<LiveWin[]> {
  const { data, error } = await supabase
    .from('gifts')
    .select(`
      id,
      name,
      image_url,
      value,
      created_at,
      users:user_id (id, telegram_id, username, photo_url),
      cases:case_id (id, name)
    `)
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error || !data) return [];
  
  return data.filter(item => item.users && item.cases).map(item => ({
    id: item.id,
    userId: item.users.id,
    username: item.users.username,
    photoUrl: item.users.photo_url,
    giftName: item.name,
    giftImageUrl: item.image_url,
    giftValue: item.value,
    caseId: item.cases.id,
    caseName: item.cases.name,
    timestamp: new Date(item.created_at),
  }));
}

// Ratings / Top Players
export async function getTopPlayers(): Promise<RatingItem[]> {
  try {
    // Try to call the stored procedure first
    const { data, error } = await supabase.rpc(
      'get_top_players', 
      { limit_count: 10 },
      { count: 'exact' }
    );
    
    if (error || !data) {
      // Fallback query if the stored procedure doesn't exist
      const { data: giftsData, error: giftsError } = await supabase
        .from('gifts')
        .select('user_id, value')
        .order('created_at', { ascending: false });
  
      if (giftsError || !giftsData) return [];
  
      // Manual aggregation
      const userWinnings = new Map<string, number>();
      for (const gift of giftsData) {
        const currentTotal = userWinnings.get(gift.user_id) || 0;
        userWinnings.set(gift.user_id, currentTotal + gift.value);
      }
  
      // Get user details
      const userIds = Array.from(userWinnings.keys());
      const { data: usersData } = await supabase
        .from('users')
        .select('id, username, photo_url')
        .in('id', userIds);
  
      if (!usersData) return [];
  
      // Map users to their winnings
      const result: RatingItem[] = usersData.map(user => ({
        userId: user.id,
        username: user.username,
        photoUrl: user.photo_url,
        totalWinnings: userWinnings.get(user.id) || 0
      }));
  
      // Sort by winnings
      result.sort((a, b) => b.totalWinnings - a.totalWinnings);
  
      return result.slice(0, 10);
    }
    
    // If the stored procedure exists and returns data
    // Explicitly type the data array for mapping
    const typedData = data as Array<{
      user_id: string;
      username: string;
      photo_url: string;
      total_winnings: number;
    }>;
    
    return typedData.map(item => ({
      userId: item.user_id,
      username: item.username,
      photoUrl: item.photo_url,
      totalWinnings: item.total_winnings,
    }));
  } catch (error) {
    console.error('Error in getTopPlayers:', error);
    return [];
  }
}

// Inventory
export async function getUserInventory(userId: string): Promise<Gift[]> {
  const { data, error } = await supabase
    .from('gifts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error || !data) return [];
  
  return data.map(gift => ({
    id: gift.id,
    name: gift.name,
    imageUrl: gift.image_url,
    value: gift.value,
    isWithdrawn: gift.is_withdrawn,
    createdAt: new Date(gift.created_at),
  }));
}

export async function withdrawGift(userId: string, giftId: string, txHash: string): Promise<boolean> {
  const { error } = await supabase
    .from('gifts')
    .update({ 
      is_withdrawn: true,
      withdrawal_tx_hash: txHash,
      withdrawal_timestamp: new Date().toISOString()
    })
    .eq('id', giftId)
    .eq('user_id', userId);
  
  return !error;
}

// For admin operations
export const admin = {
  async getCases(): Promise<Case[]> {
    const { data: casesData, error: casesError } = await supabase
      .from('cases')
      .select('*');
    
    if (casesError || !casesData) return [];
    
    const cases: Case[] = [];
    
    for (const caseItem of casesData) {
      // Get possible gifts for each case
      const { data: giftsData } = await supabase
        .from('possible_gifts')
        .select('*')
        .eq('case_id', caseItem.id);
      
      const possibleGifts = (giftsData || []).map(gift => ({
        giftId: gift.id,
        name: gift.name,
        imageUrl: gift.image_url,
        value: gift.value,
        chance: gift.chance,
      }));
      
      cases.push({
        id: caseItem.id,
        name: caseItem.name,
        imageUrl: caseItem.image_url,
        price: caseItem.price,
        description: caseItem.description,
        isActive: caseItem.is_active,
        possibleGifts,
      });
    }
    
    return cases;
  },
  
  async createCase(caseData: Partial<Case>): Promise<Case | null> {
    if (!caseData.name || !caseData.imageUrl || !caseData.price || !caseData.possibleGifts) {
      return null;
    }
    
    // Insert the case
    const { data: newCase, error: caseError } = await supabase
      .from('cases')
      .insert({
        name: caseData.name,
        image_url: caseData.imageUrl,
        price: caseData.price,
        description: caseData.description || '',
        is_active: caseData.isActive !== undefined ? caseData.isActive : true
      })
      .select()
      .single();
    
    if (caseError || !newCase) return null;
    
    // Insert possible gifts
    const possibleGiftsData = caseData.possibleGifts.map(gift => ({
      case_id: newCase.id,
      name: gift.name,
      image_url: gift.imageUrl,
      value: gift.value,
      chance: gift.chance
    }));
    
    const { data: gifts, error: giftsError } = await supabase
      .from('possible_gifts')
      .insert(possibleGiftsData)
      .select();
    
    if (giftsError) return null;
    
    return {
      id: newCase.id,
      name: newCase.name,
      imageUrl: newCase.image_url,
      price: newCase.price,
      description: newCase.description,
      isActive: newCase.is_active,
      possibleGifts: (gifts || []).map(gift => ({
        giftId: gift.id,
        name: gift.name,
        imageUrl: gift.image_url,
        value: gift.value,
        chance: gift.chance,
      }))
    };
  },
  
  async updateCase(id: string, caseData: Partial<Case>): Promise<Case | null> {
    // Update the case
    const { data: updatedCase, error: caseError } = await supabase
      .from('cases')
      .update({
        name: caseData.name,
        image_url: caseData.imageUrl,
        price: caseData.price,
        description: caseData.description,
        is_active: caseData.isActive
      })
      .eq('id', id)
      .select()
      .single();
    
    if (caseError || !updatedCase) return null;
    
    // Update possible gifts if provided
    if (caseData.possibleGifts && caseData.possibleGifts.length > 0) {
      // First delete existing gifts
      await supabase
        .from('possible_gifts')
        .delete()
        .eq('case_id', id);
      
      // Then insert new ones
      const possibleGiftsData = caseData.possibleGifts.map(gift => ({
        case_id: id,
        name: gift.name,
        image_url: gift.imageUrl,
        value: gift.value,
        chance: gift.chance
      }));
      
      await supabase
        .from('possible_gifts')
        .insert(possibleGiftsData);
    }
    
    // Get updated possible gifts
    const { data: gifts } = await supabase
      .from('possible_gifts')
      .select('*')
      .eq('case_id', id);
    
    return {
      id: updatedCase.id,
      name: updatedCase.name,
      imageUrl: updatedCase.image_url,
      price: updatedCase.price,
      description: updatedCase.description,
      isActive: updatedCase.is_active,
      possibleGifts: (gifts || []).map(gift => ({
        giftId: gift.id,
        name: gift.name,
        imageUrl: gift.image_url,
        value: gift.value,
        chance: gift.chance,
      }))
    };
  },
  
  async deleteCase(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', id);
    
    return !error;
  }
};

// Create a stored function to get top players (call this only once)
export async function createStoredProcedures() {
  await supabase.rpc(
    'create_get_top_players_function',
    {},
    { count: 'exact' }
  );
}
