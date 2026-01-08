import { api } from './api';

// Types
export interface JobApplication {
  id: string;
  userId: string;
  company: string;
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
  statusCounts: Record<string, number>;
  interviews: number;
  offers: number;
  responseRate: number;
  successRate: number;
  recentActivity: JobActivity[];
  upcomingTasks: JobTask[];
}

export interface ScrapedJobData {
  company: string;
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

// Job Tracker API
export const jobTrackerApi = {
  // Dashboard
  getDashboard: () => 
    api.get<{ success: boolean; data: DashboardStats }>('/job-tracker/dashboard'),

  // Scrape job from URL
  scrapeJob: (url: string) => 
    api.post<{ success: boolean; data: ScrapedJobData }>('/job-tracker/scrape', { url }),

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
