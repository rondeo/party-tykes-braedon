const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../../config/auth');

const productFunctions = require('./../../controllers/backend/products/index');


// router.get('/all-products', ensureAuthenticated, productFunctions.showProducts);
router.get('/add-product', ensureAuthenticated, productFunctions.addProduct);
router.post('/add-product', ensureAuthenticated, productFunctions.postProduct);
router.get('/edit-product/:id', ensureAuthenticated, productFunctions.getEditProduct);
router.post('/edit-product/:id', ensureAuthenticated, productFunctions.postEditProduct);
router.get('/delete-product/:id', ensureAuthenticated, productFunctions.deleteProduct);
router.get('/product-search', ensureAuthenticated, productFunctions.searchProducts);
router.post('/show-results', ensureAuthenticated, productFunctions.showResults);
router.get('/list-products', ensureAuthenticated, productFunctions.listProducts);
router.get('/check-fees', ensureAuthenticated, productFunctions.checkFees);
router.get('/check-charges', ensureAuthenticated, productFunctions.checkCharges);
router.get('/check-stock', ensureAuthenticated, productFunctions.checkStock);
// router.get('/all-products', ensureAuthenticated, productFunctions.showProducts);
router.get('/add-product', ensureAuthenticated, productFunctions.addProduct);
router.post('/add-product', ensureAuthenticated, productFunctions.postProduct);
router.get('/edit-product/:id', ensureAuthenticated, productFunctions.getEditProduct);
router.post('/edit-product/:id', ensureAuthenticated, productFunctions.postEditProduct);
router.get('/delete-product/:id', ensureAuthenticated, productFunctions.deleteProduct);
router.get('/getLowestPricesOffersForProducts/:asin', ensureAuthenticated, productFunctions.getLowestPricesOffersForProducts);
router.get('/getProfitForProduct/:id', ensureAuthenticated, productFunctions.getProfitForProduct);
router.post('/getProfitForProduct/:id', ensureAuthenticated, productFunctions.postProfitForProduct);
router.get('/getproductsforsku/:id', ensureAuthenticated, productFunctions.getproductsforsku);
router.get('/product-search', ensureAuthenticated, productFunctions.searchProducts);
router.post('/show-results', ensureAuthenticated, productFunctions.showResults);
router.get('/getLowestPricesOffers/:asin', ensureAuthenticated, productFunctions.getLowestPricesOffers);
router.post('/addbuycost',ensureAuthenticated,productFunctions.addbuycost);
router.get('/reimbursements',ensureAuthenticated,productFunctions.getReimbursements);
router.get('/skuprofitability',ensureAuthenticated,productFunctions.skuprofitability);
// router.post('/skudateprofit',ensureAuthenticated,productFunctions.skudateprofit);

module.exports = router;