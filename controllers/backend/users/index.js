const mongoose = require('mongoose');
const User = mongoose.model('User');
const uuid = require('uuid/v4');
const bcrypt = require('bcryptjs');
const config = require('config');
const accessKey = config.get('MWS_ACCESS_KEY');
const accessSecret = config.get('MWS_ACCESS_SECRET');
var amazonMws = require('amazon-mws')(accessKey, accessSecret);


module.exports.getAllUsers = (req, res, next) => {
    var userData = [];

    User.find({role : 'seller'}, function (err, users) {

        users.forEach(function (user) {
            userData.push({
                '_id': user._id,
                'username': user.username,
                'useremail': user.email,
                'role': user.role,
                'status': user.status
            });
        });
        res.render('users/all-users', { users: userData, request_url: 'manage_users', user: req.session.name, email: req.session.email, role: req.session.role});
    });
}

module.exports.addUser = (req, res, next) => {
    var user = req.session.name;
    var email = req.session.email;
    var role = req.session.role;
    res.render('users/addMoreUsers', { request_url: 'add_user', user: user, email: email, role: role});
}

module.exports.postUser = (req, res, next) => {

    var custom_pass = uuid();

    var user = new User();

    user.username = req.body.username;
    user.email = req.body.email;
    user.password = custom_pass;
    user.status = req.body.status;
    user.role = req.body.role;

    user.save((err, doc) => {
        if (!err)
            res.render('dashboard/dashboard', { myname: req.body.username });
        else {
            if (err.code == 11000)
                res.status(422).send(['Duplicate email adrress found.']);
            else
                return next(err);
        }
    });
}

module.exports.editAccount = (req, res, next) => {
    res.render('users/edit_account', { request_url: 'dashboard', userType:req.session.userType, user: req.session.name, email: req.session.email, role: req.session.role });
}

module.exports.postAccount = (req, res, next) => {
    User.findByIdAndUpdate(req.session.userid, req.body, (err) => {
        if (err) {
            console.log(err);
        }
        req.session.name = req.body.username;
        req.flash('success_msg', 'Profile edited successfully !');
        res.redirect('/users/edit_account');
    });  
}


module.exports.mwsuser = (req, res, next) => {
    // console.log("SESSION",req.session.AccessKey)
    // console.log("Session",req.session.AccessSecret)
    res.render('users/mws' , {AccessKey:req.session.AccessKey,AccessSecret:req.session.AccessSecret, Marketplace: req.session.Marketplace, email: req.session.email, user: req.session.name, request_url: 'dashboard', SellerID: req.session.SellerID, MwsToken: req.session.MwsToken, role: req.session.role});
}


module.exports.postmwsuser = (req, res, next) => {
    amazonMws.feeds.search({
        'Version': '2009-01-01',
        'Action': 'GetFeedSubmissionList',
        'SellerId': req.body.SellerID,
        'MWSAuthToken': req.body.Token,
    }, function (error, response) {
        if (error) {
            console.log('error', error);
            req.flash('error_msg', 'sorry! You are entering wrong credentials.');
            res.redirect('/users/mws');
            return;
        }
        User.findByIdAndUpdate(req.session.userid, req.body, (err) => {
           if (err) {
               console.log(err);
           }
           req.session.SellerID = req.body.SellerID;
           req.session.MwsToken = req.body.MwsToken;
           req.session.Marketplace = req.body.Marketplace;
           req.session.AccessKey = req.body.AccessKey;
           req.session.accessSecret = req.body.AccessSecret;
           req.flash('success_msg', 'Profile edited successfully !');
           res.redirect('/users/mws');
        });
    });  
}

module.exports.changePassword = (req, res, next) => {
    res.render('users/change_password', { user: req.user, request_url: 'dashboard', user: req.session.name, email: req.session.email, role: req.session.role});
}


module.exports.checkPassword = (req, res, next) => {
    User.findById({_id : req.session.userid}, function (err, users) {
        if(err) throw err;
        bcrypt.compare(req.body.old_password, req.session.password, (err, isMatch) => {
            // console.log(req.body.old_password)
            console.log(req.session.password)
          if (err) throw err;
          if (isMatch)
            return res.json(true);
          else
            return res.json(false);
        });
    });
}

module.exports.postChangePassword = (req, res, next) => {
    var hash = bcrypt.hashSync(req.body.password, 10);
    bcrypt.compare(req.body.password, hash, (err, isMatch) => {
        if (err) throw err;
        if (isMatch){
            User.update({_id : req.session.userid}, {$set : {password : hash}}, (err,response) => {
                if(err){
                    throw err;
                }
            })
            req.flash('success_msg', 'Profile edited successfully !');
            res.redirect('/users/edit_account');
           
        }
        else
            res.redirect('/users/edit_account');
    });
}

module.exports.toggleUserStatus = (req, res, next) => {
    User.findByIdAndUpdate(req.body.id, req.body, (err, data) => {
        if (err) throw err;
        res.json({ status: req.body.status });
    });
}

module.exports.deleteUser = (req, res, next) => {
    User.findByIdAndRemove(req.params.id, (err) => {
        if (err) return next(err);
        req.flash('success_msg', 'User deleted successfully !');
        res.redirect('/users/all-users');
    });
}

module.exports.postSellerId = (req, res, next) => {
    if(req.session.SellerID && req.session.SellerID == req.body.SellerID){
        return res.json(true);
    }
    User.find({SellerID : req.session.SellerID}, function (err, result) {
        if(err) throw err;
        if(result.length > 0)
            return res.json(false);
        else
            return res.json(true);
    });
}

module.exports.postMwsToken = (req, res, next) => {
    if(req.session.MwsToken && req.session.MwsToken == req.body.MwsToken){
        return res.json(true);
    }
    User.find({MwsToken : req.body.MwsToken}, function (err, result) {
        if(err) throw err;
        if(result.length > 0)
            return res.json(false);
        else
            return res.json(true);
    });
}
