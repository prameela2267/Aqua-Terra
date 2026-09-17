const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    soilMoisture: {
      type: Number,
      required: true
    },
    weatherSnapshot: {
      temperature: { type: Number },
      humidity: { type: Number },
      rainProbability: { type: Number },
      windSpeed: { type: Number },
      description: { type: String }
    },
    decision: {
      type: String,
      enum: ['IRRIGATE_NOW', 'NO_IRRIGATION_NEEDED'],
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

recommendationSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);
