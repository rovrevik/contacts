'use strict';

/**
 * Created by rovrevik on 2/12/16.
 */

var express = require('express');
var mongoose = require('mongoose');

var _ = require('lodash');

require('../models/user');
var User = mongoose.model('User');

module.exports = function(app, requireAuthenticated) {
    app.route('/api/users').get(requireAuthenticated, function(req, res, next) {
        User.find().exec().then(function(users) {
            res.json(users);
        });
    }).post(function(req, res, next) {
        User.create(req.body).then(function(user) {
            res.json(user);
        }).catch(function(err) {
            errorPackage(err, res);
        });
    });

    app.route('/api/users/:username').all(requireAuthenticated, requireUser).get(function(req, res, next) {
        res.json(req.user);
    }).put(function(req, res, next) {
        _.assign(req.user, req.body);
        req.user.save().then(function(user) {
            res.json(user);
        }).catch(function(err) {
            errorPackage(err, res);
        });
    }).delete(function(req, res, next) {
        req.user.remove().then(function() {
            res.json(req.user);
        }).catch(function(err) {
            errorPackage(err, res);
        });
    });

    function errorPackage(e, res) {
        if (e.name === 'ValidationError') {
            res.status(400).json({error: e});
        }
        else if (e.name === 'MongoError') {
            res.status(400).json({error: e.toJSON()});
        }
        else {
            res.status(500).json({error: e});
        }
    }

    /**
     * ObjectId middleware
     */
    function userByUsername(req, res, next, username) {
        User.findOne({username: username}).exec().then(function(user) {
            req.user = user;
            next();
        }).catch(function(err) {
            next(err);
        });
    }

    function requireUser(req, res, next) {
        if (!req.user || req.user === 'undefined') {
            res.status(404).send({message: 'No User with that username has been found'});
        }
        else {
            next();
        }
    }

    app.param('username', userByUsername);
};
