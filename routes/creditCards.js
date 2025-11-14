const express = require('express');
const CreditCard = require('../models/CreditCard');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    try {
        const cards = await CreditCard.find({ userId: req.user.userId });
        res.json(cards);
    } catch (error) {
        console.error('Get credit cards error:', error);
        res.status(500).json({ error: 'Failed to fetch credit cards' });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, balance, pending, payment } = req.body;

        const card = new CreditCard({
            userId: req.user.userId,
            name: name || '',
            balance: balance || 0,
            pending: pending || 0,
            payment: payment || 0
        });

        await card.save();
        res.status(201).json(card);
    } catch (error) {
        console.error('Create credit card error:', error);
        res.status(500).json({ error: 'Failed to create credit card' });
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { name, balance, pending, payment } = req.body;

        const card = await CreditCard.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.userId },
            { name, balance, pending, payment },
            { new: true }
        );

        if (!card) {
            return res.status(404).json({ error: 'Credit card not found' });
        }

        res.json(card);
    } catch (error) {
        console.error('Update credit card error:', error);
        res.status(500).json({ error: 'Failed to update credit card' });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const card = await CreditCard.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!card) {
            return res.status(404).json({ error: 'Credit card not found' });
        }

        res.json({ message: 'Credit card deleted successfully' });
    } catch (error) {
        console.error('Delete credit card error:', error);
        res.status(500).json({ error: 'Failed to delete credit card' });
    }
});

module.exports = router;