const express = require('express');
const Income = require('../models/Income');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

//Get all income for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { type } = req.query;
        const query = { userId: req.user.userId };

        if (type) {//Filter by income type if provided
            query.type = type;
        }

        const income = await Income.find(query).sort({ date: -1 });
        res.json(income);
    } catch (error) {
        console.error('Get income error:', error);
        res.status(500).json({ error: 'Failed to fetch income' });
    }
});

//Create a new income
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { type, amount } = req.body;

        if (!type || !amount) {
            return res.status(400).json({ error: 'Type and amount are required' });
        }

        const income = new Income({//Create a new income with user id
            userId: req.user.userId,
            type,
            amount
        });

        await income.save();
        res.status(201).json(income);
    } catch (error) {
        console.error('Create income error:', error);
        res.status(500).json({ error: 'Failed to create income' });
    }
});

//Delete an income
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const income = await Income.findOneAndDelete({//Delete only if income belongs to this user
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!income) {
            return res.status(404).json({ error: 'Income record not found' });
        }

        res.json({ message: 'Income deleted successfully' });
    } catch (error) {
        console.error('Delete income error:', error);
        res.status(500).json({ error: 'Failed to delete income' });
    }
});

module.exports = router;