const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../../config/auth');

const chartFunctions = require('./../../controllers/backend/charts/index');

router.get('/show-charts',ensureAuthenticated, chartFunctions.showCharts);

module.exports = router;