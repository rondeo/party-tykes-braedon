const express = require('express');
const router = express.Router();
const frontauth = require('./../../config/frontauth');
const mwsFunctions = require('./../../controllers/frontend/mwsManagement/index');

router.post('/checkCredentials', mwsFunctions.checkCredentials);

module.exports = router;