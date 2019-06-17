const express = require('express');
const router = express.Router();
const {ensureAuthenticated} = require('../../config/auth');

const cmsFunctions = require('./../../controllers/backend/cms/index');

router.get('/all-pages',ensureAuthenticated, cmsFunctions.showAllPages);
router.get('/add-page',ensureAuthenticated, cmsFunctions.addPage);
router.post('/add-page',ensureAuthenticated, cmsFunctions.postPage);
router.get('/edit-page/:id',ensureAuthenticated, cmsFunctions.getEditPage);
router.post('/edit-page/:id',ensureAuthenticated, cmsFunctions.postEditPage);
router.get('/delete-page/:id',ensureAuthenticated, cmsFunctions.deletePage);
router.get('/change-page-status',ensureAuthenticated, cmsFunctions.togglePageStatus);

module.exports = router;