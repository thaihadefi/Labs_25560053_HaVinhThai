const express = require('express');
const router = express.Router();
const { getWeather } = require('../controllers/weather.controller');

router.get('/', getWeather);

module.exports = router;
