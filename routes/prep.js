import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = express.Router();

// Helper to extract keywords
const extractTechStack = (text) => {
    const keywords = [
        'React', 'Node.js', 'Python', 'Java', 'C++', 'AWS', 'Docker', 'Kubernetes', 
        'TypeScript', 'JavaScript', 'Go', 'Rust', 'SQL', 'MongoDB', 'PostgreSQL',
        'GraphQL', 'Rest API', 'CI/CD', 'Git', 'Agile', 'Scrum'
    ];
    // Case insensitive matching
    return keywords.filter(kw => {
        const regex = new RegExp(`\\b${kw.replace('.', '\\.')}\\b`, 'i');
        return regex.test(text);
    });
};

const extractRole = (title) => {
    if (!title) return 'Software Engineer';
    if (/frontend|front-end/i.test(title)) return 'Frontend Engineer';
    if (/backend|back-end/i.test(title)) return 'Backend Engineer';
    if (/fullstack|full-stack/i.test(title)) return 'Full Stack Engineer';
    if (/product manager/i.test(title)) return 'Product Manager';
    if (/data scientist/i.test(title)) return 'Data Scientist';
    if (/designer|ui\/ux/i.test(title)) return 'Product Designer';
    return title;
};

router.post('/analyze', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ message: 'URL is required' });
    }

    try {
        // Fake browser headers
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000 // 10s timeout
        });

        const $ = cheerio.load(data);
        const title = $('title').text().trim() || $('h1').first().text().trim();
        const description = $('meta[name="description"]').attr('content') || $('body').text().slice(0, 500);
        
        // Try to find company name (heuristics)
        let company = '';
        // Often in title like "Role at Company" or "Company - Role"
        if (title.includes(' at ')) company = title.split(' at ')[1].split('|')[0].trim();
        else if (title.includes(' - ')) company = title.split(' - ')[0].trim();
        
        // Clean up company name (remove "Careers", "Home", etc if detected, basic check)
        if (company.length > 50) company = ''; // Too long, probably failed

        const bodyText = $('body').text();
        const stack = extractTechStack(bodyText);
        const role = extractRole(title);

        res.json({
            title,
            company,
            role,
            description: description.slice(0, 300) + '...',
            stack,
            fullText: bodyText.slice(0, 2000) // Send a chunk for potential client-side AI if needed
        });

    } catch (error) {
        console.error('Scraping error:', error.message);
        res.status(500).json({ message: 'Failed to analyze job link', error: error.message });
    }
});

export default router;
