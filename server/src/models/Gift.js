
const mongoose = require('mongoose');

const GiftSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  isWithdrawn: {
    type: Boolean,
    default: false
  },
  withdrawalTxHash: {
    type: String,
    default: null
  },
  withdrawalTimestamp: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Create index for efficient queries
GiftSchema.index({ user: 1 });
GiftSchema.index({ isWithdrawn: 1 });
GiftSchema.index({ createdAt: -1 });

const Gift = mongoose.model('Gift', GiftSchema);

module.exports = Gift;
