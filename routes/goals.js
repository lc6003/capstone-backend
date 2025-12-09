const express = require('express');
const Goal = require('../models/Goal');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    try {
        const goals = await Goal.find({ userId: req.user.userId })
            .sort({ createdAt: -1 });
        res.json(goals);
    } catch (error) {
        console.error('Get goals error:', error);
        res.status(500).json({ error: 'Failed to fetch goals' });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const goal = await Goal.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        res.json(goal);
    } catch (error) {
        console.error('Get goal error:', error);
        res.status(500).json({ error: 'Failed to fetch goal' });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, description, targetAmount, targetDate, category, icon, color } = req.body;

        if (!name || !targetAmount || !targetDate) {
            return res.status(400).json({ 
                error: 'Name, target amount, and target date are required' 
            });
        }

        if (targetAmount <= 0) {
            return res.status(400).json({ error: 'Target amount must be greater than 0' });
        }

        const goal = new Goal({
            userId: req.user.userId,
            name,
            description,
            targetAmount,
            targetDate,
            category: category || 'other',
            icon: icon || '🎯',
            color: color || '#3b82f6'
        });

        await goal.save();
        res.status(201).json(goal);
    } catch (error) {
        console.error('Create goal error:', error);
        res.status(500).json({ error: 'Failed to create goal' });
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { name, description, targetAmount, targetDate, category, icon, color } = req.body;

        const goal = await Goal.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userId },
            { name, description, targetAmount, targetDate, category, icon, color },
            { new: true, runValidators: true }
        );

        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        res.json(goal);
    } catch (error) {
        console.error('Update goal error:', error);
        res.status(500).json({ error: 'Failed to update goal' });
    }
});

router.post('/:id/contribute', authenticateToken, async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Amount must be greater than 0' });
        }

        const goal = await Goal.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        goal.currentAmount += amount;

        if (goal.currentAmount >= goal.targetAmount && !goal.completed) {
            goal.completed = true;
            goal.completedAt = new Date();
        }

        await goal.save();
        res.json(goal);
    } catch (error) {
        console.error('Contribute to goal error:', error);
        res.status(500).json({ error: 'Failed to add contribution' });
    }
});

router.post('/:id/withdraw', authenticateToken, async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Amount must be greater than 0' });
        }

        const goal = await Goal.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        if (amount > goal.currentAmount) {
            return res.status(400).json({ error: 'Withdrawal amount exceeds current savings' });
        }

        goal.currentAmount -= amount;

        if (goal.currentAmount < goal.targetAmount && goal.completed) {
            goal.completed = false;
            goal.completedAt = null;
        }

        await goal.save();
        res.json(goal);
    } catch (error) {
        console.error('Withdraw from goal error:', error);
        res.status(500).json({ error: 'Failed to withdraw' });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const goal = await Goal.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }

        res.json({ message: 'Goal deleted successfully' });
    } catch (error) {
        console.error('Delete goal error:', error);
        res.status(500).json({ error: 'Failed to delete goal' });
    }
});

module.exports = router;