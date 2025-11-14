const express = require('express');
const Expense = require('../models/Expense');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    try {
        const expenses = await Expense.find({ userId: req.user.userId })
            .sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { amount, category, date, note } = req.body;

        if (!amount || !date) {
            return res.status(400).json({ error: 'Amount and date are required' });
        }

        const expense = new Expense({
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

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const expense = await Expense.findOneAndDelete({
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