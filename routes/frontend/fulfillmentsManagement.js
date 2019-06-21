const express = require('express');
const router = express.Router();
const frontauth = require('./../../config/frontauth');
const fulfiilmentFunctions = require('./../../controllers/frontend/fulfillmentsManagement/index');

router.get('/fulfillmentOrders', frontauth, fulfiilmentFunctions.getFulfillmentOrders);
router.post('/fulfillmentDetails', frontauth, fulfiilmentFunctions.getFulfillmentDetails);

module.exports = router;