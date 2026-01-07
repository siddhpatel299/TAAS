import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  X,
  MapPin,
  Calendar,
  Star,
  FileText,
  CheckSquare,
  Users,
  Link as LinkIcon,
} from 'lucide-react';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { useJobTrackerStore } from '@/stores/job-tracker.store';
import { FilePickerDialog } from '@/components/FilePickerDialog';
import { 
  JOB_STATUSES, 
  JOB_PRIORITIES, 
  EMPLOYMENT_TYPES, 
  DOCUMENT_TYPES,
  JobApplication,
  JobDocument,
  JobTask,
  JobReferral,
} from '@/lib/plugins-api';
import { cn } from '@/lib/utils';

// Tab Component
function Tabs({ 
  tabs, 
  activeTab, 
  onChange 
}: { 
  tabs: { id: string; label: string; icon: React.ReactNode; count?: number }[];
  activeTab: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === tab.id
              ? "bg-white text-sky-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && (
            <span className="px-1.5 py-0.5 bg-sky-100 text-sky-600 text-xs rounded-full">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// Documents Tab Content
function DocumentsTab({ 
  documents, 
  onAddDocument, 
  onRemoveDocument 
}: { 
  documents: JobDocument[];
  onAddDocument: () => void;
  onRemoveDocument: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Documents</h3>
        <button
          onClick={onAddDocument}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add from TAAS
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No documents attached</p>
          <p className="text-sm">Add resumes, cover letters, or other files from TAAS</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{doc.label || 'Untitled'}</p>
                  <p className="text-sm text-gray-500">
                    {DOCUMENT_TYPES.find(t => t.value === doc.documentType)?.label || doc.documentType}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onRemoveDocument(doc.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Tasks Tab Content
function TasksTab({ 
  tasks,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}: { 
  tasks: JobTask[];
  onCreateTask: (data: Partial<JobTask>) => void;
  onUpdateTask: (id: string, data: Partial<JobTask>) => void;
  onDeleteTask: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', dueDate: '', priority: 'medium' });

  const handleSubmit = () => {
    if (!newTask.title.trim()) return;
    onCreateTask({
      title: newTask.title,
      dueDate: newTask.dueDate || undefined,
      priority: newTask.priority as 'low' | 'medium' | 'high',
    });
    setNewTask({ title: '', dueDate: '', priority: 'medium' });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Tasks</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-sky-50 rounded-xl"
          >
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Task title..."
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
              <div className="flex gap-3">
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-3 py-1.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
                >
                  Add
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {tasks.length === 0 && !showForm ? (
        <div className="text-center py-8 text-gray-400">
          <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No tasks yet</p>
          <p className="text-sm">Add follow-up tasks and reminders</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <div
              key={task.id}
              className={cn(
                "flex items-center gap-3 p-3 bg-gray-50 rounded-lg transition-colors",
                task.status === 'completed' && "opacity-60"
              )}
            >
              <button
                onClick={() => onUpdateTask(task.id, { 
                  status: task.status === 'completed' ? 'pending' : 'completed' 
                })}
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                  task.status === 'completed'
                    ? "bg-sky-500 border-sky-500 text-white"
                    : "border-gray-300 hover:border-sky-500"
                )}
              >
                {task.status === 'completed' && <CheckSquare className="w-3 h-3" />}
              </button>
              <div className="flex-1">
                <p className={cn(
                  "font-medium text-gray-900",
                  task.status === 'completed' && "line-through"
                )}>
                  {task.title}
                </p>
                {task.dueDate && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                task.priority === 'high' && "bg-red-100 text-red-600",
                task.priority === 'medium' && "bg-yellow-100 text-yellow-600",
                task.priority === 'low' && "bg-gray-100 text-gray-600",
              )}>
                {task.priority}
              </span>
              <button
                onClick={() => onDeleteTask(task.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Referrals Tab Content
function ReferralsTab({ 
  referrals,
  onCreateReferral,
  onDeleteReferral,
}: { 
  referrals: JobReferral[];
  onCreateReferral: (data: Partial<JobReferral>) => void;
  onDeleteReferral: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [newReferral, setNewReferral] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    company: '', 
    position: '' 
  });

  const handleSubmit = () => {
    if (!newReferral.name.trim()) return;
    onCreateReferral(newReferral);
    setNewReferral({ name: '', email: '', phone: '', company: '', position: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Referrals & Contacts</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-sky-50 rounded-xl"
          >
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Name *"
                value={newReferral.name}
                onChange={(e) => setNewReferral({ ...newReferral, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={newReferral.email}
                  onChange={(e) => setNewReferral({ ...newReferral, email: e.target.value })}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={newReferral.phone}
                  onChange={(e) => setNewReferral({ ...newReferral, phone: e.target.value })}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Company"
                  value={newReferral.company}
                  onChange={(e) => setNewReferral({ ...newReferral, company: e.target.value })}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Position"
                  value={newReferral.position}
                  onChange={(e) => setNewReferral({ ...newReferral, position: e.target.value })}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-3 py-1.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700"
                >
                  Add
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {referrals.length === 0 && !showForm ? (
        <div className="text-center py-8 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No referrals yet</p>
          <p className="text-sm">Track contacts and referrals for this job</p>
        </div>
      ) : (
        <div className="space-y-2">
          {referrals.map(referral => (
            <div
              key={referral.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-sky-700">
                    {referral.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{referral.name}</p>
                  <p className="text-sm text-gray-500">
                    {[referral.position, referral.company].filter(Boolean).join(' at ') || referral.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onDeleteReferral(referral.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function JobApplicationFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const {
    selectedApplication,
    error,
    fetchApplication,
    createApplication,
    updateApplication,
    deleteApplication,
    addDocument,
    removeDocument,
    createTask,
    updateTask,
    deleteTask,
    createReferral,
    deleteReferral,
    clearError,
  } = useJobTrackerStore();

  const [activeTab, setActiveTab] = useState('details');
  const [formData, setFormData] = useState<Partial<JobApplication>>({
    company: '',
    jobTitle: '',
    location: '',
    employmentType: 'full_time',
    status: 'wishlist',
    priority: 'medium',
    notes: '',
    jobDescription: '',
    source: '',
    sourceUrl: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      fetchApplication(id);
    }
  }, [id, isNew, fetchApplication]);

  useEffect(() => {
    if (selectedApplication && !isNew) {
      setFormData({
        company: selectedApplication.company,
        jobTitle: selectedApplication.jobTitle,
        location: selectedApplication.location || '',
        employmentType: selectedApplication.employmentType || 'full_time',
        status: selectedApplication.status,
        priority: selectedApplication.priority,
        salaryMin: selectedApplication.salaryMin || undefined,
        salaryMax: selectedApplication.salaryMax || undefined,
        salaryCurrency: selectedApplication.salaryCurrency || 'USD',
        salaryPeriod: selectedApplication.salaryPeriod || 'year',
        appliedDate: selectedApplication.appliedDate,
        rating: selectedApplication.rating || undefined,
        notes: selectedApplication.notes || '',
        jobDescription: selectedApplication.jobDescription || '',
        source: selectedApplication.source || '',
        sourceUrl: selectedApplication.sourceUrl || '',
      });
    }
  }, [selectedApplication, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company || !formData.jobTitle) return;

    setIsSaving(true);
    try {
      if (isNew) {
        const newApp = await createApplication(formData as any);
        navigate(`/plugins/job-tracker/applications/${newApp.id}`);
      } else if (id) {
        await updateApplication(id, formData);
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isNew) return;
    if (!confirm('Are you sure you want to delete this application?')) return;
    
    try {
      await deleteApplication(id);
      navigate('/plugins/job-tracker/applications');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const [showFilePicker, setShowFilePicker] = useState(false);
  const [documentType] = useState('resume'); // Default to resume type

  const handleAddDocument = () => {
    setShowFilePicker(true);
  };

  const handleFileSelected = async (file: { id: string; originalName: string }) => {
    if (!id) return;
    try {
      await addDocument(id, file.id, documentType, file.originalName);
      setShowFilePicker(false);
    } catch (error) {
      console.error('Failed to add document:', error);
    }
  };

  const tabs = [
    { id: 'details', label: 'Details', icon: <Briefcase className="w-4 h-4" /> },
    { 
      id: 'documents', 
      label: 'Documents', 
      icon: <FileText className="w-4 h-4" />,
      count: selectedApplication?.documents?.length || 0,
    },
    { 
      id: 'tasks', 
      label: 'Tasks', 
      icon: <CheckSquare className="w-4 h-4" />,
      count: selectedApplication?.tasks?.length || 0,
    },
    { 
      id: 'referrals', 
      label: 'Referrals', 
      icon: <Users className="w-4 h-4" />,
      count: selectedApplication?.referrals?.length || 0,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <ModernSidebar />
      
      <main className="ml-20 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/plugins/job-tracker/applications"
              className="p-2 hover:bg-white rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNew ? 'New Job Application' : formData.jobTitle || 'Edit Application'}
              </h1>
              {!isNew && formData.company && (
                <p className="text-gray-500">{formData.company}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isNew && (
              <button
                onClick={handleDelete}
                className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={isSaving || !formData.company || !formData.jobTitle}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-medium hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Tabs - always show for existing applications */}
        {!isNew && (
          <div className="mb-6">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          </div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between"
          >
            <span>{error}</span>
            <button onClick={clearError} className="text-red-500 hover:text-red-700">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          {activeTab === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      value={formData.jobTitle || ''}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      placeholder="e.g. Software Engineer"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company *
                    </label>
                    <input
                      type="text"
                      value={formData.company || ''}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g. Google"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.location || ''}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. San Francisco, CA"
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employment Type
                    </label>
                    <select
                      value={formData.employmentType || 'full_time'}
                      onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    >
                      {EMPLOYMENT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Status & Priority */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status & Priority</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status || 'wishlist'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    >
                      {JOB_STATUSES.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority || 'medium'}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    >
                      {JOB_PRIORITIES.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Applied Date
                    </label>
                    <input
                      type="date"
                      value={formData.appliedDate ? new Date(formData.appliedDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        appliedDate: e.target.value ? new Date(e.target.value) : undefined 
                      })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Salary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={formData.salaryCurrency || 'USD'}
                      onChange={(e) => setFormData({ ...formData, salaryCurrency: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="CAD">CAD ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Salary
                    </label>
                    <input
                      type="number"
                      value={formData.salaryMin || ''}
                      onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="e.g. 80000"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Salary
                    </label>
                    <input
                      type="number"
                      value={formData.salaryMax || ''}
                      onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="e.g. 120000"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Period
                    </label>
                    <select
                      value={formData.salaryPeriod || 'year'}
                      onChange={(e) => setFormData({ ...formData, salaryPeriod: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    >
                      <option value="hour">Per Hour</option>
                      <option value="month">Per Month</option>
                      <option value="year">Per Year</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Rating</h3>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="p-1"
                    >
                      <Star
                        className={cn(
                          'w-8 h-8 transition-colors',
                          star <= (formData.rating || 0)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-200 hover:text-yellow-200'
                        )}
                      />
                    </button>
                  ))}
                  {formData.rating && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: undefined })}
                      className="ml-2 text-sm text-gray-400 hover:text-gray-600"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Source */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Source</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Where did you find this job?
                    </label>
                    <input
                      type="text"
                      value={formData.source || ''}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      placeholder="e.g. LinkedIn, Indeed, Referral"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Posting URL
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={formData.sourceUrl || ''}
                        onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h3>
                <textarea
                  value={formData.jobDescription || ''}
                  onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                  placeholder="Paste or enter the job description here..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none font-mono text-sm"
                />
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any personal notes about this application..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                />
              </div>
            </form>
          )}

          {activeTab === 'documents' && selectedApplication && (
            <DocumentsTab
              documents={selectedApplication.documents || []}
              onAddDocument={handleAddDocument}
              onRemoveDocument={(docId) => removeDocument(id!, docId)}
            />
          )}

          {activeTab === 'tasks' && selectedApplication && (
            <TasksTab
              tasks={selectedApplication.tasks || []}
              onCreateTask={(data) => createTask(id!, data)}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
            />
          )}

          {activeTab === 'referrals' && selectedApplication && (
            <ReferralsTab
              referrals={selectedApplication.referrals || []}
              onCreateReferral={(data) => createReferral({ ...data, jobApplicationId: id })}
              onDeleteReferral={deleteReferral}
            />
          )}
        </div>

        {/* File Picker Dialog */}
        <FilePickerDialog
          isOpen={showFilePicker}
          onClose={() => setShowFilePicker(false)}
          onSelect={handleFileSelected}
          title="Select Document from TAAS"
        />
      </main>
    </div>
  );
}
