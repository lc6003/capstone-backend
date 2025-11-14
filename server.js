const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const { Resend } = require('resend');
require('dotenv').config();

const User = require('./models/User');
const { passwordResetEmail } = require('./emailTemplates');
const { authenticateToken } = require('./middleware/auth');

const budgetRoutes = require('./routes/budgets');
const expenseRoutes = require('./routes/expenses');
const creditCardRoutes = require('./routes/creditCards');
const incomeRoutes = require('./routes/income');

const app = express();

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error', err));

const JWT_SECRET = process.env.JWT_SECRET;

if(!JWT_SECRET){
    console.error('JWT_SECRET is not defined in .env file');
    process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

app.post('/api/signup', async(req, res) => {
    try{
        const {username, fullName, email, password} = req.body;

        if(!username || !email || !password){
            return res.status(400).json({
                error: 'Please provide username, email, and password'
            });
        }
        if(username.length < 3){
            return res.status(400).json({
                error: 'Username must be at least 3 characters'
            });
        }
        if(password.length < 6){
            return res.status(400).json({
                error: 'Password must be at least 6 characters'
            });
        }
        if(!/^\S+@\S+\.\S+$/.test(email)){
            return res.status(400).json({ 
                error: 'Please provide a valid email' 
            });
        }

        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingUser){
            if (existingUser.email === email) {
                return res.status(409).json({ error: 'Unable to create an account!' });
            }
            return res.status(409).json({ error: 'Username already taken' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            username,
            fullName: fullName || username,
            email,
            password: hashedPassword
        });

        await newUser.save();

        const token = jwt.sign(
            {
                userId: newUser._id, 
                email: newUser.email,
                username: newUser.username 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                fullName: newUser.fullName,
                email: newUser.email
            }
        });
    }   catch(error){
        console.error('Signup error:', error)
        res.status(500).json({
            error: 'An error occured during signup'
        });
    }
});

app.post('/api/login', async(req, res) => {
    try{
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Please provide email and password' 
            });
        }

        const user = await User.findOne({ email });

        if(!user){
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ 
                error: 'Invalid email or password' 
            });
        }

        const token = jwt.sign(
            {
                userId: user._id, 
                email: user.email,
                username: user.username 
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email
            }
        });
    } catch(error){
        console.error('Login error:', error);
        res.status(500).json({
            error: 'An error occurred during login'
        });
    }
});

app.post('/api/forgot-password', async (req, res) => {
    try{
        const { email } = req.body;

        if(!email){
            return res.status(400).json({
                error: 'Please provide your email address'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        const successMessage = 'If an account exists with this email, you will receive a password reset link.';

        if(!user){
            return res.json({ message: successMessage });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');

        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        const { data, error } = await resend.emails.send({
            from: 'Cashvelo <onboarding@resend.dev>',
            to: user.email,
            subject: 'Password Reset Request - Cashvelo',
            html:  passwordResetEmail(user.username, resetUrl)
        });

        if(error){
            console.error('Resend email error:', error);
            return res.status(500).json({
                error: 'Failed to send email. Please try again.'
            });
        }
        console.log('========================================');
        console.log('📧 Password Reset Email Sent via Resend');
        console.log('To:', user.email);
        console.log('Email ID:', data?.id);
        console.log('========================================');

        res.json({ message: successMessage });
    } catch(error){
        console.error('Forgot password error:', error);
        res.status(500).json({
            error: 'An error occurred. Please try again.'
        });
    }
});

app.get('/api/verify-reset-token/:token', async (req, res) => {
    try{
        const { token } = req.params;

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if(!user){
            return res.status(400).json({
                valid: false,
                error: 'Invalid or expired reset token'
            });
        }

        res.json({
            valid: true,
            email: user.email
        });
    } catch(error){
        console.error('Verify token error:', error);
        res.status(500).json({
            valid: false,
            error: 'An error occured'
        });
    }
});

app.post('/api/reset-password/:token', async (req, res) => {
    try{
        const { token } = req.params;
        const { password } = req.body;

        if(!password){
            return res.status(400).json({
                error: 'Please provide a new password'
            });
        }

        if(password.length < 6){
            return res.status(400).json({
                error: 'Password must be at least 6 characters' 
            });
        }

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if(!user){
            return res.status(400).json({
                error: 'Invalid or expired reset token'
            });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        console.log('✅ Password reset successful for:', user.email);

        res.json({
            message: 'Password has been reset successfully'
        });
    } catch(error){
        console.error('Reset password error:', error);
        res.status(500).json({
            error: 'An error occurred. Please try again.'
        });
    }
});

app.get('/api/user', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ 
            user: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

app.post('/api/logout', authenticateToken, (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

app.use('/api/budgets', budgetRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/credit-cards', creditCardRoutes);
app.use('/api/income', incomeRoutes);

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 API endpoints available at http://localhost:${PORT}/api`);
});