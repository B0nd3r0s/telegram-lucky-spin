
const express = require('express');
const router = express.Router();
const { calculateUpgrade } = require('../utils/telegramUtils');
const Gift = require('../models/Gift');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Upgrade gifts
router.post('/combine', async (req, res, next) => {
  try {
    const { giftIds } = req.body;
    const mode = req.body.mode || 'combine'; // 'combine' or 'upgrade'
    
    if (!giftIds || !Array.isArray(giftIds)) {
      return res.status(400).json({ message: 'Gift IDs are required' });
    }
    
    // Check if the mode is valid
    if (mode === 'combine' && giftIds.length !== 2) {
      return res.status(400).json({ message: 'Combine mode requires exactly 2 gifts' });
    }
    
    if (mode === 'upgrade' && giftIds.length !== 1) {
      return res.status(400).json({ message: 'Upgrade mode requires exactly 1 gift' });
    }
    
    // Get the gifts
    const gifts = await Gift.find({
      _id: { $in: giftIds },
      user: req.user._id,
      isWithdrawn: false
    });
    
    // Check if all gifts were found
    if (gifts.length !== giftIds.length) {
      return res.status(400).json({ message: 'One or more gifts not found or already withdrawn' });
    }
    
    // Calculate the upgrade result
    const result = calculateUpgrade(gifts, mode);
    
    // Create a new gift for the user
    const newGift = new Gift({
      user: req.user._id,
      case: gifts[0].case, // Use the case of the first gift
      name: `TON x${result.value}`,
      imageUrl: '/images/ton.png', // Use a generic TON image
      value: result.value,
      isWithdrawn: false
    });
    
    await newGift.save();
    
    // Mark original gifts as withdrawn
    await Gift.updateMany(
      { _id: { $in: giftIds } },
      { $set: { isWithdrawn: true } }
    );
    
    // Create transaction for the upgrade
    await Transaction.create({
      user: req.user._id,
      type: 'upgrade',
      amount: 0, // No immediate financial impact
      status: 'completed',
      gift: newGift._id,
      notes: `Upgraded ${giftIds.length} gifts with ${mode} mode. Result: ${result.success ? 'success' : 'failure'}`
    });
    
    res.json({
      message: 'Upgrade successful',
      result,
      newGift
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
