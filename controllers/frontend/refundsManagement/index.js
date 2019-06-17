module.exports.fetchRefunds = (req,res) => {
    
    const {id} = req.user;

    res.send('Refunds API in place');
}