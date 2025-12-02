const mongoose = require('mongoose');

const contactusSchema = new mongoose.Schema({

    firstName : {
        required : true,
        type : String,
        trim: true
    },
    secondName : {
        required : true,
        type : String,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
        ],
    },
    phone: {
        type: String,
        required: [true, 'Please provide a phone number'],
    },
    message: {
        type : String,
    }

},{timestamps:true})

module.exports = mongoose.model('contactus',contactusSchema);