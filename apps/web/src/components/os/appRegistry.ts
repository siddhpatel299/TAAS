import {
  FolderOpen,
  CheckSquare,
  Briefcase,
  FileText,
  LayoutDashboard,
  Workflow,
  BarChart3,
  CreditCard,
  KeyRound,
  FileType,
  Send,
  Users,
  Search,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export type AppCategory = 'system' | 'productivity' | 'finance' | 'career' | 'security' | 'utility';

export interface OSAppDefinition {
  id: string;
  name: string;
  icon: LucideIcon;
  category: AppCategory;
  description: string;
  route: string;
  pluginId?: string;
  isSystem?: boolean;
  color: string;
}

export const APP_REGISTRY: OSAppDefinition[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard,
    category: 'system',
    description: 'Overview of your workspace',
    route: '/dashboard',
    isSystem: true,
    color: '#6366f1',
  },
  {
    id: 'files',
    name: 'File Manager',
    icon: FolderOpen,
    category: 'system',
    description: 'Browse and manage your files',
    route: '/files',
    isSystem: true,
    color: '#3b82f6',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: Send,
    category: 'system',
    description: 'Telegram channel storage',
    route: '/telegram',
    isSystem: true,
    color: '#0ea5e9',
  },
  {
    id: 'todo-lists',
    name: 'Tasks',
    icon: CheckSquare,
    category: 'productivity',
    description: 'Todo lists and task management',
    route: '/plugins/todo-lists',
    pluginId: 'todo-lists',
    color: '#10b981',
  },
  {
    id: 'notes',
    name: 'Notes',
    icon: FileText,
    category: 'productivity',
    description: 'Rich text notes with folders',
    route: '/plugins/notes',
    pluginId: 'notes',
    color: '#f59e0b',
  },
  {
    id: 'nexus',
    name: 'Nexus',
    icon: LayoutDashboard,
    category: 'productivity',
    description: 'Project management with sprints',
    route: '/plugins/nexus',
    pluginId: 'nexus',
    color: '#8b5cf6',
  },
  {
    id: 'flow',
    name: 'Automations',
    icon: Workflow,
    category: 'productivity',
    description: 'Visual workflow automation',
    route: '/plugins/flow',
    pluginId: 'flow',
    color: '#ec4899',
  },
  {
    id: 'job-tracker',
    name: 'Job Tracker',
    icon: Briefcase,
    category: 'career',
    description: 'Job application pipeline',
    route: '/plugins/job-tracker',
    pluginId: 'job-tracker',
    color: '#f97316',
  },
  {
    id: 'contacts',
    name: 'Contacts',
    icon: Users,
    category: 'career',
    description: 'CRM and contact management',
    route: '/plugins/contacts',
    pluginId: 'contacts',
    color: '#14b8a6',
  },
  {
    id: 'subscriptions',
    name: 'Subscriptions',
    icon: CreditCard,
    category: 'finance',
    description: 'Track subscriptions and bills',
    route: '/plugins/subscription-tracker',
    pluginId: 'subscription-tracker',
    color: '#ef4444',
  },
  {
    id: 'insight',
    name: 'Analytics',
    icon: BarChart3,
    category: 'utility',
    description: 'Insights and analytics dashboard',
    route: '/plugins/insight',
    pluginId: 'insight',
    color: '#6366f1',
  },
  {
    id: 'password-vault',
    name: 'Vault',
    icon: KeyRound,
    category: 'security',
    description: 'Secure password manager',
    route: '/plugins/password-vault',
    pluginId: 'password-vault',
    color: '#78716c',
  },
  {
    id: 'pdf-tools',
    name: 'PDF Tools',
    icon: FileType,
    category: 'utility',
    description: 'PDF utilities and tools',
    route: '/plugins/pdf-tools',
    pluginId: 'pdf-tools',
    color: '#dc2626',
  },
  {
    id: 'ats-search',
    name: 'ATS Search',
    icon: Search,
    category: 'career',
    description: 'Search applicant tracking systems',
    route: '/plugins/ats-search',
    pluginId: 'ats-search',
    color: '#0891b2',
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: Settings,
    category: 'system',
    description: 'System preferences',
    route: '/settings',
    isSystem: true,
    color: '#64748b',
  },
];

export const CATEGORY_LABELS: Record<AppCategory, string> = {
  system: 'System',
  productivity: 'Productivity',
  finance: 'Finance',
  career: 'Career',
  security: 'Security',
  utility: 'Utilities',
};

export function getAppById(id: string): OSAppDefinition | undefined {
  return APP_REGISTRY.find((app) => app.id === id);
}

export function getAppByRoute(route: string): OSAppDefinition | undefined {
  return APP_REGISTRY.find((app) => route.startsWith(app.route));
}

export function getAppsByCategory(category: AppCategory): OSAppDefinition[] {
  return APP_REGISTRY.filter((app) => app.category === category);
}
