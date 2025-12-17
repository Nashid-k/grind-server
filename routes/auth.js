import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Google Login / Sign Up
router.post('/google', async (req, res) => {
    try {
        const { email, name, picture, googleId } = req.body;
        console.log("Google Login Request Body:", req.body);

        if (!email) {
            console.error("Missing email in Google Login payload");
            return res.status(400).json({ success: false, message: 'Email missing from Google Token' });
        }

        let user = await User.findOne({ email });
        let isNewUser = false;

        if (user) {
            // Existing user - update info but preserve hasSeenWelcome
            user.name = name;
            user.avatar = picture;
            user.googleId = googleId;
            await user.save();
            // Not a new user if hasSeenWelcome is true
            isNewUser = !user.hasSeenWelcome;
        } else {
            // Create new user
            user = new User({
                username: email,
                email,
                name,
                avatar: picture,
                googleId,
                password: 'google-auth-no-password',
                hasSeenWelcome: false // New users haven't seen welcome
            });
            await user.save();
            isNewUser = true;
        }

        res.json({ 
            success: true, 
            user: user.toObject(),
            isNewUser 
        });
    } catch (error) {
        console.error('GOOGLE AUTH ERROR DETAILS:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
});

// Regular Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (user && user.password === password) {
            // In a real app, use bcrypt and JWT here
            res.json({ success: true, user });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Regular Register
router.post('/register', async (req, res) => {
    try {
        const { username, password, name } = req.body;

        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }

        const newUser = new User({ username, password, name, email: username }); // Assuming username is email
        await newUser.save();

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Mark Welcome as Seen (after onboarding)
router.post('/mark-welcome-seen', async (req, res) => {
    try {
        const { userId, dailyTarget } = req.body;
        
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.hasSeenWelcome = true;
        if (dailyTarget) {
            user.settings = user.settings || {};
            user.settings.dailyTarget = dailyTarget;
        }
        await user.save();

        res.json({ success: true, user: user.toObject() });
    } catch (error) {
        console.error('Mark Welcome Seen Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

export default router;
