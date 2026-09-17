const mongoose = require('mongoose');

const weatherLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    city: {
      type: String,
      default: 'Bengaluru'
    },
    temperature: {
      type: Number,
      required: true // in Celsius
    },
    humidity: {
      type: Number,
      required: true // in %
    },
    rainProbability: {
      type: Number,
      required: true,
      default: 0 // in %
    },
    windSpeed: {
      type: Number,
      default: 0 // in m/s
    },
    description: {
      type: String,
      default: 'Clear sky'
    },
    icon: {
      type: String,
      default: '01d'
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

weatherLogSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('WeatherLog', weatherLogSchema);
