const express = require('express');
const router = express.Router();
const frontauth = require('./../../config/frontauth');
const productFunctions = require('./../../controllers/frontend/productsManagement/index');

router.post('/productFinder', frontauth, productFunctions.productFinder);
router.post('/checkLowestPrices', frontauth, productFunctions.checkLowestPrices);
router.get('/getProducts', frontauth, productFunctions.fetchAllProducts);
// router.get('/syncProducts', frontauth, productFunctions.syncProducts);
router.post('/addProduct', frontauth, productFunctions.addNewProduct);
router.post('/productFee', frontauth, productFunctions.checkProductFees);
router.post('/lowestPricesForInventoryData', frontauth, productFunctions.lowestPricesForInventoryData);
router.post('/productEvaluation', frontauth, productFunctions.productEvaluation);

module.exports = router;