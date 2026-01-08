import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { invoiceService } from '../services/invoice.service';

const router: Router = Router();

// Dashboard
router.get('/dashboard', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await invoiceService.getDashboard(req.user!.id);
  res.json({ success: true, data });
}));

// ==================== CLIENTS ====================

// Get all clients
router.get('/clients', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search } = req.query;
  const clients = await invoiceService.getClients(req.user!.id, { search: search as string });
  res.json({ success: true, data: clients });
}));

// Get single client
router.get('/clients/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const client = await invoiceService.getClient(req.user!.id, req.params.id);
  if (!client) {
    return res.status(404).json({ success: false, error: 'Client not found' });
  }
  res.json({ success: true, data: client });
}));

// Create client
router.post('/clients', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const client = await invoiceService.createClient(req.user!.id, req.body);
  res.status(201).json({ success: true, data: client });
}));

// Update client
router.patch('/clients/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  await invoiceService.updateClient(req.user!.id, req.params.id, req.body);
  res.json({ success: true, data: { updated: true } });
}));

// Delete client
router.delete('/clients/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  await invoiceService.deleteClient(req.user!.id, req.params.id);
  res.json({ success: true, data: { deleted: true } });
}));

// ==================== INVOICES ====================

// Get all invoices
router.get('/invoices', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, clientId, search, dateFrom, dateTo, sortBy, sortOrder, page, limit } = req.query;
  const result = await invoiceService.getInvoices(req.user!.id, {
    status: status as string,
    clientId: clientId as string,
    search: search as string,
    dateFrom: dateFrom as string,
    dateTo: dateTo as string,
    sortBy: sortBy as string,
    sortOrder: sortOrder as string,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });
  res.json({ success: true, data: result.invoices, meta: result.meta });
}));

// Get next invoice number
router.get('/invoices/next-number', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const invoiceNumber = await invoiceService.getNextInvoiceNumber(req.user!.id);
  res.json({ success: true, data: { invoiceNumber } });
}));

// Get single invoice
router.get('/invoices/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const invoice = await invoiceService.getInvoice(req.user!.id, req.params.id);
  if (!invoice) {
    return res.status(404).json({ success: false, error: 'Invoice not found' });
  }
  res.json({ success: true, data: invoice });
}));

// Create invoice
router.post('/invoices', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    console.log('Creating invoice with data:', JSON.stringify(req.body, null, 2));
    const invoice = await invoiceService.createInvoice(req.user!.id, req.body);
    res.status(201).json({ success: true, data: invoice });
  } catch (error: any) {
    console.error('Invoice creation error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create invoice' });
  }
}));

// Update invoice
router.patch('/invoices/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const invoice = await invoiceService.updateInvoice(req.user!.id, req.params.id, req.body);
  res.json({ success: true, data: invoice });
}));

// Delete invoice
router.delete('/invoices/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  await invoiceService.deleteInvoice(req.user!.id, req.params.id);
  res.json({ success: true, data: { deleted: true } });
}));

// ==================== PAYMENTS ====================

// Add payment to invoice
router.post('/invoices/:id/payments', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const payment = await invoiceService.addPayment(req.user!.id, req.params.id, req.body);
  res.status(201).json({ success: true, data: payment });
}));

// Delete payment
router.delete('/payments/:id', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  await invoiceService.deletePayment(req.user!.id, req.params.id);
  res.json({ success: true, data: { deleted: true } });
}));

export default router;
