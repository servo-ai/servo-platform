var express = require('express');
var router = express.Router();
var config = require('../config');
var passport = require('passport');
var FBStrategy = require('passport-facebook').Strategy;
var UserModel = require('../models/user-model');
var DAL = require("../dal/router");
var Promise = require("bluebird");

// function initPassport(app) {

//     passport.use(new FBStrategy({
//         clientID: config.facebook.login.clientID,
//         clientSecret: config.facebook.login.clientSecret,
//         callbackURL: 'https://' + config.serverBaseDomain + '/login/facebook/return',
//         profileFields: ["id", "emails", "birthdate", "name"]
//     },
//         function (accessToken, refreshToken, profile, cb) {
//             // In this example, the user's Facebook profile is supplied as the user
//             // record.  In a production-quality application, the Facebook profile should
//             // be associated with a user record in the application's database, which
//             // allows for account linking and authentication with other identity
//             // providers.
//             return cb(null, profile);
//         }));

//     // Configure Passport authenticated session persistence.
//     //
//     // In order to restore authentication state across HTTP requests, Passport needs
//     // to serialize users into and deserialize users out of the session.  In a
//     // production-quality application, this would typically be as simple as
//     // supplying the user ID when serializing, and querying the user record by ID
//     // from the database when deserializing.  However, due to the fact that this
//     // example does not have a database, the complete Facebook profile is serialized
//     // and deserialized.
//     passport.serializeUser(function (user, cb) {
//         //UserModel.create()
//         //DAL.Users.upsert();
//         DAL.Users.getByFacebookID(user.id).then(function (userObj) {
//             cb(null, userObj)
//         }).catch(function (err) {
//             if (err === 0) {
//                 var userObj = new UserModel(user.displayName, user.email, user.id, null, null, Date.now(), Date.now());
//                 DAL.Users.upsert(userObj).then(function (userObj) {
//                     cb(null, userObj);
//                 });
//             } else {
//                 cb(null, {});
//             }
//         });
//     });

//     passport.deserializeUser(function (obj, cb) {
//         cb(null, obj);
//     });

//     // Initialize Passport and restore authentication state, if any, from the
//     // session.
//     app.use(passport.initialize());
//     app.use(passport.session());
// }

//router.get("/facebook", passport.authenticate('facebook'));
router.get("/facebook", function (req, res) {
    return new Promise((resolve, reject) => {
        var user = req.params.user;
        DAL.Users.getByFacebookID(user.facebookID).then(function (userObj) {
            resolve(userObj)
        }).catch(function (err) {
            if (err === 0) {
                var userObj = new UserModel(user.displayName, user.email, user.id, null, null, Date.now(), Date.now());
                DAL.Users.upsert(userObj).then(function (userObj) {
                    resolve(userObj);
                });
            } else {
                resolve({});
            }
        });
    });
});

// router.get("/facebook/return",
//     passport.authenticate('facebook', { failureRedirect: '/login/facebook', successRedirect: 'http://localhost:8000' /*'https://' + config.serverBaseDomain*/ })
// )

// router.get('/profile',
//     function (req, res) {
//         res.send({ user: req.user });
//     }
// )

module.exports = {
    initPassport,
    router
}