const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
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
    limit: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        enum: ['recurring', 'variable'],
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Budget', budgetSchema);