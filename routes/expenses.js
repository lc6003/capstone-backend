const express = require('express');
const Expense = require('../models/Expense');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

//Get all expenses for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const expenses = await Expense.find({ userId: req.user.userId })//Find all expenses for this user sorted by newest first
            .sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

//Create a new expense
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { amount, category, date, note } = req.body;

        if (!amount || !date) {
            return res.status(400).json({ error: 'Amount and date are required' });
        }

        const expense = new Expense({//Create new expense with user id
            userId: req.user.userId,
            amount,
            category: category || '',
            date,
            note: note || ''
        });

        await expense.save();
        res.status(201).json(expense);
    } catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({ error: 'Failed to create expense' });
    }
});

//Delete an expense
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const expense = await Expense.findOneAndDelete({//Delete only if expense belong to this user
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({ error: 'Failed to delete expense' });
    }
});

module.exports = router;