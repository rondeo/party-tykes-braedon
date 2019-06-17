const express = require('express');
const router = express.Router();
const transactionFunctions = require('./../../controllers/frontend/transactionsManagement/index');
const frontauth = require('./../../config/frontauth');

router.get('/getAllTransactions', frontauth, transactionFunctions.fetchAllTransactions);

module.exports = router;