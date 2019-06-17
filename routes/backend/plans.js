const express = require('express');
const router = express.Router();
const { ensureAuthenticated, ensureAmazon } = require('../../config/auth');

const planFunctions = require('./../../controllers/backend/plans/index');

router.get('/all-plans', ensureAuthenticated, planFunctions.showAllPlans);
router.get('/add-plan', ensureAuthenticated, planFunctions.addPlan);
router.post('/add-plan', ensureAuthenticated, planFunctions.submitPlan);
router.get('/edit-plan/:id', ensureAuthenticated, planFunctions.getEditPlan);
router.post('/edit-plan/:id', ensureAuthenticated, planFunctions.postEditPlan);
router.get('/delete-plan/:id', ensureAuthenticated, planFunctions.deletePlan);
router.post('/change-plan-status', ensureAuthenticated, planFunctions.togglePlanStatus);

module.exports = router;