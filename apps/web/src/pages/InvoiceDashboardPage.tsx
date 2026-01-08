import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  Users,
  DollarSign,
  Clock,
  AlertCircle,
  Send,
  Search,
  MoreVertical,
  Trash2,
  Eye,
  X,
  CheckCircle,
} from 'lucide-react';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { cn } from '@/lib/utils';
import {
  invoiceApi,
  Invoice,
  InvoiceClient,
  InvoiceDashboard,
  INVOICE_STATUSES,
  PAYMENT_METHODS,
} from '@/lib/finance-api';

export function InvoiceDashboardPage() {
  const [dashboard, setDashboard] = useState<InvoiceDashboard | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<InvoiceClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invoices' | 'clients'>('invoices');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<Invoice | null>(null);
  
  // New Invoice Form State
  const [newInvoice, setNewInvoice] = useState({
    clientId: '',
    dueDate: '',
    notes: '',
    terms: '',
    taxRate: 0,
    items: [{ description: '', quantity: 1, unitPrice: 0 }] as { description: string; quantity: number; unitPrice: number }[],
  });
  
  // New Client Form State
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  });
  
  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: '',
    reference: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dashboardRes, invoicesRes, clientsRes] = await Promise.all([
        invoiceApi.getDashboard(),
        invoiceApi.getInvoices(),
        invoiceApi.getClients(),
      ]);
      setDashboard(dashboardRes.data.data);
      setInvoices(invoicesRes.data.data);
      setClients(clientsRes.data.data);
    } catch (error) {
      console.error('Failed to load invoice data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchesSearch = !searchQuery || 
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.client?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    const statusObj = INVOICE_STATUSES.find(s => s.value === status);
    const colors: Record<string, string> = {
      gray: 'bg-gray-100 text-gray-700',
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700',
      red: 'bg-red-100 text-red-700',
      slate: 'bg-slate-100 text-slate-700',
    };
    return colors[statusObj?.color || 'gray'];
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
      year: 'numeric',
    });
  };

  // Calculate invoice subtotal
  const calculateSubtotal = () => {
    return newInvoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (newInvoice.taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  // Add invoice item
  const addInvoiceItem = () => {
    setNewInvoice({
      ...newInvoice,
      items: [...newInvoice.items, { description: '', quantity: 1, unitPrice: 0 }],
    });
  };

  // Remove invoice item
  const removeInvoiceItem = (index: number) => {
    setNewInvoice({
      ...newInvoice,
      items: newInvoice.items.filter((_, i) => i !== index),
    });
  };

  // Update invoice item
  const updateInvoiceItem = (index: number, field: string, value: string | number) => {
    const items = [...newInvoice.items];
    items[index] = { ...items[index], [field]: value };
    setNewInvoice({ ...newInvoice, items });
  };

  // Create invoice
  const handleCreateInvoice = async () => {
    if (newInvoice.items.length === 0 || !newInvoice.items[0].description) {
      alert('Please add at least one item');
      return;
    }
    try {
      // Ensure items have proper number types
      const formattedItems = newInvoice.items
        .filter(item => item.description)
        .map(item => ({
          description: item.description,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
        }));
      
      await invoiceApi.createInvoice({
        clientId: newInvoice.clientId || undefined,
        dueDate: newInvoice.dueDate || undefined,
        notes: newInvoice.notes || undefined,
        terms: newInvoice.terms || undefined,
        taxRate: Number(newInvoice.taxRate) || undefined,
        items: formattedItems,
      });
      setShowNewInvoiceModal(false);
      setNewInvoice({
        clientId: '',
        dueDate: '',
        notes: '',
        terms: '',
        taxRate: 0,
        items: [{ description: '', quantity: 1, unitPrice: 0 }],
      });
      loadData();
    } catch (error) {
      console.error('Failed to create invoice:', error);
      alert('Failed to create invoice');
    }
  };

  // Create client
  const handleCreateClient = async () => {
    if (!newClient.name) {
      alert('Client name is required');
      return;
    }
    try {
      await invoiceApi.createClient(newClient);
      setShowNewClientModal(false);
      setNewClient({
        name: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      });
      loadData();
    } catch (error) {
      console.error('Failed to create client:', error);
      alert('Failed to create client');
    }
  };

  // Record payment
  const handleRecordPayment = async () => {
    if (!showPaymentModal || !paymentForm.amount) return;
    try {
      await invoiceApi.addPayment(showPaymentModal.id, {
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod || undefined,
        reference: paymentForm.reference || undefined,
        notes: paymentForm.notes || undefined,
      });
      setShowPaymentModal(null);
      setPaymentForm({ amount: '', paymentMethod: '', reference: '', notes: '' });
      loadData();
    } catch (error) {
      console.error('Failed to record payment:', error);
      alert('Failed to record payment');
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await invoiceApi.deleteInvoice(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete invoice:', error);
    }
  };

  // Delete client
  const handleDeleteClient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client? This will also delete all their invoices.')) return;
    try {
      await invoiceApi.deleteClient(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete client:', error);
    }
  };

  // Mark invoice as sent
  const handleMarkAsSent = async (invoice: Invoice) => {
    try {
      await invoiceApi.updateInvoice(invoice.id, { status: 'sent' });
      loadData();
    } catch (error) {
      console.error('Failed to update invoice:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <ModernSidebar />
        <main className="ml-20 p-8 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Invoice Generator</h1>
            </div>
            <p className="text-gray-500">Create and manage professional invoices</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowNewClientModal(true)}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Add Client
            </button>
            <button
              onClick={() => setShowNewInvoiceModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Invoice
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm text-gray-500">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(dashboard?.totalRevenue || 0)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500">Pending</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(dashboard?.pendingAmount || 0)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Sent</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{dashboard?.sentInvoices || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-sm text-gray-500">Overdue</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{dashboard?.overdueInvoices || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Clients</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{dashboard?.totalClients || 0}</p>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('invoices')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-xl transition-all",
              activeTab === 'invoices'
                ? "bg-emerald-500 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300"
            )}
          >
            Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-xl transition-all",
              activeTab === 'clients'
                ? "bg-emerald-500 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300"
            )}
          >
            Clients ({clients.length})
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeTab === 'invoices' ? "Search invoices..." : "Search clients..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {activeTab === 'invoices' && (
            <div className="flex gap-2">
              {['all', ...INVOICE_STATUSES.map(s => s.value)].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-xl transition-all capitalize",
                    statusFilter === status
                      ? "bg-emerald-500 text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        {activeTab === 'invoices' ? (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Invoice</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Client</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Amount</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Due Date</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No invoices found. Create your first invoice to get started.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">{invoice.client?.name || 'No client'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">
                          {formatCurrency(invoice.total, invoice.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 text-xs font-medium rounded-full capitalize",
                          getStatusColor(invoice.status)
                        )}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600">
                          {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setShowInvoiceDetail(invoice)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                          {invoice.status !== 'paid' && (
                            <button 
                              onClick={() => {
                                setShowPaymentModal(invoice);
                                setPaymentForm({ ...paymentForm, amount: String(invoice.total) });
                              }}
                              className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Record payment"
                            >
                              <DollarSign className="w-4 h-4 text-emerald-500" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No clients yet. Add your first client to get started.</p>
              </div>
            ) : (
              clients.map((client) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{client.name}</h3>
                  {client.company && (
                    <p className="text-sm text-gray-500 mb-2">{client.company}</p>
                  )}
                  {client.email && (
                    <p className="text-sm text-gray-400">{client.email}</p>
                  )}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {client._count?.invoices || 0} invoices
                    </span>
                    <button 
                      onClick={() => handleDeleteClient(client.id)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* New Invoice Modal */}
        {showNewInvoiceModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-gray-900">Create New Invoice</h2>
                <button
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Client Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                  <select
                    value={newInvoice.clientId}
                    onChange={(e) => setNewInvoice({ ...newInvoice, clientId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select a client (optional)</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>

                {/* Due Date & Tax */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                    <input
                      type="date"
                      value={newInvoice.dueDate}
                      onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
                    <input
                      type="number"
                      value={newInvoice.taxRate}
                      onChange={(e) => setNewInvoice({ ...newInvoice, taxRate: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      min="0"
                      max="100"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Invoice Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">Items</label>
                    <button
                      onClick={addInvoiceItem}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {newInvoice.items.map((item, index) => (
                      <div key={index} className="flex gap-3 items-start">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                          placeholder="Description"
                          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          placeholder="Qty"
                          min="1"
                          className="w-20 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateInvoiceItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          placeholder="Price"
                          min="0"
                          step="0.01"
                          className="w-28 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <div className="w-24 px-4 py-2.5 bg-gray-50 rounded-xl text-right font-medium">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </div>
                        {newInvoice.items.length > 1 && (
                          <button
                            onClick={() => removeInvoiceItem(index)}
                            className="p-2.5 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  {newInvoice.taxRate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax ({newInvoice.taxRate}%)</span>
                      <span className="font-medium">{formatCurrency(calculateTax())}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-emerald-600">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>

                {/* Notes & Terms */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={newInvoice.notes}
                      onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                      placeholder="Additional notes..."
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions</label>
                    <textarea
                      value={newInvoice.terms}
                      onChange={(e) => setNewInvoice({ ...newInvoice, terms: e.target.value })}
                      placeholder="Payment terms..."
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0 bg-white">
                <button
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInvoice}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Create Invoice
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* New Client Modal */}
        {showNewClientModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add New Client</h2>
                <button
                  onClick={() => setShowNewClientModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    placeholder="Client name"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      placeholder="email@example.com"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={newClient.company}
                    onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                    placeholder="Company name"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={newClient.address}
                    onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                    placeholder="Street address"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={newClient.city}
                      onChange={(e) => setNewClient({ ...newClient, city: e.target.value })}
                      placeholder="City"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={newClient.state}
                      onChange={(e) => setNewClient({ ...newClient, state: e.target.value })}
                      placeholder="State"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={newClient.country}
                      onChange={(e) => setNewClient({ ...newClient, country: e.target.value })}
                      placeholder="Country"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={newClient.postalCode}
                      onChange={(e) => setNewClient({ ...newClient, postalCode: e.target.value })}
                      placeholder="12345"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
                <button
                  onClick={() => setShowNewClientModal(false)}
                  className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateClient}
                  disabled={!newClient.name}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Add Client
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl w-full max-w-md"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
                  <p className="text-sm text-gray-500">Invoice #{showPaymentModal.invoiceNumber}</p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-emerald-600 mb-1">Amount Due</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {formatCurrency(showPaymentModal.total)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount *</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder={String(showPaymentModal.total)}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select method</option>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference #</label>
                  <input
                    type="text"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    placeholder="Transaction ID, check number, etc."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
                <button
                  onClick={() => setShowPaymentModal(null)}
                  className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordPayment}
                  disabled={!paymentForm.amount}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Record Payment
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Invoice Detail Modal */}
        {showInvoiceDetail && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Invoice #{showInvoiceDetail.invoiceNumber}</h2>
                  <span className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-full capitalize",
                    getStatusColor(showInvoiceDetail.status)
                  )}>
                    {showInvoiceDetail.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {showInvoiceDetail.status === 'draft' && (
                    <button
                      onClick={() => {
                        handleMarkAsSent(showInvoiceDetail);
                        setShowInvoiceDetail(null);
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Mark as Sent
                    </button>
                  )}
                  {(showInvoiceDetail.status === 'sent' || showInvoiceDetail.status === 'overdue') && (
                    <button
                      onClick={() => {
                        setShowPaymentModal(showInvoiceDetail);
                        setPaymentForm({ ...paymentForm, amount: String(showInvoiceDetail.total) });
                        setShowInvoiceDetail(null);
                      }}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      Record Payment
                    </button>
                  )}
                  <button
                    onClick={() => setShowInvoiceDetail(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Client Info */}
                {showInvoiceDetail.client && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Bill To</h3>
                    <p className="text-gray-700">{showInvoiceDetail.client.name}</p>
                    {showInvoiceDetail.client.company && (
                      <p className="text-gray-500 text-sm">{showInvoiceDetail.client.company}</p>
                    )}
                    {showInvoiceDetail.client.email && (
                      <p className="text-gray-500 text-sm">{showInvoiceDetail.client.email}</p>
                    )}
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Issue Date</p>
                    <p className="font-medium">{formatDate(showInvoiceDetail.issueDate)}</p>
                  </div>
                  {showInvoiceDetail.dueDate && (
                    <div>
                      <p className="text-sm text-gray-500">Due Date</p>
                      <p className="font-medium">{formatDate(showInvoiceDetail.dueDate)}</p>
                    </div>
                  )}
                </div>

                {/* Items */}
                {showInvoiceDetail.items && showInvoiceDetail.items.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Items</h3>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-4 py-2 text-sm font-medium text-gray-500">Description</th>
                            <th className="text-right px-4 py-2 text-sm font-medium text-gray-500">Qty</th>
                            <th className="text-right px-4 py-2 text-sm font-medium text-gray-500">Price</th>
                            <th className="text-right px-4 py-2 text-sm font-medium text-gray-500">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {showInvoiceDetail.items.map((item, i) => (
                            <tr key={i} className="border-t border-gray-100">
                              <td className="px-4 py-3">{item.description}</td>
                              <td className="px-4 py-3 text-right">{item.quantity}</td>
                              <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                              <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(showInvoiceDetail.subtotal)}</span>
                  </div>
                  {showInvoiceDetail.taxAmount && showInvoiceDetail.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax ({showInvoiceDetail.taxRate}%)</span>
                      <span className="font-medium">{formatCurrency(showInvoiceDetail.taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-emerald-600">{formatCurrency(showInvoiceDetail.total)}</span>
                  </div>
                </div>

                {/* Notes */}
                {showInvoiceDetail.notes && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
                    <p className="text-gray-600 text-sm">{showInvoiceDetail.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
