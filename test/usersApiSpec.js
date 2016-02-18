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

var users = require('../src/routes/users');
require('../src/models/user');
var User = mongoose.model('User');

describe('Users API', function() {
    var app;
    var USERS_API = '/api/users';

    beforeEach(function() {
        app = express();
        app.use(bodyParser.json());
        users(app, function(req, res, next) { next(); });
        return mongoose.connect('mongodb://localhost/contactsDemoTest');
    });

    afterEach(function() {
        return mongoose.disconnect();
    });

    before(removeAllUsers);

    describe('routes/verbs', function() {
        describe('Supported routes/verbs should respond with JSON', function() {
            function not404(res) {
                res.statusCode.should.not.equal(404);
            }

            it('responds to GET /users', function() {
                return request(app).get(USERS_API).set('Accept', 'application/json').expect('Content-Type', /json/).then(not404);
            });
            it('responds to GET /users/:username with missing username', function() {
                return request(app).get(USERS_API + '/bogus').set('Accept', 'application/json').expect('Content-Type', /json/).expect(404);
            });
            it('responds to POST /users', function() {
                return request(app).post(USERS_API).set('Accept', 'application/json').expect('Content-Type', /json/).then(not404);
            });
            it('responds to DELETE /users/:username with missing username', function() {
                return request(app).delete(USERS_API + '/bogus').set('Accept', 'application/json').expect('Content-Type', /json/).expect(404);
            });
            it('responds to PUT /users/:username with missing username', function() {
                return request(app).put(USERS_API + '/bogus').set('Accept', 'application/json').expect('Content-Type', /json/).expect(404);
            });

            it('responds to POST /users/:id with bogus id', function() {
                return request(app).post(USERS_API + '/bogus').set('Accept', 'application/json').expect(404);
            });
            it('responds to POST /users/:id with missing id', function() {
                return request(app).post(USERS_API + '/' + new ObjectID()).set('Accept', 'application/json').expect(404);
            });
        });

        describe('Unsupported routes/verbs are not found', function() {
            it('PUT to /users', function() {
                return request(app).put(USERS_API).set('Accept', 'application/json').expect(404);
            });
            it('DELETE to /users', function() {
                return request(app).delete(USERS_API).set('Accept', 'application/json').expect(404);
            });
        });
    });

    it('Should start off with no users', function() {
        return request(app)
            .get(USERS_API)
            .set('Accept', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .then(function(res) {
                res.body.length.should.be.empty();
            });
    });

    describe('GET (read) users', function() {
        //it('responds to /users', function() {
        //    return request(app)
        //        .get('/users')
        //        .set('Accept', 'application/json')
        //        .then(function(res) { return res.statusCode !=  200; })
        //        .expect('Content-Type', /json/);
        //});
    });

    describe('POST (create) users', function() {
        it('should POST on the happy path', function() {
            var userDoc = {username: 'Post1', password: 'Post1'};
            return request(app)
                .post(USERS_API)
                .send(userDoc)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .then(function(res) {
                    var doc = res.body;
                    doc.createdAt.should.equal(doc.updatedAt);
                    doc.username.should.equal(userDoc.username);
                    doc.roles.should.be.an.Array().with.length(0);
                    doc.should.not.have.property('password');
                    doc.should.not.have.property('password_hashed');
                });
        });
        it('should not create duplicates', function() {
            var userDoc = {username: 'Post2', password: 'Post2'};
            return request(app)
                .post(USERS_API)
                .send(userDoc)
                .set('Accept', 'application/json')
                .expect(200)
                .then(function(res) {
                    // true to create the same thing again
                    return request(app).post(USERS_API)
                        .send(userDoc)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(400);
                }).should.be.fulfilled();
        });
    });

    describe('DELETE (remove) users', function() {
        it('should DELETE on the happy path', function() {
            var userDoc = {username: 'Delete1', password: 'Delete2'};
            return request(app)
                .post(USERS_API)
                .send(userDoc)
                .set('Accept', 'application/json')
                .expect(200)
                .then(function(res) {
                    var doc = res.body;
                    return request(app).delete('/api/users/' + userDoc.username)
                        .send(userDoc)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200);
                }).then(function() {
                    return request(app).get('/api/users/' + userDoc.username)
                        .send(userDoc)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(404);
                }).should.be.fulfilled();
        });
    });

    describe('PUT (update) users', function() {
        it('should PUT on the happy path', function() {
            var userDoc = {username: 'Put1', password: 'Put2'};
            return request(app)
                .post(USERS_API)
                .send(userDoc)
                .set('Accept', 'application/json')
                .expect(200)
                .then(function(res) {
                    var doc = res.body;
                    doc.username += 'Updated';
                    doc.password += 'Updated';
                    return request(app).put('/api/users/' + userDoc.username)
                        .send(doc)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200);
                }).then(function(res) {
                    var doc = res.body;
                    doc.createdAt.should.not.equal(doc.updatedAt);
                    doc.username.should.not.equal(userDoc.username);
                    doc.should.not.have.property('password');
                    doc.should.not.have.property('password_hashed');
                    return request(app).put('/api/users/' + doc.username)
                        .send(doc)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200);
                });
        });
    });

    function removeAllUsers() {
        return Promise.all([
            mongoose.connect('mongodb://localhost/contactsDemoTest'),
            // TODO just drop the collection
            User.remove().exec().then(function() {
                return mongoose.disconnect();
            })
        ]);
    }
});
