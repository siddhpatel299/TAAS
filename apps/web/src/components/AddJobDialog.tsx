import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Loader2, CheckCircle, AlertCircle, Edit3, ArrowLeft } from 'lucide-react';
import { jobTrackerApi, EMPLOYMENT_TYPES, JOB_STATUSES, JOB_PRIORITIES } from '@/lib/plugins-api';
import { cn } from '@/lib/utils';
import { useJobTrackerStore } from '@/stores/job-tracker.store';

interface AddJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type TabType = 'manual' | 'scraper';
type ScraperStep = 'input' | 'edit';

interface EditableJobData {
  company: string;
  companyLogo: string;
  jobTitle: string;
  location: string;
  employmentType: string;
  status: string;
  priority: string;
  jobUrl: string;
  jobDescription: string;
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  source: string;
}

export function AddJobDialog({ isOpen, onClose, onSuccess }: AddJobDialogProps) {
  const { createApplication } = useJobTrackerStore();
  const [activeTab, setActiveTab] = useState<TabType>('scraper');
  const [scraperStep, setScraperStep] = useState<ScraperStep>('input');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editable form data (used for both manual and scraped jobs)
  const [formData, setFormData] = useState<EditableJobData>({
    company: '',
    companyLogo: '',
    jobTitle: '',
    location: '',
    employmentType: 'full_time',
    status: 'applied',
    priority: 'medium',
    jobUrl: '',
    jobDescription: '',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'USD',
    source: '',
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setUrl('');
    setError(null);
    setScraperStep('input');
    setFormData({
      company: '',
      companyLogo: '',
      jobTitle: '',
      location: '',
      employmentType: 'full_time',
      status: 'applied',
      priority: 'medium',
      jobUrl: '',
      jobDescription: '',
      salaryMin: '',
      salaryMax: '',
      salaryCurrency: 'USD',
      source: '',
    });
  };

  const handleScrape = async () => {
    if (!url.trim()) {
      setError('Please enter a job posting URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await jobTrackerApi.scrapeJob(url);
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        // Populate form with scraped data
        setFormData({
          company: data.company || '',
          companyLogo: data.companyLogo || '',
          jobTitle: data.jobTitle || '',
          location: data.location || '',
          employmentType: data.employmentType || 'full_time',
          status: 'applied', // Default to applied
          priority: 'medium',
          jobUrl: data.jobUrl || url,
          jobDescription: data.jobDescription || '',
          salaryMin: data.salaryMin?.toString() || '',
          salaryMax: data.salaryMax?.toString() || '',
          salaryCurrency: data.salaryCurrency || 'USD',
          source: data.source || 'LinkedIn',
        });
        setScraperStep('edit');
      } else {
        setError('Failed to scrape job details');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to scrape job posting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.company.trim() || !formData.jobTitle.trim()) {
      setError('Company and Job Title are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createApplication({
        company: formData.company,
        companyLogo: formData.companyLogo || undefined,
        jobTitle: formData.jobTitle,
        location: formData.location || undefined,
        employmentType: formData.employmentType,
        jobUrl: formData.jobUrl || undefined,
        jobDescription: formData.jobDescription || undefined,
        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
        salaryCurrency: formData.salaryCurrency,
        status: formData.status,
        priority: formData.priority,
        source: formData.source || (activeTab === 'scraper' ? 'LinkedIn' : 'Manual'),
        sourceUrl: formData.jobUrl || undefined,
        appliedDate: new Date(), // Auto-fill apply date
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save job application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {scraperStep === 'edit' && activeTab === 'scraper' && (
                <button
                  onClick={() => setScraperStep('input')}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className="text-xl font-semibold text-gray-900">
                {scraperStep === 'edit' && activeTab === 'scraper'
                  ? 'Review & Edit Job Details'
                  : 'Add New Job Application'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Switcher - only show on input step */}
          {(scraperStep === 'input' || activeTab === 'manual') && (
            <div className="flex p-2 mx-6 mt-4 bg-gray-100 rounded-xl">
              <button
                onClick={() => { setActiveTab('manual'); resetForm(); }}
                className={cn(
                  'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all',
                  activeTab === 'manual'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                Manual Entry
              </button>
              <button
                onClick={() => { setActiveTab('scraper'); resetForm(); }}
                className={cn(
                  'flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all',
                  activeTab === 'scraper'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                URL Scraper
              </button>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="ml-auto">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* URL Scraper - Input Step */}
            {activeTab === 'scraper' && scraperStep === 'input' && (
              <div className="space-y-6">
                {/* Scraper Header */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Enhanced Job Scraper</h3>
                    <p className="text-sm text-gray-500">
                      Paste a LinkedIn, Indeed, or Glassdoor job URL to auto-fill details
                    </p>
                  </div>
                </div>

                {/* URL Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Posting URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/jobs/view/..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
                  />
                </div>

                {/* Scrape Button */}
                <button
                  onClick={handleScrape}
                  disabled={isLoading || !url.trim()}
                  className="w-full py-3 px-4 bg-gradient-to-r from-sky-400 to-sky-500 text-white rounded-xl font-medium hover:from-sky-500 hover:to-sky-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <Globe className="w-5 h-5" />
                      Scrape Job Details
                    </>
                  )}
                </button>

                <div className="text-center text-sm text-gray-400">
                  or <button onClick={() => setActiveTab('manual')} className="text-sky-600 hover:underline">enter details manually</button>
                </div>
              </div>
            )}

            {/* Edit Form - shown for both manual entry and after scraping */}
            {(activeTab === 'manual' || (activeTab === 'scraper' && scraperStep === 'edit')) && (
              <div className="space-y-6">
                {/* Success indicator for scraped jobs */}
                {activeTab === 'scraper' && scraperStep === 'edit' && (
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Job details scraped! Review and edit below.</span>
                  </div>
                )}

                {/* Basic Info */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">Job Title *</label>
                      <input
                        type="text"
                        value={formData.jobTitle}
                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                        placeholder="e.g. Software Engineer"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">Company *</label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="e.g. Google"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. New York, NY"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">Employment Type</label>
                      <select
                        value={formData.employmentType}
                        onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
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
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Status & Priority</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                      >
                        {JOB_STATUSES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                      >
                        {JOB_PRIORITIES.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Salary */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Salary (Optional)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">Currency</label>
                      <select
                        value={formData.salaryCurrency}
                        onChange={(e) => setFormData({ ...formData, salaryCurrency: e.target.value })}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="CAD">CAD ($)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">Min</label>
                      <input
                        type="number"
                        value={formData.salaryMin}
                        onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                        placeholder="80000"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">Max</label>
                      <input
                        type="number"
                        value={formData.salaryMax}
                        onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                        placeholder="120000"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Source & URL */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Source</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">Source</label>
                      <input
                        type="text"
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        placeholder="e.g. LinkedIn, Indeed"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">Job URL</label>
                      <input
                        type="url"
                        value={formData.jobUrl}
                        onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Job Description */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Job Description</h3>
                  <textarea
                    value={formData.jobDescription}
                    onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                    placeholder="Paste the job description here..."
                    rows={4}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.company.trim() || !formData.jobTitle.trim()}
                  className="w-full py-3 px-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl font-medium hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Save Job Application
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
