const axios = require('axios');
const env = require('../config/env');
const WeatherLog = require('../models/WeatherLog');

/**
 * Weather Service
 * Connects to OpenWeatherMap API with automatic resilient fallback.
 */
class WeatherService {
  /**
   * Fetch current weather for a specific city or coordinates
   * @param {string} city
   * @param {string|ObjectId} userId
   * @param {boolean} logToDb - whether to save a snapshot to WeatherLog collection
   */
  async getWeatherData(city = 'Bengaluru', userId = null, logToDb = false) {
    const targetCity = city || env.DEFAULT_CITY || 'Bengaluru';
    let weatherData = null;

    if (env.OPENWEATHER_API_KEY && env.OPENWEATHER_API_KEY.trim() !== '') {
      try {
        const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
          params: {
            q: targetCity,
            units: 'metric',
            appid: env.OPENWEATHER_API_KEY
          },
          timeout: 4000
        });

        const data = response.data;
        const rainAmount = data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : 0;
        // Derive approximate rain probability percentage from clouds and rain volume
        let calculatedRainProb = 0;
        if (rainAmount > 0) {
          calculatedRainProb = Math.min(100, Math.round(50 + rainAmount * 20));
        } else if (data.clouds && data.clouds.all) {
          calculatedRainProb = Math.round(data.clouds.all * 0.45);
        }

        weatherData = {
          city: data.name || targetCity,
          temperature: +(data.main.temp.toFixed(1)),
          humidity: data.main.humidity,
          rainProbability: calculatedRainProb,
          windSpeed: +(data.wind.speed.toFixed(1)),
          description: data.weather[0] ? data.weather[0].description : 'Clear sky',
          icon: data.weather[0] ? data.weather[0].icon : '01d',
          source: 'OPENWEATHERMAP_LIVE'
        };
      } catch (err) {
        console.warn(`[WeatherService] OpenWeatherMap API call failed: ${err.message}. Using dynamic fallback.`);
      }
    }

    // Fallback if API key missing or error occurred
    if (!weatherData) {
      weatherData = this.generateSyntheticWeather(targetCity);
    }

    // Optionally record to WeatherLog in MongoDB
    if (logToDb && userId) {
      try {
        await WeatherLog.create({
          userId,
          city: weatherData.city,
          temperature: weatherData.temperature,
          humidity: weatherData.humidity,
          rainProbability: weatherData.rainProbability,
          windSpeed: weatherData.windSpeed,
          description: weatherData.description,
          icon: weatherData.icon,
          timestamp: new Date()
        });
      } catch (dbErr) {
        console.error('[WeatherService] Error logging weather snapshot:', dbErr.message);
      }
    }

    return weatherData;
  }

  /**
   * Realistic synthetic weather generator when API key is unconfigured.
   * Produces realistic diurnal weather fluctuations.
   */
  generateSyntheticWeather(city) {
    const hour = new Date().getHours();
    // Diurnal temperature swing: coolest at 5am, warmest at 2pm (14h)
    const baseTemp = 24.0;
    const tempVariation = Math.sin(((hour - 8) / 24) * 2 * Math.PI) * 6.5;
    const temperature = +(baseTemp + tempVariation + (Math.random() - 0.5) * 1.5).toFixed(1);

    // Humidity inversely correlates with temperature
    const humidity = Math.min(95, Math.max(35, Math.round(75 - tempVariation * 3.5 + (Math.random() - 0.5) * 5)));

    // Rain probability between 10% and 45%
    const rainProbability = Math.round(15 + Math.random() * 25);
    const windSpeed = +(2.5 + Math.random() * 3.5).toFixed(1);

    let description = 'Scattered clouds';
    let icon = '03d';

    if (rainProbability > 50) {
      description = 'Light passing rain';
      icon = '10d';
    } else if (temperature > 28) {
      description = 'Warm and sunny';
      icon = '01d';
    } else if (humidity > 70) {
      description = 'Humid with overcast skies';
      icon = '04d';
    }

    return {
      city: city || 'Bengaluru',
      temperature,
      humidity,
      rainProbability,
      windSpeed,
      description,
      icon,
      source: 'SYNTHETIC_REALISTIC'
    };
  }

  /**
   * Seed historical weather logs for the past N days for analytics charts
   */
  async seedHistoricalWeather(userId, city = 'Bengaluru', days = 7) {
    const existing = await WeatherLog.countDocuments({ userId });
    if (existing >= 20) return;

    const logs = [];
    const now = Date.now();
    const points = days * 3;
    const intervalMs = (days * 24 * 60 * 60 * 1000) / points;

    for (let i = points; i >= 1; i--) {
      const timestamp = new Date(now - i * intervalMs);
      const hour = timestamp.getHours();
      const tempVariation = Math.sin(((hour - 8) / 24) * 2 * Math.PI) * 6.5;
      const temperature = +(24.0 + tempVariation + (Math.random() - 0.5) * 2).toFixed(1);
      const humidity = Math.min(95, Math.max(35, Math.round(70 - tempVariation * 3)));
      const rainProbability = Math.round(10 + Math.random() * 35);

      logs.push({
        userId,
        city,
        temperature,
        humidity,
        rainProbability,
        windSpeed: +(2.0 + Math.random() * 3.0).toFixed(1),
        description: rainProbability > 35 ? 'Moderate clouds' : 'Clear sky',
        icon: rainProbability > 35 ? '04d' : '01d',
        timestamp
      });
    }

    await WeatherLog.insertMany(logs);
    console.log(`[WeatherService] Seeded ${logs.length} historical weather logs for user ${userId}`);
  }
}

module.exports = new WeatherService();
