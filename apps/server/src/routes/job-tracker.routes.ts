import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { jobTrackerService } from '../services/job-tracker.service';
import { pluginsService } from '../services/plugins.service';
import { jobScraperService } from '../services/job-scraper.service';
import { CompanyContactsService } from '../services/company-contacts.service';
import { EmailOutreachService } from '../services/email-outreach.service';

const router: Router = Router();

// Middleware to check if job-tracker plugin is enabled
const requireJobTrackerPlugin = asyncHandler(async (req: AuthRequest, res: Response, next: any) => {
  const enabled = await pluginsService.isPluginEnabled(req.user!.id, 'job-tracker');
  if (!enabled) {
    throw new ApiError('Job Tracker plugin is not enabled. Please enable it in the Plugins page.', 403);
  }
  next();
});

// Apply plugin check to all routes
router.use(authMiddleware, requireJobTrackerPlugin);

// ==================== Dashboard ====================

router.get('/dashboard', asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await jobTrackerService.getDashboardStats(req.user!.id);

  res.json({
    success: true,
    data: stats,
  });
}));

// ==================== Job Applications ====================

// Get all applications with filters
router.get('/applications', asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    status,
    priority,
    search,
    company,
    location,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
    page,
    limit,
  } = req.query;

  const result = await jobTrackerService.getJobApplications({
    userId: req.user!.id,
    status: status as string | undefined,
    priority: priority as string | undefined,
    search: search as string | undefined,
    company: company as string | undefined,
    location: location as string | undefined,
    dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
    dateTo: dateTo ? new Date(dateTo as string) : undefined,
    sortBy: sortBy as any,
    sortOrder: sortOrder as any,
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 50,
  });

  res.json({
    success: true,
    data: result.jobs,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    },
  });
}));

// Create new application
router.post('/applications', asyncHandler(async (req: AuthRequest, res: Response) => {
  const job = await jobTrackerService.createJobApplication({
    userId: req.user!.id,
    ...req.body,
    appliedDate: req.body.appliedDate ? new Date(req.body.appliedDate) : undefined,
  });

  res.json({
    success: true,
    data: job,
  });
}));

// Get single application
router.get('/applications/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const job = await jobTrackerService.getJobApplication(req.user!.id, req.params.id);

  res.json({
    success: true,
    data: job,
  });
}));

// Update application
router.patch('/applications/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const job = await jobTrackerService.updateJobApplication(
    req.user!.id,
    req.params.id,
    {
      ...req.body,
      appliedDate: req.body.appliedDate ? new Date(req.body.appliedDate) : undefined,
    }
  );

  res.json({
    success: true,
    data: job,
  });
}));

// Delete application
router.delete('/applications/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  await jobTrackerService.deleteJobApplication(req.user!.id, req.params.id);

  res.json({
    success: true,
    data: { deleted: true },
  });
}));

// ==================== Documents ====================

// Get documents with file info
router.get('/applications/:id/documents', asyncHandler(async (req: AuthRequest, res: Response) => {
  const documents = await jobTrackerService.getDocumentsWithFileInfo(req.user!.id, req.params.id);

  res.json({
    success: true,
    data: documents,
  });
}));

// Add document
router.post('/applications/:id/documents', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { fileId, documentType, label } = req.body;

  if (!fileId || !documentType) {
    throw new ApiError('fileId and documentType are required', 400);
  }

  const document = await jobTrackerService.addDocument(
    req.user!.id,
    req.params.id,
    fileId,
    documentType,
    label
  );

  res.json({
    success: true,
    data: document,
  });
}));

// Remove document
router.delete('/applications/:jobId/documents/:docId', asyncHandler(async (req: AuthRequest, res: Response) => {
  await jobTrackerService.removeDocument(req.user!.id, req.params.jobId, req.params.docId);

  res.json({
    success: true,
    data: { deleted: true },
  });
}));

// ==================== Tasks ====================

// Get upcoming tasks
router.get('/tasks/upcoming', asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const tasks = await jobTrackerService.getUpcomingTasks(req.user!.id, limit);

  res.json({
    success: true,
    data: tasks,
  });
}));

// Create task
router.post('/applications/:id/tasks', asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await jobTrackerService.createTask(req.user!.id, req.params.id, {
    ...req.body,
    dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
  });

  res.json({
    success: true,
    data: task,
  });
}));

// Update task
router.patch('/tasks/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const task = await jobTrackerService.updateTask(req.user!.id, req.params.id, {
    ...req.body,
    dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
  });

  res.json({
    success: true,
    data: task,
  });
}));

// Delete task
router.delete('/tasks/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  await jobTrackerService.deleteTask(req.user!.id, req.params.id);

  res.json({
    success: true,
    data: { deleted: true },
  });
}));

// ==================== Referrals ====================

// Get all referrals
router.get('/referrals', asyncHandler(async (req: AuthRequest, res: Response) => {
  const referrals = await jobTrackerService.getAllReferrals(
    req.user!.id,
    req.query.status as string | undefined
  );

  res.json({
    success: true,
    data: referrals,
  });
}));

// Create referral
router.post('/referrals', asyncHandler(async (req: AuthRequest, res: Response) => {
  const referral = await jobTrackerService.createReferral(req.user!.id, req.body);

  res.json({
    success: true,
    data: referral,
  });
}));

// Update referral
router.patch('/referrals/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const referral = await jobTrackerService.updateReferral(req.user!.id, req.params.id, {
    ...req.body,
    messageSentDate: req.body.messageSentDate ? new Date(req.body.messageSentDate) : undefined,
    followUpDate: req.body.followUpDate ? new Date(req.body.followUpDate) : undefined,
  });

  res.json({
    success: true,
    data: referral,
  });
}));

// Delete referral
router.delete('/referrals/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  await jobTrackerService.deleteReferral(req.user!.id, req.params.id);

  res.json({
    success: true,
    data: { deleted: true },
  });
}));

// ==================== Activity ====================

router.get('/activity', asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const activity = await jobTrackerService.getRecentActivity(req.user!.id, limit);

  res.json({
    success: true,
    data: activity,
  });
}));

// ==================== Job URL Scraper ====================

router.post('/scrape', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    throw new ApiError('Job posting URL is required', 400);
  }

  const scrapedData = await jobScraperService.scrapeJob(url);

  res.json({
    success: true,
    data: scrapedData,
  });
}));

// ==================== Export ====================

router.get('/export/csv', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, dateFrom, dateTo } = req.query;

  const csv = await jobTrackerService.exportToCSV(req.user!.id, {
    status: status as string | undefined,
    dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
    dateTo: dateTo ? new Date(dateTo as string) : undefined,
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="job-applications.csv"');
  res.send(csv);
}));

// ==================== Company Contacts Finder ====================

// Find company contacts (emails & LinkedIn profiles)
router.post('/applications/:id/contacts', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { 
    mode = 'hr', 
    targetRoles = [], 
    location,
    maxResults = 10 
  } = req.body;

  // Verify job application belongs to user
  const job = await jobTrackerService.getJobApplication(req.user!.id, id);

  // Get API keys from plugin settings
  const pluginSettings = await pluginsService.getPluginSettings(req.user!.id, 'job-tracker');
  const serpApiKey = pluginSettings?.serpApiKey as string | undefined;
  const hunterApiKey = pluginSettings?.hunterApiKey as string | undefined;

  if (!serpApiKey) {
    throw new ApiError('SERP API key not configured. Please add it in Job Tracker settings.', 400);
  }

  // Create service with user's API keys
  const contactsService = new CompanyContactsService(serpApiKey, hunterApiKey);

  // Find contacts at the company
  const result = await contactsService.findCompanyContacts(job.company, {
    mode: mode as 'hr' | 'functional',
    targetRoles: targetRoles as string[],
    location: location as string | undefined,
    maxResults: Math.min(maxResults, 25), // Cap at 25
  });

  res.json({
    success: true,
    data: {
      company: job.company,
      contacts: result.contacts,
      emailPattern: result.emailPattern,
      totalFound: result.totalFound,
      patternFromCache: result.patternFromCache,
    },
  });
}));

// Get default HR roles
router.get('/contacts/default-roles', asyncHandler(async (req: AuthRequest, res: Response) => {
  const hrRoles = CompanyContactsService.getDefaultHRRoles();

  res.json({
    success: true,
    data: {
      hrRoles,
      functionalCategories: [
        'Software Engineer',
        'Security Engineer',
        'Data Scientist',
        'Product Manager',
        'DevOps',
      ],
    },
  });
}));

// Expand role keywords
router.post('/contacts/expand-roles', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.body;

  if (!role || typeof role !== 'string') {
    throw new ApiError('Role is required', 400);
  }

  const expandedRoles = CompanyContactsService.getExpandedRoles(role);

  res.json({
    success: true,
    data: expandedRoles,
  });
}));

// Save API keys to plugin settings
router.post('/settings/api-keys', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { serpApiKey, hunterApiKey } = req.body;

  // Get current settings
  const currentSettings = await pluginsService.getPluginSettings(req.user!.id, 'job-tracker') || {};

  // Update with new API keys (only update if provided)
  const newSettings = {
    ...currentSettings,
    ...(serpApiKey !== undefined && { serpApiKey }),
    ...(hunterApiKey !== undefined && { hunterApiKey }),
  };

  await pluginsService.updatePluginSettings(req.user!.id, 'job-tracker', newSettings);

  res.json({
    success: true,
    data: {
      serpApiKey: serpApiKey ? '***' + serpApiKey.slice(-4) : null,
      hunterApiKey: hunterApiKey ? '***' + hunterApiKey.slice(-4) : null,
    },
  });
}));

// Get API keys status (masked)
router.get('/settings/api-keys', asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await pluginsService.getPluginSettings(req.user!.id, 'job-tracker');

  res.json({
    success: true,
    data: {
      hasSerpApiKey: !!settings?.serpApiKey,
      hasHunterApiKey: !!settings?.hunterApiKey,
      serpApiKeyMasked: settings?.serpApiKey ? '***' + (settings.serpApiKey as string).slice(-4) : null,
      hunterApiKeyMasked: settings?.hunterApiKey ? '***' + (settings.hunterApiKey as string).slice(-4) : null,
    },
  });
}));

// ==================== Email Pattern Cache ====================

// Get cache statistics
router.get('/contacts/cache/stats', asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await CompanyContactsService.getCacheStats();

  res.json({
    success: true,
    data: stats,
  });
}));

// Clear cached pattern for a domain
router.delete('/contacts/cache/:domain', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { domain } = req.params;

  if (!domain) {
    throw new ApiError('Domain is required', 400);
  }

  const deleted = await CompanyContactsService.clearCachedPattern(domain);

  res.json({
    success: true,
    data: { deleted, domain },
  });
}));

// ==================== Email Outreach ====================

// Get default email templates
router.get('/email/templates', asyncHandler(async (req: AuthRequest, res: Response) => {
  const templates = EmailOutreachService.getDefaultTemplates();

  res.json({
    success: true,
    data: templates,
  });
}));

// Generate AI-powered personalized email
router.post('/email/generate', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { 
    recipientName, 
    recipientPosition, 
    company, 
    jobTitle, 
    tone = 'professional',
    purpose = 'cold-outreach'
  } = req.body;

  // Get user's settings
  const settings = await pluginsService.getPluginSettings(req.user!.id, 'job-tracker');
  const openaiApiKey = settings?.openaiApiKey as string | undefined;
  const resumeText = settings?.resumeText as string | undefined;

  if (!openaiApiKey) {
    throw new ApiError('OpenAI API key not configured. Please add it in Job Tracker settings.', 400);
  }

  if (!resumeText) {
    throw new ApiError('Resume text not configured. Please add it in Job Tracker settings.', 400);
  }

  const emailService = new EmailOutreachService(undefined, openaiApiKey);

  const generated = await emailService.generatePersonalizedEmail({
    recipientName,
    recipientPosition,
    company,
    jobTitle,
    resumeText,
    tone,
    purpose,
  });

  res.json({
    success: true,
    data: generated,
  });
}));

// Send emails to contacts
router.post('/email/send', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { 
    contacts, 
    subject, 
    body, 
    attachments = [],
    senderName 
  } = req.body;

  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    throw new ApiError('At least one contact is required', 400);
  }

  if (!subject || !body) {
    throw new ApiError('Subject and body are required', 400);
  }

  // Get Gmail tokens from settings
  const settings = await pluginsService.getPluginSettings(req.user!.id, 'job-tracker');
  const gmailTokens = settings?.gmailTokens as { accessToken: string; refreshToken: string } | undefined;

  if (!gmailTokens) {
    throw new ApiError('Gmail not connected. Please connect your Gmail account in settings.', 400);
  }

  const emailService = new EmailOutreachService(gmailTokens);

  const results = await emailService.sendBulkEmails(
    contacts,
    { subject, body },
    senderName || 'Job Seeker',
    attachments
  );

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  res.json({
    success: true,
    data: {
      results,
      summary: {
        total: results.length,
        successful,
        failed,
      },
    },
  });
}));

// Get Gmail OAuth URL
router.get('/email/gmail/auth-url', asyncHandler(async (req: AuthRequest, res: Response) => {
  const state = Buffer.from(JSON.stringify({ userId: req.user!.id })).toString('base64');
  const authUrl = EmailOutreachService.getGmailAuthUrl(state);

  res.json({
    success: true,
    data: { authUrl },
  });
}));

// Handle Gmail OAuth callback
router.post('/email/gmail/callback', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code } = req.body;

  if (!code) {
    throw new ApiError('Authorization code is required', 400);
  }

  const tokens = await EmailOutreachService.exchangeCodeForTokens(code);

  // Save tokens to plugin settings
  const currentSettings = await pluginsService.getPluginSettings(req.user!.id, 'job-tracker') || {};
  await pluginsService.updatePluginSettings(req.user!.id, 'job-tracker', {
    ...currentSettings,
    gmailTokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
    gmailEmail: tokens.email,
  });

  res.json({
    success: true,
    data: {
      email: tokens.email,
      connected: true,
    },
  });
}));

// Disconnect Gmail
router.delete('/email/gmail/disconnect', asyncHandler(async (req: AuthRequest, res: Response) => {
  const currentSettings = await pluginsService.getPluginSettings(req.user!.id, 'job-tracker') || {};
  
  // Remove Gmail tokens
  const { gmailTokens, gmailEmail, ...restSettings } = currentSettings;
  await pluginsService.updatePluginSettings(req.user!.id, 'job-tracker', restSettings);

  res.json({
    success: true,
    data: { disconnected: true },
  });
}));

// Save resume text
router.post('/settings/resume', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { resumeText } = req.body;

  if (typeof resumeText !== 'string') {
    throw new ApiError('Resume text must be a string', 400);
  }

  const currentSettings = await pluginsService.getPluginSettings(req.user!.id, 'job-tracker') || {};
  await pluginsService.updatePluginSettings(req.user!.id, 'job-tracker', {
    ...currentSettings,
    resumeText,
  });

  res.json({
    success: true,
    data: {
      saved: true,
      length: resumeText.length,
    },
  });
}));

// Get resume text
router.get('/settings/resume', asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await pluginsService.getPluginSettings(req.user!.id, 'job-tracker');

  res.json({
    success: true,
    data: {
      resumeText: settings?.resumeText || '',
      hasResume: !!settings?.resumeText,
    },
  });
}));

// Save OpenAI API key
router.post('/settings/openai-key', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { openaiApiKey } = req.body;

  const currentSettings = await pluginsService.getPluginSettings(req.user!.id, 'job-tracker') || {};
  await pluginsService.updatePluginSettings(req.user!.id, 'job-tracker', {
    ...currentSettings,
    openaiApiKey,
  });

  res.json({
    success: true,
    data: {
      saved: true,
      masked: openaiApiKey ? '***' + openaiApiKey.slice(-4) : null,
    },
  });
}));

// Get full settings status (all API keys + Gmail + resume)
router.get('/settings/full', asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await pluginsService.getPluginSettings(req.user!.id, 'job-tracker');

  res.json({
    success: true,
    data: {
      hasSerpApiKey: !!settings?.serpApiKey,
      hasHunterApiKey: !!settings?.hunterApiKey,
      hasOpenaiApiKey: !!settings?.openaiApiKey,
      hasResume: !!settings?.resumeText,
      resumeLength: (settings?.resumeText as string)?.length || 0,
      gmailConnected: !!settings?.gmailTokens,
      gmailEmail: settings?.gmailEmail || null,
      serpApiKeyMasked: settings?.serpApiKey ? '***' + (settings.serpApiKey as string).slice(-4) : null,
      hunterApiKeyMasked: settings?.hunterApiKey ? '***' + (settings.hunterApiKey as string).slice(-4) : null,
      openaiApiKeyMasked: settings?.openaiApiKey ? '***' + (settings.openaiApiKey as string).slice(-4) : null,
    },
  });
}));

export default router;
