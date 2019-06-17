const express = require('express');
const router = express.Router();
const feedFunctions = require('./../../controllers/frontend/feedsManagement/index');
const frontauth = require('./../../config/frontauth');

router.get('/submitFeed', feedFunctions.submitFeed);

module.exports = router;