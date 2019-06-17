const express = require('express');
const router = express.Router();
const frontauth = require('./../../config/frontauth');
const emailFunctions = require('./../../controllers/frontend/emailManagement/index');

router.post('/otpConfirmation', emailFunctions.verifyOTP);
router.post('/resendOtp', emailFunctions.resendOTP);

module.exports = router;