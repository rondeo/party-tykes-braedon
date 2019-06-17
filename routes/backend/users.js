const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../../config/auth');
const { ensureAuthenticatedAdmin } = require('../../config/auth');
const userFunctions = require('./../../controllers/backend/users/index');

router.get('/all-users', ensureAuthenticated, userFunctions.getAllUsers);
router.get('/add-user', ensureAuthenticated, userFunctions.addUser);
router.post('/add-user', ensureAuthenticated, userFunctions.postUser);
router.get('/edit_account', ensureAuthenticated, userFunctions.editAccount);
router.post('/edit_account', ensureAuthenticated, userFunctions.postAccount);
router.get('/change_password', ensureAuthenticated, userFunctions.changePassword);
router.post('/change_password', ensureAuthenticated, userFunctions.postChangePassword);
router.post('/check_password', ensureAuthenticated, userFunctions.checkPassword);
router.get('/mws',ensureAuthenticated, userFunctions.mwsuser);
router.post('/mws',ensureAuthenticated,userFunctions.postmwsuser);
router.post('/check_sellerid',ensureAuthenticated,userFunctions.postSellerId);
router.post('/check_mws_token',ensureAuthenticated,userFunctions.postMwsToken);
router.post('/change-user-status', ensureAuthenticated, userFunctions.toggleUserStatus);
router.get('/delete-user/:id', ensureAuthenticated, userFunctions.deleteUser);

module.exports = router;