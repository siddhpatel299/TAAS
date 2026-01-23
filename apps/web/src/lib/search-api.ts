import { api } from './api';

export interface SearchParams {
    q: string;
    start?: number;
    num?: number;
    dateRestrict?: string;
}

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

export const searchApi = {
    search: (params: SearchParams) =>
        api.get<{ success: boolean; data: SearchResult[] }>('/search', { params }),

    getStatus: () =>
        api.get<{ success: boolean; data: any }>('/search/status'),
};
