'use strict';

/**
 * Created by rovrevik on 2/13/16.
 */

var request = require('supertest-as-promised');
var should = require('should');

var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var Promise = require('q').Promise;
var ObjectID = require('mongodb').ObjectID;

var contacts = require('../src/routes/contacts');
require('../src/models/contact');
var Contact = mongoose.model('Contact');

describe('Contacts API', function() {
    var app;
    var CONTACTS_API = '/api/contacts';

    beforeEach(function() {
        app = express();
        app.use(bodyParser.json());
        contacts(app, function(req, res, next) { next(); });
        return mongoose.connect('mongodb://localhost/contactsDemoTest');
    });

    afterEach(function() {
        return mongoose.disconnect();
    });

    before(removeAllContacts);

    describe('routes/verbs', function() {
        describe('Supported routes/verbs should respond with JSON', function() {
            function not404(res) {
                res.statusCode.should.not.equal(404);
            }

            it('responds to GET /contacts', function() {
                return request(app).get(CONTACTS_API).set('Accept', 'application/json').expect('Content-Type', /json/).then(not404);
            });
            it('responds to GET /contacts/:id with bogus id', function() {
                return request(app).get(CONTACTS_API + '/1').set('Accept', 'application/json').expect('Content-Type', /json/).expect(400);
            });
            it('responds to GET /contacts/:id with missing id', function() {
                return request(app).get(CONTACTS_API + '/'+ new ObjectID()).set('Accept', 'application/json').expect('Content-Type', /json/).expect(404);
            });
            it('responds to POST /contacts', function() {
                return request(app).post(CONTACTS_API).set('Accept', 'application/json').expect('Content-Type', /json/).then(not404);
            });
            it('responds to DELETE /contacts/:id with bogus id', function() {
                return request(app).delete(CONTACTS_API + '/1').set('Accept', 'application/json').expect('Content-Type', /json/).expect(400);
            });
            it('responds to DELETE /contacts/:id with missing id', function() {
                return request(app).delete(CONTACTS_API + '/' + new ObjectID()).set('Accept', 'application/json').expect('Content-Type', /json/).expect(404);
            });
            it('responds to PUT /contacts/:id with bogus id', function() {
                return request(app).put(CONTACTS_API + '/1').set('Accept', 'application/json').expect('Content-Type', /json/).expect(400);
            });
            it('responds to PUT /contacts/:id with missing id', function() {
                return request(app).put(CONTACTS_API + '/' + new ObjectID()).set('Accept', 'application/json').expect('Content-Type', /json/).expect(404);
            });

            it('responds to POST /contacts/:id with bogus id', function() {
                return request(app).post(CONTACTS_API + '/1').set('Accept', 'application/json').expect(400);
            });
            it('responds to POST /contacts/:id with missing id', function() {
                return request(app).post(CONTACTS_API + '/' + new ObjectID()).set('Accept', 'application/json').expect(404);
            });
        });

        describe('Unsupported routes/verbs are not found', function() {
            it('PUT to /contacts', function() {
                return request(app).put(CONTACTS_API).set('Accept', 'application/json').expect(404);
            });
            it('DELETE to /contacts', function() {
                return request(app).delete(CONTACTS_API).set('Accept', 'application/json').expect(404);
            });
        });
    });

    it('Should start off with no contacts', function() {
        return request(app)
            .get(CONTACTS_API)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .then(function(res) {
                res.body.length.should.be.empty();
            });
    });

    describe('GET (read) contacts', function() {
        //it('responds to /contacts', function() {
        //    return request(app)
        //        .get('/contacts')
        //        .set('Accept', 'application/json')
        //        .then(function(res) { return res.statusCode !=  200; })
        //        .expect('Content-Type', /json/);
        //});
    });

    describe('POST (create) contacts', function() {
        it('should POST on the happy path', function() {
            var contactDoc = {firstName: 'Post1', lastName: 'Post1'};
            return request(app)
                .post(CONTACTS_API)
                .send(contactDoc)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .then(function(res) {
                    var doc = res.body;
                    doc.createdAt.should.equal(doc.updatedAt);
                    doc.firstName.should.equal(contactDoc.firstName);
                    doc.lastName.should.equal(contactDoc.lastName);
                });
        });
        it('should not create duplicates', function() {
            var contactDoc = {firstName: 'Post2', lastName: 'Post2'};
            return request(app)
                .post(CONTACTS_API)
                .send(contactDoc)
                .set('Accept', 'application/json')
                .expect(200)
                .then(function(res) {
                    // true to create the same thing again
                    return request(app).post(CONTACTS_API)
                        .send(contactDoc)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(400);
                }).should.be.fulfilled();
        });
    });

    describe('DELETE (remove) contacts', function() {
        it('should DELETE on the happy path', function() {
            var contactDoc = {firstName: 'Delete1', lastName: 'Delete2'};
            return request(app)
                .post(CONTACTS_API)
                .send(contactDoc)
                .set('Accept', 'application/json')
                .expect(200)
                .then(function(res) {
                    var doc = res.body;
                    return request(app).delete('/api/contacts/' + doc._id)
                        .send(contactDoc)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200);
                }).should.be.fulfilled();
        });
    });

    describe('PUT (update) contacts', function() {
        it('should PUT on the happy path', function() {
            var contactDoc = {firstName: 'Put1', lastName: 'Put2'};
            return request(app)
                .post(CONTACTS_API)
                .send(contactDoc)
                .set('Accept', 'application/json')
                .expect(200)
                .then(function(res) {
                    var doc = res.body;
                    doc.firstName += 'Updated';
                    doc.lastName += 'Updated';
                    return request(app).put('/api/contacts/' + doc._id)
                        .send(doc)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200);
                }).then(function(res) {
                    var doc = res.body;
                    doc.createdAt.should.not.equal(doc.updatedAt);
                    doc.firstName.should.not.equal(contactDoc.firstName);
                    doc.lastName.should.not.equal(contactDoc.lastName);
                });
        });
    });

    function removeAllContacts() {
        return Promise.all([
            mongoose.connect('mongodb://localhost/contactsDemoTest'),
            // TODO just drop the collection
            Contact.remove().exec().then(function() {
                return mongoose.disconnect();
            })
        ]);
    }
});
