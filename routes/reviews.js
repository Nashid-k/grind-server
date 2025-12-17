import express from 'express';
import Review from '../models/Review.js';
import User from '../models/User.js';

const router = express.Router();

// Submit a review (requires user info from request body)
router.post('/', async (req, res) => {
    try {
        const { userId, rating, comment } = req.body;

        // Validate input
        if (!userId || !rating || !comment) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        if (comment.length > 500) {
            return res.status(400).json({ error: 'Comment exceeds 500 characters' });
        }

        // Get user info
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user already submitted a review
        const existingReview = await Review.findOne({ userId });
        if (existingReview) {
            return res.status(400).json({ error: 'You have already submitted a review' });
        }

        // Create review
        const review = new Review({
            userId,
            userName: user.name,
            userEmail: user.email,
            userPhoto: user.photo || '',
            rating,
            comment: comment.trim()
        });

        await review.save();

        res.status(201).json({
            message: 'Review submitted successfully',
            review
        });
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ error: 'Failed to submit review' });
    }
});

// Get all reviews (public endpoint)
router.get('/', async (req, res) => {
    try {
        const reviews = await Review.find()
            .sort({ createdAt: -1 })
            .limit(6); // Latest 6 reviews

        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// Get review statistics
router.get('/stats', async (req, res) => {
    try {
        const totalReviews = await Review.countDocuments();
        
        if (totalReviews === 0) {
            return res.json({
                totalReviews: 0,
                averageRating: 0,
                ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
            });
        }

        const reviews = await Review.find();
        
        // Calculate average rating
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = (totalRating / totalReviews).toFixed(1);

        // Calculate rating distribution
        const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(review => {
            ratingDistribution[review.rating]++;
        });

        res.json({
            totalReviews,
            averageRating: parseFloat(averageRating),
            ratingDistribution
        });
    } catch (error) {
        console.error('Error fetching review stats:', error);
        res.status(500).json({ error: 'Failed to fetch review statistics' });
    }
});

export default router;
