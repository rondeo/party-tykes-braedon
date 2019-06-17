const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../../config/auth');

const dashboardFunctions = require('./../../controllers/backend/dashboard/index');

router.get('/show-dashboard', ensureAuthenticated, dashboardFunctions.showDashboard);

module.exports = router;