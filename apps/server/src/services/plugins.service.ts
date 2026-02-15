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
  {
    id: 'expense-tracker',
    name: 'Expense Tracker',
    description: 'Track personal and business expenses with categories, budgets, and detailed analytics.',
    icon: 'dollar-sign',
    category: 'finance',
    features: [
      'Expense categorization with custom tags',
      'Monthly & yearly budget planning',
      'Receipt scanning & attachment',
      'Spending analytics & trends',
      'Split expenses with friends',
      'Export to CSV/PDF for taxes',
      'Recurring expense tracking',
      'Multi-currency support',
    ],
  },
  {
    id: 'notes',
    name: 'Notes & Documents',
    description: 'Create, organize, and sync notes with rich text editing and folder organization.',
    icon: 'file-text',
    category: 'productivity',
    features: [
      'Rich text editor with Markdown support',
      'Folder & tag organization',
      'Full-text search across all notes',
      'Version history & restore',
      'Note templates',
      'Share notes via link',
      'Pin important notes',
      'Dark mode support',
    ],
  },
  {
    id: 'password-vault',
    name: 'Password Vault',
    description: 'Securely store and manage passwords, API keys, and sensitive credentials with encryption.',
    icon: 'shield',
    category: 'security',
    features: [
      'AES-256 end-to-end encryption',
      'Password generator with custom rules',
      'Secure notes for sensitive data',
      'Auto-fill browser extension',
      'Two-factor authentication',
      'Password strength analyzer',
      'Breach monitoring alerts',
      'Secure sharing with expiry',
    ],
  },
  {
    id: 'bookmark-manager',
    name: 'Bookmark Manager',
    description: 'Save, organize, and search bookmarks with tags, collections, and smart categorization.',
    icon: 'bookmark',
    category: 'productivity',
    features: [
      'Browser extension for quick save',
      'Automatic metadata extraction',
      'Tag-based organization',
      'Smart collections & folders',
      'Full-text search with filters',
      'Broken link checker',
      'Import from browsers',
      'Share collections publicly',
    ],
  },
  {
    id: 'habit-tracker',
    name: 'Habit Tracker',
    description: 'Build positive habits with streak tracking, reminders, and motivational insights.',
    icon: 'target',
    category: 'lifestyle',
    features: [
      'Daily habit check-ins',
      'Streak tracking & rewards',
      'Habit frequency customization',
      'Push notification reminders',
      'Weekly & monthly analytics',
      'Habit grouping by category',
      'Motivational quotes',
      'Integration with calendar',
    ],
  },
  {
    id: 'time-tracker',
    name: 'Time Tracker',
    description: 'Track time spent on tasks and projects with detailed reports and productivity insights.',
    icon: 'clock',
    category: 'productivity',
    features: [
      'One-click timer start/stop',
      'Manual time entry',
      'Project & task categorization',
      'Billable hours tracking',
      'Weekly timesheet reports',
      'Pomodoro timer integration',
      'Idle time detection',
      'Export for invoicing',
    ],
  },
  {
    id: 'calendar',
    name: 'Calendar & Events',
    description: 'Manage your schedule with events, reminders, and integrations with external calendars.',
    icon: 'calendar',
    category: 'productivity',
    features: [
      'Day, week, month views',
      'Recurring event support',
      'Event reminders & notifications',
      'Google Calendar sync',
      'Event color coding',
      'Meeting scheduling links',
      'Timezone support',
      'iCal import/export',
    ],
  },
  {
    id: 'contacts',
    name: 'Contacts CRM',
    description: 'Manage personal and professional contacts with notes, tags, and interaction history.',
    icon: 'users',
    category: 'productivity',
    features: [
      'Contact profiles with notes',
      'Tag & group organization',
      'Interaction history timeline',
      'Birthday & anniversary reminders',
      'LinkedIn profile linking',
      'Quick search & filters',
      'Import from CSV/vCard',
      'Relationship strength tracking',
    ],
  },
  {
    id: 'todo-lists',
    name: 'To-Do Lists',
    description: 'Simple yet powerful task management with projects, priorities, and due dates.',
    icon: 'check-square',
    category: 'productivity',
    features: [
      'Quick task capture',
      'Projects & sub-tasks',
      'Priority levels (P1-P4)',
      'Due date & reminders',
      'Recurring tasks',
      'Labels & filters',
      'Daily focus list',
      'Completed task archive',
    ],
  },
  {
    id: 'code-snippets',
    name: 'Code Snippets',
    description: 'Save and organize code snippets with syntax highlighting and quick search.',
    icon: 'code',
    category: 'development',
    features: [
      'Syntax highlighting for 50+ languages',
      'Tag & folder organization',
      'Full-text search',
      'One-click copy to clipboard',
      'Snippet versioning',
      'Public/private snippets',
      'VS Code extension',
      'GitHub Gist sync',
    ],
  },
  {
    id: 'flashcards',
    name: 'Flashcards & Learning',
    description: 'Create flashcard decks for spaced repetition learning and knowledge retention.',
    icon: 'layers',
    category: 'education',
    features: [
      'Create custom flashcard decks',
      'Spaced repetition algorithm',
      'Image & audio support',
      'Study statistics & progress',
      'Deck sharing & import',
      'Quiz mode',
      'Keyboard shortcuts',
      'Mobile-friendly study mode',
    ],
  },
  {
    id: 'invoice-generator',
    name: 'Invoice Generator',
    description: 'Create professional invoices, track payments, and manage clients for freelancers.',
    icon: 'file-text',
    category: 'finance',
    features: [
      'Professional invoice templates',
      'Client management',
      'Payment tracking & reminders',
      'Tax calculation support',
      'Multi-currency invoicing',
      'Recurring invoices',
      'PDF export & email sending',
      'Payment history & reports',
    ],
  },
  {
    id: 'subscription-tracker',
    name: 'Subscription Tracker',
    description: 'Monitor all your recurring subscriptions, track costs, and get renewal reminders.',
    icon: 'repeat',
    category: 'finance',
    features: [
      'Track all subscriptions in one place',
      'Monthly & yearly cost overview',
      'Renewal date reminders',
      'Category organization',
      'Spending trends & analytics',
      'Cancel subscription reminders',
      'Price change tracking',
      'Budget alerts',
    ],
  },
  {
    id: 'investment-portfolio',
    name: 'Investment Portfolio',
    description: 'Track stocks, crypto, and investments with real-time performance monitoring.',
    icon: 'trending-up',
    category: 'finance',
    features: [
      'Multi-asset portfolio tracking',
      'Stock & crypto support',
      'Performance analytics',
      'Gain/loss calculations',
      'Dividend tracking',
      'Portfolio allocation charts',
      'Transaction history',
      'Watchlist management',
    ],
  },
  {
    id: 'bill-reminders',
    name: 'Bill Reminders',
    description: 'Never miss a payment with smart bill tracking and automated reminders.',
    icon: 'bell',
    category: 'finance',
    features: [
      'Bill due date tracking',
      'Payment reminders',
      'Recurring bill support',
      'Payment history',
      'Category organization',
      'Monthly spending overview',
      'Late payment alerts',
      'Bill calendar view',
    ],
  },
  {
    id: 'nexus',
    name: 'Nexus',
    description: 'Enterprise-grade Project Management with Kanban boards, Sprints, and Epics.',
    icon: 'layers',
    category: 'productivity',
    features: [
      'Kanban Board & List Views',
      'Sprint Planning & Cycles',
      'Epics & User Stories',
      'Task Sub-tasks & Dependencies',
      'Custom Workflows',
      'Velocity Tracking',
      'Gantt Chart Timeline',
      'Project-level Analytics',
    ],
  },
  {
    id: 'flow',
    name: 'Flow Automation',
    description: 'Visual workflow builder to automate tasks, move files, and connect your plugins.',
    icon: 'zap',
    category: 'productivity',
    features: [
      'Visual Node Editor',
      'Event Triggers (Task Completed, File Uploaded)',
      'Automated Actions',
      'Execution History & Logs',
      'Drag-and-drop Builder',
      'Cron Jobs (Recurring Workflows)',
    ],
  },
  {
    id: 'insight',
    name: 'Insight',
    description: 'Personal BI & Analytics command center to visualize data from all your plugins.',
    icon: 'bar-chart',
    category: 'productivity',
    features: [
      'Visual Dashboard Builder',
      'Cross-Domain Queries',
      'Data Connectors (Finance, Jobs, Outreach)',
      'Goals & KPI Tracking',
      'Drag-and-drop Widget Layout',
    ],
  },
  {
    id: 'pdf-tools',
    name: 'PDF Tools',
    description: 'Merge, split, compress, and transform PDFs directly from your storage. Client-side tools run in your browser for privacy.',
    icon: 'file-text',
    category: 'productivity',
    features: [
      'Merge multiple PDFs (client-side)',
      'Split PDF by pages (client-side)',
      'Extract pages (client-side)',
      'Add watermark (client-side)',
      'Compress PDF (server-side)',
      'Extract text / OCR (server-side)',
    ],
  },
  {
    id: 'ats-search',
    name: 'ATS X-Ray Search',
    description: 'Find top talent and hidden jobs using advanced boolean search techniques across multiple platforms.',
    icon: 'search',
    category: 'productivity',
    features: [
      'X-Ray Search for LinkedIn Profiles',
      'Targeted Job Search across major ATS',
      'Company Research & Intelligence',
      'Boolean Query Builder',
      'Save & Export Searches',
    ],
  },
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

  async getPluginSettings(userId: string, pluginId: string): Promise<Record<string, any> | null> {
    const plugin = await prisma.enabledPlugin.findFirst({
      where: { userId, pluginId },
    });

    return plugin?.settings as Record<string, any> | null;
  },
};
