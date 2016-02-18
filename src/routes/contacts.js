'use strict';

/**
 * Created by rovrevik on 2/12/16.
 */

var express = require('express');
var mongoose = require('mongoose');
var _ = require('lodash');

require('../models/contact');
var Contact = mongoose.model('Contact');

module.exports = function(app, requireAuthenticated) {
    app.route('/api/contacts').all(requireAuthenticated).get(function(req, res, next) {
        Contact.find().exec().then(function(contacts) {
            res.json(contacts);
        });
    }).post(function(req, res, next) {
        Contact.create(req.body).then(function(contact) {
            res.json(contact);
        }).catch(function(err) {
            errorPackage(err, res);
        });
    });

    app.route('/api/contacts/:contactId').all(requireAuthenticated, requireContactId, requireContact).get(function(req, res, next) {
        res.json(req.contact);
    }).put(function(req, res, next) {
        _.assign(req.contact, req.body);
        req.contact.save().then(function(contact) {
            res.json(contact);
        }).catch(function(err) {
            errorPackage(err, res);
        });
    }).delete(function(req, res, next) {
        req.contact.remove().then(function() {
            res.json(req.contact);
        }).catch(function(err) {
            errorPackage(err, res);
        });
    });

    /**
     * ObjectId middleware
     */
    function contactById(req, res, next, id) {
        req.contactId = id;
        if (mongoose.Types.ObjectId.isValid(id)) {
            Contact.findById(id).exec().then(function(contact) {
                req.contact = contact;
                next();
            }).catch(function(err) {
                next(err);
            });
        }
        else {
            next();
        }
    }

    function requireContactId(req, res, next) {
        if (!req.contactId ) {
            res.status(404).send({message: 'No Contact with that username has been found'});
        }
        else if (!mongoose.Types.ObjectId.isValid(req.contactId)) {
            res.status(400).send({message: 'Id is invalid'});
        }
        else {
            next();
        }
    }

    function requireContact(req, res, next) {
        if (!req.contact) {
            res.status(404).send({message: 'No Contact with that username has been found'});
        }
        else {
            next();
        }
    }

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

    app.param('contactId', contactById);
};
