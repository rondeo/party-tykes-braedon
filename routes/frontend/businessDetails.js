const express = require('express');
const router = express.Router();
// const frontauth = require('./../../config/frontauth');
const businessFunctions = require('./../../controllers/frontend/businessDetails/index');

router.post('/businessInfo', businessFunctions.addBusinessInfo);

module.exports = router;