const mongoose = require('mongoose');

const creditCardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    balance: {
        type: Number,
        default: 0
    },
    pending: {
        type: Number,
        default: 0
    },
    payment: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CreditCard', creditCardSchema);