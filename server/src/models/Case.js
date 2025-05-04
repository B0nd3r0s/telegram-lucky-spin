
const mongoose = require('mongoose');

const PossibleGiftSchema = new mongoose.Schema({
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
  chance: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
});

const CaseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    default: ''
  },
  possibleGifts: {
    type: [PossibleGiftSchema],
    required: true,
    validate: {
      validator: function(gifts) {
        if (gifts.length === 0) return false;
        
        // Make sure chances sum to 100%
        const totalChance = gifts.reduce((sum, gift) => sum + gift.chance, 0);
        return Math.abs(totalChance - 100) < 0.01; // Allow small floating point error
      },
      message: 'Possible gifts must be provided and chances must sum to 100%'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Case = mongoose.model('Case', CaseSchema);

module.exports = Case;
