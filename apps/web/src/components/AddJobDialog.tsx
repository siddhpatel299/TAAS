import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { jobTrackerApi, ScrapedJobData, EMPLOYMENT_TYPES, JOB_STATUSES, JOB_PRIORITIES } from '@/lib/plugins-api';
import { cn } from '@/lib/utils';

interface AddJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ScrapedJobData> & { status?: string; priority?: string }) => Promise<void>;
}

type TabType = 'manual' | 'scraper';

export function AddJobDialog({ isOpen, onClose, onSubmit }: AddJobDialogProps) {
  const [activeTab, setActiveTab] = useState<TabType>('scraper');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapedData, setScrapedData] = useState<ScrapedJobData | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Manual entry form
  const [manualData, setManualData] = useState({
    company: '',
    jobTitle: '',
    location: '',
    employmentType: 'full_time',
    status: 'wishlist',
    priority: 'medium',
    jobUrl: '',
    jobDescription: '',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'USD',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScrape = async () => {
    if (!url.trim()) {
      setError('Please enter a job posting URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setScrapedData(null);

    try {
      const response = await jobTrackerApi.scrapeJob(url);
      if (response.data.success && response.data.data) {
        setScrapedData(response.data.data);
      } else {
        setError('Failed to scrape job details');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to scrape job posting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitScraped = async () => {
    if (!scrapedData) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...scrapedData,
        status: 'wishlist',
        priority: 'medium',
      });
      handleClose();
    } catch (err) {
      console.error('Failed to create application:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitManual = async () => {
    if (!manualData.company.trim() || !manualData.jobTitle.trim()) {
      setError('Company and Job Title are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        company: manualData.company,
        jobTitle: manualData.jobTitle,
        location: manualData.location || undefined,
        employmentType: manualData.employmentType,
        jobUrl: manualData.jobUrl || undefined,
        jobDescription: manualData.jobDescription || undefined,
        salaryMin: manualData.salaryMin ? parseInt(manualData.salaryMin) : undefined,
        salaryMax: manualData.salaryMax ? parseInt(manualData.salaryMax) : undefined,
        salaryCurrency: manualData.salaryCurrency,
        status: manualData.status,
        priority: manualData.priority,
        source: 'Manual',
      });
      handleClose();
    } catch (err) {
      console.error('Failed to create application:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setUrl('');
    setError(null);
    setScrapedData(null);
    setManualData({
      company: '',
      jobTitle: '',
      location: '',
      employmentType: 'full_time',
      status: 'wishlist',
      priority: 'medium',
      jobUrl: '',
      jobDescription: '',
      salaryMin: '',
      salaryMax: '',
      salaryCurrency: 'USD',
    });
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
            <h2 className="text-xl font-semibold text-gray-900">Add New Job Application</h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-2 mx-6 mt-4 bg-gray-100 rounded-xl">
            <button
              onClick={() => setActiveTab('manual')}
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
              onClick={() => setActiveTab('scraper')}
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'scraper' ? (
              <div className="space-y-6">
                {/* Scraper Header */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Enhanced Job Scraper</h3>
                    <p className="text-sm text-gray-500">
                      Scrape jobs from LinkedIn, Indeed, Glassdoor, Dice, and more with advanced filtering
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
                  />
                </div>

                {/* Filters Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <span className="text-sm font-medium">Show Filters</span>
                </button>

                {/* Filters (placeholder) */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-gray-50 rounded-xl text-sm text-gray-500"
                    >
                      Filters coming soon: filter by experience level, job type, salary range, etc.
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Scrape Button */}
                <button
                  onClick={handleScrape}
                  disabled={isLoading || !url.trim()}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-xl font-medium hover:from-purple-500 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Failed to scrape</p>
                      <p className="text-sm">{error}</p>
                    </div>
                  </motion.div>
                )}

                {/* Scraped Results */}
                {scrapedData && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Job details scraped successfully!</span>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                          <span className="text-xl font-bold text-purple-600">
                            {scrapedData.company?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-lg">{scrapedData.jobTitle}</h4>
                          <p className="text-gray-600">{scrapedData.company}</p>
                          {scrapedData.location && (
                            <p className="text-sm text-gray-500 mt-1">{scrapedData.location}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        {scrapedData.employmentType && (
                          <div>
                            <span className="text-gray-500">Type:</span>{' '}
                            <span className="text-gray-900">
                              {EMPLOYMENT_TYPES.find(t => t.value === scrapedData.employmentType)?.label || scrapedData.employmentType}
                            </span>
                          </div>
                        )}
                        {scrapedData.salaryMin && (
                          <div>
                            <span className="text-gray-500">Salary:</span>{' '}
                            <span className="text-gray-900">
                              {scrapedData.salaryCurrency || '$'}{scrapedData.salaryMin?.toLocaleString()}
                              {scrapedData.salaryMax && ` - ${scrapedData.salaryMax.toLocaleString()}`}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Source:</span>{' '}
                          <span className="text-gray-900">{scrapedData.source}</span>
                        </div>
                      </div>

                      {scrapedData.jobDescription && (
                        <div className="mt-4 pt-4 border-t border-purple-100">
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {scrapedData.jobDescription.slice(0, 300)}
                            {scrapedData.jobDescription.length > 300 && '...'}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSubmitScraped}
                      disabled={isSubmitting}
                      className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Add to Job Tracker
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              /* Manual Entry Form */
              <div className="space-y-6">
                {/* Company & Title */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company *
                    </label>
                    <input
                      type="text"
                      value={manualData.company}
                      onChange={(e) => setManualData({ ...manualData, company: e.target.value })}
                      placeholder="e.g. Google"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      value={manualData.jobTitle}
                      onChange={(e) => setManualData({ ...manualData, jobTitle: e.target.value })}
                      placeholder="e.g. Software Engineer"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Location & Employment Type */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={manualData.location}
                      onChange={(e) => setManualData({ ...manualData, location: e.target.value })}
                      placeholder="e.g. San Francisco, CA"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Employment Type
                    </label>
                    <select
                      value={manualData.employmentType}
                      onChange={(e) => setManualData({ ...manualData, employmentType: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {EMPLOYMENT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={manualData.status}
                      onChange={(e) => setManualData({ ...manualData, status: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {JOB_STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={manualData.priority}
                      onChange={(e) => setManualData({ ...manualData, priority: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {JOB_PRIORITIES.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Salary */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={manualData.salaryCurrency}
                      onChange={(e) => setManualData({ ...manualData, salaryCurrency: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      value={manualData.salaryMin}
                      onChange={(e) => setManualData({ ...manualData, salaryMin: e.target.value })}
                      placeholder="80000"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Salary
                    </label>
                    <input
                      type="number"
                      value={manualData.salaryMax}
                      onChange={(e) => setManualData({ ...manualData, salaryMax: e.target.value })}
                      placeholder="120000"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Job URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Posting URL
                  </label>
                  <input
                    type="url"
                    value={manualData.jobUrl}
                    onChange={(e) => setManualData({ ...manualData, jobUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description
                  </label>
                  <textarea
                    value={manualData.jobDescription}
                    onChange={(e) => setManualData({ ...manualData, jobDescription: e.target.value })}
                    placeholder="Paste the job description here..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmitManual}
                  disabled={isSubmitting || !manualData.company.trim() || !manualData.jobTitle.trim()}
                  className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Add Application
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
