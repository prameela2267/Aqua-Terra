require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'smart_irrigation_super_secure_jwt_secret_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || '',
  DEFAULT_CITY: process.env.DEFAULT_CITY || 'Bengaluru',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
