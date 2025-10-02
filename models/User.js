const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String, 
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    fullName: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unqiue: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updateAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.pre('save', function(next){
    this.updateAt = Date.now();
    next();
});

module.exports = mongoose.model('User', userSchema)