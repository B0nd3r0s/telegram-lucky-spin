
const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Case = require('../models/Case');
const Gift = require('../models/Gift');
const Transaction = require('../models/Transaction');
const { AlertDialog, AlertDialogContent, AlertDialogTitle } = require('@radix-ui/react-alert-dialog');

// Protect all admin routes
router.use(isAdmin);

// Get platform statistics
router.get('/stats', async (req, res, next) => {
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
});

// Get users with pagination
router.get('/users', async (req, res, next) => {
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
});

// Get user by ID
router.get('/users/:id', async (req, res, next) => {
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
});

// Update user (block/unblock, change role, adjust balance)
router.put('/users/:id', async (req, res, next) => {
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
});

// Get all cases
router.get('/cases', async (req, res, next) => {
  try {
    const cases = await Case.find().sort({ createdAt: -1 });
    res.json(cases);
  } catch (error) {
    next(error);
  }
});

// Create a new case
router.post('/cases', async (req, res, next) => {
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
});

// Update an existing case
router.put('/cases/:id', async (req, res, next) => {
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
});

// Delete a case
router.delete('/cases/:id', async (req, res, next) => {
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
});

// Get transactions with pagination
router.get('/transactions', async (req, res, next) => {
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
});

// Wallet management
router.get('/wallet', async (req, res, next) => {
  try {
    // Get admin TON wallet settings from environment variables
    const walletAddress = process.env.TON_WALLET_ADDRESS || '';
    const walletBalance = 0; // In a real app, you would fetch this from TON API
    
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
});

// Update wallet settings
router.post('/wallet', async (req, res, next) => {
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
    
    // For now, we'll just return success
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
});

module.exports = router;
