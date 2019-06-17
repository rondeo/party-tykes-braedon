const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureAmazon } = require('../../config/auth');
const refundFunctions = require('./../../controllers/backend/refunds/index');

router.get('/show-refunds', ensureAuthenticated, refundFunctions.showAllRefunds);
router.get('/accept_refund/:id', ensureAuthenticated, refundFunctions.acceptRefunds);
router.post('/accept_refund', ensureAuthenticated, refundFunctions.postAcceptRefunds);
router.get('/refund_details/:id', ensureAuthenticated, refundFunctions.getRefundDetails);

module.exports = router;