const axios = require('axios');

// Set WEATHER_TIMEOUT_MS=1 to test the 504 timeout response
const TIMEOUT_MS = Number(process.env.WEATHER_TIMEOUT_MS) || 5000;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 2;             // the first call plus one retry

// city (lower-cased) -> { data, expiresAt }
const cache = new Map();

async function getCoordinatesForCity(city) {
  const response = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
    params: { name: city, count: 1 },
    timeout: TIMEOUT_MS
  });
  const result = response.data.results && response.data.results[0];
  if (!result) {
    const err = new Error(`City "${city}" was not found`);
    err.status = 404;
    throw err;
  }
  return { latitude: result.latitude, longitude: result.longitude, resolvedName: result.name };
}

async function fetchCurrentWeather(city) {
  const { latitude, longitude, resolvedName } = await getCoordinatesForCity(city);
  const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
    params: { latitude, longitude, current_weather: true },
    timeout: TIMEOUT_MS
  });
  const current = response.data.current_weather;
  return {
    city: resolvedName,
    temperatureC: current.temperature,
    windSpeedKmh: current.windspeed,
    observedAt: current.time
  };
}

// Calls the external API, retrying once on failure. A 404 is never retried:
// the city does not exist, so a second call would fail the same way.
async function fetchWithRetry(city) {
  for (let attempt = 1; ; attempt++) {
    const startedAt = Date.now();
    try {
      const weather = await fetchCurrentWeather(city);
      console.log(`External API call for "${city}" took ${Date.now() - startedAt}ms`);
      return weather;
    } catch (error) {
      console.log(`External API call for "${city}" failed after ${Date.now() - startedAt}ms ` +
        `(attempt ${attempt}/${MAX_ATTEMPTS}): ${error.code || error.message}`);
      if (error.status === 404 || attempt >= MAX_ATTEMPTS) throw error;
      console.log(`Retrying external API call for "${city}"...`);
    }
  }
}

async function getCurrentWeather(city) {
  const key = city.trim().toLowerCase();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`Cache hit for city: ${city}`);
    return cached.data;
  }

  const data = await fetchWithRetry(city.trim());
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}

module.exports = { getCurrentWeather };
