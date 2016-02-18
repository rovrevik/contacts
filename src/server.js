#!/usr/bin/env node

'use strict';

/**
 * Created by rovrevik on 2/12/16.
 */

var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');

var auth = require('../src/routes/auth');
var users = require('../src/routes/users');
var contacts = require('./routes/contacts');

var app = express();

app.use(bodyParser.json());

var requireAuthenticated = auth(app).authenticated;
users(app, requireAuthenticated);
contacts(app, requireAuthenticated);

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/contactsDemoTest');

app.use(express.static('src/client'));
app.use('/bower_components', express.static('bower_components'));

// deal with 404s
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

var server = http.createServer(app);

// server scope event listeners
server.on('error', function(err) {
    console.error('error: ' + JSON.stringify(err));
    throw err;
});
server.on('listening', function() {
    var addr = server.address();
    console.error('listening: ' + JSON.stringify(addr));
});

server.listen(3000);
