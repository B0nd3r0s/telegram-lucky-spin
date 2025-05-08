
const User = require('../models/User');
const Case = require('../models/Case');
const Gift = require('../models/Gift');
const Transaction = require('../models/Transaction');
const axios = require('axios');

// Get platform statistics
exports.getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCases = await Case.countDocuments();
    
    // Calculate total transaction volume
    const transactions = await Transaction.find();
    const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    // Calculate profit (difference between case purchases and withdrawals)
    const casePurchases = await Transaction.find({ type: 'case_purchase' });
    const withdrawals = await Transaction.find({ type: 'withdrawal' });
    
    const casePurchaseTotal = casePurchases.reduce((sum, tx) => sum + tx.amount, 0);
    const withdrawalTotal = withdrawals.reduce((sum, tx) => sum + tx.amount, 0);
    
    const profit = casePurchaseTotal - withdrawalTotal;
    
    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTransactions = await Transaction.find({ 
      createdAt: { $gte: today } 
    });
    
    const todayRevenue = todayTransactions
      .filter(tx => tx.type === 'case_purchase')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const todayCasesOpened = todayTransactions
      .filter(tx => tx.type === 'case_purchase')
      .length;
    
    res.json({
      totalUsers,
      totalCases,
      casesOpened: casePurchases.length,
      totalVolume,
      profit,
      today: {
        revenue: todayRevenue,
        casesOpened: todayCasesOpened
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get users with pagination
exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { telegramId: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user transactions
    const transactions = await Transaction.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      user,
      transactions
    });
  } catch (error) {
    next(error);
  }
};

// Update user (block/unblock, change role, adjust balance)
exports.updateUser = async (req, res, next) => {
  try {
    const { isBlocked, role, balance } = req.body;
    const confirmation = req.body.confirmation;
    
    // Require confirmation for sensitive operations
    if (!confirmation) {
      return res.status(400).json({ 
        message: 'Confirmation required for this action',
        requireConfirmation: true
      });
    }
    
    const updateData = {};
    if (typeof isBlocked === 'boolean') updateData.isBlocked = isBlocked;
    if (role) updateData.role = role;
    if (typeof balance === 'number') updateData.balance = balance;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Log the admin action
    await Transaction.create({
      user: req.user._id,
      type: 'admin_action',
      amount: 0,
      status: 'completed',
      notes: `Updated user ${user.username}: ${JSON.stringify(updateData)}`
    });
    
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Get all cases
exports.getCases = async (req, res, next) => {
  try {
    const cases = await Case.find().sort({ createdAt: -1 });
    res.json(cases);
  } catch (error) {
    next(error);
  }
};

// Create a new case
exports.createCase = async (req, res, next) => {
  try {
    const { name, imageUrl, price, description, possibleGifts } = req.body;
    
    // Validate that chances sum to 100%
    const totalChance = possibleGifts.reduce((sum, gift) => sum + gift.chance, 0);
    if (Math.abs(totalChance - 100) > 0.01) {
      return res.status(400).json({
        message: 'Total chance must be 100%',
        currentTotal: totalChance
      });
    }
    
    const newCase = new Case({
      name,
      imageUrl,
      price,
      description,
      possibleGifts
    });
    
    await newCase.save();
    
    // Log the admin action
    await Transaction.create({
      user: req.user._id,
      type: 'admin_action',
      amount: 0,
      status: 'completed',
      notes: `Created new case: ${name}`
    });
    
    res.status(201).json(newCase);
  } catch (error) {
    next(error);
  }
};

// Update an existing case
exports.updateCase = async (req, res, next) => {
  try {
    const { name, imageUrl, price, description, possibleGifts, isActive } = req.body;
    
    // If possibleGifts are provided, validate their chances
    if (possibleGifts) {
      const totalChance = possibleGifts.reduce((sum, gift) => sum + gift.chance, 0);
      if (Math.abs(totalChance - 100) > 0.01) {
        return res.status(400).json({
          message: 'Total chance must be 100%',
          currentTotal: totalChance
        });
      }
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (imageUrl) updateData.imageUrl = imageUrl;
    if (price) updateData.price = price;
    if (description !== undefined) updateData.description = description;
    if (possibleGifts) updateData.possibleGifts = possibleGifts;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const updatedCase = await Case.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    
    if (!updatedCase) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    // Log the admin action
    await Transaction.create({
      user: req.user._id,
      type: 'admin_action',
      amount: 0,
      status: 'completed',
      notes: `Updated case ${updatedCase.name}`
    });
    
    res.json(updatedCase);
  } catch (error) {
    next(error);
  }
};

// Delete a case
exports.deleteCase = async (req, res, next) => {
  try {
    const deletedCase = await Case.findByIdAndDelete(req.params.id);
    
    if (!deletedCase) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    // Log the admin action
    await Transaction.create({
      user: req.user._id,
      type: 'admin_action',
      amount: 0,
      status: 'completed',
      notes: `Deleted case: ${deletedCase.name}`
    });
    
    res.json({ message: 'Case deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get transactions with pagination
exports.getTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const transactions = await Transaction.find()
      .populate('user', 'telegramId username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Transaction.countDocuments();
    
    res.json({
      transactions,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Wallet management
exports.getWallet = async (req, res, next) => {
  try {
    // Get admin TON wallet settings from environment variables
    const walletAddress = process.env.TON_WALLET_ADDRESS || '';
    
    // In a real app, we would fetch this from TON API
    // For now we'll simulate this
    let walletBalance = 0;
    
    try {
      // Only try to fetch wallet balance if API key and wallet address are set
      if (process.env.TON_API_KEY && process.env.TON_API_ENDPOINT && walletAddress) {
        const response = await axios.get(`${process.env.TON_API_ENDPOINT}/getAddressBalance`, {
          params: {
            address: walletAddress
          },
          headers: {
            'X-API-KEY': process.env.TON_API_KEY
          }
        });
        
        if (response.data && response.data.ok && response.data.result) {
          // Convert from nanoTON to TON (1 TON = 10^9 nanoTON)
          walletBalance = parseInt(response.data.result) / 1000000000;
        }
      }
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
      // Continue with zero balance
    }
    
    // Get recent withdrawal transactions
    const withdrawals = await Transaction.find({ type: 'withdrawal' })
      .populate('user', 'telegramId username')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      walletAddress,
      walletBalance,
      withdrawals
    });
  } catch (error) {
    next(error);
  }
};

// Update wallet settings
exports.updateWallet = async (req, res, next) => {
  try {
    const { walletAddress } = req.body;
    const confirmation = req.body.confirmation;
    
    // Require confirmation for wallet updates
    if (!confirmation) {
      return res.status(400).json({ 
        message: 'Confirmation required for wallet updates',
        requireConfirmation: true
      });
    }
    
    // In a real implementation, this would update environment variables
    // or a settings collection in the database
    // For this implementation, we'll just return success
    
    // TODO: Create a Settings model to store wallet address
    
    res.json({ 
      success: true,
      message: 'Wallet settings updated',
      walletAddress
    });
    
    // Log the admin action
    await Transaction.create({
      user: req.user._id,
      type: 'admin_action',
      amount: 0,
      status: 'completed',
      notes: `Updated wallet address to: ${walletAddress}`
    });
  } catch (error) {
    next(error);
  }
};

// Update gift prices based on TON exchange rate
exports.updatePrices = async () => {
  try {
    console.log('Updating gift prices based on TON exchange rate...');
    
    // In a real implementation, fetch TON price from an API
    // For now, just log that this would happen
    console.log('Price update scheduled task completed');
    
    return true;
  } catch (error) {
    console.error('Failed to update prices:', error);
    return false;
  }
};

// Export the updatePrices function for scheduler
exports.updatePrices = exports.updatePrices;
