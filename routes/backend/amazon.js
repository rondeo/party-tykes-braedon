const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../../config/auth');

const amazonAuthFunctions = require('./../../controllers/backend/amazonLogin/index');

router.get('/amazon-login', amazonAuthFunctions.loginwithamazon);
router.get('/get-credentials-forAmazon', amazonAuthFunctions.getCredentialsForAmazon);
router.get('/skip-credentials-forAmazon', amazonAuthFunctions.skipCredentialsForAmazon);
router.post('/submit-credentials-forAmazon', amazonAuthFunctions.submitCredentialsForAmazon);

module.exports = router;