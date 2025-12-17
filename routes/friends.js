import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Get user's friends list with their stats
router.get('/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('friends', 'name email avatar xp streak friendCode');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, friends: user.friends });
    } catch (error) {
        console.error('Get Friends Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Get pending friend requests
router.get('/requests/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('friendRequests', 'name email avatar friendCode')
            .populate('sentRequests', 'name email avatar friendCode');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ 
            success: true, 
            incoming: user.friendRequests,
            outgoing: user.sentRequests
        });
    } catch (error) {
        console.error('Get Requests Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Get user's friend code
router.get('/code/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('friendCode');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, friendCode: user.friendCode });
    } catch (error) {
        console.error('Get Friend Code Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Send a friend request (by friend code or email)
router.post('/request', async (req, res) => {
    try {
        const { userId, identifier } = req.body; // identifier can be friendCode or email
        
        if (!userId || !identifier) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const sender = await User.findById(userId);
        if (!sender) {
            return res.status(404).json({ success: false, message: 'Sender not found' });
        }

        // Find target user by friend code or email
        let targetUser = await User.findOne({ 
            $or: [
                { friendCode: identifier.toUpperCase() },
                { email: identifier.toLowerCase() }
            ]
        });

        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found with that code or email' });
        }

        // Can't add yourself
        if (targetUser._id.toString() === userId) {
            return res.status(400).json({ success: false, message: "You can't add yourself as a friend" });
        }

        // Check if already friends
        if (sender.friends.includes(targetUser._id)) {
            return res.status(400).json({ success: false, message: 'Already friends with this user' });
        }

        // Check if request already sent
        if (sender.sentRequests.includes(targetUser._id)) {
            return res.status(400).json({ success: false, message: 'Friend request already sent' });
        }

        // Check if they sent us a request (auto-accept)
        if (sender.friendRequests.includes(targetUser._id)) {
            // Auto-accept: they already sent us a request
            sender.friends.push(targetUser._id);
            targetUser.friends.push(sender._id);
            
            sender.friendRequests = sender.friendRequests.filter(id => id.toString() !== targetUser._id.toString());
            targetUser.sentRequests = targetUser.sentRequests.filter(id => id.toString() !== sender._id.toString());
            
            await sender.save();
            await targetUser.save();

            return res.json({ 
                success: true, 
                message: 'Friend added! (They already sent you a request)',
                autoAccepted: true
            });
        }

        // Send the request
        sender.sentRequests.push(targetUser._id);
        targetUser.friendRequests.push(sender._id);
        
        await sender.save();
        await targetUser.save();

        res.json({ success: true, message: 'Friend request sent!' });
    } catch (error) {
        console.error('Send Request Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Accept a friend request
router.post('/accept', async (req, res) => {
    try {
        const { userId, requesterId } = req.body;
        
        const user = await User.findById(userId);
        const requester = await User.findById(requesterId);
        
        if (!user || !requester) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify the request exists
        if (!user.friendRequests.includes(requesterId)) {
            return res.status(400).json({ success: false, message: 'No pending request from this user' });
        }

        // Add each other as friends
        user.friends.push(requesterId);
        requester.friends.push(userId);
        
        // Remove from requests
        user.friendRequests = user.friendRequests.filter(id => id.toString() !== requesterId);
        requester.sentRequests = requester.sentRequests.filter(id => id.toString() !== userId);
        
        await user.save();
        await requester.save();

        res.json({ success: true, message: 'Friend request accepted!' });
    } catch (error) {
        console.error('Accept Request Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Reject a friend request
router.post('/reject', async (req, res) => {
    try {
        const { userId, requesterId } = req.body;
        
        const user = await User.findById(userId);
        const requester = await User.findById(requesterId);
        
        if (!user || !requester) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Remove from requests
        user.friendRequests = user.friendRequests.filter(id => id.toString() !== requesterId);
        requester.sentRequests = requester.sentRequests.filter(id => id.toString() !== userId);
        
        await user.save();
        await requester.save();

        res.json({ success: true, message: 'Friend request rejected' });
    } catch (error) {
        console.error('Reject Request Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Remove a friend
router.delete('/:userId/:friendId', async (req, res) => {
    try {
        const { userId, friendId } = req.params;
        
        const user = await User.findById(userId);
        const friend = await User.findById(friendId);
        
        if (!user || !friend) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Remove each other from friends
        user.friends = user.friends.filter(id => id.toString() !== friendId);
        friend.friends = friend.friends.filter(id => id.toString() !== userId);
        
        await user.save();
        await friend.save();

        res.json({ success: true, message: 'Friend removed' });
    } catch (error) {
        console.error('Remove Friend Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

export default router;
