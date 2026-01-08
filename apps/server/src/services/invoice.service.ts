import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export const invoiceService = {
  // Dashboard
  async getDashboard(userId: string) {
    const [
      totalInvoices,
      draftInvoices,
      sentInvoices,
      paidInvoices,
      overdueInvoices,
      totalClients,
      recentInvoices,
      totalRevenue,
      pendingAmount,
    ] = await Promise.all([
      prisma.invoice.count({ where: { userId } }),
      prisma.invoice.count({ where: { userId, status: 'draft' } }),
      prisma.invoice.count({ where: { userId, status: 'sent' } }),
      prisma.invoice.count({ where: { userId, status: 'paid' } }),
      prisma.invoice.count({ where: { userId, status: 'overdue' } }),
      prisma.invoiceClient.count({ where: { userId } }),
      prisma.invoice.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { client: true },
      }),
      prisma.invoice.aggregate({
        where: { userId, status: 'paid' },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { userId, status: { in: ['sent', 'overdue'] } },
        _sum: { total: true },
      }),
    ]);

    return {
      totalInvoices,
      draftInvoices,
      sentInvoices,
      paidInvoices,
      overdueInvoices,
      totalClients,
      recentInvoices,
      totalRevenue: totalRevenue._sum.total || 0,
      pendingAmount: pendingAmount._sum.total || 0,
    };
  },

  // Clients
  async getClients(userId: string, params?: { search?: string }) {
    const where: Prisma.InvoiceClientWhereInput = { userId };
    
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { company: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return prisma.invoiceClient.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { invoices: true } },
      },
    });
  },

  async getClient(userId: string, clientId: string) {
    return prisma.invoiceClient.findFirst({
      where: { id: clientId, userId },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  },

  async createClient(userId: string, data: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    taxId?: string;
    notes?: string;
  }) {
    return prisma.invoiceClient.create({
      data: { ...data, userId },
    });
  },

  async updateClient(userId: string, clientId: string, data: Partial<{
    name: string;
    email: string;
    phone: string;
    company: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    taxId: string;
    notes: string;
  }>) {
    return prisma.invoiceClient.updateMany({
      where: { id: clientId, userId },
      data,
    });
  },

  async deleteClient(userId: string, clientId: string) {
    return prisma.invoiceClient.deleteMany({
      where: { id: clientId, userId },
    });
  },

  // Invoices
  async getInvoices(userId: string, params?: {
    status?: string;
    clientId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }) {
    const where: Prisma.InvoiceWhereInput = { userId };
    
    if (params?.status) where.status = params.status;
    if (params?.clientId) where.clientId = params.clientId;
    if (params?.search) {
      where.OR = [
        { invoiceNumber: { contains: params.search, mode: 'insensitive' } },
        { client: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }
    if (params?.dateFrom || params?.dateTo) {
      where.issueDate = {};
      if (params.dateFrom) where.issueDate.gte = new Date(params.dateFrom);
      if (params.dateTo) where.issueDate.lte = new Date(params.dateTo);
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const orderBy: Prisma.InvoiceOrderByWithRelationInput = {};
    const sortBy = params?.sortBy || 'createdAt';
    const sortOrder = params?.sortOrder || 'desc';
    (orderBy as any)[sortBy] = sortOrder;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          client: true,
          _count: { select: { items: true, payments: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      invoices,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getInvoice(userId: string, invoiceId: string) {
    return prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
      include: {
        client: true,
        items: true,
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });
  },

  async getNextInvoiceNumber(userId: string) {
    const lastInvoice = await prisma.invoice.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true },
    });

    if (!lastInvoice) return 'INV-001';

    const match = lastInvoice.invoiceNumber.match(/INV-(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1]) + 1;
      return `INV-${nextNum.toString().padStart(3, '0')}`;
    }
    return `INV-${Date.now()}`;
  },

  async createInvoice(userId: string, data: {
    clientId?: string;
    invoiceNumber?: string;
    status?: string;
    issueDate?: Date;
    dueDate?: Date;
    currency?: string;
    notes?: string;
    terms?: string;
    taxRate?: number;
    discount?: number;
    isRecurring?: boolean;
    recurringPeriod?: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  }) {
    const invoiceNumber = data.invoiceNumber || await this.getNextInvoiceNumber(userId);
    
    // Calculate totals
    let subtotal = 0;
    const items = data.items.map(item => {
      const amount = item.quantity * item.unitPrice;
      subtotal += amount;
      return { ...item, amount };
    });

    const taxAmount = data.taxRate ? subtotal * (data.taxRate / 100) : 0;
    const discount = data.discount || 0;
    const total = subtotal + taxAmount - discount;

    return prisma.invoice.create({
      data: {
        userId,
        clientId: data.clientId,
        invoiceNumber,
        status: data.status || 'draft',
        issueDate: data.issueDate || new Date(),
        dueDate: data.dueDate,
        subtotal,
        taxRate: data.taxRate,
        taxAmount,
        discount,
        total,
        currency: data.currency || 'USD',
        notes: data.notes,
        terms: data.terms,
        isRecurring: data.isRecurring || false,
        recurringPeriod: data.recurringPeriod,
        items: {
          create: items,
        },
      },
      include: {
        client: true,
        items: true,
      },
    });
  },

  async updateInvoice(userId: string, invoiceId: string, data: {
    clientId?: string;
    status?: string;
    issueDate?: Date;
    dueDate?: Date;
    paidDate?: Date;
    currency?: string;
    notes?: string;
    terms?: string;
    taxRate?: number;
    discount?: number;
    isRecurring?: boolean;
    recurringPeriod?: string;
    items?: Array<{
      id?: string;
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  }) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
    });

    if (!invoice) throw new Error('Invoice not found');

    let updateData: any = { ...data };
    delete updateData.items;

    // If items are provided, recalculate totals
    if (data.items) {
      let subtotal = 0;
      const items = data.items.map(item => {
        const amount = item.quantity * item.unitPrice;
        subtotal += amount;
        return { ...item, amount };
      });

      const taxRate = data.taxRate ?? Number(invoice.taxRate) ?? 0;
      const taxAmount = taxRate ? subtotal * (taxRate / 100) : 0;
      const discount = data.discount ?? Number(invoice.discount) ?? 0;
      const total = subtotal + taxAmount - discount;

      updateData = {
        ...updateData,
        subtotal,
        taxAmount,
        total,
      };

      // Delete existing items and create new ones
      await prisma.invoiceItem.deleteMany({ where: { invoiceId } });
      await prisma.invoiceItem.createMany({
        data: items.map(item => ({
          invoiceId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
        })),
      });
    }

    return prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        client: true,
        items: true,
        payments: true,
      },
    });
  },

  async deleteInvoice(userId: string, invoiceId: string) {
    return prisma.invoice.deleteMany({
      where: { id: invoiceId, userId },
    });
  },

  // Payments
  async addPayment(userId: string, invoiceId: string, data: {
    amount: number;
    paymentDate?: Date;
    paymentMethod?: string;
    reference?: string;
    notes?: string;
  }) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
      include: { payments: true },
    });

    if (!invoice) throw new Error('Invoice not found');

    const payment = await prisma.invoicePayment.create({
      data: {
        invoiceId,
        amount: data.amount,
        paymentDate: data.paymentDate || new Date(),
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        notes: data.notes,
      },
    });

    // Check if invoice is fully paid
    const totalPaid = invoice.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    ) + data.amount;

    if (totalPaid >= Number(invoice.total)) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'paid', paidDate: new Date() },
      });
    }

    return payment;
  },

  async deletePayment(userId: string, paymentId: string) {
    const payment = await prisma.invoicePayment.findFirst({
      where: { id: paymentId },
      include: { invoice: true },
    });

    if (!payment || payment.invoice.userId !== userId) {
      throw new Error('Payment not found');
    }

    await prisma.invoicePayment.delete({ where: { id: paymentId } });

    // Update invoice status if needed
    if (payment.invoice.status === 'paid') {
      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: { status: 'sent', paidDate: null },
      });
    }

    return { deleted: true };
  },
};
