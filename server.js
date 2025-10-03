const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const User = require('./models/User')

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

function authenticateToken(req, res, next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(!token){
        return res.status(401).json({ error: 'Access token required'});
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if(err){
            return res.status(403).json({error: 'Invalid or expired token'});
        }
        req.user = user;
        next();
    });
}

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
                return res.status(409).json({ error: 'Email already registered' });
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
})

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