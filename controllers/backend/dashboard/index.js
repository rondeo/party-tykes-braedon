//const localStorage = require('localStorage');
var AmazonOrdersSchema = require('./../../../models/amazonOrders');
var Decimal = require('decimal');
var format = require('date-format');

module.exports.showDashboard = async (req, res, next) => {
  console.log('req.session----------', req.session);

    var totalOrders = null;
    function sum(arr) {
        return arr.reduce(function (a, b) {
          return a + b;
        }, 0);
    }

    const order = await AmazonOrdersSchema.find({'userid' : req.session.userid});

    totalOrders = order.length;
    var profit = '';
    var week_profit = '';
    var week_arr = [];

    //for getting week profit
    var today = format('dd-MM-yyyy', new Date());
    var date1 = new Date();
    date1.setDate(date1.getDate() - 7);

    var dateString1 = format('dd-MM-yyyy', date1);
 
    const Orders_data  = await AmazonOrdersSchema.find({'userid' : req.session.userid});
    var arr = [];	

    for(var i = 0; i<Orders_data.length; i++){
       var Buycost = (Orders_data[i].buycost != NaN) ? Orders_data[i].buycost : 0;
       var SubTotal = (Orders_data[i].OrderTotal != NaN && Orders_data[i].OrderTotal != null) ? Orders_data[i].OrderTotal : 0;
       profit = parseFloat(Decimal(SubTotal).sub(Buycost));
   	   arr.push(profit);   
    }

    var total_profit = sum(arr);
    console.log('total_profit------', total_profit);
  
    await AmazonOrdersSchema.aggregate([
        { $match: {"userid" : req.session.userid, "PurchaseDate": {$gte: dateString1, $lt:today} } },         
      ])
      .exec(function(err, data) {
        for(var i=0; i < data.length; i++){
          var Buycost = (data[i].buycost != NaN) ? data[i].buycost : 0;
           var SubTotal = (data[i].OrderTotal != NaN && data[i].OrderTotal != null) ? data[i].OrderTotal : 0;
           week_profit = parseFloat(Decimal(SubTotal).sub(Buycost));
           week_arr.push(week_profit);
        }
        
        var total_week_profit = sum(week_arr);
        console.log('total_week_profit----', total_week_profit);
        res.render('dashboard/dashboard', {week_profit: total_week_profit, total_profit: total_profit, totalOrders: totalOrders, request_url: 'dashboard', user: req.session.name, email: req.session.email, role: req.session.role });
    });
  }