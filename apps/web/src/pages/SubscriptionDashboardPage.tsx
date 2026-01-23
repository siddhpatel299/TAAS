import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Repeat,
  Plus,
  DollarSign,
  Calendar,
  AlertCircle,
  Pause,
  Play,
  X,
  Search,
  Trash2,
  ExternalLink,
  TrendingUp,
  MoreVertical,
  Tv,
  Briefcase,
  Zap,
  Heart,
  BookOpen,
  Newspaper,
  Cloud,
  Gamepad2,
  Music,
  Package,
} from 'lucide-react';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { cn } from '@/lib/utils';
import {
  subscriptionApi,
  Subscription,
  SubscriptionDashboard,
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_CATEGORIES,
  BILLING_CYCLES,
} from '@/lib/finance-api';

// Category icon mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  entertainment: <Tv className="w-4 h-4" />,
  productivity: <Briefcase className="w-4 h-4" />,
  utilities: <Zap className="w-4 h-4" />,
  health: <Heart className="w-4 h-4" />,
  education: <BookOpen className="w-4 h-4" />,
  news: <Newspaper className="w-4 h-4" />,
  storage: <Cloud className="w-4 h-4" />,
  gaming: <Gamepad2 className="w-4 h-4" />,
  music: <Music className="w-4 h-4" />,
  other: <Package className="w-4 h-4" />,
};

// Category colors for chart
const CATEGORY_COLORS: Record<string, string> = {
  entertainment: '#8B5CF6',
  productivity: '#3B82F6',
  utilities: '#F59E0B',
  health: '#EF4444',
  education: '#10B981',
  news: '#6366F1',
  storage: '#06B6D4',
  gaming: '#EC4899',
  music: '#14B8A6',
  other: '#6B7280',
};

export function SubscriptionDashboardPage() {
  const [dashboard, setDashboard] = useState<SubscriptionDashboard | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSub, setNewSub] = useState({
    name: '',
    amount: '',
    billingCycle: 'monthly',
    category: '',
    startDate: new Date().toISOString().split('T')[0],
    website: '',
    color: '#8B5CF6',
    notes: '',
    reminderEnabled: false,
    reminderDays: 3,
    reminderTime: '10:00',
  });

  // Calculate category breakdown for chart
  const categoryBreakdown = useMemo(() => {
    const breakdown: { category: string; amount: number; count: number; color: string }[] = [];
    const categoryMap = new Map<string, { amount: number; count: number }>();

    subscriptions
      .filter(s => s.status === 'active')
      .forEach(sub => {
        const cat = sub.category || 'other';
        const existing = categoryMap.get(cat) || { amount: 0, count: 0 };
        // Normalize to monthly
        let monthlyAmount = sub.amount;
        if (sub.billingCycle === 'yearly') monthlyAmount /= 12;
        else if (sub.billingCycle === 'quarterly') monthlyAmount /= 3;
        else if (sub.billingCycle === 'weekly') monthlyAmount *= 4.33;

        categoryMap.set(cat, {
          amount: existing.amount + monthlyAmount,
          count: existing.count + 1,
        });
      });

    categoryMap.forEach((value, key) => {
      breakdown.push({
        category: key,
        amount: Math.round(value.amount * 100) / 100,
        count: value.count,
        color: CATEGORY_COLORS[key] || '#6B7280',
      });
    });

    return breakdown.sort((a, b) => b.amount - a.amount);
  }, [subscriptions]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dashboardRes, subsRes] = await Promise.all([
        subscriptionApi.getDashboard(),
        subscriptionApi.getSubscriptions(),
      ]);
      setDashboard(dashboardRes.data.data);
      setSubscriptions(subsRes.data.data);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubscription = async () => {
    if (!newSub.name || !newSub.amount) return;
    try {
      await subscriptionApi.createSubscription({
        name: newSub.name,
        amount: parseFloat(newSub.amount),
        billingCycle: newSub.billingCycle,
        category: newSub.category || undefined,
        startDate: newSub.startDate,
        website: newSub.website || undefined,
        reminderEnabled: newSub.reminderEnabled,
        reminderDays: newSub.reminderDays,
        reminderTime: newSub.reminderTime,
      });
      setShowAddModal(false);
      setNewSub({
        name: '',
        amount: '',
        billingCycle: 'monthly',
        category: '',
        startDate: new Date().toISOString().split('T')[0],
        website: '',
        color: '#8B5CF6',
        notes: '',
        reminderEnabled: false,
        reminderDays: 3,
        reminderTime: '10:00',
      });
      loadData();
    } catch (error) {
      console.error('Failed to create subscription:', error);
    }
  };

  const handlePause = async (id: string) => {
    try {
      await subscriptionApi.pauseSubscription(id);
      loadData();
    } catch (error) {
      console.error('Failed to pause subscription:', error);
    }
  };

  const handleResume = async (id: string) => {
    try {
      await subscriptionApi.resumeSubscription(id);
      loadData();
    } catch (error) {
      console.error('Failed to resume subscription:', error);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    try {
      await subscriptionApi.cancelSubscription(id);
      loadData();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return;
    try {
      await subscriptionApi.deleteSubscription(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete subscription:', error);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || sub.category === categoryFilter;
    const matchesSearch = !searchQuery ||
      sub.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      paused: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
      trial: 'bg-blue-100 text-blue-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <ModernSidebar />
        <main className="ml-20 p-8 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <ModernSidebar />

      <main className="ml-20 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Repeat className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Subscription Tracker</h1>
            </div>
            <p className="text-gray-500">Monitor and manage your recurring subscriptions</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Subscription
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Monthly Cost</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(dashboard?.monthlyTotal || 0)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-sm text-gray-500">Yearly Cost</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(dashboard?.yearlyTotal || 0)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Repeat className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Active</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{dashboard?.activeSubscriptions || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-sm text-gray-500">Upcoming Renewals</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {dashboard?.upcomingRenewals?.length || 0}
            </p>
          </motion.div>
        </div>

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-6 mb-8"
          >
            <h3 className="font-semibold text-gray-900 mb-4">Spending by Category</h3>
            <div className="space-y-3">
              {categoryBreakdown.map((cat) => {
                const totalMonthly = categoryBreakdown.reduce((sum, c) => sum + c.amount, 0);
                const percentage = totalMonthly > 0 ? (cat.amount / totalMonthly) * 100 : 0;
                return (
                  <div key={cat.category} className="flex items-center gap-4">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: cat.color }}
                    >
                      {CATEGORY_ICONS[cat.category] || <Package className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 capitalize">{cat.category}</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(cat.amount)}/mo</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">{cat.count} subs</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
              <span className="text-sm text-gray-500">Total Monthly</span>
              <span className="font-bold text-purple-600">
                {formatCurrency(categoryBreakdown.reduce((sum, c) => sum + c.amount, 0))}
              </span>
            </div>
          </motion.div>
        )}

        {/* Upcoming Renewals */}
        {dashboard?.upcomingRenewals && dashboard.upcomingRenewals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Upcoming Renewals This Week</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {dashboard.upcomingRenewals.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white rounded-xl px-4 py-2 border border-orange-200 flex items-center gap-3"
                >
                  <span className="font-medium text-gray-900">{sub.name}</span>
                  <span className="text-sm text-gray-500">
                    {formatCurrency(sub.amount)} on {formatDate(sub.nextBillingDate!)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            {SUBSCRIPTION_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Categories</option>
            {SUBSCRIPTION_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Subscriptions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubscriptions.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Repeat className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No subscriptions found. Add your first subscription to get started.</p>
            </div>
          ) : (
            filteredSubscriptions.map((sub) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: sub.color || '#8B5CF6' }}
                    >
                      {sub.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{sub.name}</h3>
                      <span className={cn(
                        "px-2 py-0.5 text-xs font-medium rounded-full capitalize",
                        getStatusColor(sub.status)
                      )}>
                        {sub.status}
                      </span>
                    </div>
                  </div>
                  <div className="relative group">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[140px]">
                      <button
                        onClick={() => sub.status === 'paused' ? handleResume(sub.id) : handlePause(sub.id)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        {sub.status === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        {sub.status === 'paused' ? 'Resume' : 'Pause'}
                      </button>
                      <button
                        onClick={() => handleCancel(sub.id)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-orange-600"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Amount</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(sub.amount, sub.currency)}/{sub.billingCycle}
                    </span>
                  </div>
                  {sub.nextBillingDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Next billing</span>
                      <span className="text-sm text-gray-700">{formatDate(sub.nextBillingDate)}</span>
                    </div>
                  )}
                  {sub.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Category</span>
                      <span className="text-sm text-gray-700 capitalize">{sub.category}</span>
                    </div>
                  )}
                </div>

                {sub.website && (
                  <a
                    href={sub.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Visit website
                  </a>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Add Subscription Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Add Subscription</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newSub.name}
                    onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                    placeholder="e.g., Netflix, Spotify"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                    <input
                      type="number"
                      value={newSub.amount}
                      onChange={(e) => setNewSub({ ...newSub, amount: e.target.value })}
                      placeholder="9.99"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
                    <select
                      value={newSub.billingCycle}
                      onChange={(e) => setNewSub({ ...newSub, billingCycle: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {BILLING_CYCLES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newSub.category}
                    onChange={(e) => setNewSub({ ...newSub, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select category</option>
                    {SUBSCRIPTION_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newSub.startDate}
                    onChange={(e) => setNewSub({ ...newSub, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={newSub.website}
                    onChange={(e) => setNewSub({ ...newSub, website: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Call Reminder Settings */}
                <div className="border-t border-gray-200 pt-4 mt-2">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <label className="text-sm font-medium text-gray-900">📞 Phone Call Reminders</label>
                      <p className="text-xs text-gray-500 mt-0.5">Get a call before renewal to avoid unwanted charges</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewSub({ ...newSub, reminderEnabled: !newSub.reminderEnabled })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${newSub.reminderEnabled ? 'bg-purple-600' : 'bg-gray-200'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newSub.reminderEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  {newSub.reminderEnabled && (
                    <div className="grid grid-cols-2 gap-3 mt-3 p-3 bg-purple-50 rounded-lg">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Days Before</label>
                        <select
                          value={newSub.reminderDays}
                          onChange={(e) => setNewSub({ ...newSub, reminderDays: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="0">Same day</option>
                          <option value="1">1 day before</option>
                          <option value="2">2 days before</option>
                          <option value="3">3 days before</option>
                          <option value="5">5 days before</option>
                          <option value="7">7 days before</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Call Time</label>
                        <input
                          type="time"
                          value={newSub.reminderTime}
                          onChange={(e) => setNewSub({ ...newSub, reminderTime: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSubscription}
                  disabled={!newSub.name || !newSub.amount}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                >
                  Add Subscription
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
