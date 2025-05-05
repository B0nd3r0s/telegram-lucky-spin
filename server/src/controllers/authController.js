
const jwt = require('jsonwebtoken');
const { verifyTelegramInitData } = require('../utils/telegramUtils');

// Authenticate user with Telegram data
exports.login = async (req, res, next) => {
  try {
    const { initData } = req.body;
    const { supabase } = req;
    
    // Verify Telegram init data
    const telegramData = verifyTelegramInitData(initData);
    if (!telegramData || !telegramData.user) {
      return res.status(400).json({ message: 'Invalid Telegram data' });
    }
    
    const { id, username, first_name, last_name, photo_url } = telegramData.user;
    
    // Check if user exists, create if not
    const { data: existingUser, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', id)
      .single();
    
    let user;
    
    if (!existingUser && !queryError) {
      // Check if this user should be an admin
      const isAdmin = process.env.ADMIN_TELEGRAM_IDS.split(',').includes(id.toString());
      
      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          telegram_id: id,
          username: username || `user_${id}`,
          first_name: first_name,
          last_name: last_name || '',
          photo_url: photo_url || '',
          role: isAdmin ? 'admin' : 'user',
          last_login: new Date().toISOString()
        })
        .select('*')
        .single();
        
      if (insertError) {
        return res.status(500).json({ message: 'Failed to create user', error: insertError });
      }
      
      user = newUser;
    } else {
      // Update user details in case they changed
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          username: username || existingUser.username,
          first_name: first_name,
          last_name: last_name || '',
          photo_url: photo_url || existingUser.photo_url,
          last_login: new Date().toISOString()
        })
        .eq('telegram_id', id)
        .select('*')
        .single();
      
      if (updateError) {
        return res.status(500).json({ message: 'Failed to update user', error: updateError });
      }
      
      user = updatedUser;
    }
    
    // Check referral if provided
    const { ref } = req.query;
    if (ref && !user.referred_by) {
      const { data: referrer } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', ref)
        .single();
      
      if (referrer && referrer.id !== user.id) {
        await supabase
          .from('users')
          .update({ referred_by: referrer.id })
          .eq('id', user.id);
      }
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRATION }
    );
    
    res.status(200).json({
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        telegramId: user.telegram_id,
        username: user.username,
        photoUrl: user.photo_url,
        balance: user.balance,
        role: user.role,
        referralCode: user.referral_code,
        referralBalance: user.referral_balance,
        referralCount: user.referral_count
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
      id: user.id,
      telegramId: user.telegram_id,
      username: user.username,
      photoUrl: user.photo_url,
      balance: user.balance,
      role: user.role,
      referralCode: user.referral_code,
      referralBalance: user.referral_balance,
      referralCount: user.referral_count,
      walletConnected: !!user.wallet_address
    });
  } catch (error) {
    next(error);
  }
};

// Connect wallet
exports.connectWallet = async (req, res, next) => {
  try {
    const { walletAddress } = req.body;
    const { supabase } = req;
    
    if (!walletAddress) {
      return res.status(400).json({ message: 'Wallet address required' });
    }
    
    // Update user's wallet address
    const { error } = await supabase
      .from('users')
      .update({ wallet_address: walletAddress })
      .eq('id', req.user.id);
    
    if (error) {
      return res.status(500).json({ message: 'Failed to connect wallet', error });
    }
    
    res.status(200).json({
      message: 'Wallet connected successfully',
      walletAddress
    });
  } catch (error) {
    next(error);
  }
};
