const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const passport = require("passport");
const flash = require("connect-flash");
const session = require("express-session");
const clientSession = require("client-sessions");
const appdocs = require("./routes/backend/index");
const cors = require("cors");
const bodyParser = require("body-parser");
const config = require("config");
const fileUpload = require('express-fileupload');
var cron = require('node-schedule');

// Initializing models before routes
require("./models/user.model");
require("./models/services");
require("./models/plans");
require("./models/pages");
require("./models/amazonOrders");
require("./models/amazonProducts");
require("./models/refunds");
require("./models/amazonFulfillmentOrders");
require("./models/fulfillmentReturn");

// Passport Config
require("./config/passport")(passport);

var mwsOrders = require('./controllers/backend/mwsApis/mwsOrders');
var mwsProduct = require('./controllers/backend/mwsApis/mwsProducts');

//--------------------------------------Route Imports------------------------------------------------

//------x------x------BACKEND------x------x-------
let amzn = require("./routes/backend/amazon");
let service = require("./routes/backend/services");
let plan = require("./routes/backend/plans");
let cms = require("./routes/backend/pages");
let order = require("./routes/backend/orders");
let product = require("./routes/backend/products");
let chart = require("./routes/backend/charts");
let sales = require("./routes/backend/sales");
let user = require("./routes/backend/users");
let refund = require("./routes/backend/refunds");
let fulfillments = require("./routes/backend/mwsOrdersFulfillments");
let dash = require("./routes/backend/dashboard");
let mwsRefunds = require("./routes/backend/mwsRefunds");
let mwsReports = require("./routes/backend/mwsReports");
let inventory = require('./routes/backend/inventory');
//------x------x-----COMMON------x-------x---------
let auth = require("./routes/common/auth");
let mwsOrder = require("./routes/backend/mwsOrders");
let mwsProducts = require("./routes/backend/mwsProducts");
//------x------x-----FRONTEND----x-------x----------
let emailCheck = require('./routes/frontend/emailManagement');
let social = require('./routes/frontend/socialLogin');
let passwordManagement = require('./routes/frontend/passwordManagement');
let businessInfo = require('./routes/frontend/businessDetails');
let sellerplans = require('./routes/frontend/plansManagement');
let payments = require('./routes/frontend/paymentManagement');
let mwsCredentials = require('./routes/frontend/mwsManagement');
let profile = require('./routes/frontend/profileManagement');
let sellerProducts = require('./routes/frontend/productsManagement');
let sellerOrders = require('./routes/frontend/ordersManagement');
let sellerTransactions = require('./routes/frontend/transactionsManagement');
let feeds = require('./routes/frontend/feedsManagement');
let sellerRefunds = require('./routes/frontend/refundsManagement');
//-------------------------------------------------------------------------------------------------------

// Initializing express app.
const app = express();
const router = express.Router();
app.use(cors({ origin: "http://localhost:3000" }));

// minutes and hours cron job for add products
// cron.scheduleJob('* 24,6,12,18 * * *', function () {
//     mwsProduct.fetchAmazonProducts();
// });

// //minutes and hours cron job for add orders
// cron.scheduleJob('* 4,10,16,22 * * *', function () {
//     mwsOrders.fetchAmazonOrders();
// });

// cron.scheduleJob('*/10 * * * *', () => {
//     mwsProduct.fetchAmazonProducts();
// });

//minutes and hours cron job for add orders
// cron.scheduleJob('*/10 * * * *', () => {
//     mwsOrders.fetchAmazonOrders();
// });

// Connect to MongoDB
mongoose
    .connect(config.get("mongoURI"), { useNewUrlParser: true, useCreateIndex: true })
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

// Setting layouts.
app.set("view engine", "ejs");
app.set("view options", { layout: false });

// Setting static public directory.
app.use(express.static("./public"));
app.use(expressLayouts);
app.use(fileUpload());

// Setting sessions
app.use(
    clientSession({
        cookieName: "session",
        secret: config.get("SESSION_SECRET"),
        duration: 30 * 60 * 10000,
        activeDuration: 30 * 60 * 10000,
        httpOnly: true,
        secure: true,
        ephemeral: true,
        maxAge: 30 * 60 * 10000
    })
);

// Express body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(express.urlencoded({limit : '50mb'}));

// For Swagger.io
app.use("/index", appdocs);

// Express session
app.use(
    session({
        secret: "secret",
        resave: true,
        saveUninitialized: true
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables                     
app.use(function (req, res, next) {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    next();
});


//--------------------------------------------ROUTES-------------------------------------------------
app.get("/template", (req, res) => {
    console.log("hello")
    res.render("users/html.ejs", { layout: "frontend" });
})

//x------------x-------------COMMON--------------x---------------x
app.use("/auth", auth);

//x-------------x------------BACKEND-------------x---------------x
app.get("/landingPage", (req, res) => {
    if (req.session.name) res.redirect("dashboard/show-dashboard");
    else res.render("users/login-user", { layout: "frontend" });
});
app.use("/amazon", amzn);
app.use("/services", service);
app.use("/plans", plan);
app.use("/cms", cms);
app.use("/charts", chart);
app.use("/sales", sales);
app.use("/orders", order);
app.use("/products", product);
app.use("/users", user);
app.use("/refunds", refund);
app.use("/fulfillments", fulfillments);
app.use("/dashboard", dash);
app.use("/orders", mwsOrder);
app.use("/products", mwsProducts);
app.use("/reports", mwsReports);
app.use("/refunds", mwsRefunds);
app.use("/payment", payments);
app.use('/inventory', inventory);

//x-------------x------------FRONTEND-------------x---------------x-------------
app.use('/emails', emailCheck);
app.use('/social', social);
app.use('/password', passwordManagement);
app.use('/business', businessInfo);
app.use('/seller/plans', sellerplans);
app.use('/mws', mwsCredentials);
app.use('/profile', profile);
app.use('/sellerProducts', sellerProducts);
app.use('/sellerOrders', sellerOrders);
app.use('/sellerTransactions', sellerTransactions);
app.use('/feeds', feeds);
app.use('/sellerRefunds', sellerRefunds);
//-----------------------------------------------------------------------------------------------------

// const PORT = process.env.PORT || 4000;
const PORT = "54.183.146.39"

app.listen(PORT, console.log(`Server started on port ${PORT}`));
