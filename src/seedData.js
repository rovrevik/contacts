'use strict';

/**
 * Created by rovrevik on 2/12/16.
 */

var mongoose = require('mongoose');
var Promise = require('q').Promise;

require('../src/models/user');
var User = mongoose.model('User');
require('../src/models/contact');
var Contact = mongoose.model('Contact');

var users = [
    {username: "user", password: "password"},
    {username: "admin", password: "admin"} // I have not gotten to any role-based features yet.
];

var contacts = [
    {firstName: "Stewart", lastName: "Copeland"},
    {firstName: "Terry", lastName: "Bozzio"},
    {firstName: "Neal", lastName: "Peart"},
    {firstName: "Tim", lastName: "Alexander"},
    {firstName: "Dave", lastName: "Lombardo"},
    {firstName: "Frank", lastName: "Zappa"},
    {firstName: "Dweezil", lastName: "Zappa"}
];

function* x(){}

console.log('starting');
mongoose.connect('mongodb://localhost/contactsDemoTest').then(function() {
    console.log('connected');
    return Promise.all(users.map(function(item) {
        console.log('create: ' + JSON.stringify(item))
        return User.create(item);
    })).then(function(r) {
        console.log('then ' + r)
    });
}).then(function() {
    return Promise.all(contacts.map(function(item) {
        console.log('create: ' + JSON.stringify(item))
        return Contact.create(item);
    })).then(function(r) {
        console.log('then ' + r)
    });
}).then(function() {
    console.log('disconecting');
    return mongoose.disconnect().then();
});
