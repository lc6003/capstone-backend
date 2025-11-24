const express = require('express');
const Income = require('../models/Income');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    try {
        const { type } = req.query;
        const query = { userId: req.user.userId };

        if (type) {
            query.type = type;
        }

        const income = await Income.find(query).sort({ date: -1 });
        res.json(income);
    } catch (error) {
        console.error('Get income error:', error);
        res.status(500).json({ error: 'Failed to fetch income' });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { type, amount } = req.body;

        if (!type || !amount) {
            return res.status(400).json({ error: 'Type and amount are required' });
        }

        const income = new Income({
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

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const income = await Income.findOneAndDelete({
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