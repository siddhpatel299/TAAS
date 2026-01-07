import { prisma } from '../lib/prisma';

// Available plugins definition
export const AVAILABLE_PLUGINS = [
  {
    id: 'job-tracker',
    name: 'Job Application Tracker',
    description: 'Track your job applications, interviews, documents, tasks, and referrals all in one place.',
    icon: 'briefcase',
    category: 'productivity',
    features: [
      'Application pipeline with Kanban board',
      'Document management (resumes, cover letters)',
      'Task tracking with due dates',
      'Referral management',
      'Analytics dashboard',
      'CSV export',
    ],
  },
  // Future plugins can be added here
  // {
  //   id: 'expense-tracker',
  //   name: 'Expense Tracker',
  //   description: 'Track personal expenses and budgets.',
  //   icon: 'dollar-sign',
  //   category: 'finance',
  //   features: [...],
  // },
];

export const pluginsService = {
  async getAvailablePlugins() {
    return AVAILABLE_PLUGINS;
  },

  async getEnabledPlugins(userId: string) {
    const enabled = await prisma.enabledPlugin.findMany({
      where: { userId, enabled: true },
    });

    return enabled.map(e => ({
      ...AVAILABLE_PLUGINS.find(p => p.id === e.pluginId),
      settings: e.settings,
      enabledAt: e.createdAt,
    }));
  },

  async isPluginEnabled(userId: string, pluginId: string) {
    const plugin = await prisma.enabledPlugin.findFirst({
      where: { userId, pluginId, enabled: true },
    });
    return !!plugin;
  },

  async enablePlugin(userId: string, pluginId: string, settings?: any) {
    // Verify plugin exists
    const plugin = AVAILABLE_PLUGINS.find(p => p.id === pluginId);
    if (!plugin) {
      throw new Error('Plugin not found');
    }

    await prisma.enabledPlugin.upsert({
      where: { userId_pluginId: { userId, pluginId } },
      create: {
        userId,
        pluginId,
        enabled: true,
        settings,
      },
      update: {
        enabled: true,
        settings,
      },
    });

    return { success: true, plugin };
  },

  async disablePlugin(userId: string, pluginId: string) {
    await prisma.enabledPlugin.updateMany({
      where: { userId, pluginId },
      data: { enabled: false },
    });

    return { success: true };
  },

  async updatePluginSettings(userId: string, pluginId: string, settings: any) {
    await prisma.enabledPlugin.updateMany({
      where: { userId, pluginId },
      data: { settings },
    });

    return { success: true };
  },
};
