import axios from 'axios';
import { config } from '../config';

export interface SearchResult {
    kind: string;
    title: string;
    htmlTitle: string;
    link: string;
    displayLink: string;
    snippet: string;
    htmlSnippet: string;
    pagemap?: any;
}

export class GoogleSearchService {
    private static readonly BASE_URL = 'https://www.googleapis.com/customsearch/v1';

    async search(query: string, start: number = 1, num: number = 10, dateRestrict?: string): Promise<SearchResult[]> {
        if (!config.googleApiKey || !config.googleCx) {
            throw new Error('Google Search credentials are not configured');
        }

        try {
            const params: Record<string, any> = {
                key: config.googleApiKey,
                cx: config.googleCx,
                q: query,
                num: Math.min(num, 10), // API limit is 10
                start: start,
            };

            if (dateRestrict) {
                params.dateRestrict = dateRestrict;
            }

            console.log(`[GoogleSearch] Searching for: ${query} (Start: ${start})`);

            const response = await axios.get(GoogleSearchService.BASE_URL, { params });

            if (response.data.error) {
                throw new Error(response.data.error.message || 'Google Search API Error');
            }

            return response.data.items || [];
        } catch (error: any) {
            console.error('Google Search Error:', error.response?.data || error.message);
            // If quota exceeded or other API error, rethrow nicely
            if (error.response?.status === 429) {
                throw new Error('Daily search quota exceeded');
            }
            throw new Error(error.response?.data?.error?.message || 'Failed to perform search');
        }
    }

    // Simple mock usage tracking (reset on restart for now, or persist if needed later)
    // Real implementation might want to store this in DB
    async getQuotaStatus() {
        // This is a placeholder as the API doesn't return quota usage directly.
        // effective usage tracking would require DB persistence.
        return {
            status: 'ok',
            message: 'Quota tracking requires DB implementation. Please check Google Cloud Console.'
        };
    }
}

export const googleSearchService = new GoogleSearchService();
