const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = mongoose.model('User');

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {

      // console.log('--------------TESTING PASSPORT-----------------');
      // console.log('EMAIL --> ', email);
      // console.log('PASSWORD --> ', passport);

      // Match user
      User.findOne({
        email: email
      }).then(user => {
        //console.log('USER --> ',user);


        // if(user.role === 'seller'){

        // }


        if (!user) {
          console.log('user=============not exist');
          return done(null, false, { message: 'That email is not registered' });
        }
        if (user.status === 'inactive') {
          return done(null, false, { message: 'Your account is in-active. Please contact the support' });
        }

        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Password incorrect' });
          }
        });
      });
    })
  );

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
};
