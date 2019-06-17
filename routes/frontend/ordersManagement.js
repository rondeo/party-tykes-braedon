const express = require('express');
const router = express.Router();
const orderFunctions = require('./../../controllers/frontend/ordersManagement/index');
const frontauth = require('./../../config/frontauth');

router.get('/getOrders', frontauth, orderFunctions.fetchAllOrders);
router.post('/ordersByDuration', frontauth, orderFunctions.ordersByDuration);

module.exports = router;