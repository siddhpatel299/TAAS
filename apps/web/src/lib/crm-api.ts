import { api } from './api';

// Types
export interface CrmTag {
    id: string;
    name: string;
    color?: string;
}

export interface CrmInteraction {
    id: string;
    contactId: string;
    userId: string;
    type: string; // note, email, call, meeting, task
    direction?: string; // inbound, outbound
    summary: string;
    details?: string;
    date: string;
    duration?: number;
    createdAt: string;
}

export interface CrmContact {
    id: string;
    userId: string;

    // Basic Info
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    avatar?: string;

    // Professional Info
    company?: string;
    position?: string;
    department?: string;
    website?: string;
    linkedinUrl?: string;
    twitterHandle?: string;

    // CRM Status
    status: string;
    pipelineStage?: string;
    source?: string;

    // Dates
    lastContactedAt?: string;
    nextFollowUpAt?: string;
    birthday?: string;

    // Meta
    rating: number;
    isFavorite: boolean;
    notes?: string;

    createdAt: string;
    updatedAt: string;

    // Relations
    tags?: CrmTag[];
    interactions?: CrmInteraction[];
}

export interface CrmContactFilters {
    search?: string;
    company?: string;
    status?: string;
    tag?: string;
    isFavorite?: boolean;
    pipelineStage?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

// API methods
export const crmApi = {
    // Contacts
    getContacts: (filters?: CrmContactFilters) =>
        api.get<{ success: boolean; data: CrmContact[]; meta: any }>('/crm/contacts', { params: filters }),

    getContact: (id: string) =>
        api.get<{ success: boolean; data: CrmContact }>(`/crm/contacts/${id}`),

    createContact: (data: Partial<CrmContact> & { tags?: string[] }) =>
        api.post<{ success: boolean; data: CrmContact }>('/crm/contacts', data),

    updateContact: (id: string, data: Partial<CrmContact> & { tags?: string[] }) =>
        api.patch<{ success: boolean; data: CrmContact }>(`/crm/contacts/${id}`, data),

    deleteContact: (id: string) =>
        api.delete<{ success: boolean; data: { deleted: boolean } }>(`/crm/contacts/${id}`),

    // Interactions
    addInteraction: (contactId: string, data: Partial<CrmInteraction>) =>
        api.post<{ success: boolean; data: CrmInteraction }>(`/crm/contacts/${contactId}/interactions`, data),

    getInteractions: (contactId: string) =>
        api.get<{ success: boolean; data: CrmInteraction[] }>(`/crm/contacts/${contactId}/interactions`),

    // Tags
    getTags: () =>
        api.get<{ success: boolean; data: CrmTag[] }>('/crm/tags'),
};

// Constants
export const CRM_STATUS_OPTIONS = [
    { value: 'lead', label: 'Lead', color: 'blue' },
    { value: 'contact', label: 'Contact', color: 'gray' },
    { value: 'customer', label: 'Customer', color: 'green' },
    { value: 'partner', label: 'Partner', color: 'purple' },
    { value: 'archived', label: 'Archived', color: 'slate' },
];

export const PIPELINE_STAGES = [
    { value: 'discovery', label: 'Discovery' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'won', label: 'Won' },
];

export const INTERACTION_TYPES = [
    { value: 'note', label: 'Note', icon: 'FileText' },
    { value: 'email', label: 'Email', icon: 'Mail' },
    { value: 'call', label: 'Call', icon: 'Phone' },
    { value: 'meeting', label: 'Meeting', icon: 'Calendar' },
    { value: 'task', label: 'Task', icon: 'CheckSquare' },
];
