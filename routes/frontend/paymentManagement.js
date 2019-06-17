const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../../config/auth');
const paymentFunctions = require('../../controllers/frontend/paymentManagement/index');

router.post('/success', paymentFunctions.successfulPayment);
router.post('/cancelled', paymentFunctions.cancelledPayment);
// router.get('/success', paymentFunctions.paymentConfirmed);
// router.get('/cancel', paymentFunctions.paymentCancelled);

module.exports = router;