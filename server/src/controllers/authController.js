
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyTelegramInitData } = require('../utils/telegramUtils');

// Authenticate user with Telegram data
exports.login = async (req, res, next) => {
  try {
    const { initData } = req.body;
    
    // Verify Telegram init data
    const telegramData = verifyTelegramInitData(initData);
    if (!telegramData || !telegramData.user) {
      return res.status(400).json({ message: 'Invalid Telegram data' });
    }
    
    const { id, username, first_name, last_name, photo_url } = telegramData.user;
    
    // Check if user exists, create if not
    let user = await User.findOne({ telegramId: id });
    
    if (!user) {
      // Check if this user should be an admin
      const isAdmin = process.env.ADMIN_TELEGRAM_IDS.split(',').includes(id.toString());
      
      // Create new user
      user = new User({
        telegramId: id,
        username: username || `user_${id}`,
        firstName: first_name,
        lastName: last_name || '',
        photoUrl: photo_url || '',
        role: isAdmin ? 'admin' : 'user'
      });
      
      await user.save();
    } else {
      // Update user details in case they changed
      user.username = username || user.username;
      user.firstName = first_name;
      user.lastName = last_name || '';
      user.photoUrl = photo_url || user.photoUrl;
      user.lastLogin = Date.now();
      
      await user.save();
    }
    
    // Check referral if provided
    const { ref } = req.query;
    if (ref && !user.referredBy) {
      const referrer = await User.findOne({ referralCode: ref });
      if (referrer && referrer._id.toString() !== user._id.toString()) {
        user.referredBy = referrer._id;
        await user.save();
      }
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRATION }
    );
    
    res.status(200).json({
      message: 'Authentication successful',
      token,
      user: {
        id: user._id,
        telegramId: user.telegramId,
        username: user.username,
        photoUrl: user.photoUrl,
        balance: user.balance,
        role: user.role,
        referralCode: user.referralCode,
        referralBalance: user.referralBalance,
        referralCount: user.referralCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = req.user;
    
    res.status(200).json({
      id: user._id,
      telegramId: user.telegramId,
      username: user.username,
      photoUrl: user.photoUrl,
      balance: user.balance,
      role: user.role,
      referralCode: user.referralCode,
      referralBalance: user.referralBalance,
      referralCount: user.referralCount,
      walletConnected: !!user.walletAddress
    });
  } catch (error) {
    next(error);
  }
};

// Connect wallet
exports.connectWallet = async (req, res, next) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ message: 'Wallet address required' });
    }
    
    // Update user's wallet address
    const user = req.user;
    user.walletAddress = walletAddress;
    await user.save();
    
    res.status(200).json({
      message: 'Wallet connected successfully',
      walletAddress
    });
  } catch (error) {
    next(error);
  }
};
