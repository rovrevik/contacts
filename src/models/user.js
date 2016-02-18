'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');

var UserSchema = new Schema({
    username: {
        type: String,
        default: '',
        required: 'UserId name can not be blank',
        trim: true
    },
    password_hashed: {
        type: String,
        default: '',
        required: 'Password can not be blank',
        trim: true
    },
    salt: String,
    roles: {
        type: ['authenticated']
    }
}, {
    timestamps: {}
});

UserSchema.index({username: 1}, {unique: true});

UserSchema.methods.hasRole = function(role) {
    var roles = this.roles;
    return roles.indexOf('admin') !== -1 || roles.indexOf(role) !== -1;
};

UserSchema.virtual('password').set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.password_hashed = this.hashPassword(password);
}).get(function() {
    return this._password;
});

UserSchema.methods.makeSalt = function() {
    return crypto.randomBytes(16).toString('base64');
};

UserSchema.methods.hashPassword = function(password) {
    if (!password || !this.salt) return '';
    var salt = new Buffer(this.salt, 'base64');
    return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
};

UserSchema.methods.toJSON = function() {
    var obj = this.toObject();
    delete obj.password_hashed;
    delete obj.salt;
    return obj;
};

module.exports = mongoose.model('User', UserSchema);
