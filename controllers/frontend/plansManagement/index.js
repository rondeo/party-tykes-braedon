const PlanSchema = require('./../../../models/plans');

module.exports.viewAllPlans = async (req, res, next) => {

    const planData = await PlanSchema.find({});

    res.json({ success: true, plans: planData })
}