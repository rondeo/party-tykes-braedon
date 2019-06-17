const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../../config/auth');

const orderFunctions = require('./../../controllers/backend/orders/index');

router.get('/all-orders',ensureAuthenticated, orderFunctions.showOrders);
router.get('/fetchOrdersByDate',ensureAuthenticated, orderFunctions.showOrdersByDate);
router.get('/fulfillment_orders',ensureAuthenticated, orderFunctions.fulfillmentOrders);
router.get('/get_fulfillmentDetails/:id',ensureAuthenticated, orderFunctions.fulfillmentDetails);
router.get('/get_tracking_details/:id',ensureAuthenticated, orderFunctions.trackingDetails);
router.get('/delete-order/:id',ensureAuthenticated, orderFunctions.deleteOrder);
router.get('/add-order',ensureAuthenticated, orderFunctions.addOrder);
router.post('/add-order',ensureAuthenticated, orderFunctions.postaddOrder);
module.exports = router;