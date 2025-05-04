
const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'case_purchase', 'referral'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'canceled'],
    default: 'pending'
  },
  txHash: {
    type: String,
    default: null
  },
  gift: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gift',
    default: null // Only for withdrawals
  },
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    default: null // Only for case purchases
  },
  referral: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Only for referral rewards
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Create index for efficient queries
TransactionSchema.index({ user: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ createdAt: -1 });

const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction;
