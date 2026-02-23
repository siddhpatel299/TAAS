import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Send,
  Sparkles,
  FileText,
  Loader2,
  AlertCircle,
  Check,
  Upload,
  Trash2,
  ChevronDown,
  User,
  Paperclip,
  Wand2,
  FileEdit,
  Plus,
  Briefcase,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  jobTrackerApi,
  ContactForEmail,
  EmailTemplate,
  JobApplication,
} from '@/lib/plugins-api';

interface Attachment {
  filename: string;
  content: string;
  mimeType: string;
  size: number;
}

interface ManualRecipient {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  company: string;
}

export function EmailStudioPage() {
  // Recipients
  const [recipients, setRecipients] = useState<ManualRecipient[]>([]);
  const [recipientForm, setRecipientForm] = useState({ name: '', email: '', position: '' });

  // Job application context (optional)
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [loadingApps, setLoadingApps] = useState(true);

  // Email content
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [senderName, setSenderName] = useState('');

  // Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // AI
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTone, setAiTone] = useState<'professional' | 'friendly' | 'casual'>('professional');
  const [aiPurpose, setAiPurpose] = useState<'referral' | 'introduction' | 'follow-up' | 'cold-outreach'>('cold-outreach');
  const [showAiOptions, setShowAiOptions] = useState(false);

  // Refinement
  const [isRefining, setIsRefining] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [showRefineInput, setShowRefineInput] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sending
  const [isSending, setIsSending] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSentTo, setTestSentTo] = useState<string | null>(null);
  const [sendResults, setSendResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    mode: 'sent' | 'draft';
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Settings
  const [settingsStatus, setSettingsStatus] = useState<{
    gmailConnected: boolean;
    gmailEmail: string | null;
    hasOpenaiApiKey: boolean;
    hasResume: boolean;
  }>({ gmailConnected: false, gmailEmail: null, hasOpenaiApiKey: false, hasResume: false });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedAppId) {
      const app = applications.find(a => a.id === selectedAppId);
      setSelectedApp(app || null);
    } else {
      setSelectedApp(null);
    }
  }, [selectedAppId, applications]);

  const loadInitialData = async () => {
    try {
      const [templatesRes, settingsRes, appsRes] = await Promise.all([
        jobTrackerApi.getEmailTemplates(),
        jobTrackerApi.getFullSettings(),
        jobTrackerApi.getApplications({ limit: 200, sortBy: 'createdAt', sortOrder: 'desc' }),
      ]);
      setTemplates(templatesRes.data.data);
      const s = settingsRes.data.data;
      setSettingsStatus({
        gmailConnected: s.gmailConnected,
        gmailEmail: s.gmailEmail,
        hasOpenaiApiKey: s.hasOpenaiApiKey,
        hasResume: s.hasResume,
      });
      setApplications(appsRes.data.data);
    } catch {
      // silent
    } finally {
      setLoadingApps(false);
    }
  };

  // -- Recipients --
  const addRecipient = () => {
    const { name, email, position } = recipientForm;
    if (!email.trim()) { setError('Email address is required'); return; }

    const parts = name.trim().split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    setRecipients(prev => [...prev, {
      name: name.trim() || email,
      firstName,
      lastName,
      email: email.trim(),
      position: position.trim(),
      company: selectedApp?.company || '',
    }]);
    setRecipientForm({ name: '', email: '', position: '' });
    setError(null);
  };

  const removeRecipient = (idx: number) => setRecipients(prev => prev.filter((_, i) => i !== idx));

  // -- Templates --
  const applyTemplate = (template: EmailTemplate) => {
    let newSubject = template.subject;
    let newBody = template.body;
    const vars: Record<string, string> = {
      company: selectedApp?.company || '{company}',
      jobTitle: selectedApp?.jobTitle || '{jobTitle}',
      senderName: senderName || '{senderName}',
    };
    for (const [key, value] of Object.entries(vars)) {
      const regex = new RegExp(`\\{${key}\\}`, 'gi');
      newSubject = newSubject.replace(regex, value);
      newBody = newBody.replace(regex, value);
    }
    setSubject(newSubject);
    setBody(newBody);
    setSelectedTemplate(template.id);
    setShowTemplates(false);
  };

  // -- AI --
  const generateWithAi = async () => {
    if (!settingsStatus.hasOpenaiApiKey) { setError('OpenAI API key not configured. Add it in Job Tracker settings.'); return; }
    if (!settingsStatus.hasResume) { setError('Resume text not configured. Add it in Job Tracker settings.'); return; }

    const first = recipients[0];
    if (!first && !selectedApp) { setError('Add a recipient or select a job application first.'); return; }

    setIsGenerating(true);
    setError(null);
    try {
      const res = await jobTrackerApi.generateEmail({
        recipientName: first?.name || 'Hiring Manager',
        recipientPosition: first?.position || 'Recruiter',
        company: selectedApp?.company || first?.company || 'the company',
        jobTitle: selectedApp?.jobTitle || 'the position',
        jobDescription: selectedApp?.jobDescription || undefined,
        tone: aiTone,
        purpose: aiPurpose,
      });
      setSubject(res.data.data.subject);
      setBody(res.data.data.body);
      setShowRefineInput(false);
      setRefineInstruction('');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to generate');
    } finally {
      setIsGenerating(false);
    }
  };

  const refineWithAi = async () => {
    if (!refineInstruction.trim()) { setError('Please enter refinement instructions.'); return; }
    if (!subject.trim() || !body.trim()) { setError('Generate or write an email first.'); return; }

    setIsRefining(true);
    setError(null);
    try {
      const first = recipients[0];
      const res = await jobTrackerApi.refineEmail({
        currentSubject: subject,
        currentBody: body,
        instruction: refineInstruction,
        recipientName: first?.name,
        recipientPosition: first?.position,
        company: selectedApp?.company || first?.company,
        jobTitle: selectedApp?.jobTitle,
      });
      setSubject(res.data.data.subject);
      setBody(res.data.data.body);
      setRefineInstruction('');
      setShowRefineInput(false);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to refine');
    } finally {
      setIsRefining(false);
    }
  };

  // -- Attachments --
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) { setError(`File ${file.name} exceeds 10 MB limit.`); continue; }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setAttachments(prev => [...prev, { filename: file.name, content: base64, mimeType: file.type || 'application/octet-stream', size: file.size }]);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // -- Send / Draft --
  const contactsForApi = (): ContactForEmail[] =>
    recipients.map(r => ({ ...r, company: r.company || selectedApp?.company || '' }));

  const busy = isSending || isDrafting || isSendingTest;

  const sendTestEmail = async () => {
    if (!settingsStatus.gmailConnected) { setError('Gmail not connected.'); return; }
    if (!subject.trim() || !body.trim()) { setError('Subject and body are required.'); return; }
    setIsSendingTest(true); setError(null); setTestSentTo(null);
    try {
      const res = await jobTrackerApi.sendTestEmail({
        subject, body, senderName: senderName || 'Job Seeker',
        testContact: recipients[0] || undefined,
      });
      setTestSentTo(res.data.data.sentTo);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to send test');
    } finally { setIsSendingTest(false); }
  };

  const sendEmails = async () => {
    if (!settingsStatus.gmailConnected) { setError('Gmail not connected.'); return; }
    if (recipients.length === 0) { setError('Add at least one recipient.'); return; }
    if (!subject.trim() || !body.trim()) { setError('Subject and body are required.'); return; }
    setIsSending(true); setError(null); setSendResults(null);
    try {
      const res = await jobTrackerApi.sendEmails({
        contacts: contactsForApi(), subject, body,
        senderName: senderName || 'Job Seeker', attachments,
        jobApplicationId: selectedAppId || undefined,
      });
      setSendResults({ ...res.data.data.summary, mode: 'sent' });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to send');
    } finally { setIsSending(false); }
  };

  const draftEmails = async () => {
    if (!settingsStatus.gmailConnected) { setError('Gmail not connected.'); return; }
    if (recipients.length === 0) { setError('Add at least one recipient.'); return; }
    if (!subject.trim() || !body.trim()) { setError('Subject and body are required.'); return; }
    setIsDrafting(true); setError(null); setSendResults(null);
    try {
      const res = await jobTrackerApi.draftEmails({
        contacts: contactsForApi(), subject, body,
        senderName: senderName || 'Job Seeker', attachments,
        jobApplicationId: selectedAppId || undefined,
      });
      setSendResults({ ...res.data.data.summary, mode: 'draft' });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create drafts');
    } finally { setIsDrafting(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50/30">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Studio</h1>
            <p className="text-sm text-gray-500">Compose, generate, and send or draft personalized emails</p>
          </div>
        </div>

        {/* Gmail Status */}
        {!settingsStatus.gmailConnected && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Gmail not connected. Connect your Gmail in Job Tracker settings to send or draft emails.
          </div>
        )}

        {/* Status banners */}
        {testSentTo && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-blue-700">
            <Check className="w-5 h-5" />
            <span className="font-medium">Test email sent to {testSentTo}!</span>
          </div>
        )}
        {sendResults && sendResults.failed === 0 && (
          <div className={cn('mb-6 p-4 border rounded-xl flex items-center gap-2', sendResults.mode === 'draft' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700')}>
            <Check className="w-5 h-5" />
            <span className="font-medium">
              {sendResults.mode === 'draft'
                ? `${sendResults.successful} draft${sendResults.successful !== 1 ? 's' : ''} created! Open Gmail to review and send.`
                : `All ${sendResults.successful} emails sent successfully!`}
            </span>
          </div>
        )}
        {sendResults && sendResults.failed > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-700">
            <AlertCircle className="w-5 h-5" />
            {sendResults.successful} {sendResults.mode === 'draft' ? 'drafted' : 'sent'}, {sendResults.failed} failed of {sendResults.total}.
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column -- context */}
          <div className="space-y-6">
            {/* Job Application Selector */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-700">Job Application (optional)</h3>
              </div>
              <select
                value={selectedAppId}
                onChange={e => setSelectedAppId(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">None -- standalone email</option>
                {loadingApps && <option disabled>Loading...</option>}
                {applications.map(app => (
                  <option key={app.id} value={app.id}>
                    {app.company} -- {app.jobTitle}
                  </option>
                ))}
              </select>
              {selectedApp && (
                <div className="mt-3 p-3 bg-emerald-50 rounded-xl text-xs text-emerald-700 space-y-1">
                  <p><span className="font-medium">Company:</span> {selectedApp.company}</p>
                  <p><span className="font-medium">Role:</span> {selectedApp.jobTitle}</p>
                  {selectedApp.location && <p><span className="font-medium">Location:</span> {selectedApp.location}</p>}
                </div>
              )}
            </div>

            {/* Recipients */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-700">Recipients ({recipients.length})</h3>
              </div>

              {recipients.length > 0 && (
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  {recipients.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">{r.name}</p>
                        <p className="text-xs text-gray-500 truncate">{r.email}{r.position ? ` · ${r.position}` : ''}</p>
                      </div>
                      <button onClick={() => removeRecipient(idx)} className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <input
                  placeholder="Full name"
                  value={recipientForm.name}
                  onChange={e => setRecipientForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <input
                  placeholder="Email address *"
                  type="email"
                  value={recipientForm.email}
                  onChange={e => setRecipientForm(prev => ({ ...prev, email: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addRecipient()}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <input
                  placeholder="Position / Title"
                  value={recipientForm.position}
                  onChange={e => setRecipientForm(prev => ({ ...prev, position: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addRecipient()}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  onClick={addRecipient}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Recipient
                </button>
              </div>
            </div>

            {/* Sender Name */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name (signature)</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right column -- compose */}
          <div className="lg:col-span-2 space-y-6">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Templates */}
              <div className="relative">
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                >
                  <FileText className="w-4 h-4 text-gray-500" />
                  Templates
                  <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', showTemplates && 'rotate-180')} />
                </button>
                {showTemplates && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-2">
                    {templates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => applyTemplate(t)}
                        className={cn('w-full px-4 py-2 text-left text-sm hover:bg-gray-50', selectedTemplate === t.id && 'bg-sky-50 text-sky-700')}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Generate */}
              <div className="relative">
                <button
                  onClick={() => setShowAiOptions(!showAiOptions)}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm hover:from-violet-600 hover:to-purple-700 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  Generate with AI
                  <ChevronDown className={cn('w-4 h-4 transition-transform', showAiOptions && 'rotate-180')} />
                </button>
                {showAiOptions && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-10 p-4">
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 mb-2">Tone</label>
                      <div className="flex gap-2">
                        {(['professional', 'friendly', 'casual'] as const).map(t => (
                          <button key={t} onClick={() => setAiTone(t)} className={cn('px-3 py-1.5 rounded-lg text-sm capitalize transition-colors', aiTone === t ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 mb-2">Purpose</label>
                      <select value={aiPurpose} onChange={e => setAiPurpose(e.target.value as any)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                        <option value="cold-outreach">Cold Outreach</option>
                        <option value="referral">Referral Request</option>
                        <option value="introduction">Introduction</option>
                        <option value="follow-up">Follow Up</option>
                      </select>
                    </div>
                    <button
                      onClick={() => { setShowAiOptions(false); generateWithAi(); }}
                      disabled={isGenerating || !settingsStatus.hasOpenaiApiKey || !settingsStatus.hasResume}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate Email
                    </button>
                    {(!settingsStatus.hasOpenaiApiKey || !settingsStatus.hasResume) && (
                      <p className="mt-2 text-xs text-amber-600">
                        {!settingsStatus.hasOpenaiApiKey && 'OpenAI API key required. '}
                        {!settingsStatus.hasResume && 'Resume text required.'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Refine */}
            {(subject.trim() || body.trim()) && (
              <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-violet-600" />
                    <span className="text-sm font-medium text-violet-800">Refine with AI</span>
                  </div>
                  {!showRefineInput && (
                    <button onClick={() => setShowRefineInput(true)} className="text-sm text-violet-600 hover:text-violet-700 font-medium">+ Add Instructions</button>
                  )}
                </div>
                {showRefineInput && (
                  <div className="space-y-3">
                    <textarea
                      value={refineInstruction}
                      onChange={e => setRefineInstruction(e.target.value)}
                      placeholder='e.g. "Make it shorter", "Emphasize my leadership skills"'
                      rows={2}
                      className="w-full px-4 py-3 bg-white border border-violet-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <button onClick={() => { setShowRefineInput(false); setRefineInstruction(''); }} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                      <button
                        onClick={refineWithAi}
                        disabled={isRefining || !refineInstruction.trim()}
                        className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all', isRefining || !refineInstruction.trim() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-violet-600 text-white hover:bg-violet-700')}
                      >
                        {isRefining ? <><Loader2 className="w-4 h-4 animate-spin" />Refining...</> : <><Sparkles className="w-4 h-4" />Apply Changes</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Subject + Body */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text" value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="Email subject..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={body} onChange={e => setBody(e.target.value)}
                  placeholder="Write your email message..."
                  rows={14}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Placeholders: {'{firstName}'}, {'{lastName}'}, {'{company}'}, {'{position}'}, {'{senderName}'}
                </p>
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
              <div className="space-y-2">
                {attachments.map((a, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Paperclip className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{a.filename}</span>
                      <span className="text-xs text-gray-400">{formatFileSize(a.size)}</span>
                    </div>
                    <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 w-full justify-center"
                >
                  <Upload className="w-4 h-4" />
                  Add Attachment
                </button>
                <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" />
              </div>
            </div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"
            >
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <span className={cn('w-2 h-2 rounded-full', settingsStatus.gmailConnected ? 'bg-green-500' : 'bg-gray-300')} />
                  Gmail {settingsStatus.gmailConnected ? `(${settingsStatus.gmailEmail})` : 'Not connected'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={sendTestEmail}
                  disabled={busy || !settingsStatus.gmailConnected || !subject.trim() || !body.trim()}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all border',
                    busy || !settingsStatus.gmailConnected || !subject.trim() || !body.trim()
                      ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
                  )}
                >
                  {isSendingTest ? <><Loader2 className="w-4 h-4 animate-spin" />Sending Test...</> : <><Mail className="w-4 h-4" />Test</>}
                </button>
                <button
                  onClick={draftEmails}
                  disabled={busy || !settingsStatus.gmailConnected || recipients.length === 0 || !subject.trim() || !body.trim()}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all border',
                    busy || !settingsStatus.gmailConnected || recipients.length === 0 || !subject.trim() || !body.trim()
                      ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-amber-600 border-amber-300 hover:bg-amber-50'
                  )}
                >
                  {isDrafting ? <><Loader2 className="w-4 h-4 animate-spin" />Drafting...</> : <><FileEdit className="w-4 h-4" />Save as Draft{recipients.length > 1 ? 's' : ''}</>}
                </button>
                <button
                  onClick={sendEmails}
                  disabled={busy || !settingsStatus.gmailConnected || recipients.length === 0 || !subject.trim() || !body.trim()}
                  className={cn(
                    'flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all',
                    busy || !settingsStatus.gmailConnected || recipients.length === 0 || !subject.trim() || !body.trim()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25'
                  )}
                >
                  {isSending ? <><Loader2 className="w-4 h-4 animate-spin" />Sending...</> : <><Send className="w-4 h-4" />Send Now</>}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
