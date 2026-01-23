import { Router } from 'express';
import { googleSearchService } from '../services/google-search.service';

export const searchRoutes = Router();

// Proxy search requests
searchRoutes.get('/', async (req, res, next) => {
    try {
        const { q, start, num, dateRestrict } = req.query;

        if (!q) {
            return res.status(400).json({ success: false, error: 'Query parameter "q" is required' });
        }

        const results = await googleSearchService.search(
            String(q),
            start ? parseInt(String(start)) : 1,
            num ? parseInt(String(num)) : 10,
            dateRestrict ? String(dateRestrict) : undefined
        );

        res.json({ success: true, data: results });
    } catch (error: any) {
        next(error);
    }
});

// Get status/quota (placeholder)
searchRoutes.get('/status', async (req, res, next) => {
    try {
        const status = await googleSearchService.getQuotaStatus();
        res.json({ success: true, data: status });
    } catch (error) {
        next(error);
    }
});
