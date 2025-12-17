import express from 'express';
import User from '../models/User.js';
import Job from '../models/Job.js';

const router = express.Router();

// In-memory challenge storage (for simplicity - in production use MongoDB)
const challenges = new Map();

// Create a challenge
router.post('/create', async (req, res) => {
    try {
        const { challengerId, challengedId, duration = 7 } = req.body;
        
        if (!challengerId || !challengedId) {
            return res.status(400).json({ success: false, message: 'Both user IDs required' });
        }

        const challenger = await User.findById(challengerId);
        const challenged = await User.findById(challengedId);

        if (!challenger || !challenged) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const challengeId = `${challengerId}_${challengedId}_${Date.now()}`;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + duration);

        const challenge = {
            id: challengeId,
            challenger: {
                id: challengerId,
                name: challenger.name,
                avatar: challenger.avatar,
                score: 0
            },
            challenged: {
                id: challengedId,
                name: challenged.name,
                avatar: challenged.avatar,
                score: 0
            },
            duration,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            status: 'pending', // pending, active, completed
            winner: null
        };

        challenges.set(challengeId, challenge);

        res.json({ success: true, challenge });
    } catch (error) {
        console.error('Create Challenge Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Accept a challenge
router.post('/accept/:challengeId', async (req, res) => {
    try {
        const { challengeId } = req.params;
        const challenge = challenges.get(challengeId);

        if (!challenge) {
            return res.status(404).json({ success: false, message: 'Challenge not found' });
        }

        challenge.status = 'active';
        challenge.startDate = new Date().toISOString();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + challenge.duration);
        challenge.endDate = endDate.toISOString();

        challenges.set(challengeId, challenge);

        res.json({ success: true, challenge });
    } catch (error) {
        console.error('Accept Challenge Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Reject a challenge
router.post('/reject/:challengeId', async (req, res) => {
    try {
        const { challengeId } = req.params;
        challenges.delete(challengeId);
        res.json({ success: true, message: 'Challenge rejected' });
    } catch (error) {
        console.error('Reject Challenge Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Get challenges for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userChallenges = [];

        for (const [id, challenge] of challenges) {
            if (challenge.challenger.id === userId || challenge.challenged.id === userId) {
                // Update scores
                const challengerJobs = await Job.countDocuments({
                    userId: challenge.challenger.id,
                    createdAt: { 
                        $gte: new Date(challenge.startDate),
                        $lte: new Date(challenge.endDate)
                    }
                });
                const challengedJobs = await Job.countDocuments({
                    userId: challenge.challenged.id,
                    createdAt: { 
                        $gte: new Date(challenge.startDate),
                        $lte: new Date(challenge.endDate)
                    }
                });

                challenge.challenger.score = challengerJobs;
                challenge.challenged.score = challengedJobs;

                // Check if challenge ended
                if (challenge.status === 'active' && new Date() > new Date(challenge.endDate)) {
                    challenge.status = 'completed';
                    if (challengerJobs > challengedJobs) {
                        challenge.winner = challenge.challenger.id;
                    } else if (challengedJobs > challengerJobs) {
                        challenge.winner = challenge.challenged.id;
                    } else {
                        challenge.winner = 'tie';
                    }
                }

                challenges.set(id, challenge);
                userChallenges.push(challenge);
            }
        }

        res.json({ success: true, challenges: userChallenges });
    } catch (error) {
        console.error('Get Challenges Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

export default router;
