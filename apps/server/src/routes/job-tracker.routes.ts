import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { jobTrackerService } from '../services/job-tracker.service';
import { pluginsService } from '../services/plugins.service';
import { jobScraperService } from '../services/job-scraper.service';

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

export default router;
