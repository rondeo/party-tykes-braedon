const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../../config/auth');

const serviceFunctions = require('./../../controllers/backend/services/index');

router.get('/all-services', ensureAuthenticated, serviceFunctions.showAllServices);
router.get('/add-service', ensureAuthenticated, serviceFunctions.addService);
router.post('/add-service', ensureAuthenticated, serviceFunctions.postService);
router.get('/edit-service/:id', ensureAuthenticated, serviceFunctions.getEditRequest);
router.post('/edit-service/:id', ensureAuthenticated, serviceFunctions.postEditRequest);
router.get('/delete-service/:id', ensureAuthenticated, serviceFunctions.deleteService);
router.post('/change-service-status',ensureAuthenticated, serviceFunctions.toggleServiceStatus);

module.exports = router;