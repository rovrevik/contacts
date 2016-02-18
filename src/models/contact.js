'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ContactSchema = new Schema({
    firstName: {
        type: String,
        default: '',
        required: 'First name can not be blank',
        trim: true
    },
    lastName: {
        type: String,
        default: '',
        required: 'Last name can not be blank',
        trim: true
    }
}, {
    timestamps: {}
});

ContactSchema.index({firstName: 1, lastName: -1}, {unique: true});

module.exports = mongoose.model('Contact', ContactSchema);
