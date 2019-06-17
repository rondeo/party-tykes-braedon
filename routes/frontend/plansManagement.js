const express = require('express');
const router = express.Router();
const plansFunctions = require('./../../controllers/frontend/plansManagement/index');

router.get('/viewPlans', plansFunctions.viewAllPlans);

module.exports = router;