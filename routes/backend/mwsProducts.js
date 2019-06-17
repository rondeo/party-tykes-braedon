const express = require('express');
const router = express.Router();
const productsApi = require('./../../controllers/backend/mwsApis/mwsProducts');
const { ensureAuthenticated } = require('../../config/auth');

router.get('/fetch-amazon-products',ensureAuthenticated, productsApi.fetchAmazonProducts);
//router.get('/fetch-amazonfees',ensureAuthenticated, productsApi.fetchAmazonProductfees);

module.exports = router;