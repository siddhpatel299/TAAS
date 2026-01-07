import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { pluginsService } from '../services/plugins.service';

const router: Router = Router();

// Get all available plugins
router.get('/available', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const plugins = await pluginsService.getAvailablePlugins();
  const enabledPlugins = await pluginsService.getEnabledPlugins(req.user!.id);
  const enabledIds = enabledPlugins.map((p: { id?: string }) => p?.id);

  const pluginsWithStatus = plugins.map(plugin => ({
    ...plugin,
    enabled: enabledIds.includes(plugin.id),
  }));

  res.json({
    success: true,
    data: pluginsWithStatus,
  });
}));

// Get enabled plugins for current user
router.get('/enabled', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const plugins = await pluginsService.getEnabledPlugins(req.user!.id);

  res.json({
    success: true,
    data: plugins,
  });
}));

// Check if a specific plugin is enabled
router.get('/:pluginId/status', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { pluginId } = req.params;
  const enabled = await pluginsService.isPluginEnabled(req.user!.id, pluginId);

  res.json({
    success: true,
    data: { enabled },
  });
}));

// Enable a plugin
router.post('/:pluginId/enable', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { pluginId } = req.params;
  const { settings } = req.body;

  const result = await pluginsService.enablePlugin(req.user!.id, pluginId, settings);

  res.json({
    success: true,
    data: result,
  });
}));

// Disable a plugin
router.post('/:pluginId/disable', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { pluginId } = req.params;

  const result = await pluginsService.disablePlugin(req.user!.id, pluginId);

  res.json({
    success: true,
    data: result,
  });
}));

// Update plugin settings
router.patch('/:pluginId/settings', authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { pluginId } = req.params;
  const { settings } = req.body;

  const result = await pluginsService.updatePluginSettings(req.user!.id, pluginId, settings);

  res.json({
    success: true,
    data: result,
  });
}));

export default router;
