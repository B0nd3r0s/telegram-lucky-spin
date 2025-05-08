
const crypto = require('crypto');

/**
 * Validates Telegram initData to ensure it's authentic
 * @param {string} initData - The initData string from Telegram Mini App
 * @param {string} botToken - Your bot's token
 * @returns {boolean} Whether the initData is valid
 */
const validateTelegramWebAppData = (initData, botToken) => {
  try {
    const searchParams = new URLSearchParams(initData);
    const hash = searchParams.get('hash');
    
    if (!hash) return false;
    
    // Remove hash from the data
    searchParams.delete('hash');
    
    // Sort in alphabetical order
    const sortedParams = Array.from(searchParams.entries())
      .sort(([a], [b]) => a.localeCompare(b));
    
    // Create a data string
    const dataString = sortedParams
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    // Create a secret key from the bot token
    const secretKey = crypto.createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();
    
    // Calculate the hash
    const calculatedHash = crypto.createHmac('sha256', secretKey)
      .update(dataString)
      .digest('hex');
    
    return calculatedHash === hash;
  } catch (error) {
    console.error('Error validating Telegram data:', error);
    return false;
  }
};

/**
 * Parse Telegram initData into a user object
 * @param {string} initData - The initData string from Telegram Mini App
 * @returns {Object|null} Parsed user data or null if invalid
 */
const parseTelegramInitData = (initData) => {
  try {
    // For URL-encoded initData
    const data = new URLSearchParams(initData);
    const user = data.get('user');
    
    if (!user) return null;
    
    return JSON.parse(decodeURIComponent(user));
  } catch (error) {
    try {
      // For JSON encoded initData
      const data = JSON.parse(initData);
      return data.user || null;
    } catch (innerError) {
      console.error('Error parsing Telegram init data:', innerError);
      return null;
    }
  }
};

/**
 * Select a gift based on probabilities
 * @param {Array} possibleGifts - Array of gifts with chance values
 * @returns {Object} The selected gift
 */
const selectGiftByProbability = (possibleGifts) => {
  // Sort gifts by chance (descending)
  const sortedGifts = [...possibleGifts].sort((a, b) => b.chance - a.chance);
  
  // Generate a random number between 0 and 100
  const randomValue = Math.random() * 100;
  
  let cumulativeChance = 0;
  
  // Find the gift based on its chance
  for (const gift of sortedGifts) {
    cumulativeChance += gift.chance;
    if (randomValue <= cumulativeChance) {
      return gift;
    }
  }
  
  // Fallback to the last gift (should rarely happen due to rounding errors)
  return sortedGifts[sortedGifts.length - 1];
};

/**
 * Calculate upgrade result based on input gifts and upgrade mode
 * @param {Array} gifts - Array of gift objects to upgrade
 * @param {string} mode - 'combine' (combine 2 gifts) or 'upgrade' (upgrade 1 gift)
 * @returns {Object} The upgrade result
 */
const calculateUpgrade = (gifts, mode) => {
  if (mode === 'combine') {
    // Combine two gifts (mode 1)
    if (gifts.length !== 2) {
      throw new Error('Combine mode requires exactly 2 gifts');
    }
    
    const totalValue = gifts.reduce((sum, gift) => sum + gift.value, 0);
    
    // Apply multiplier based on random chance
    const rand = Math.random();
    let multiplier = 1.0; // Default, no change
    
    if (rand < 0.1) {
      // 10% chance of x0.8 (downgrade)
      multiplier = 0.8;
    } else if (rand < 0.4) {
      // 30% chance of x1.0 (same value)
      multiplier = 1.0;
    } else if (rand < 0.8) {
      // 40% chance of x1.2
      multiplier = 1.2;
    } else {
      // 20% chance of x1.5
      multiplier = 1.5;
    }
    
    const newValue = Math.round(totalValue * multiplier);
    
    return {
      success: true,
      value: newValue,
      multiplier
    };
    
  } else if (mode === 'upgrade') {
    // Upgrade single gift (mode 2)
    if (gifts.length !== 1) {
      throw new Error('Upgrade mode requires exactly 1 gift');
    }
    
    const gift = gifts[0];
    const multipliers = [0, 1.5, 2, 3, 5, 10, 20];
    const weights = [15, 30, 25, 15, 10, 4, 1]; // Percentages
    
    // Calculate weighted random multiplier
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    let selectedIndex = 0;
    
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        selectedIndex = i;
        break;
      }
    }
    
    const multiplier = multipliers[selectedIndex];
    const success = multiplier > 0;
    const newValue = Math.round(gift.value * multiplier);
    
    return {
      success,
      value: newValue,
      multiplier
    };
  }
  
  throw new Error('Invalid upgrade mode');
};

/**
 * Schedule auto-update of prizes (every hour)
 * @param {Function} updateFunction - Function to call for updates
 */
const scheduleAutoUpdate = (updateFunction) => {
  // Call immediately on startup
  updateFunction();
  
  // Schedule for every hour
  const oneHour = 60 * 60 * 1000;
  setInterval(updateFunction, oneHour);
};

module.exports = {
  validateTelegramWebAppData,
  parseTelegramInitData,
  selectGiftByProbability,
  calculateUpgrade,
  scheduleAutoUpdate
};
