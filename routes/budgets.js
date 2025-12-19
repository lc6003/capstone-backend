const express = require('express');
const Budget = require('../models/Budget');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

//Get all budget for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const budgets = await Budget.find({ userId: req.user.userId });//find all budget belonging to this user
        res.json(budgets);
    } catch (error) {
        console.error('Get budgets error:', error);
        res.status(500).json({ error: 'Failed to fetch budgets' });
    }
});

//Create new budget
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, limit, type } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'Name and type are required' });
        }

        const budget = new Budget({//create new budget with userid
            userId: req.user.userId,
            name,
            limit: limit || 0,
            type
        });

        await budget.save();
        res.status(201).json(budget);
    } catch (error) {
        console.error('Create budget error:', error);
        res.status(500).json({ error: 'Failed to create budget' });
    }
});

//Delete a budget
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const budget = await Budget.findOneAndDelete({//delete only if budget belongs to this user
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!budget) {
            return res.status(404).json({ error: 'Budget not found' });
        }

        res.json({ message: 'Budget deleted successfully' });
    } catch (error) {
        console.error('Delete budget error:', error);
        res.status(500).json({ error: 'Failed to delete budget' });
    }
});

module.exports = router;