/**
 * Sent Emails Service
 * 
 * Handles tracking of sent emails for follow-up management:
 * - CRUD operations for sent emails
 * - Follow-up reminders and tracking
 * - Status updates (manual - no tracking pixels)
 * - Export to CSV
 * - Dashboard statistics
 */

import { prisma } from '../lib/prisma';

// Types
export interface CreateSentEmailInput {
  userId: string;
  jobApplicationId?: string;
  recipientName: string;
  recipientEmail: string;
  recipientPosition?: string;
  company: string;
  subject: string;
  body: string;
  gmailMessageId?: string;
  gmailThreadId?: string;
  followUpDate?: Date;
}

export interface UpdateSentEmailInput {
  status?: string;
  followUpDate?: Date | null;
  followedUp?: boolean;
  notes?: string;
}

export interface SentEmailFilters {
  userId: string;
  jobApplicationId?: string;
  company?: string;
  status?: string;
  followUpDue?: boolean;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy?: 'sentAt' | 'followUpDate' | 'company' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface FollowUpStats {
  dueToday: number;
  overdue: number;
  upcoming: number;
  noResponse: number;
}

class SentEmailsService {
  /**
   * Create a new sent email record
   */
  async create(input: CreateSentEmailInput) {
    return prisma.sentEmail.create({
      data: {
        ...input,
        followUpDate: input.followUpDate || this.getDefaultFollowUpDate(),
      },
      include: {
        jobApplication: {
          select: {
            id: true,
            company: true,
            jobTitle: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Create multiple sent email records (for bulk send)
   */
  async createMany(inputs: CreateSentEmailInput[]) {
    const results = [];
    for (const input of inputs) {
      const result = await this.create(input);
      results.push(result);
    }
    return results;
  }

  /**
   * Get sent emails with filters and pagination
   */
  async getMany(filters: SentEmailFilters) {
    const {
      userId,
      jobApplicationId,
      company,
      status,
      followUpDue,
      search,
      dateFrom,
      dateTo,
      sortBy = 'sentAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters;

    const where: any = { userId };

    if (jobApplicationId) {
      where.jobApplicationId = jobApplicationId;
    }

    if (company) {
      where.company = { contains: company, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    if (followUpDue) {
      where.followUpDate = { lte: new Date() };
      where.followedUp = false;
      where.status = 'sent'; // Only show follow-ups for emails that haven't been replied to
    }

    if (search) {
      where.OR = [
        { recipientName: { contains: search, mode: 'insensitive' } },
        { recipientEmail: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (dateFrom || dateTo) {
      where.sentAt = {};
      if (dateFrom) where.sentAt.gte = dateFrom;
      if (dateTo) where.sentAt.lte = dateTo;
    }

    const [emails, total] = await Promise.all([
      prisma.sentEmail.findMany({
        where,
        include: {
          jobApplication: {
            select: {
              id: true,
              company: true,
              jobTitle: true,
              status: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sentEmail.count({ where }),
    ]);

    return {
      emails,
      total,
      page,
      limit,
      hasMore: total > page * limit,
    };
  }

  /**
   * Get a single sent email by ID
   */
  async getById(userId: string, id: string) {
    const email = await prisma.sentEmail.findFirst({
      where: { id, userId },
      include: {
        jobApplication: {
          select: {
            id: true,
            company: true,
            jobTitle: true,
            status: true,
          },
        },
      },
    });

    if (!email) {
      throw new Error('Sent email not found');
    }

    return email;
  }

  /**
   * Update a sent email (status, follow-up, notes)
   */
  async update(userId: string, id: string, input: UpdateSentEmailInput) {
    // Verify ownership
    await this.getById(userId, id);

    const updateData: any = { ...input };

    // If marking as followed up, update the follow-up count and timestamp
    if (input.followedUp === true) {
      updateData.followUpCount = { increment: 1 };
      updateData.lastFollowUpAt = new Date();
    }

    return prisma.sentEmail.update({
      where: { id },
      data: updateData,
      include: {
        jobApplication: {
          select: {
            id: true,
            company: true,
            jobTitle: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Delete a sent email record
   */
  async delete(userId: string, id: string) {
    // Verify ownership
    await this.getById(userId, id);

    return prisma.sentEmail.delete({
      where: { id },
    });
  }

  /**
   * Get follow-up statistics for dashboard
   */
  async getFollowUpStats(userId: string): Promise<FollowUpStats> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const [dueToday, overdue, upcoming, noResponse] = await Promise.all([
      // Due today
      prisma.sentEmail.count({
        where: {
          userId,
          followUpDate: { gte: today, lt: tomorrow },
          followedUp: false,
          status: 'sent',
        },
      }),
      // Overdue (past due date, not followed up)
      prisma.sentEmail.count({
        where: {
          userId,
          followUpDate: { lt: today },
          followedUp: false,
          status: 'sent',
        },
      }),
      // Upcoming (within next 7 days)
      prisma.sentEmail.count({
        where: {
          userId,
          followUpDate: { gte: tomorrow, lte: nextWeek },
          followedUp: false,
          status: 'sent',
        },
      }),
      // No response (status is 'no_response')
      prisma.sentEmail.count({
        where: {
          userId,
          status: 'no_response',
        },
      }),
    ]);

    return { dueToday, overdue, upcoming, noResponse };
  }

  /**
   * Get emails due for follow-up (for dashboard)
   */
  async getFollowUpsDue(userId: string, limit: number = 10) {
    const now = new Date();
    
    return prisma.sentEmail.findMany({
      where: {
        userId,
        followUpDate: { lte: now },
        followedUp: false,
        status: 'sent',
      },
      include: {
        jobApplication: {
          select: {
            id: true,
            company: true,
            jobTitle: true,
          },
        },
      },
      orderBy: { followUpDate: 'asc' },
      take: limit,
    });
  }

  /**
   * Get all emails sent to a specific company
   */
  async getByCompany(userId: string, company: string) {
    return prisma.sentEmail.findMany({
      where: {
        userId,
        company: { contains: company, mode: 'insensitive' },
      },
      include: {
        jobApplication: {
          select: {
            id: true,
            company: true,
            jobTitle: true,
            status: true,
          },
        },
      },
      orderBy: { sentAt: 'desc' },
    });
  }

  /**
   * Get emails for a specific job application
   */
  async getByJobApplication(userId: string, jobApplicationId: string) {
    return prisma.sentEmail.findMany({
      where: {
        userId,
        jobApplicationId,
      },
      orderBy: { sentAt: 'desc' },
    });
  }

  /**
   * Export sent emails to CSV
   */
  async exportToCSV(userId: string, filters?: Partial<SentEmailFilters>): Promise<string> {
    const where: any = { userId };

    if (filters?.company) {
      where.company = { contains: filters.company, mode: 'insensitive' };
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.sentAt = {};
      if (filters.dateFrom) where.sentAt.gte = filters.dateFrom;
      if (filters.dateTo) where.sentAt.lte = filters.dateTo;
    }

    const emails = await prisma.sentEmail.findMany({
      where,
      include: {
        jobApplication: {
          select: {
            jobTitle: true,
          },
        },
      },
      orderBy: { sentAt: 'desc' },
    });

    // CSV headers
    const headers = [
      'Sent Date',
      'Recipient Name',
      'Recipient Email',
      'Position',
      'Company',
      'Job Title',
      'Subject',
      'Status',
      'Follow-up Date',
      'Followed Up',
      'Follow-up Count',
      'Notes',
    ];

    // CSV rows
    const rows = emails.map(email => [
      email.sentAt.toISOString().split('T')[0],
      `"${email.recipientName.replace(/"/g, '""')}"`,
      email.recipientEmail,
      email.recipientPosition || '',
      `"${email.company.replace(/"/g, '""')}"`,
      email.jobApplication?.jobTitle || '',
      `"${email.subject.replace(/"/g, '""')}"`,
      email.status,
      email.followUpDate ? email.followUpDate.toISOString().split('T')[0] : '',
      email.followedUp ? 'Yes' : 'No',
      email.followUpCount.toString(),
      email.notes ? `"${email.notes.replace(/"/g, '""')}"` : '',
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Get outreach statistics for dashboard
   */
  async getOutreachStats(userId: string) {
    const [
      totalSent,
      totalReplied,
      totalMeetings,
      totalNoResponse,
      statusCounts,
      recentEmails,
    ] = await Promise.all([
      prisma.sentEmail.count({ where: { userId } }),
      prisma.sentEmail.count({ where: { userId, status: 'replied' } }),
      prisma.sentEmail.count({ where: { userId, status: 'meeting_scheduled' } }),
      prisma.sentEmail.count({ where: { userId, status: 'no_response' } }),
      prisma.sentEmail.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
      prisma.sentEmail.findMany({
        where: { userId },
        orderBy: { sentAt: 'desc' },
        take: 5,
        include: {
          jobApplication: {
            select: { id: true, company: true, jobTitle: true },
          },
        },
      }),
    ]);

    const responseRate = totalSent > 0 
      ? Math.round((totalReplied / totalSent) * 100) 
      : 0;

    const meetingRate = totalSent > 0 
      ? Math.round((totalMeetings / totalSent) * 100) 
      : 0;

    return {
      totalSent,
      totalReplied,
      totalMeetings,
      totalNoResponse,
      responseRate,
      meetingRate,
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr.status] = curr._count;
        return acc;
      }, {} as Record<string, number>),
      recentEmails,
    };
  }

  /**
   * Mark email as replied
   */
  async markAsReplied(userId: string, id: string) {
    return this.update(userId, id, { status: 'replied' });
  }

  /**
   * Mark email as meeting scheduled
   */
  async markAsMeetingScheduled(userId: string, id: string) {
    return this.update(userId, id, { status: 'meeting_scheduled' });
  }

  /**
   * Mark email as no response (after follow-ups)
   */
  async markAsNoResponse(userId: string, id: string) {
    return this.update(userId, id, { status: 'no_response' });
  }

  /**
   * Reset follow-up for another round
   */
  async scheduleFollowUp(userId: string, id: string, followUpDate: Date) {
    return this.update(userId, id, {
      followUpDate,
      followedUp: false,
    });
  }

  /**
   * Get default follow-up date (7 days from now)
   */
  private getDefaultFollowUpDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  }
}

export const sentEmailsService = new SentEmailsService();
