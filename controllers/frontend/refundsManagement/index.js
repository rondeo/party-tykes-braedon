const RefundSchema = require('./../../../models/refunds');

module.exports.fetchRefunds = (req, res) => {

    RefundSchema.find({}, (err, refunds) => {
        if (err) {
            res.status(404).json({ message: 'Error while fetching refunds list' });
        } else {
            res.json({ data: refunds, success: true });
        }
    })
}