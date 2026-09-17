const mongoose = require('mongoose');

const pumpLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['ON', 'OFF'],
      required: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    stoppedAt: {
      type: Date
    },
    durationMinutes: {
      type: Number,
      default: 0
    },
    estimatedWaterUsedLiters: {
      type: Number,
      default: 0
    },
    triggerType: {
      type: String,
      enum: ['MANUAL', 'AUTOMATIC'],
      default: 'MANUAL'
    }
  },
  {
    timestamps: true
  }
);

pumpLogSchema.index({ userId: 1, startedAt: -1 });

module.exports = mongoose.model('PumpLog', pumpLogSchema);
