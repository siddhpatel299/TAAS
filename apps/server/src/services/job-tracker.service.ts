import { prisma } from '../lib/prisma';
import { ApiError } from '../middleware/error.middleware';
import { Prisma } from '@prisma/client';

interface CreateJobApplicationInput {
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
  status?: string;
  priority?: string;
  rating?: number;
  appliedDate?: Date;
  notes?: string;
  source?: string;
  sourceUrl?: string;
}

interface UpdateJobApplicationInput {
  company?: string;
  jobTitle?: string;
  location?: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  jobUrl?: string;
  jobDescription?: string;
  status?: string;
  priority?: string;
  rating?: number;
  appliedDate?: Date;
  notes?: string;
  source?: string;
  sourceUrl?: string;
}

interface GetJobApplicationsParams {
  userId: string;
  status?: string;
  priority?: string;
  search?: string;
  company?: string;
  location?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'createdAt' | 'appliedDate' | 'company' | 'status' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const jobTrackerService = {
  // ==================== Job Applications ====================

  async createJobApplication(input: CreateJobApplicationInput) {
    const job = await prisma.jobApplication.create({
      data: {
        userId: input.userId,
        company: input.company,
        jobTitle: input.jobTitle,
        location: input.location,
        employmentType: input.employmentType,
        salaryMin: input.salaryMin,
        salaryMax: input.salaryMax,
        salaryCurrency: input.salaryCurrency || 'USD',
        salaryPeriod: input.salaryPeriod || 'year',
        jobUrl: input.jobUrl,
        jobDescription: input.jobDescription,
        status: input.status || 'wishlist',
        priority: input.priority || 'medium',
        rating: input.rating,
        appliedDate: input.appliedDate,
        notes: input.notes,
        source: input.source,
        sourceUrl: input.sourceUrl,
      },
      include: {
        documents: true,
        tasks: true,
        referrals: true,
      },
    });

    // Do not fail creation if activity logging has an issue (e.g. missing table in older envs).
    try {
      await this.logActivity(job.id, 'created', `Added application for ${input.jobTitle} at ${input.company}`);
    } catch (error) {
      console.warn('[JobTracker] Failed to log creation activity:', error);
    }

    return job;
  },

  async getJobApplications(params: GetJobApplicationsParams) {
    const {
      userId,
      status,
      priority,
      search,
      company,
      location,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 50,
    } = params;

    const where: Prisma.JobApplicationWhereInput = {
      userId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(company && { company: { contains: company, mode: 'insensitive' } }),
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
      ...(dateFrom && dateTo && {
        createdAt: { gte: dateFrom, lte: dateTo },
      }),
      ...(search && {
        OR: [
          { company: { contains: search, mode: 'insensitive' } },
          { jobTitle: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [jobs, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          documents: true,
          tasks: {
            where: { status: 'pending' },
            orderBy: { dueDate: 'asc' },
            take: 3,
          },
          _count: {
            select: {
              documents: true,
              tasks: true,
              referrals: true,
            },
          },
        },
      }),
      prisma.jobApplication.count({ where }),
    ]);

    return {
      jobs,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  },

  async getJobApplication(userId: string, jobId: string) {
    const job = await prisma.jobApplication.findFirst({
      where: { id: jobId, userId },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
        },
        referrals: {
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!job) {
      throw new ApiError('Job application not found', 404);
    }

    return job;
  },

  async updateJobApplication(userId: string, jobId: string, input: UpdateJobApplicationInput) {
    const existing = await prisma.jobApplication.findFirst({
      where: { id: jobId, userId },
    });

    if (!existing) {
      throw new ApiError('Job application not found', 404);
    }

    // Track status change for activity log
    const statusChanged = input.status && input.status !== existing.status;

    const job = await prisma.jobApplication.update({
      where: { id: jobId },
      data: input,
      include: {
        documents: true,
        tasks: true,
        referrals: true,
      },
    });

    if (statusChanged) {
      await this.logActivity(
        jobId,
        'status_changed',
        `Status changed from ${existing.status} to ${input.status}`,
        { oldStatus: existing.status, newStatus: input.status }
      );
    }

    return job;
  },

  async deleteJobApplication(userId: string, jobId: string) {
    const existing = await prisma.jobApplication.findFirst({
      where: { id: jobId, userId },
    });

    if (!existing) {
      throw new ApiError('Job application not found', 404);
    }

    await prisma.jobApplication.delete({
      where: { id: jobId },
    });

    return { success: true };
  },

  // ==================== Documents ====================

  async addDocument(userId: string, jobId: string, fileId: string, documentType: string, label?: string) {
    // Verify job belongs to user
    const job = await prisma.jobApplication.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new ApiError('Job application not found', 404);
    }

    // Verify file belongs to user
    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      throw new ApiError('File not found', 404);
    }

    const document = await prisma.jobDocument.create({
      data: {
        jobApplicationId: jobId,
        fileId,
        documentType,
        label,
      },
    });

    await this.logActivity(jobId, 'document_added', `Added ${documentType}: ${file.originalName}`);

    return document;
  },

  async removeDocument(userId: string, jobId: string, documentId: string) {
    const job = await prisma.jobApplication.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new ApiError('Job application not found', 404);
    }

    await prisma.jobDocument.delete({
      where: { id: documentId },
    });

    return { success: true };
  },

  async getDocumentsWithFileInfo(userId: string, jobId: string) {
    const documents = await prisma.jobDocument.findMany({
      where: { jobApplicationId: jobId },
      orderBy: { createdAt: 'desc' },
    });

    // Get file info for each document
    const fileIds = documents.map(d => d.fileId);
    const files = await prisma.file.findMany({
      where: { id: { in: fileIds }, userId },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        size: true,
        createdAt: true,
      },
    });

    const fileMap = new Map(files.map(f => [f.id, f]));

    return documents.map(doc => ({
      ...doc,
      file: fileMap.get(doc.fileId) || null,
    }));
  },

  // ==================== Tasks ====================

  async createTask(userId: string, jobId: string, data: {
    title: string;
    description?: string;
    dueDate?: Date;
    priority?: string;
  }) {
    const job = await prisma.jobApplication.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new ApiError('Job application not found', 404);
    }

    const task = await prisma.jobTask.create({
      data: {
        jobApplicationId: jobId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        priority: data.priority || 'medium',
      },
    });

    await this.logActivity(jobId, 'task_created', `Created task: ${data.title}`);

    return task;
  },

  async updateTask(userId: string, taskId: string, data: {
    title?: string;
    description?: string;
    dueDate?: Date;
    priority?: string;
    status?: string;
  }) {
    const task = await prisma.jobTask.findFirst({
      where: { id: taskId },
      include: { jobApplication: true },
    });

    if (!task || task.jobApplication.userId !== userId) {
      throw new ApiError('Task not found', 404);
    }

    const statusChanged = data.status && data.status !== task.status;

    const updatedTask = await prisma.jobTask.update({
      where: { id: taskId },
      data: {
        ...data,
        ...(data.status === 'completed' && !task.completedAt ? { completedAt: new Date() } : {}),
      },
    });

    if (statusChanged && data.status === 'completed') {
      await this.logActivity(task.jobApplicationId, 'task_completed', `Completed task: ${task.title}`);
    }

    return updatedTask;
  },

  async deleteTask(userId: string, taskId: string) {
    const task = await prisma.jobTask.findFirst({
      where: { id: taskId },
      include: { jobApplication: true },
    });

    if (!task || task.jobApplication.userId !== userId) {
      throw new ApiError('Task not found', 404);
    }

    await prisma.jobTask.delete({
      where: { id: taskId },
    });

    return { success: true };
  },

  async getUpcomingTasks(userId: string, limit = 10) {
    const now = new Date();
    
    return prisma.jobTask.findMany({
      where: {
        jobApplication: { userId },
        status: 'pending',
        dueDate: { not: null },
      },
      orderBy: { dueDate: 'asc' },
      take: limit,
      include: {
        jobApplication: {
          select: { id: true, company: true, jobTitle: true },
        },
      },
    });
  },

  // ==================== Referrals ====================

  async createReferral(userId: string, data: {
    jobApplicationId?: string;
    name: string;
    role?: string;
    company?: string;
    email?: string;
    phone?: string;
    linkedinUrl?: string;
    notes?: string;
  }) {
    // If job ID provided, verify it belongs to user
    if (data.jobApplicationId) {
      const job = await prisma.jobApplication.findFirst({
        where: { id: data.jobApplicationId, userId },
      });

      if (!job) {
        throw new ApiError('Job application not found', 404);
      }
    }

    const referral = await prisma.jobReferral.create({
      data: {
        userId,
        ...data,
      },
    });

    if (data.jobApplicationId) {
      await this.logActivity(data.jobApplicationId, 'referral_added', `Added referral: ${data.name}`);
    }

    return referral;
  },

  async updateReferral(userId: string, referralId: string, data: {
    name?: string;
    role?: string;
    company?: string;
    email?: string;
    phone?: string;
    linkedinUrl?: string;
    messageSent?: string;
    messageSentDate?: Date;
    followUpDate?: Date;
    status?: string;
    notes?: string;
  }) {
    const referral = await prisma.jobReferral.findFirst({
      where: { id: referralId, userId },
    });

    if (!referral) {
      throw new ApiError('Referral not found', 404);
    }

    return prisma.jobReferral.update({
      where: { id: referralId },
      data,
    });
  },

  async deleteReferral(userId: string, referralId: string) {
    const referral = await prisma.jobReferral.findFirst({
      where: { id: referralId, userId },
    });

    if (!referral) {
      throw new ApiError('Referral not found', 404);
    }

    await prisma.jobReferral.delete({
      where: { id: referralId },
    });

    return { success: true };
  },

  async getAllReferrals(userId: string, status?: string) {
    return prisma.jobReferral.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        jobApplication: {
          select: { id: true, company: true, jobTitle: true },
        },
      },
    });
  },

  // ==================== Analytics & Dashboard ====================

  async getDashboardStats(userId: string) {
    const [
      totalApplications,
      applicationsByStatus,
      recentActivity,
      upcomingTasks,
    ] = await Promise.all([
      prisma.jobApplication.count({ where: { userId } }),
      prisma.jobApplication.groupBy({
        by: ['status'],
        where: { userId },
        _count: { status: true },
      }),
      prisma.jobActivity.findMany({
        where: { jobApplication: { userId } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          jobApplication: {
            select: { id: true, company: true, jobTitle: true },
          },
        },
      }),
      this.getUpcomingTasks(userId, 5),
    ]);

    // Calculate funnel metrics
    const statusCounts = Object.fromEntries(
      applicationsByStatus.map(s => [s.status, s._count.status])
    );

    const totalApplied = (statusCounts.applied || 0) + 
      (statusCounts.interview || 0) + 
      (statusCounts.offer || 0) + 
      (statusCounts.accepted || 0) + 
      (statusCounts.rejected || 0);

    return {
      totalApplications,
      statusCounts,
      interviews: statusCounts.interview || 0,
      offers: statusCounts.offer || 0,
      responseRate: totalApplied > 0 
        ? Math.round(((statusCounts.interview || 0) + (statusCounts.offer || 0)) / totalApplied * 100) 
        : 0,
      successRate: totalApplied > 0 
        ? Math.round((statusCounts.offer || 0) / totalApplied * 100) 
        : 0,
      recentActivity,
      upcomingTasks,
    };
  },

  // ==================== Activity Logging ====================

  async logActivity(jobId: string, action: string, description: string, metadata?: any) {
    await prisma.jobActivity.create({
      data: {
        jobApplicationId: jobId,
        action,
        description,
        metadata: metadata || undefined,
      },
    });
  },

  async getRecentActivity(userId: string, limit = 20) {
    return prisma.jobActivity.findMany({
      where: { jobApplication: { userId } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        jobApplication: {
          select: { id: true, company: true, jobTitle: true },
        },
      },
    });
  },

  // ==================== Export ====================

  async exportToCSV(userId: string, filters?: { status?: string; dateFrom?: Date; dateTo?: Date }) {
    const jobs = await prisma.jobApplication.findMany({
      where: {
        userId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.dateFrom && filters?.dateTo && {
          createdAt: { gte: filters.dateFrom, lte: filters.dateTo },
        }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { documents: true, tasks: true, referrals: true } },
      },
    });

    // Generate CSV content
    const headers = [
      'Company', 'Job Title', 'Location', 'Employment Type', 'Salary Range',
      'Status', 'Priority', 'Rating', 'Applied Date', 'Source', 'Job URL',
      'Documents', 'Tasks', 'Referrals', 'Created At', 'Notes'
    ];

    const rows = jobs.map(job => [
      job.company,
      job.jobTitle,
      job.location || '',
      job.employmentType || '',
      job.salaryMin && job.salaryMax 
        ? `${job.salaryCurrency}${job.salaryMin}-${job.salaryMax}` 
        : '',
      job.status,
      job.priority,
      job.rating?.toString() || '',
      job.appliedDate?.toISOString().split('T')[0] || '',
      job.source || '',
      job.jobUrl || '',
      job._count.documents.toString(),
      job._count.tasks.toString(),
      job._count.referrals.toString(),
      job.createdAt.toISOString().split('T')[0],
      job.notes?.replace(/[\n\r,]/g, ' ') || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  },
};
