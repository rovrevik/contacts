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
var expressjwt = require('express-jwt');
var ObjectID = require('mongodb').ObjectID;

var auth = require('../src/routes/auth');
var users = require('../src/routes/users');
require('../src/models/user');
var User = mongoose.model('User');
var contacts = require('../src/routes/contacts');
require('../src/models/contact');
var Contact = mongoose.model('Contact');

describe('Authentication API', function() {
    var app;
    var AUTH_API = '/api/auth/login';
    var USERS_API = '/api/users';
    var CONTACTS_API = '/api/contacts';


    beforeEach(function() {
        app = express();
        app.use(bodyParser.json());

        expressjwt({secret: 'wonderfullybogussecretvalue'});

        var requireAuthenticated = auth(app).authenticated;
        users(app, requireAuthenticated);
        contacts(app, requireAuthenticated);

        return mongoose.connect('mongodb://localhost/contactsDemoTest').then();
    });

    afterEach(function() {
        return mongoose.disconnect().then();
    });

    before(removeAllUsers);

    describe('Authenticate', function() {
        it('no payload', function() {
            return request(app).post(AUTH_API).set('Accept', 'application/json')
                .expect('Content-Type', /json/).expect(400);
        });
        it('empty payload', function() {
            return request(app).post(AUTH_API).set('Accept', 'application/json')
                .send({}).expect('Content-Type', /json/).expect(400);
        });
        it('bogus user no password', function() {
            return request(app).post(AUTH_API).set('Accept', 'application/json')
                .send({username: 'frankzappa'}).expect('Content-Type', /json/).expect(400);
        });
        it('bogus user and password', function() {
            return request(app).post(AUTH_API).set('Accept', 'application/json')
                .send({username: 'frankzappa', password: 'sleepdirt'}).expect('Content-Type', /json/).expect(401);
        });
        it('happy path', function() {
            var userDoc1 = {username: 'user1', password: 'xxx'};
            var userDoc2 = {username: 'user2', password: 'yyy'};
            return User.create(userDoc1).then(function() {
                return User.create(userDoc2);
            }).then(function(user) {
                return request(app).post(AUTH_API).set('Accept', 'application/json')
                    .send(userDoc2).expect('Content-Type', /json/).expect(200);
            }).then(function(res) {
                res.body.should.have.a.property('token');
                //decode the token?
                return request(app).get(USERS_API).set('Authorization', 'Bearer ' + res.body.token)
                    .set('Accept', 'application/json').expect('Content-Type', /json/).expect(200);
            }).then(function(res) {
               res.body.should.be.an.Array().with.length(2);
            });
        });
    });

    describe('Unauthenticated Users API', function() {
        it('responds to GET /users', function() {
            return request(app).get(USERS_API).set('Accept', 'application/json').expect(401);
        });
        it('responds to GET /users/:username with missing username', function() {
            return request(app).get(USERS_API + '/bogus').set('Accept', 'application/json').expect(401);
        });
        it('responds to POST /users', function() {
            //return request(app).post(USERS_API).set('Accept', 'application/json').then(not404);
        });
        it('responds to DELETE /users/:username with missing username', function() {
            return request(app).delete(USERS_API + '/bogus').set('Accept', 'application/json').expect(401);
        });
        it('responds to PUT /users/:username with missing username', function() {
            return request(app).put(USERS_API + '/bogus').set('Accept', 'application/json').expect(401);
        });

        it('responds to POST /users/:id with bogus id', function() {
            return request(app).post(USERS_API + '/bogus').set('Accept', 'application/json').expect(401);
        });
        it('responds to POST /users/:id with missing id', function() {
            return request(app).post(USERS_API + '/' + new ObjectID()).set('Accept', 'application/json').expect(401);
        });
    });

    describe('Unauthentication Contacts API', function() {
        it('responds to GET /contacts', function() {
            return request(app).get(CONTACTS_API).set('Accept', 'application/json').expect(401);
        });
        it('responds to GET /contacts/:id with bogus id', function() {
            return request(app).get(CONTACTS_API + '/1').set('Accept', 'application/json').expect(401);
        });
        it('responds to GET /contacts/:id with missing id', function() {
            return request(app).get(CONTACTS_API + '/'+ new ObjectID()).set('Accept', 'application/json').expect(401);
        });
        it('responds to POST /contacts', function() {
            return request(app).post(CONTACTS_API).set('Accept', 'application/json').expect(401);
        });
        it('responds to DELETE /contacts/:id with bogus id', function() {
            return request(app).delete(CONTACTS_API + '/1').set('Accept', 'application/json').expect(401);
        });
        it('responds to DELETE /contacts/:id with missing id', function() {
            return request(app).delete(CONTACTS_API + '/' + new ObjectID()).set('Accept', 'application/json').expect(401);
        });
        it('responds to PUT /contacts/:id with bogus id', function() {
            return request(app).put(CONTACTS_API + '/1').set('Accept', 'application/json').expect(401);
        });
        it('responds to PUT /contacts/:id with missing id', function() {
            return request(app).put(CONTACTS_API + '/' + new ObjectID()).set('Accept', 'application/json').expect(401);
        });

        it('responds to POST /contacts/:id with bogus id', function() {
            return request(app).post(CONTACTS_API + '/bogus').set('Accept', 'application/json').expect(401);
        });
        it('responds to POST /contacts/:id with missing id', function() {
            return request(app).post(CONTACTS_API + '/' + new ObjectID()).set('Accept', 'application/json').expect(401);
        });
    });

    describe('Authenticated Users API', function() {
        var token;
        before(function() {
            var userDoc1 = {username: 'authUser1', password: 'xxx'};
            var userDoc2 = {username: 'authUser2', password: 'yyy'};
            return mongoose.connect('mongodb://localhost/contactsDemoTest').then(function() {
                return User.create(userDoc1);
            }).then(function() {
                return User.create(userDoc2);
            }).then(function(user) {
                return request(app).post(AUTH_API).set('Accept', 'application/json')
                    .send(userDoc2).expect('Content-Type', /json/).expect(200);
            }).then(function(res) {
                res.body.should.have.a.property('token');
                token = res.body.token;
                //decode the token?
            }).then(function() {
                return mongoose.disconnect().then();
            });
        });
        it('responds to GET /users', function() {
            return request(app).get(USERS_API).set('Authorization', 'Bearer ' + token)
                .set('Accept', 'application/json').expect('Content-Type', /json/).expect(200);
        });
        it('responds to GET /users/:username with missing username', function() {
            return request(app).get(USERS_API + '/bogus').set('Authorization', 'Bearer ' + token)
                .set('Accept', 'application/json').expect(404);
        });
        it('responds to POST /users', function() {
            //return request(app).post(USERS_API).set('Accept', 'application/json').then(not404);
        });
        it('responds to DELETE /users/:username with missing username', function() {
            return request(app).delete(USERS_API + '/bogus').set('Authorization', 'Bearer ' + token)
                .set('Accept', 'application/json').expect(404);
        });
        it('responds to PUT /users/:username with missing username', function() {
            return request(app).put(USERS_API + '/bogus').set('Authorization', 'Bearer ' + token)
                .set('Accept', 'application/json').expect(404);
        });

        it('responds to POST /users/:id with bogus id', function() {
            return request(app).post(USERS_API + '/bogus').set('Authorization', 'Bearer ' + token)
                .set('Accept', 'application/json').expect(404);
        });
        it('responds to POST /users/:id with missing id', function() {
            return request(app).post(USERS_API + '/' + new ObjectID()).set('Authorization', 'Bearer ' + token)
                .set('Accept', 'application/json').expect(404);
        });
    });

    describe('Authentication Contacts API', function() {
        var token;
        before(function() {
            var userDoc1 = {username: 'authUser3', password: 'xxx'};
            var userDoc2 = {username: 'authUser4', password: 'yyy'};
            return mongoose.connect('mongodb://localhost/contactsDemoTest').then(function() {
                return User.create(userDoc1);
            }).then(function() {
                return User.create(userDoc2);
            }).then(function(user) {
                return request(app).post(AUTH_API).set('Accept', 'application/json')
                    .send(userDoc2).expect('Content-Type', /json/).expect(200);
            }).then(function(res) {
                res.body.should.have.a.property('token');
                token = res.body.token;
                //decode the token?
            }).then(function() {
                return mongoose.disconnect().then();
            });
        });


        it('responds to GET /contacts', function() {
            return request(app).get(CONTACTS_API).set('Authorization', 'Bearer ' + token)
                .set('Accept', 'application/json').expect(200);
        });
        it('responds to GET /contacts/:id with bogus id', function() {
            return request(app).get(CONTACTS_API + '/1').set('Authorization', 'Bearer ' + token)
                .set('Accept', 'application/json').expect(400);
        });
        it('responds to GET /contacts/:id with missing id', function() {
            return request(app).get(CONTACTS_API + '/'+ new ObjectID()).set('Authorization', 'Bearer ' + token)
                .set('Accept', 'application/json').expect(404);
        });
        it('responds to POST /contacts', function() {
            return request(app).post(CONTACTS_API).set('Authorization', 'Bearer ' + token)
                .set('Accept', 'application/json').expect(400);
        });
        it('responds to DELETE /contacts/:id with bogus id', function() {
            return request(app).delete(CONTACTS_API + '/1').set('Authorization', 'Bearer ' + token)
                .set('Accept', 'application/json').expect(400);
        });
        it('responds to DELETE /contacts/:id with missing id', function() {
            return request(app).delete(CONTACTS_API + '/' + new ObjectID()).set('Authorization', 'Bearer ' + token)
                .set('Accept', 'application/json').expect(404);
        });
        it('responds to PUT /contacts/:id with bogus id', function() {
            return request(app).put(CONTACTS_API + '/1').set('Authorization', 'Bearer ' + token)
                .set('Accept', 'application/json').expect(400);
        });
        it('responds to PUT /contacts/:id with missing id', function() {
            return request(app).put(CONTACTS_API + '/' + new ObjectID()).set('Authorization', 'Bearer ' + token)
                .set('Accept', 'application/json').expect(404);
        });

        it('responds to POST /contacts/:id with bogus id', function() {
            return request(app).post(CONTACTS_API + '/bogus').set('Authorization', 'Bearer ' + token)
                .set('Accept', 'application/json').expect(400);
        });
        it('responds to POST /contacts/:id with missing id', function() {
            return request(app).post(CONTACTS_API + '/' + new ObjectID()).set('Authorization', 'Bearer ' + token)
                .set('Accept', 'application/json').expect(404);
        });
    });

    function removeAllUsers() {
        return mongoose.connect('mongodb://localhost/contactsDemoTest').then(function() {
            // TODO just drop the collection
            return User.remove().exec();
        }).then(function () {
            return mongoose.disconnect().then();
        });
    }
});
