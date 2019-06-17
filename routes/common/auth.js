const express = require('express');
const passport = require('passport');
const router = express.Router();
const { ensureAuthenticated } = require('./../../config/auth');
const authFunctions = require('./../../controllers/common/auth/index');

router.get('/sign-up', authFunctions.signup);
router.post('/register', authFunctions.register);
router.post('/authenticate', authFunctions.authenticate);
router.get('/userProfile', authFunctions.userProfile);
router.get('/logout', authFunctions.logoutFunction);
router.get('/forgot-password', authFunctions.resetPassword);
router.post('/forgot-password', authFunctions.submitEmail);
router.get('/reset-password', authFunctions.resetNewPassword);
router.post('/reset-password', authFunctions.saveNewPassword);
router.get('/get-credentials', authFunctions.getCredentials);
router.get('/skipCredentials', authFunctions.skipCredentials);
router.post('/submit-credentials', authFunctions.submitCredentials);

module.exports = router;