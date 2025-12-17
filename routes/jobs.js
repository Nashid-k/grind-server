import express from 'express';
import Job from '../models/Job.js';
import User from '../models/User.js';

const router = express.Router();

// Get all jobs for a user
router.get('/:userId', async (req, res) => {
    try {
        const jobs = await Job.find({ userId: req.params.userId }).sort({ date: -1 });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching jobs' });
    }
});

// Add a job
router.post('/', async (req, res) => {
    try {
        const newJob = new Job(req.body);
        const savedJob = await newJob.save();
        res.json(savedJob);
    } catch (error) {
        res.status(500).json({ message: 'Error adding job' });
    }
});

// Update a job
router.put('/:id', async (req, res) => {
    try {
        // Prevent changing immutable fields
        const { _id, userId, createdAt, ...updateData } = req.body;
        const updatedJob = await Job.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(updatedJob);
    } catch (error) {
        res.status(500).json({ message: 'Error updating job' });
    }
});

// Delete a job
router.delete('/:id', async (req, res) => {
    try {
        await Job.findByIdAndDelete(req.params.id);
        res.json({ message: 'Job deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting job' });
    }
});

// Update XP / User Stats (Quick Hack to keep logic simple)
router.post('/stats/:userId', async (req, res) => {
    try {
        const { xp, streak } = req.body;
        const update = {};
        if (xp !== undefined) update.xp = xp;
        if (streak) update.streak = streak;

        const updatedUser = await User.findByIdAndUpdate(req.params.userId, update, { new: true });
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Error updating stats' });
    }
});

export default router;
