const express = require('express');
const router = express.Router();
const profileFunctions = require('./../../controllers/frontend/profileManagement/index');
const frontauth = require('./../../config/frontauth');

router.post('/editProfile', profileFunctions.editProfile);
router.post('/changePassword', profileFunctions.changePassword);
router.get('/getCurrentUser', frontauth, profileFunctions.getUser);

module.exports = router;