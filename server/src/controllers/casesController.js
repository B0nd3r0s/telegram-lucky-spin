
const Case = require('../models/Case');
const Gift = require('../models/Gift');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { selectGiftByProbability } = require('../utils/telegramUtils');

// Get all active cases
exports.getCases = async (req, res, next) => {
  try {
    const cases = await Case.find({ isActive: true });
    res.status(200).json(cases);
  } catch (error) {
    next(error);
  }
};

// Get a specific case by ID
exports.getCaseById = async (req, res, next) => {
  try {
    const caseItem = await Case.findById(req.params.id);
    
    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    if (!caseItem.isActive) {
      return res.status(400).json({ message: 'This case is no longer available' });
    }
    
    res.status(200).json(caseItem);
  } catch (error) {
    next(error);
  }
};

// Open a case and get a gift
exports.openCase = async (req, res, next) => {
  try {
    const { caseId } = req.body;
    const user = req.user;
    
    if (!caseId) {
      return res.status(400).json({ message: 'Case ID is required' });
    }
    
    const caseItem = await Case.findById(caseId);
    
    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    if (!caseItem.isActive) {
      return res.status(400).json({ message: 'This case is no longer available' });
    }
    
    // Check if user has enough balance
    if (user.balance < caseItem.price) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    
    // Select a gift based on probabilities
    const selectedGift = selectGiftByProbability(caseItem.possibleGifts);
    
    // Create a transaction for the case purchase
    const transaction = new Transaction({
      user: user._id,
      type: 'case_purchase',
      amount: -caseItem.price, // Negative amount for spending
      status: 'completed',
      case: caseItem._id
    });
    
    // Create the gift in user's inventory
    const gift = new Gift({
      user: user._id,
      case: caseItem._id,
      name: selectedGift.name,
      imageUrl: selectedGift.imageUrl,
      value: selectedGift.value,
      isWithdrawn: false
    });
    
    // Update user balance
    user.balance -= caseItem.price;
    
    // Save all changes in a transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      await transaction.save({ session });
      await gift.save({ session });
      await user.save({ session });
      
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
    
    // Update gift with additional display info
    const giftToReturn = gift.toObject();
    giftToReturn.caseName = caseItem.name;
    
    // Return the gift to the user
    res.status(200).json({
      message: 'Case opened successfully',
      gift: giftToReturn
    });
  } catch (error) {
    next(error);
  }
};
