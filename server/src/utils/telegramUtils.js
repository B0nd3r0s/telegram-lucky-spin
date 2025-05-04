
const crypto = require('crypto');

/**
 * Verify Telegram Mini App init data
 * @param {string} initDataString - The initData string from Telegram Mini App
 * @returns {Object|null} - Parsed and verified data or null if invalid
 */
exports.verifyTelegramInitData = (initDataString) => {
  try {
    // Parse the initData string into a URLSearchParams object
    const initData = new URLSearchParams(initDataString);
    
    // Extract the hash and data to validate
    const hash = initData.get('hash');
    initData.delete('hash');
    
    // Sort the parameters alphabetically
    const dataToCheck = [];
    for (const [key, value] of [...initData.entries()].sort()) {
      dataToCheck.push(`${key}=${value}`);
    }
    
    // Create a data check string
    const dataCheckString = dataToCheck.join('\n');
    
    // Create an HMAC using the bot token
    const secretKey = crypto.createHash('sha256')
      .update(process.env.TELEGRAM_BOT_TOKEN)
      .digest();
      
    const hmac = crypto.createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    // Verify that the hash matches our calculated hmac
    if (hmac !== hash) {
      console.warn('Telegram data verification failed: Invalid hash');
      return null;
    }
    
    // Parse the user data
    const userData = JSON.parse(initData.get('user') || '{}');
    
    // Return the verified data
    return {
      user: userData,
      auth_date: initData.get('auth_date'),
      query_id: initData.get('query_id'),
    };
  } catch (error) {
    console.error('Error verifying Telegram data:', error);
    return null;
  }
};

/**
 * Generate a random string to use as CSRF token
 * @param {number} length - The length of the string to generate
 * @returns {string} - Random string
 */
exports.generateRandomString = (length = 20) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Calculate the probability of a gift based on its chance
 * @param {Array} possibleGifts - Array of possible gifts with their chances
 * @returns {Object} - The selected gift
 */
exports.selectGiftByProbability = (possibleGifts) => {
  const random = Math.random() * 100;
  let cumulativeChance = 0;
  
  for (const gift of possibleGifts) {
    cumulativeChance += gift.chance;
    if (random <= cumulativeChance) {
      return gift;
    }
  }
  
  // Fallback to the last gift if no gift is selected
  // (This should not happen if chances sum to 100%)
  return possibleGifts[possibleGifts.length - 1];
};
