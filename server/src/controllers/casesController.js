
const { selectGiftByProbability } = require('../utils/telegramUtils');

// Get all active cases
exports.getCases = async (req, res, next) => {
  try {
    const { supabase } = req;
    
    const { data: cases, error } = await supabase
      .from('cases')
      .select('*, possibleGifts:possible_gifts(*)')
      .eq('is_active', true);
    
    if (error) {
      return res.status(500).json({ message: 'Failed to fetch cases', error });
    }
    
    res.status(200).json(cases);
  } catch (error) {
    next(error);
  }
};

// Get a specific case by ID
exports.getCaseById = async (req, res, next) => {
  try {
    const { supabase } = req;
    
    const { data: caseItem, error } = await supabase
      .from('cases')
      .select('*, possibleGifts:possible_gifts(*)')
      .eq('id', req.params.id)
      .single();
    
    if (error || !caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    if (!caseItem.is_active) {
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
    const { supabase } = req;
    const user = req.user;
    
    if (!caseId) {
      return res.status(400).json({ message: 'Case ID is required' });
    }
    
    // Begin a Supabase transaction
    // Note: Supabase JS client doesn't support transactions directly
    // We'll use multiple operations and handle errors carefully
    
    // Get the case
    const { data: caseItem, error: caseError } = await supabase
      .from('cases')
      .select('*, possibleGifts:possible_gifts(*)')
      .eq('id', caseId)
      .single();
    
    if (caseError || !caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    if (!caseItem.is_active) {
      return res.status(400).json({ message: 'This case is no longer available' });
    }
    
    // Check if user has enough balance
    if (user.balance < caseItem.price) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    
    // Select a gift based on probabilities
    const selectedGift = selectGiftByProbability(caseItem.possibleGifts);
    
    // Create a transaction for the case purchase
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'case_purchase',
        amount: -caseItem.price, // Negative amount for spending
        status: 'completed',
        case_id: caseItem.id
      })
      .select()
      .single();
    
    if (transactionError) {
      return res.status(500).json({ message: 'Failed to create transaction', error: transactionError });
    }
    
    // Create the gift in user's inventory
    const { data: gift, error: giftError } = await supabase
      .from('gifts')
      .insert({
        user_id: user.id,
        case_id: caseItem.id,
        name: selectedGift.name,
        image_url: selectedGift.image_url,
        value: selectedGift.value,
        is_withdrawn: false
      })
      .select()
      .single();
    
    if (giftError) {
      return res.status(500).json({ message: 'Failed to create gift', error: giftError });
    }
    
    // Update user balance
    const { error: userError } = await supabase
      .from('users')
      .update({ balance: user.balance - caseItem.price })
      .eq('id', user.id);
    
    if (userError) {
      return res.status(500).json({ message: 'Failed to update balance', error: userError });
    }
    
    // Update gift with additional display info
    const giftToReturn = {...gift, caseName: caseItem.name};
    
    // Return the gift to the user
    res.status(200).json({
      message: 'Case opened successfully',
      gift: giftToReturn
    });
  } catch (error) {
    next(error);
  }
};
