const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    targetAmount: {
        type: Number,
        required: true,
        min: 0
    },
    currentAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    targetDate: {
        type: Date,
        required: true
    },
    category: {
        type: String,
        enum: ['vacation', 'debt', 'emergency', 'purchase', 'education', 'home', 'other'],
        default: 'other'
    },
    icon: {
        type: String,
        default: '🎯'
    },
    color: {
        type: String,
        default: '#3b82f6'
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

goalSchema.virtual('progress').get(function() {
    if (this.targetAmount === 0) return 0;
    return Math.min(100, (this.currentAmount / this.targetAmount) * 100);
});

goalSchema.virtual('remaining').get(function() {
    return Math.max(0, this.targetAmount - this.currentAmount);
});

goalSchema.virtual('daysRemaining').get(function() {
    const now = new Date();
    const target = new Date(this.targetDate);
    const diffTime = target - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Goal', goalSchema);