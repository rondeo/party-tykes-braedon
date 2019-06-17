const express = require('express');
const router = express.Router();
const frontauth = require('./../../config/frontauth');
const passwordFunctions = require('./../../controllers/frontend/passwordManagement/index');

router.post('/forgot', passwordFunctions.forgotPassword);
router.post('/verifyOtp', passwordFunctions.verifyOTP);
router.post('/resetPassword', passwordFunctions.resetPassword);

module.exports = router;