import { api } from './api';

// Types
export interface JobApplication {
  id: string;
  userId: string;
  company: string;
  companyLogo?: string;
  jobTitle: string;
  location?: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  jobUrl?: string;
  jobDescription?: string;
  status: string;
  priority: string;
  rating?: number;
  appliedDate?: Date | string;
  notes?: string;
  source?: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
  documents?: JobDocument[];
  tasks?: JobTask[];
  referrals?: JobReferral[];
  activities?: JobActivity[];
  _count?: {
    documents: number;
    tasks: number;
    referrals: number;
  };
}

export interface JobDocument {
  id: string;
  jobApplicationId: string;
  fileId: string;
  documentType: string;
  label?: string;
  createdAt: string;
  file?: {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
    createdAt: string;
  };
}

export interface JobTask {
  id: string;
  jobApplicationId: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: string;
  status: string;
  completedAt?: string;
  createdAt: string;
  jobApplication?: {
    id: string;
    company: string;
    jobTitle: string;
  };
}

export interface JobReferral {
  id: string;
  jobApplicationId?: string;
  userId: string;
  name: string;
  role?: string;
  position?: string;
  company?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  messageSent?: string;
  messageSentDate?: string;
  followUpDate?: string;
  status: string;
  notes?: string;
  createdAt: string;
  jobApplication?: {
    id: string;
    company: string;
    jobTitle: string;
  };
}

export interface JobActivity {
  id: string;
  jobApplicationId: string;
  action: string;
  description: string;
  metadata?: any;
  createdAt: string;
  jobApplication?: {
    id: string;
    company: string;
    jobTitle: string;
  };
}

export interface DashboardStats {
  totalApplications: number;
  applicationsToday?: number;
  statusCounts: Record<string, number>;
  interviews: number;
  offers: number;
  responseRate: number;
  successRate: number;
  recentActivity: JobActivity[];
  upcomingTasks: JobTask[];
}

export interface JobTrackerPreferences {
  dailyGoal: number;
  timezone: string | null;
}

export interface ScrapedJobData {
  company: string;
  companyLogo?: string;
  jobTitle: string;
  location?: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  jobDescription?: string;
  jobUrl: string;
  source: string;
  postedDate?: string;
  applicants?: string;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  features: string[];
  enabled?: boolean;
}

// Plugins API
export const pluginsApi = {
  getAvailable: () => api.get<{ success: boolean; data: Plugin[] }>('/plugins/available'),

  getEnabled: () => api.get<{ success: boolean; data: Plugin[] }>('/plugins/enabled'),

  checkStatus: (pluginId: string) =>
    api.get<{ success: boolean; data: { enabled: boolean } }>(`/plugins/${pluginId}/status`),

  enable: (pluginId: string, settings?: any) =>
    api.post(`/plugins/${pluginId}/enable`, { settings }),

  disable: (pluginId: string) =>
    api.post(`/plugins/${pluginId}/disable`),

  updateSettings: (pluginId: string, settings: any) =>
    api.patch(`/plugins/${pluginId}/settings`, { settings }),
};

// Company Contact types
export interface CompanyContact {
  name: string;
  firstName: string;
  lastName: string;
  position: string;
  linkedinUrl: string;
  email: string | null;
  emailConfidence: number;
  source: string;
}

export interface EmailPattern {
  pattern: string;
  confidence: number;
}

export interface CompanyContactsResult {
  company: string;
  contacts: CompanyContact[];
  emailPattern: EmailPattern | null;
  totalFound: number;
  patternFromCache: boolean;
}

// Email Outreach Types
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  isAiGenerated?: boolean;
}

export interface ContactForEmail {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  company: string;
}

export interface EmailSendResult {
  success: boolean;
  email: string;
  name: string;
  error?: string;
  messageId?: string;
}

export interface FullSettingsStatus {
  hasSerpApiKey: boolean;
  hasHunterApiKey: boolean;
  hasOpenaiApiKey: boolean;
  hasResume: boolean;
  resumeLength: number;
  gmailConnected: boolean;
  gmailEmail: string | null;
  serpApiKeyMasked: string | null;
  hunterApiKeyMasked: string | null;
  openaiApiKeyMasked: string | null;
}

// Sent Email Tracking Types
export interface SentEmail {
  id: string;
  userId: string;
  jobApplicationId?: string;
  recipientName: string;
  recipientEmail: string;
  recipientPosition?: string;
  company: string;
  subject: string;
  body: string;
  status: 'sent' | 'replied' | 'meeting_scheduled' | 'not_interested' | 'no_response';
  gmailMessageId?: string;
  gmailThreadId?: string;
  followUpDate?: string;
  followedUp: boolean;
  followUpCount: number;
  lastFollowUpAt?: string;
  notes?: string;
  sentAt: string;
  createdAt: string;
  updatedAt: string;
  jobApplication?: {
    id: string;
    company: string;
    jobTitle: string;
    status: string;
  };
}

export interface FollowUpStats {
  dueToday: number;
  overdue: number;
  upcoming: number;
  noResponse: number;
}

export interface OutreachStats {
  totalSent: number;
  totalReplied: number;
  totalMeetings: number;
  totalNoResponse: number;
  responseRate: number;
  meetingRate: number;
  statusCounts: Record<string, number>;
  recentEmails: SentEmail[];
}

// Job Tracker API
export const jobTrackerApi = {
  // Dashboard
  getDashboard: (timezone?: string, signal?: AbortSignal) => {
    const params: Record<string, string> = { _t: String(Date.now()) };
    if (timezone) params.timezone = timezone;
    return api.get<{ success: boolean; data: DashboardStats }>('/job-tracker/dashboard', { params, signal });
  },

  // Preferences (daily goal, timezone)
  getPreferences: () =>
    api.get<{ success: boolean; data: JobTrackerPreferences }>('/job-tracker/preferences'),
  updatePreferences: (data: { dailyGoal?: number; timezone?: string | null }) =>
    api.patch<{ success: boolean; data: JobTrackerPreferences }>('/job-tracker/preferences', data),

  // Scrape job from URL
  scrapeJob: (url: string) =>
    api.post<{ success: boolean; data: ScrapedJobData }>('/job-tracker/scrape', { url }),

  // Company Contacts Finder
  findCompanyContacts: (jobId: string, options: {
    mode: 'hr' | 'functional';
    targetRoles?: string[];
    location?: string;
    maxResults?: number;
  }) =>
    api.post<{ success: boolean; data: CompanyContactsResult }>(`/job-tracker/applications/${jobId}/contacts`, options),

  // Standalone contact finder (no job application required)
  searchContacts: (options: {
    company: string;
    mode?: 'hr' | 'functional';
    targetRoles?: string[];
    location?: string;
    maxResults?: number;
  }) =>
    api.post<{ success: boolean; data: CompanyContactsResult }>('/job-tracker/contacts/search', options),

  getDefaultRoles: () =>
    api.get<{ success: boolean; data: { hrRoles: string[]; functionalCategories: string[] } }>('/job-tracker/contacts/default-roles'),

  expandRoles: (role: string) =>
    api.post<{ success: boolean; data: string[] }>('/job-tracker/contacts/expand-roles', { role }),

  // API Keys management
  getApiKeysStatus: () =>
    api.get<{ success: boolean; data: { hasSerpApiKey: boolean; hasHunterApiKey: boolean; serpApiKeyMasked: string | null; hunterApiKeyMasked: string | null } }>('/job-tracker/settings/api-keys'),

  saveApiKeys: (keys: { serpApiKey?: string; hunterApiKey?: string }) =>
    api.post<{ success: boolean; data: { serpApiKey: string | null; hunterApiKey: string | null } }>('/job-tracker/settings/api-keys', keys),

  // Full Settings
  getFullSettings: () =>
    api.get<{ success: boolean; data: FullSettingsStatus }>('/job-tracker/settings/full'),

  // Email Outreach
  getEmailTemplates: () =>
    api.get<{ success: boolean; data: EmailTemplate[] }>('/job-tracker/email/templates'),

  generateEmail: (options: {
    recipientName: string;
    recipientPosition: string;
    company: string;
    jobTitle: string;
    jobDescription?: string;
    tone?: 'professional' | 'friendly' | 'casual';
    purpose?: 'referral' | 'introduction' | 'follow-up' | 'cold-outreach';
  }) =>
    api.post<{ success: boolean; data: { subject: string; body: string } }>('/job-tracker/email/generate', options),

  refineEmail: (options: {
    currentSubject: string;
    currentBody: string;
    instruction: string;
    recipientName?: string;
    recipientPosition?: string;
    company?: string;
    jobTitle?: string;
  }) =>
    api.post<{ success: boolean; data: { subject: string; body: string } }>('/job-tracker/email/refine', options),

  sendEmails: (data: {
    contacts: ContactForEmail[];
    subject: string;
    body: string;
    senderName: string;
    attachments?: Array<{ filename: string; content: string; mimeType: string }>;
    jobApplicationId?: string;
  }) =>
    api.post<{ success: boolean; data: { results: EmailSendResult[]; savedEmails: SentEmail[]; summary: { total: number; successful: number; failed: number; tracked: number } } }>('/job-tracker/email/send', data),

  draftEmails: (data: {
    contacts: ContactForEmail[];
    subject: string;
    body: string;
    senderName: string;
    attachments?: Array<{ filename: string; content: string; mimeType: string }>;
    jobApplicationId?: string;
  }) =>
    api.post<{ success: boolean; data: { results: EmailSendResult[]; savedEmails: SentEmail[]; summary: { total: number; successful: number; failed: number; tracked: number } } }>('/job-tracker/email/draft', data),

  sendTestEmail: (data: {
    subject: string;
    body: string;
    senderName: string;
    testContact?: ContactForEmail;
  }) =>
    api.post<{ success: boolean; data: { message: string; sentTo: string; messageId?: string } }>('/job-tracker/email/test', data),

  // Gmail OAuth
  getGmailAuthUrl: () =>
    api.get<{ success: boolean; data: { authUrl: string } }>('/job-tracker/email/gmail/auth-url'),

  connectGmail: (code: string) =>
    api.post<{ success: boolean; data: { email: string; connected: boolean } }>('/job-tracker/email/gmail/callback', { code }),

  disconnectGmail: () =>
    api.delete<{ success: boolean; data: { disconnected: boolean } }>('/job-tracker/email/gmail/disconnect'),

  // Resume
  saveResume: (resumeText: string) =>
    api.post<{ success: boolean; data: { saved: boolean; length: number } }>('/job-tracker/settings/resume', { resumeText }),

  getResume: () =>
    api.get<{ success: boolean; data: { resumeText: string; hasResume: boolean } }>('/job-tracker/settings/resume'),

  // OpenAI Key
  saveOpenaiKey: (openaiApiKey: string) =>
    api.post<{ success: boolean; data: { saved: boolean; masked: string | null } }>('/job-tracker/settings/openai-key', { openaiApiKey }),

  // Applications
  getApplications: (params?: {
    status?: string;
    priority?: string;
    search?: string;
    company?: string;
    location?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }) => api.get<{ success: boolean; data: JobApplication[]; meta: any }>('/job-tracker/applications', { params }),

  getApplication: (id: string) =>
    api.get<{ success: boolean; data: JobApplication }>(`/job-tracker/applications/${id}`),

  createApplication: (data: Partial<JobApplication>) =>
    api.post<{ success: boolean; data: JobApplication }>('/job-tracker/applications', data),

  updateApplication: (id: string, data: Partial<JobApplication>) =>
    api.patch<{ success: boolean; data: JobApplication }>(`/job-tracker/applications/${id}`, data),

  deleteApplication: (id: string) =>
    api.delete(`/job-tracker/applications/${id}`),

  // Documents
  getDocuments: (jobId: string) =>
    api.get<{ success: boolean; data: JobDocument[] }>(`/job-tracker/applications/${jobId}/documents`),

  addDocument: (jobId: string, data: { fileId: string; documentType: string; label?: string }) =>
    api.post<{ success: boolean; data: JobDocument }>(`/job-tracker/applications/${jobId}/documents`, data),

  removeDocument: (jobId: string, docId: string) =>
    api.delete(`/job-tracker/applications/${jobId}/documents/${docId}`),

  // Tasks
  getUpcomingTasks: (limit?: number) =>
    api.get<{ success: boolean; data: JobTask[] }>('/job-tracker/tasks/upcoming', { params: { limit } }),

  createTask: (jobId: string, data: Partial<JobTask>) =>
    api.post<{ success: boolean; data: JobTask }>(`/job-tracker/applications/${jobId}/tasks`, data),

  updateTask: (taskId: string, data: Partial<JobTask>) =>
    api.patch<{ success: boolean; data: JobTask }>(`/job-tracker/tasks/${taskId}`, data),

  deleteTask: (taskId: string) =>
    api.delete(`/job-tracker/tasks/${taskId}`),

  // Referrals
  getReferrals: (status?: string) =>
    api.get<{ success: boolean; data: JobReferral[] }>('/job-tracker/referrals', { params: { status } }),

  createReferral: (data: Partial<JobReferral>) =>
    api.post<{ success: boolean; data: JobReferral }>('/job-tracker/referrals', data),

  updateReferral: (id: string, data: Partial<JobReferral>) =>
    api.patch<{ success: boolean; data: JobReferral }>(`/job-tracker/referrals/${id}`, data),

  deleteReferral: (id: string) =>
    api.delete(`/job-tracker/referrals/${id}`),

  // Activity
  getActivity: (limit?: number) =>
    api.get<{ success: boolean; data: JobActivity[] }>('/job-tracker/activity', { params: { limit } }),

  // Export
  exportCSV: (params?: { status?: string; dateFrom?: string; dateTo?: string }) =>
    api.get('/job-tracker/export/csv', {
      params,
      responseType: 'blob',
    }),

  // ==================== Outreach / Sent Emails ====================

  // Get all sent emails with filters
  getSentEmails: (params?: {
    jobApplicationId?: string;
    company?: string;
    status?: string;
    followUpDue?: boolean;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: 'sentAt' | 'followUpDate' | 'company' | 'status';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) =>
    api.get<{ success: boolean; data: SentEmail[]; meta: any }>('/job-tracker/outreach/emails', { params }),

  // Get outreach dashboard stats
  getOutreachStats: () =>
    api.get<{ success: boolean; data: OutreachStats }>('/job-tracker/outreach/stats'),

  // Get follow-up stats for main dashboard
  getFollowUpStats: () =>
    api.get<{ success: boolean; data: FollowUpStats }>('/job-tracker/outreach/follow-up-stats'),

  // Get emails due for follow-up
  getFollowUpsDue: (limit?: number) =>
    api.get<{ success: boolean; data: SentEmail[] }>('/job-tracker/outreach/follow-ups-due', { params: { limit } }),

  // Get emails by company
  getEmailsByCompany: (company: string) =>
    api.get<{ success: boolean; data: SentEmail[] }>(`/job-tracker/outreach/by-company/${encodeURIComponent(company)}`),

  // Get emails for a job application
  getEmailsByJobApplication: (jobId: string) =>
    api.get<{ success: boolean; data: SentEmail[] }>(`/job-tracker/outreach/by-job/${jobId}`),

  // Get single sent email
  getSentEmail: (id: string) =>
    api.get<{ success: boolean; data: SentEmail }>(`/job-tracker/outreach/emails/${id}`),

  // Update sent email
  updateSentEmail: (id: string, data: {
    status?: string;
    followUpDate?: string | null;
    followedUp?: boolean;
    notes?: string;
  }) =>
    api.patch<{ success: boolean; data: SentEmail }>(`/job-tracker/outreach/emails/${id}`, data),

  // Quick actions
  markEmailAsReplied: (id: string) =>
    api.post<{ success: boolean; data: SentEmail }>(`/job-tracker/outreach/emails/${id}/replied`),

  markEmailAsMeetingScheduled: (id: string) =>
    api.post<{ success: boolean; data: SentEmail }>(`/job-tracker/outreach/emails/${id}/meeting-scheduled`),

  markEmailAsNoResponse: (id: string) =>
    api.post<{ success: boolean; data: SentEmail }>(`/job-tracker/outreach/emails/${id}/no-response`),

  scheduleFollowUp: (id: string, followUpDate: string) =>
    api.post<{ success: boolean; data: SentEmail }>(`/job-tracker/outreach/emails/${id}/schedule-follow-up`, { followUpDate }),

  // Delete sent email record
  deleteSentEmail: (id: string) =>
    api.delete<{ success: boolean; data: { deleted: boolean } }>(`/job-tracker/outreach/emails/${id}`),

  // Export sent emails to CSV
  exportSentEmailsCSV: (params?: { company?: string; status?: string; dateFrom?: string; dateTo?: string }) =>
    api.get('/job-tracker/outreach/export/csv', {
      params,
      responseType: 'blob',
    }),
};

// Password Vault Types
export interface PasswordEntry {
  id: string;
  userId: string;
  name: string;
  username?: string;
  password?: string; // Only returned when explicitly requested
  url?: string;
  notes?: string; // Only returned when explicitly requested
  category?: string;
  tags: string[];
  isFavorite: boolean;
  lastUsedAt?: string;
  passwordStrength?: 'weak' | 'fair' | 'good' | 'strong';
  customFields?: any;
  createdAt: string;
  updatedAt: string;
  _count?: {
    // Add any counts if needed
  };
}

export interface PasswordCategory {
  id: string;
  userId: string;
  name: string;
  color?: string;
  icon?: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordSecurityEvent {
  id: string;
  userId: string;
  eventType: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  createdAt: string;
}

export interface PasswordStrengthCheck {
  score: number;
  strength: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
}

export interface PasswordGenerationOptions {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
  excludeSimilar?: boolean;
}

// Password Vault API
export const passwordVaultApi = {
  // Dashboard
  getDashboard: () =>
    api.get<{ success: boolean; data: any }>('/password-vault/dashboard'),

  // Password Entries
  getPasswords: (params?: {
    category?: string;
    search?: string;
    tags?: string[];
    isFavorite?: boolean;
    sortBy?: 'name' | 'createdAt' | 'lastUsedAt' | 'category';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) =>
    api.get<{ success: boolean; data: PasswordEntry[]; meta: any }>('/password-vault/passwords', { params }),

  getPassword: (id: string, masterKey: string) =>
    api.post<{ success: boolean; data: PasswordEntry }>(`/password-vault/passwords/${id}`, { masterKey }),

  createPassword: (data: {
    name: string;
    username?: string;
    password: string;
    url?: string;
    notes?: string;
    category?: string;
    tags?: string[];
    customFields?: any;
  }, masterKey: string) =>
    api.post<{ success: boolean; data: PasswordEntry }>('/password-vault/passwords', { ...data, masterKey }),

  updatePassword: (id: string, data: Partial<PasswordEntry>, masterKey: string) =>
    api.patch<{ success: boolean; data: PasswordEntry }>(`/password-vault/passwords/${id}`, { ...data, masterKey }),

  deletePassword: (id: string) =>
    api.delete<{ success: boolean; data: { deleted: boolean } }>(`/password-vault/passwords/${id}`),

  // Categories
  getCategories: () =>
    api.get<{ success: boolean; data: PasswordCategory[] }>('/password-vault/categories'),

  createCategory: (data: {
    name: string;
    color?: string;
    icon?: string;
  }) =>
    api.post<{ success: boolean; data: PasswordCategory }>('/password-vault/categories', data),

  updateCategory: (id: string, data: Partial<PasswordCategory>) =>
    api.patch<{ success: boolean; data: PasswordCategory }>(`/password-vault/categories/${id}`, data),

  deleteCategory: (id: string) =>
    api.delete<{ success: boolean; data: { deleted: boolean } }>(`/password-vault/categories/${id}`),

  // Password Generation & Strength
  generatePassword: (options?: PasswordGenerationOptions) =>
    api.post<{ success: boolean; data: { password: string } }>('/password-vault/generate-password', options),

  checkPasswordStrength: (password: string) =>
    api.post<{ success: boolean; data: PasswordStrengthCheck }>('/password-vault/check-password-strength', { password }),

  // Security Events
  getSecurityEvents: (limit?: number) =>
    api.get<{ success: boolean; data: PasswordSecurityEvent[] }>('/password-vault/security-events', { params: { limit } }),

  // Export
  exportCSV: (masterKey: string) =>
    api.get('/password-vault/export/csv', {
      params: { masterKey },
      responseType: 'blob',
    }),
};

// Job Status Options
// Notification types
export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Notifications API
export const notificationsApi = {
  getNotifications: (params?: { unreadOnly?: boolean; limit?: number; offset?: number; type?: string; excludeType?: string }) =>
    api.get<{ success: boolean; data: AppNotification[]; meta: { total: number } }>('/notifications', { params }),

  getUnreadCount: (params?: { excludeType?: string }) =>
    api.get<{ success: boolean; data: { count: number } }>('/notifications/unread-count', { params }),

  /** Fetch only email_reply notifications for the dedicated Email Replies section */
  getEmailReplies: (params?: { limit?: number; offset?: number }) =>
    api.get<{ success: boolean; data: AppNotification[]; meta: { total: number } }>('/notifications', {
      params: { type: 'email_reply', limit: params?.limit ?? 10, offset: params?.offset ?? 0 },
    }),

  markAsRead: (id: string) =>
    api.patch<{ success: boolean; data: AppNotification }>(`/notifications/${id}/read`),

  markAllRead: () =>
    api.post<{ success: boolean; data: { marked: boolean } }>('/notifications/mark-all-read'),
};

export const JOB_STATUSES = [
  { value: 'wishlist', label: 'Wishlist', color: 'gray' },
  { value: 'applied', label: 'Applied', color: 'blue' },
  { value: 'interview', label: 'Interview', color: 'yellow' },
  { value: 'offer', label: 'Offer', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
  { value: 'accepted', label: 'Accepted', color: 'emerald' },
  { value: 'withdrawn', label: 'Withdrawn', color: 'slate' },
];

export const JOB_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'gray' },
  { value: 'medium', label: 'Medium', color: 'yellow' },
  { value: 'high', label: 'High', color: 'red' },
];

export const DOCUMENT_TYPES = [
  { value: 'resume', label: 'Resume' },
  { value: 'cover_letter', label: 'Cover Letter' },
  { value: 'job_description', label: 'Job Description' },
  { value: 'offer_letter', label: 'Offer Letter' },
  { value: 'contract', label: 'Contract' },
  { value: 'other', label: 'Other' },
];

export const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'internship', label: 'Internship' },
  { value: 'remote', label: 'Remote' },
];
