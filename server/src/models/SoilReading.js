const mongoose = require('mongoose');

const soilReadingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    moisturePercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    sensorId: {
      type: String,
      default: 'SENSOR-SOIL-01'
    },
    source: {
      type: String,
      enum: ['SIMULATED', 'HARDWARE'],
      default: 'SIMULATED'
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

// Index for efficient chronological queries per user
soilReadingSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('SoilReading', soilReadingSchema);
