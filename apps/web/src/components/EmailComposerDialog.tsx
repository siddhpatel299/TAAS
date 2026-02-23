import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
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
  Mail,
  Paperclip,
  Wand2,
  FileEdit,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { jobTrackerApi, ContactForEmail, EmailTemplate } from '@/lib/plugins-api';

interface EmailComposerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: ContactForEmail[];
  company: string;
  jobTitle: string;
  jobDescription?: string;
  jobApplicationId?: string;
}

interface Attachment {
  filename: string;
  content: string; // Base64
  mimeType: string;
  size: number;
}

export function EmailComposerDialog({
  isOpen,
  onClose,
  contacts,
  company,
  jobTitle,
  jobDescription,
  jobApplicationId,
}: EmailComposerDialogProps) {
  // Email content
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [senderName, setSenderName] = useState('');
  
  // Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  
  // AI Generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTone, setAiTone] = useState<'professional' | 'friendly' | 'casual'>('professional');
  const [aiPurpose, setAiPurpose] = useState<'referral' | 'introduction' | 'follow-up' | 'cold-outreach'>('cold-outreach');
  const [showAiOptions, setShowAiOptions] = useState(false);
  
  // AI Refinement
  const [isRefining, setIsRefining] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [showRefineInput, setShowRefineInput] = useState(false);
  const [hasGeneratedEmail, setHasGeneratedEmail] = useState(false);
  
  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Sending state
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
  
  // Settings status
  const [settingsStatus, setSettingsStatus] = useState<{
    gmailConnected: boolean;
    gmailEmail: string | null;
    hasOpenaiApiKey: boolean;
    hasResume: boolean;
  }>({
    gmailConnected: false,
    gmailEmail: null,
    hasOpenaiApiKey: false,
    hasResume: false,
  });

  // Load templates and settings on mount
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      loadSettings();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      const response = await jobTrackerApi.getEmailTemplates();
      setTemplates(response.data.data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await jobTrackerApi.getFullSettings();
      const data = response.data.data;
      setSettingsStatus({
        gmailConnected: data.gmailConnected,
        gmailEmail: data.gmailEmail,
        hasOpenaiApiKey: data.hasOpenaiApiKey,
        hasResume: data.hasResume,
      });
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const applyTemplate = (template: EmailTemplate) => {
    // Keep placeholders - only replace company/jobTitle/senderName which are same for all
    // {firstName}, {lastName}, {name}, {position} will be replaced per-contact by backend
    let newSubject = template.subject;
    let newBody = template.body;

    const staticVariables: Record<string, string> = {
      company,
      jobTitle,
      senderName: senderName || '[Your Name]',
    };

    for (const [key, value] of Object.entries(staticVariables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'gi');
      newSubject = newSubject.replace(regex, value);
      newBody = newBody.replace(regex, value);
    }

    setSubject(newSubject);
    setBody(newBody);
    setSelectedTemplate(template.id);
    setShowTemplates(false);
  };

  const generateWithAi = async () => {
    if (!settingsStatus.hasOpenaiApiKey) {
      setError('OpenAI API key not configured. Please add it in Job Tracker settings.');
      return;
    }

    if (!settingsStatus.hasResume) {
      setError('Resume text not configured. Please add it in Job Tracker settings for personalized emails.');
      return;
    }

    const firstContact = contacts[0];
    if (!firstContact) {
      setError('No contacts selected');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await jobTrackerApi.generateEmail({
        recipientName: firstContact.name,
        recipientPosition: firstContact.position,
        company,
        jobTitle,
        jobDescription, // Include job description for context
        tone: aiTone,
        purpose: aiPurpose,
      });

      const data = response.data.data;
      setSubject(data.subject);
      setBody(data.body);
      setSelectedTemplate(null);
      setHasGeneratedEmail(true);
      setShowRefineInput(false);
      setRefineInstruction('');
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Failed to generate email';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const refineWithAi = async () => {
    if (!settingsStatus.hasOpenaiApiKey) {
      setError('OpenAI API key not configured. Please add it in Job Tracker settings.');
      return;
    }

    if (!refineInstruction.trim()) {
      setError('Please enter instructions for how to modify the email.');
      return;
    }

    if (!subject.trim() || !body.trim()) {
      setError('Generate an email first before refining it.');
      return;
    }

    const firstContact = contacts[0];
    
    setIsRefining(true);
    setError(null);

    try {
      const response = await jobTrackerApi.refineEmail({
        currentSubject: subject,
        currentBody: body,
        instruction: refineInstruction,
        recipientName: firstContact?.name,
        recipientPosition: firstContact?.position,
        company,
        jobTitle,
      });

      const data = response.data.data;
      setSubject(data.subject);
      setBody(data.body);
      setRefineInstruction('');
      setShowRefineInput(false);
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Failed to refine email';
      setError(message);
    } finally {
      setIsRefining(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      // Max 10MB per file
      if (file.size > 10 * 1024 * 1024) {
        setError(`File ${file.name} is too large. Max size is 10MB.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setAttachments(prev => [...prev, {
          filename: file.name,
          content: base64,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
        }]);
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const sendTestEmail = async () => {
    if (!settingsStatus.gmailConnected) {
      setError('Gmail not connected. Please connect your Gmail account in Job Tracker settings.');
      return;
    }

    if (!subject.trim() || !body.trim()) {
      setError('Subject and body are required');
      return;
    }

    setIsSendingTest(true);
    setError(null);
    setTestSentTo(null);

    try {
      const response = await jobTrackerApi.sendTestEmail({
        subject,
        body,
        senderName: senderName || 'Job Seeker',
        testContact: contacts[0], // Use first contact for preview
      });

      const data = response.data.data;
      setTestSentTo(data.sentTo);
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Failed to send test email';
      setError(message);
    } finally {
      setIsSendingTest(false);
    }
  };

  const sendEmails = async () => {
    if (!settingsStatus.gmailConnected) {
      setError('Gmail not connected. Please connect your Gmail account in Job Tracker settings.');
      return;
    }

    if (!subject.trim() || !body.trim()) {
      setError('Subject and body are required');
      return;
    }

    setIsSending(true);
    setError(null);
    setSendResults(null);

    try {
      const response = await jobTrackerApi.sendEmails({
        contacts,
        subject,
        body,
        senderName: senderName || 'Job Seeker',
        attachments,
        jobApplicationId,
      });

      const data = response.data.data;
      setSendResults({ ...data.summary, mode: 'sent' });

      if (data.summary.failed === 0) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Failed to send emails';
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  const draftEmails = async () => {
    if (!settingsStatus.gmailConnected) {
      setError('Gmail not connected. Please connect your Gmail account in Job Tracker settings.');
      return;
    }

    if (!subject.trim() || !body.trim()) {
      setError('Subject and body are required');
      return;
    }

    setIsDrafting(true);
    setError(null);
    setSendResults(null);

    try {
      const response = await jobTrackerApi.draftEmails({
        contacts,
        subject,
        body,
        senderName: senderName || 'Job Seeker',
        attachments,
        jobApplicationId,
      });

      const data = response.data.data;
      setSendResults({ ...data.summary, mode: 'draft' });

      if (data.summary.failed === 0) {
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Failed to create drafts';
      setError(message);
    } finally {
      setIsDrafting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Compose Email</h2>
                <p className="text-sm text-gray-500">
                  Sending to {contacts.length} contact{contacts.length !== 1 ? 's' : ''} at {company}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/80 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Gmail Status Warning */}
          {!settingsStatus.gmailConnected && (
            <div className="px-6 py-3 bg-amber-50 border-b border-amber-200">
              <div className="flex items-center gap-2 text-amber-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Gmail not connected. Please connect your Gmail account in Job Tracker settings to send emails.</span>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Test Email Success Message */}
            {testSentTo && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 text-blue-700">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Test email sent to {testSentTo}! Check your inbox (and spam folder).</span>
                </div>
              </div>
            )}

            {/* Success Message */}
            {sendResults && sendResults.failed === 0 && (
              <div className={cn(
                'mb-6 p-4 border rounded-xl',
                sendResults.mode === 'draft'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-emerald-50 border-emerald-200'
              )}>
                <div className={cn(
                  'flex items-center gap-2',
                  sendResults.mode === 'draft' ? 'text-blue-700' : 'text-emerald-700'
                )}>
                  <Check className="w-5 h-5" />
                  <span className="font-medium">
                    {sendResults.mode === 'draft'
                      ? `${sendResults.successful} draft${sendResults.successful !== 1 ? 's' : ''} created! Open Gmail to review and send.`
                      : `All ${sendResults.successful} emails sent successfully!`
                    }
                  </span>
                </div>
              </div>
            )}

            {/* Partial Success Message */}
            {sendResults && sendResults.failed > 0 && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="w-5 h-5" />
                  <span>
                    {sendResults.successful} {sendResults.mode === 'draft' ? 'drafted' : 'sent'}, {sendResults.failed} failed out of {sendResults.total} emails.
                  </span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Recipients Preview */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipients ({contacts.length})
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 max-h-24 overflow-y-auto">
                {contacts.map((contact, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-lg text-sm"
                  >
                    <User className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-700">{contact.name}</span>
                    <span className="text-gray-400">({contact.email})</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Template & AI Section */}
            <div className="flex items-center gap-3 mb-6">
              {/* Template Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                >
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span>Templates</span>
                  <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', showTemplates && 'rotate-180')} />
                </button>
                
                {showTemplates && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-2">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => applyTemplate(template)}
                        className={cn(
                          'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors',
                          selectedTemplate === template.id && 'bg-sky-50 text-sky-700'
                        )}
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* AI Generation */}
              <div className="relative">
                <button
                  onClick={() => setShowAiOptions(!showAiOptions)}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm hover:from-violet-600 hover:to-purple-700 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  <span>Generate with AI</span>
                  <ChevronDown className={cn('w-4 h-4 transition-transform', showAiOptions && 'rotate-180')} />
                </button>

                {showAiOptions && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-10 p-4">
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 mb-2">Tone</label>
                      <div className="flex gap-2">
                        {(['professional', 'friendly', 'casual'] as const).map((tone) => (
                          <button
                            key={tone}
                            onClick={() => setAiTone(tone)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-sm capitalize transition-colors',
                              aiTone === tone
                                ? 'bg-violet-100 text-violet-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            )}
                          >
                            {tone}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 mb-2">Purpose</label>
                      <select
                        value={aiPurpose}
                        onChange={(e) => setAiPurpose(e.target.value as any)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="cold-outreach">Cold Outreach</option>
                        <option value="referral">Referral Request</option>
                        <option value="introduction">Introduction</option>
                        <option value="follow-up">Follow Up</option>
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        setShowAiOptions(false);
                        generateWithAi();
                      }}
                      disabled={isGenerating || !settingsStatus.hasOpenaiApiKey || !settingsStatus.hasResume}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

              {/* Sender Name */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Your name (for signature)"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* AI Refinement Section - Shows after email has content */}
            {(hasGeneratedEmail || (subject.trim() && body.trim())) && (
              <div className="mb-6 p-4 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-violet-600" />
                    <span className="text-sm font-medium text-violet-800">Refine with AI</span>
                  </div>
                  {!showRefineInput && (
                    <button
                      onClick={() => setShowRefineInput(true)}
                      className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                    >
                      + Add Instructions
                    </button>
                  )}
                </div>
                
                {showRefineInput ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <textarea
                        value={refineInstruction}
                        onChange={(e) => setRefineInstruction(e.target.value)}
                        placeholder="Tell AI how to modify the email... e.g., 'Make it shorter', 'Add more about my security experience', 'Make it more casual', 'Emphasize my leadership skills'"
                        rows={2}
                        className="w-full px-4 py-3 bg-white border border-violet-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          setShowRefineInput(false);
                          setRefineInstruction('');
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={refineWithAi}
                        disabled={isRefining || !refineInstruction.trim()}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                          isRefining || !refineInstruction.trim()
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-violet-600 text-white hover:bg-violet-700'
                        )}
                      >
                        {isRefining ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Refining...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Apply Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-violet-600">
                    Not satisfied with the generated email? Click above to give AI instructions on how to modify it.
                  </p>
                )}
              </div>
            )}

            {/* Subject */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Body */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your email message..."
                rows={12}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
              <p className="mt-2 text-xs text-gray-500">
                Use {'{firstName}'}, {'{lastName}'}, {'{company}'}, {'{position}'} for personalization
              </p>
            </div>

            {/* Preview Section - Show how email will look for each contact */}
            {contacts.length > 1 && body.includes('{') && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Preview: Each contact will receive a personalized email
                </h4>
                <div className="text-xs text-blue-700 space-y-1">
                  {contacts.slice(0, 3).map((contact, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="font-medium">{contact.name}:</span>
                      <span className="text-blue-600">
                        "{body.replace(/{firstName}/gi, contact.firstName).replace(/{lastName}/gi, contact.lastName).replace(/{name}/gi, contact.name).replace(/{position}/gi, contact.position).split('\n')[0].substring(0, 50)}..."
                      </span>
                    </div>
                  ))}
                  {contacts.length > 3 && (
                    <div className="text-blue-500">...and {contacts.length - 3} more contacts</div>
                  )}
                </div>
              </div>
            )}

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments
              </label>
              <div className="space-y-2">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Paperclip className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{attachment.filename}</span>
                      <span className="text-xs text-gray-400">{formatFileSize(attachment.size)}</span>
                    </div>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors w-full justify-center"
                >
                  <Upload className="w-4 h-4" />
                  Add Attachment
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <span className={cn('w-2 h-2 rounded-full', settingsStatus.gmailConnected ? 'bg-green-500' : 'bg-gray-300')} />
                Gmail {settingsStatus.gmailConnected ? `(${settingsStatus.gmailEmail})` : 'Not connected'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendTestEmail}
                disabled={isSendingTest || isSending || isDrafting || !settingsStatus.gmailConnected || !subject.trim() || !body.trim()}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all border',
                  isSendingTest || isSending || isDrafting || !settingsStatus.gmailConnected || !subject.trim() || !body.trim()
                    ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400'
                )}
              >
                {isSendingTest ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Test...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Test to Me
                  </>
                )}
              </button>
              <button
                onClick={draftEmails}
                disabled={isDrafting || isSending || isSendingTest || !settingsStatus.gmailConnected || !subject.trim() || !body.trim()}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all border',
                  isDrafting || isSending || isSendingTest || !settingsStatus.gmailConnected || !subject.trim() || !body.trim()
                    ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-amber-600 border-amber-300 hover:bg-amber-50 hover:border-amber-400'
                )}
              >
                {isDrafting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Drafts...
                  </>
                ) : (
                  <>
                    <FileEdit className="w-4 h-4" />
                    Save as Draft{contacts.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
              <button
                onClick={sendEmails}
                disabled={isSending || isDrafting || isSendingTest || !settingsStatus.gmailConnected || !subject.trim() || !body.trim()}
                className={cn(
                  'flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all',
                  isSending || isDrafting || isSendingTest || !settingsStatus.gmailConnected || !subject.trim() || !body.trim()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25'
                )}
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Now
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
