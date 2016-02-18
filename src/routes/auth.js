'use strict';

/**
 * Created by rovrevik on 2/12/16.
 */

var express = require('express');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var expressjwt = require('express-jwt');

var _ = require('lodash');

require('../models/user');
var User = mongoose.model('User');

module.exports = function(app) {
    app.route('/api/auth/login').post(function(req, res, next) {
        if (req.body.username && req.body.password) {
            User.findOne({username: req.body.username}).exec().then(function(user) {
                if (user && (user.password_hashed === user.hashPassword(req.body.password))) {
                    var escaped = encodeURI(JSON.stringify(req.user));
                    var token = jwt.sign(escaped, 'wonderfullybogussecretvalue'); //, { expiresIn: 60*5 }); // 5 minutes
                    res.json({token: token});
                }
                else {
                    res.status(401).json({});
                }
            }).catch(function(err) {
                res.status(400).json({});
            });
        }
        else {
            res.status(400).json({});
        }
    });

    return {
        authenticated: expressjwt({secret: 'wonderfullybogussecretvalue'})
    };
};
