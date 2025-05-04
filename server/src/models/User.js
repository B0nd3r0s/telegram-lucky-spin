
const mongoose = require('mongoose');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    default: ''
  },
  photoUrl: {
    type: String,
    default: ''
  },
  balance: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  referralCode: {
    type: String,
    unique: true,
    default: function() {
      return crypto.randomBytes(6).toString('hex');
    }
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referralBalance: {
    type: Number,
    default: 0
  },
  referralCount: {
    type: Number,
    default: 0
  },
  walletAddress: {
    type: String,
    default: null
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create index for efficient queries
UserSchema.index({ telegramId: 1 });
UserSchema.index({ referralCode: 1 });

const User = mongoose.model('User', UserSchema);

module.exports = User;
