import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { passwordVaultService } from '../services/password-vault.service';
import { pluginsService } from '../services/plugins.service';

const router: Router = Router();

// Middleware to check if password-vault plugin is enabled
const requirePasswordVaultPlugin = asyncHandler(async (req: AuthRequest, res: Response, next: any) => {
  const enabled = await pluginsService.isPluginEnabled(req.user!.id, 'password-vault');
  if (!enabled) {
    throw new ApiError('Password Vault plugin is not enabled. Please enable it in the Plugins page.', 403);
  }
  next();
});

// Apply plugin check to all routes
router.use(authMiddleware, requirePasswordVaultPlugin);

// ==================== Dashboard ====================

router.get('/dashboard', asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await passwordVaultService.getDashboardStats(req.user!.id);

  res.json({
    success: true,
    data: stats,
  });
}));

// ==================== Password Entries ====================

// Get all password entries with filters
router.get('/passwords', asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    category,
    search,
    tags,
    isFavorite,
    sortBy,
    sortOrder,
    page,
    limit,
  } = req.query;

  const result = await passwordVaultService.getPasswordEntries({
    userId: req.user!.id,
    category: category as string | undefined,
    search: search as string | undefined,
    tags: tags ? (tags as string).split(',') : undefined,
    isFavorite: isFavorite === 'true' ? true : isFavorite === 'false' ? false : undefined,
    sortBy: sortBy as any,
    sortOrder: sortOrder as any,
    page: page ? parseInt(page as string) : 1,
    limit: limit ? parseInt(limit as string) : 50,
  });

  res.json({
    success: true,
    data: result.entries,
    meta: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    },
  });
}));

// Get single password entry (decrypted)
router.get('/passwords/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { masterKey } = req.body; // Master key should be provided in request body for security
  
  if (!masterKey) {
    throw new ApiError('Master key is required to decrypt password', 400);
  }

  const entry = await passwordVaultService.getPasswordEntry(
    req.user!.id, 
    req.params.id, 
    masterKey
  );

  // Update last used timestamp
  await passwordVaultService.updateLastUsed(req.user!.id, req.params.id);

  res.json({
    success: true,
    data: entry,
  });
}));

// Create new password entry
router.post('/passwords', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { masterKey, ...passwordData } = req.body;

  if (!masterKey) {
    throw new ApiError('Master key is required to encrypt password', 400);
  }

  const entry = await passwordVaultService.createPasswordEntry({
    userId: req.user!.id,
    ...passwordData,
  }, masterKey);

  res.json({
    success: true,
    data: entry,
  });
}));

// Update password entry
router.patch('/passwords/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { masterKey, ...updateData } = req.body;

  if (!masterKey) {
    throw new ApiError('Master key is required to encrypt password', 400);
  }

  const entry = await passwordVaultService.updatePasswordEntry(
    req.user!.id,
    req.params.id,
    updateData,
    masterKey
  );

  res.json({
    success: true,
    data: entry,
  });
}));

// Delete password entry
router.delete('/passwords/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  await passwordVaultService.deletePasswordEntry(req.user!.id, req.params.id);

  res.json({
    success: true,
    data: { deleted: true },
  });
}));

// ==================== Categories ====================

// Get all categories
router.get('/categories', asyncHandler(async (req: AuthRequest, res: Response) => {
  const categories = await passwordVaultService.getCategories(req.user!.id);

  res.json({
    success: true,
    data: categories,
  });
}));

// Create new category
router.post('/categories', asyncHandler(async (req: AuthRequest, res: Response) => {
  const category = await passwordVaultService.createCategory({
    userId: req.user!.id,
    ...req.body,
  });

  res.json({
    success: true,
    data: category,
  });
}));

// Update category
router.patch('/categories/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const category = await passwordVaultService.updateCategory(
    req.user!.id,
    req.params.id,
    req.body
  );

  res.json({
    success: true,
    data: category,
  });
}));

// Delete category
router.delete('/categories/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  await passwordVaultService.deleteCategory(req.user!.id, req.params.id);

  res.json({
    success: true,
    data: { deleted: true },
  });
}));

// ==================== Password Generation ====================

// Generate secure password
router.post('/generate-password', asyncHandler(async (req: AuthRequest, res: Response) => {
  const password = passwordVaultService.generatePassword(req.body);

  res.json({
    success: true,
    data: { password },
  });
}));

// Check password strength
router.post('/check-password-strength', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { password } = req.body;

  if (!password) {
    throw new ApiError('Password is required', 400);
  }

  const strength = passwordVaultService.checkPasswordStrength(password);

  res.json({
    success: true,
    data: strength,
  });
}));

// ==================== Security Events ====================

// Get security events
router.get('/security-events', asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const events = await passwordVaultService.getSecurityEvents(req.user!.id, limit);

  res.json({
    success: true,
    data: events,
  });
}));

// ==================== Export ====================

// Export passwords (CSV format)
router.get('/export/csv', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { masterKey } = req.query;

  if (!masterKey) {
    throw new ApiError('Master key is required to export passwords', 400);
  }

  // Get all passwords for the user
  const result = await passwordVaultService.getPasswordEntries({
    userId: req.user!.id,
    limit: 10000 // Get all passwords for export
  });

  // Decrypt all passwords
  const decryptedEntries = [];
  for (const entry of result.entries) {
    try {
      const decrypted = await passwordVaultService.getPasswordEntry(
        req.user!.id,
        entry.id,
        masterKey as string
      );
      decryptedEntries.push(decrypted);
    } catch (error) {
      console.error(`Failed to decrypt entry ${entry.id}:`, error);
    }
  }

  // Generate CSV
  const csvHeaders = ['Name', 'Username', 'Password', 'URL', 'Notes', 'Category', 'Tags', 'Created At'];
  const csvRows = decryptedEntries.map(entry => [
    `"${entry.name.replace(/"/g, '""')}"`,
    `"${entry.username || ''}"`,
    `"${entry.password}"`,
    `"${entry.url || ''}"`,
    `"${(entry.notes || '').replace(/"/g, '""')}"`,
    `"${entry.category || ''}"`,
    `"${(entry.tags || []).join(';')}"`,
    `"${entry.createdAt.toISOString()}"`
  ]);

  const csv = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');

  // Log security event
  await passwordVaultService.logSecurityEvent(
    req.user!.id,
    'passwords_exported',
    { count: decryptedEntries.length },
    req.ip,
    req.get('User-Agent')
  );

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="passwords.csv"');
  res.send(csv);
}));

// ==================== Bulk Operations ====================

// Bulk delete passwords
router.post('/bulk/delete', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { passwordIds } = req.body;

  if (!passwordIds || !Array.isArray(passwordIds)) {
    throw new ApiError('passwordIds array is required', 400);
  }

  const result = await passwordVaultService.bulkDeletePasswords(req.user!.id, passwordIds);

  res.json({
    success: true,
    data: result,
  });
}));

// Bulk update category
router.post('/bulk/update-category', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { passwordIds, category } = req.body;

  if (!passwordIds || !Array.isArray(passwordIds)) {
    throw new ApiError('passwordIds array is required', 400);
  }

  const result = await passwordVaultService.bulkUpdateCategory(req.user!.id, passwordIds, category);

  res.json({
    success: true,
    data: result,
  });
}));

// ==================== Password Health ====================

// Get password health report
router.get('/health', asyncHandler(async (req: AuthRequest, res: Response) => {
  const health = await passwordVaultService.getPasswordHealth(req.user!.id);

  res.json({
    success: true,
    data: health,
  });
}));

export default router;
