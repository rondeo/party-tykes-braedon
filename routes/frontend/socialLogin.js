const express = require('express');
const router = express.Router();
const socialAuthFunctions = require('./../../controllers/frontend/socialLogin/index');

router.post('/google', socialAuthFunctions.googleLogin);
router.post('/facebook', socialAuthFunctions.facebookLogin);

module.exports = router;