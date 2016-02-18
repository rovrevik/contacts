'use strict';

/**
 * Created by rovrevik on 2/13/16.
 */

var should = require('should');

var mongoose = require('mongoose');
var Promise = require('q').Promise;

require('../src/models/user');
var User = mongoose.model('User');

describe('User Model', function() {
    beforeEach(function() {
        return mongoose.connect('mongodb://localhost/contactsDemoTest');
    });
    afterEach(function() {
        return mongoose.disconnect();
    });
    before(removeAllUsers);

    it('Should start off with no users', function() {
        return User.find().count().exec().should.be.fulfilledWith(0);
    });

    describe('Create new User', function() {
        it('should save on the happy path', function() {
            var userDoc = {username: 'Create1', password: 'Create1'};
            return User.create(userDoc).then(function(user) {
                user.createdAt.getTime().should.equal(user.updatedAt.getTime());
            });
        });
        it('should not save when constructed with empty object', function() {
            return User.create({}).should.be.rejectedWith('User validation failed');
        });
        it('should not save with duplicates', function() {
            var userDoc = {username: 'Create2', password: 'Create2'};
            return Promise.all([
                User.create(userDoc),
                User.create(userDoc)
            ]).should.be.rejected();
        });
    });

    describe('Read existing User', function() {
        it('should read on the happy path', function() {
            var readDoc = {username: 'Read1', password: 'Read1'};
            return User.create(readDoc).then(function(user) {
                return User.find({username: readDoc.username}).exec().then(function(users) {
                    users.should.be.an.Array().with.length(1);
                    users[0].should.not.equal(user);
                });
            });
        });
    });

    describe('Update existing User', function() {
        it('should update on the happy path', function() {
            var updateDoc1 = {username: 'Update1', password: 'Update1'};
            var updateDoc2 = {username: 'Update2', password: 'Update2'};
            return User.create(updateDoc1).then(function() {
                return User.create(updateDoc2);
            }).then(function(user) {
                user.username += 'Updated';
                return user.save();
            }).then(function(user) {
                user.createdAt.getTime().should.be.lessThan(user.updatedAt.getTime());
            });
        });
        it('should not save the update when it would collide with an existing document', function() {
            var updateDoc3 = {username: 'Update3', password: 'Update3'};
            var updateDoc4 = {username: 'Update4', password: 'Update4'};
            return User.create(updateDoc3).then(function() {
                return User.create(updateDoc4);
            }).then(function(user) {
                user.username = updateDoc3.username;
                return user.save();
            }).should.be.rejected();
        });
    });

    describe('Remove existing User', function() {
        it('should remove on the happy path', function() {
            var deleteDoc = {username: 'Remove1', password: 'Remove1'};
            return User.create(deleteDoc).then(function(user) {
                return user.remove();
            }).should.be.fulfilled();
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
