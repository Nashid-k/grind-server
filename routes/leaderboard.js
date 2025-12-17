import express from 'express';
import User from '../models/User.js';
import Job from '../models/Job.js';

const router = express.Router();

// Calculate score for a user (XP + streak bonus + job count bonus)
const calculateScore = async (user) => {
    const jobCount = await Job.countDocuments({ userId: user._id });
    const streakBonus = (user.streak?.count || 0) * 50;
    const jobBonus = jobCount * 10;
    return (user.xp || 0) + streakBonus + jobBonus;
};

// Get global leaderboard (top 50 users by score)
router.get('/global', async (req, res) => {
    try {
        // Get all users with their basic info
        const users = await User.find({})
            .select('name email avatar xp streak friendCode')
            .lean();

        // Calculate scores for all users
        const usersWithScores = await Promise.all(
            users.map(async (user) => {
                const jobCount = await Job.countDocuments({ userId: user._id });
                const streakCount = user.streak?.count || 0;
                const score = (user.xp || 0) + (streakCount * 50) + (jobCount * 10);
                return {
                    _id: user._id,
                    name: user.name || 'Anonymous Grinder',
                    avatar: user.avatar,
                    xp: user.xp || 0,
                    streak: streakCount,
                    score,
                    jobCount
                };
            })
        );

        // Sort by score descending and take top 50
        usersWithScores.sort((a, b) => b.score - a.score);
        const top50 = usersWithScores.slice(0, 50);

        res.json({ success: true, leaderboard: top50 });
    } catch (error) {
        console.error('Global Leaderboard Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Get friends leaderboard
router.get('/friends/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .populate('friends', 'name email avatar xp streak friendCode');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Include the current user in the friends leaderboard
        const friendsToProcess = [
            ...user.friends,
            { 
                _id: user._id, 
                name: user.name, 
                avatar: user.avatar, 
                xp: user.xp, 
                streak: user.streak,
                isCurrentUser: true 
            }
        ];

        // Calculate scores for friends + current user
        const usersWithScores = await Promise.all(
            friendsToProcess.map(async (friend) => {
                const jobCount = await Job.countDocuments({ userId: friend._id });
                const streakCount = friend.streak?.count || 0;
                const score = (friend.xp || 0) + (streakCount * 50) + (jobCount * 10);
                return {
                    _id: friend._id,
                    name: friend.name || 'Anonymous Grinder',
                    avatar: friend.avatar,
                    xp: friend.xp || 0,
                    streak: streakCount,
                    score,
                    jobCount,
                    isCurrentUser: friend.isCurrentUser || false
                };
            })
        );

        // Sort by score descending
        usersWithScores.sort((a, b) => b.score - a.score);

        res.json({ success: true, leaderboard: usersWithScores });
    } catch (error) {
        console.error('Friends Leaderboard Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

export default router;
