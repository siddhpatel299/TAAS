import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  DollarSign,
  PieChart,
  Eye,
  Search,
  Trash2,
  Edit,
  ArrowUpRight,
  ArrowDownRight,
  X,
  BarChart2,
  Briefcase,
  Bitcoin,
  Building2,
  Landmark,
  Home,
  Package,
  RefreshCw,
} from 'lucide-react';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { cn } from '@/lib/utils';
import {
  investmentApi,
  Investment,
  InvestmentDashboard,
  INVESTMENT_TYPES,
} from '@/lib/finance-api';

// Type colors for allocation chart
const TYPE_COLORS: Record<string, string> = {
  stock: '#3B82F6',
  crypto: '#F59E0B',
  etf: '#8B5CF6',
  mutual_fund: '#10B981',
  bond: '#6366F1',
  real_estate: '#EC4899',
  other: '#6B7280',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  stock: <BarChart2 className="w-4 h-4" />,
  crypto: <Bitcoin className="w-4 h-4" />,
  etf: <Briefcase className="w-4 h-4" />,
  mutual_fund: <Building2 className="w-4 h-4" />,
  bond: <Landmark className="w-4 h-4" />,
  real_estate: <Home className="w-4 h-4" />,
  other: <Package className="w-4 h-4" />,
};

// Type for refresh result
interface RefreshResult {
  updated: number;
  failed: number;
  results: Array<{ symbol: string; name: string; oldPrice: number; newPrice: number; change: number }>;
}

export function InvestmentDashboardPage() {
  const [dashboard, setDashboard] = useState<InvestmentDashboard | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<RefreshResult | null>(null);

  // Calculate type allocation for chart
  const typeAllocation = useMemo(() => {
    const allocation: { type: string; value: number; percentage: number; color: string; label: string }[] = [];
    const typeMap = new Map<string, number>();
    let totalValue = 0;
    
    investments
      .filter(inv => !inv.isWatchlist)
      .forEach(inv => {
        const value = inv.currentValue || 0;
        totalValue += value;
        typeMap.set(inv.type, (typeMap.get(inv.type) || 0) + value);
      });
    
    typeMap.forEach((value, type) => {
      const typeInfo = INVESTMENT_TYPES.find(t => t.value === type);
      allocation.push({
        type,
        value: Math.round(value * 100) / 100,
        percentage: totalValue > 0 ? Math.round((value / totalValue) * 1000) / 10 : 0,
        color: TYPE_COLORS[type] || '#6B7280',
        label: typeInfo?.label || type,
      });
    });
    
    return allocation.sort((a, b) => b.value - a.value);
  }, [investments]);
  const [newInvestment, setNewInvestment] = useState({
    symbol: '',
    name: '',
    type: 'stock',
    quantity: '',
    avgCostBasis: '',
    currentPrice: '',
    sector: '',
    isWatchlist: false,
  });
  const [newTransaction, setNewTransaction] = useState({
    type: 'buy',
    quantity: '',
    pricePerUnit: '',
    fees: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dashboardRes, investmentsRes] = await Promise.all([
        investmentApi.getDashboard(),
        investmentApi.getInvestments(),
      ]);
      setDashboard(dashboardRes.data.data);
      setInvestments(investmentsRes.data.data);
    } catch (error) {
      console.error('Failed to load investment data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshPrices = async () => {
    setIsRefreshing(true);
    setRefreshResult(null);
    try {
      const response = await investmentApi.refreshMutualFundPrices();
      setRefreshResult(response.data.data);
      loadData(); // Reload to get updated prices
    } catch (error) {
      console.error('Failed to refresh prices:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateInvestment = async () => {
    if (!newInvestment.symbol || !newInvestment.name || !newInvestment.type) return;
    try {
      await investmentApi.createInvestment({
        symbol: newInvestment.symbol,
        name: newInvestment.name,
        type: newInvestment.type,
        quantity: newInvestment.quantity ? parseFloat(newInvestment.quantity) : 0,
        avgCostBasis: newInvestment.avgCostBasis ? parseFloat(newInvestment.avgCostBasis) : 0,
        currentPrice: newInvestment.currentPrice ? parseFloat(newInvestment.currentPrice) : undefined,
        sector: newInvestment.sector || undefined,
        isWatchlist: newInvestment.isWatchlist,
      });
      setShowAddModal(false);
      setNewInvestment({
        symbol: '',
        name: '',
        type: 'stock',
        quantity: '',
        avgCostBasis: '',
        currentPrice: '',
        sector: '',
        isWatchlist: false,
      });
      loadData();
    } catch (error) {
      console.error('Failed to create investment:', error);
    }
  };

  const handleAddTransaction = async () => {
    if (!selectedInvestment || !newTransaction.quantity || !newTransaction.pricePerUnit) return;
    try {
      await investmentApi.addTransaction(selectedInvestment.id, {
        type: newTransaction.type,
        quantity: parseFloat(newTransaction.quantity),
        pricePerUnit: parseFloat(newTransaction.pricePerUnit),
        fees: newTransaction.fees ? parseFloat(newTransaction.fees) : undefined,
        date: newTransaction.date,
      });
      setShowTransactionModal(false);
      setSelectedInvestment(null);
      setNewTransaction({
        type: 'buy',
        quantity: '',
        pricePerUnit: '',
        fees: '',
        date: new Date().toISOString().split('T')[0],
      });
      loadData();
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this investment?')) return;
    try {
      await investmentApi.deleteInvestment(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete investment:', error);
    }
  };

  const filteredInvestments = investments.filter(inv => {
    const matchesType = typeFilter === 'all' || inv.type === typeFilter;
    const matchesWatchlist = showWatchlist ? inv.isWatchlist : !inv.isWatchlist;
    const matchesSearch = !searchQuery || 
      inv.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesWatchlist && matchesSearch;
  });

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <ModernSidebar />
        <main className="ml-20 p-8 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </main>
      </div>
    );
  }

  const isPositive = (dashboard?.totalGainLoss || 0) >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <ModernSidebar />
      
      <main className="ml-20 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Investment Portfolio</h1>
            </div>
            <p className="text-gray-500">Track your stocks, crypto, and investments</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshPrices}
              disabled={isRefreshing}
              className={cn(
                "px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2",
                isRefreshing && "opacity-50 cursor-not-allowed"
              )}
            >
              <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Prices'}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Investment
            </button>
          </div>
        </div>

        {/* Refresh Results Toast */}
        {refreshResult && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">
                  Prices updated: {refreshResult.updated} funds refreshed
                  {refreshResult.failed > 0 && `, ${refreshResult.failed} failed`}
                </span>
              </div>
              <button onClick={() => setRefreshResult(null)} className="text-green-600 hover:text-green-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            {refreshResult.results.length > 0 && (
              <div className="mt-2 space-y-1">
                {refreshResult.results.slice(0, 3).map((r: { name: string; oldPrice: number; newPrice: number; change: number }, i: number) => (
                  <div key={i} className="text-sm text-green-700">
                    {r.name}: ₹{r.oldPrice.toFixed(2)} → ₹{r.newPrice.toFixed(2)} 
                    <span className={r.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {' '}({r.change >= 0 ? '+' : ''}{r.change.toFixed(2)}%)
                    </span>
                  </div>
                ))}
                {refreshResult.results.length > 3 && (
                  <div className="text-sm text-green-600">+{refreshResult.results.length - 3} more</div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Total Value</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(dashboard?.totalValue || 0)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-gray-600" />
              </div>
              <span className="text-sm text-gray-500">Total Cost</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(dashboard?.totalCost || 0)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn(
              "bg-white rounded-2xl p-6 border",
              isPositive ? "border-green-200" : "border-red-200"
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isPositive ? "bg-green-100" : "bg-red-100"
              )}>
                {isPositive ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
              </div>
              <span className="text-sm text-gray-500">Total Gain/Loss</span>
            </div>
            <p className={cn(
              "text-2xl font-bold",
              isPositive ? "text-green-600" : "text-red-600"
            )}>
              {formatCurrency(dashboard?.totalGainLoss || 0)}
            </p>
            <p className={cn(
              "text-sm",
              isPositive ? "text-green-600" : "text-red-600"
            )}>
              {formatPercent(dashboard?.totalGainLossPercent || 0)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Holdings</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{dashboard?.totalInvestments || 0}</p>
            <p className="text-sm text-gray-500">{dashboard?.watchlistCount || 0} in watchlist</p>
          </motion.div>
        </div>

        {/* Portfolio Allocation */}
        {typeAllocation.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Allocation Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 p-6"
            >
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-500" />
                Portfolio Allocation
              </h3>
              <div className="space-y-3">
                {typeAllocation.map((item) => (
                  <div key={item.type} className="flex items-center gap-4">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      {TYPE_ICONS[item.type] || <Package className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.value)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percentage}%` }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Top Performers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-gray-100 p-6"
            >
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Top Performers
              </h3>
              <div className="space-y-3">
                {investments
                  .filter(inv => !inv.isWatchlist && (inv.gainLossPercent || 0) > 0)
                  .sort((a, b) => (b.gainLossPercent || 0) - (a.gainLossPercent || 0))
                  .slice(0, 5)
                  .map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                          {inv.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{inv.symbol}</p>
                          <p className="text-xs text-gray-500">{inv.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">+{formatPercent(inv.gainLossPercent || 0)}</p>
                        <p className="text-xs text-green-600">+{formatCurrency(inv.gainLoss || 0)}</p>
                      </div>
                    </div>
                  ))}
                {investments.filter(inv => !inv.isWatchlist && (inv.gainLossPercent || 0) > 0).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No gains yet</p>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Tabs and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setShowWatchlist(false)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-xl transition-all",
                !showWatchlist
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-600 border border-gray-200"
              )}
            >
              Portfolio
            </button>
            <button
              onClick={() => setShowWatchlist(true)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-xl transition-all",
                showWatchlist
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-600 border border-gray-200"
              )}
            >
              Watchlist
            </button>
          </div>
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by symbol or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            {INVESTMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Investments Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Asset</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Quantity</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Avg Cost</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Current Price</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Value</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Gain/Loss</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvestments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    {showWatchlist 
                      ? "No items in watchlist. Add investments to track."
                      : "No investments found. Add your first investment to get started."}
                  </td>
                </tr>
              ) : (
                filteredInvestments.map((inv) => {
                  const gainLoss = inv.gainLoss || 0;
                  const gainLossPercent = inv.gainLossPercent || 0;
                  const isPositive = gainLoss >= 0;

                  return (
                    <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                            {inv.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{inv.symbol}</p>
                            <p className="text-sm text-gray-500">{inv.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-gray-900">{inv.quantity}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-gray-900">{formatCurrency(inv.avgCostBasis)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-gray-900">
                          {inv.currentPrice ? formatCurrency(inv.currentPrice) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-gray-900">
                          {formatCurrency(inv.currentValue || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isPositive ? (
                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-500" />
                          )}
                          <div>
                            <p className={cn(
                              "font-medium",
                              isPositive ? "text-green-600" : "text-red-600"
                            )}>
                              {formatCurrency(gainLoss)}
                            </p>
                            <p className={cn(
                              "text-sm",
                              isPositive ? "text-green-600" : "text-red-600"
                            )}>
                              {formatPercent(gainLossPercent)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedInvestment(inv);
                              setShowTransactionModal(true);
                            }}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                            title="Add transaction"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Edit className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Add Investment Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Add Investment</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Symbol *</label>
                    <input
                      type="text"
                      value={newInvestment.symbol}
                      onChange={(e) => setNewInvestment({ ...newInvestment, symbol: e.target.value.toUpperCase() })}
                      placeholder="AAPL"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      value={newInvestment.type}
                      onChange={(e) => setNewInvestment({ ...newInvestment, type: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {INVESTMENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newInvestment.name}
                    onChange={(e) => setNewInvestment({ ...newInvestment, name: e.target.value })}
                    placeholder="Apple Inc."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={newInvestment.quantity}
                      onChange={(e) => setNewInvestment({ ...newInvestment, quantity: e.target.value })}
                      placeholder="10"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Avg Cost</label>
                    <input
                      type="number"
                      value={newInvestment.avgCostBasis}
                      onChange={(e) => setNewInvestment({ ...newInvestment, avgCostBasis: e.target.value })}
                      placeholder="150.00"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Price</label>
                  <input
                    type="number"
                    value={newInvestment.currentPrice}
                    onChange={(e) => setNewInvestment({ ...newInvestment, currentPrice: e.target.value })}
                    placeholder="175.00"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isWatchlist"
                    checked={newInvestment.isWatchlist}
                    onChange={(e) => setNewInvestment({ ...newInvestment, isWatchlist: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isWatchlist" className="text-sm text-gray-700">
                    Add to watchlist only (not owned)
                  </label>
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
                  onClick={handleCreateInvestment}
                  disabled={!newInvestment.symbol || !newInvestment.name}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                >
                  Add Investment
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Transaction Modal */}
        {showTransactionModal && selectedInvestment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add Transaction</h2>
                  <p className="text-sm text-gray-500">{selectedInvestment.symbol} - {selectedInvestment.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowTransactionModal(false);
                    setSelectedInvestment(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newTransaction.type}
                    onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                    <option value="transfer_in">Transfer In</option>
                    <option value="transfer_out">Transfer Out</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      value={newTransaction.quantity}
                      onChange={(e) => setNewTransaction({ ...newTransaction, quantity: e.target.value })}
                      placeholder="10"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price/Unit *</label>
                    <input
                      type="number"
                      value={newTransaction.pricePerUnit}
                      onChange={(e) => setNewTransaction({ ...newTransaction, pricePerUnit: e.target.value })}
                      placeholder="150.00"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fees</label>
                    <input
                      type="number"
                      value={newTransaction.fees}
                      onChange={(e) => setNewTransaction({ ...newTransaction, fees: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowTransactionModal(false);
                    setSelectedInvestment(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTransaction}
                  disabled={!newTransaction.quantity || !newTransaction.pricePerUnit}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
                >
                  Add Transaction
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
