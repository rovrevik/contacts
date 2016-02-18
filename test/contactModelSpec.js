'use strict';

/**
 * Created by rovrevik on 2/13/16.
 */

var should = require('should');

var mongoose = require('mongoose');
var Promise = require('q').Promise;

require('../src/models/contact');
var Contact = mongoose.model('Contact');

describe('Contact Model', function() {
    beforeEach(function() {
        return mongoose.connect('mongodb://localhost/contactsDemoTest');
    });
    afterEach(function() {
        return mongoose.disconnect();
    });
    before(removeAllContacts);

    it('Should start off with no contacts', function() {
        return Contact.find().count().exec().should.be.fulfilledWith(0);
    });

    describe('Create new Contact', function() {
        it('should save on the happy path', function() {
            var contactDoc = {firstName: 'Create1', lastName: 'Create1'};
            return Contact.create(contactDoc).then(function(contact) {
                contact.createdAt.getTime().should.equal(contact.updatedAt.getTime());
            });
        });
        it('should not save when constructed with empty object', function() {
            return Contact.create({}).should.be.rejectedWith('Contact validation failed');
        });
        it('should not save with duplicates', function() {
            var contactDoc = {firstName: 'Create2', lastName: 'Create2'};
            return Promise.all([
                Contact.create(contactDoc),
                Contact.create(contactDoc)
            ]).should.be.rejected();
        });
    });

    describe('Read existing Contact', function() {
        it('should read on the happy path', function() {
            var readDoc = {firstName: 'Read1', lastName: 'Read1'};
            return Contact.create(readDoc).then(function(contact) {
                return Contact.find(readDoc).exec().then(function(contacts) {
                    contacts.should.be.an.Array().with.length(1);
                    contacts[0].should.not.equal(contact);
                });
            });
        });
    });

    describe('Update existing Contact', function() {
        it('should update on the happy path', function() {
            var updateDoc1 = {firstName: 'Update1', lastName: 'Update1'};
            var updateDoc2 = {firstName: 'Update2', lastName: 'Update2'};
            return Contact.create(updateDoc1).then(function() {
                return Contact.create(updateDoc2);
            }).then(function(contact) {
                contact.lastName += 'Updated';
                return contact.save();
            }).then(function(contact) {
                contact.createdAt.getTime().should.be.lessThan( contact.updatedAt.getTime());
            });
        });
        it('should not save the update when it would collide with an existing document', function() {
            var updateDoc3 = {firstName: 'Update3', lastName: 'Update3'};
            var updateDoc4 = {firstName: 'Update4', lastName: 'Update4'};
            return Contact.create(updateDoc3).then(function() {
                return Contact.create(updateDoc4);
            }).then(function(contact) {
                contact.firstName = updateDoc3.firstName;
                contact.lastName =  updateDoc3.lastName;
                return contact.save();
            }).should.be.rejected();
        });
    });

    describe('Remove existing Contact', function() {
        it('should remove on the happy path', function() {
            var deleteDoc = {firstName: 'Remove1', lastName: 'Remove1'};
            return Contact.create(deleteDoc).then(function(contact) {
                return contact.remove();
            }).should.be.fulfilled();
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
