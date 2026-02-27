import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { CrmLayout } from '@/components/crm/CrmLayout';
import { crmApi, CRM_STATUS_OPTIONS, PIPELINE_STAGES } from '@/lib/crm-api';
import { useOSStore } from '@/stores/os.store';
import { HUDAppLayout, HUDCard } from '@/components/hud';

export function CrmContactFormPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = id && id !== 'new';
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        position: '',
        status: 'lead',
        pipelineStage: 'discovery',
        website: '',
        linkedinUrl: '',
        twitterHandle: '',
        notes: '',
        tags: [] as string[],
        tagInput: ''
    });

    useEffect(() => {
        if (isEditMode) {
            loadContact();
        }
    }, [id]);

    const loadContact = async () => {
        setIsLoading(true);
        try {
            const response = await crmApi.getContact(id!);
            const contact = response.data.data;
            setFormData({
                firstName: contact.firstName,
                lastName: contact.lastName || '',
                email: contact.email || '',
                phone: contact.phone || '',
                company: contact.company || '',
                position: contact.position || '',
                status: contact.status,
                pipelineStage: contact.pipelineStage || 'discovery',
                website: contact.website || '',
                linkedinUrl: contact.linkedinUrl || '',
                twitterHandle: contact.twitterHandle || '',
                notes: contact.notes || '',
                tags: contact.tags?.map(t => t.name) || [],
                tagInput: ''
            });
        } catch (error) {
            console.error('Failed to load contact:', error);
            navigate('/plugins/contacts');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isEditMode) {
                await crmApi.updateContact(id!, {
                    ...formData,
                    userId: '', // handled by backend
                } as any);
            } else {
                await crmApi.createContact(formData as any);
            }
            navigate('/plugins/contacts');
        } catch (error) {
            console.error('Failed to save contact:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && formData.tagInput.trim()) {
            e.preventDefault();
            if (!formData.tags.includes(formData.tagInput.trim())) {
                setFormData(prev => ({
                    ...prev,
                    tags: [...prev.tags, prev.tagInput.trim()],
                    tagInput: ''
                }));
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const osStyle = useOSStore((s) => s.osStyle);
    const isHUD = osStyle === 'hud';

    if (isHUD) {
        return (
            <div className="h-full min-h-0 flex flex-col">
                <HUDAppLayout
                    title={isEditMode ? 'EDIT CONTACT' : 'NEW CONTACT'}
                    actions={
                        <>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="hud-btn px-2 py-1.5 text-xs"
                            >
                                <ArrowLeft className="w-3.5 h-3.5 inline" />
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="hud-btn hud-btn-primary px-3 py-1.5 text-xs"
                            >
                                {isLoading ? 'SAVING...' : 'SAVE'}
                            </button>
                        </>
                    }
                >
                    <HUDCard accent>
                        <form className="p-6 space-y-6" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold tracking-wider mb-1" style={{ color: 'rgba(0,255,255,0.9)' }}>FIRST NAME *</label>
                                    <input required type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-3 py-2 text-xs bg-cyan-500/5 border border-cyan-500/30 rounded text-cyan-200" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-wider mb-1" style={{ color: 'rgba(0,255,255,0.9)' }}>LAST NAME</label>
                                    <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-3 py-2 text-xs bg-cyan-500/5 border border-cyan-500/30 rounded text-cyan-200" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-wider mb-1" style={{ color: 'rgba(0,255,255,0.9)' }}>EMAIL</label>
                                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 text-xs bg-cyan-500/5 border border-cyan-500/30 rounded text-cyan-200" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-wider mb-1" style={{ color: 'rgba(0,255,255,0.9)' }}>PHONE</label>
                                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 text-xs bg-cyan-500/5 border border-cyan-500/30 rounded text-cyan-200" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-wider mb-1" style={{ color: 'rgba(0,255,255,0.9)' }}>COMPANY</label>
                                    <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="w-full px-3 py-2 text-xs bg-cyan-500/5 border border-cyan-500/30 rounded text-cyan-200" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold tracking-wider mb-1" style={{ color: 'rgba(0,255,255,0.9)' }}>POSITION</label>
                                    <input type="text" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="w-full px-3 py-2 text-xs bg-cyan-500/5 border border-cyan-500/30 rounded text-cyan-200" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold tracking-wider mb-1" style={{ color: 'rgba(0,255,255,0.9)' }}>STATUS</label>
                                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 text-xs bg-cyan-500/5 border border-cyan-500/30 rounded text-cyan-200">
                                        {CRM_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </form>
                    </HUDCard>
                </HUDAppLayout>
            </div>
        );
    }

    return (
        <CrmLayout>
            <div className="flex h-full bg-slate-50 flex-col">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">
                            {isEditMode ? 'Edit Contact' : 'New Contact'}
                        </h1>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {isLoading ? 'Saving...' : 'Save Contact'}
                    </button>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-8 space-y-8">

                                {/* Section: Basic Info */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">Basic Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                            <input
                                                type="text"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Professional */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">Professional Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                                            <input
                                                type="text"
                                                value={formData.company}
                                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Position / Title</label>
                                            <input
                                                type="text"
                                                value={formData.position}
                                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                            <input
                                                type="url"
                                                value={formData.website}
                                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                                            <input
                                                type="url"
                                                value={formData.linkedinUrl}
                                                onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Status & Tags */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">Status & Organization</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Relationship Status</label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                {CRM_STATUS_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {/* Pipeline Stage - Only show if not archived? Keep simple for now */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline Stage</label>
                                            <select
                                                value={formData.pipelineStage}
                                                onChange={(e) => setFormData({ ...formData, pipelineStage: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                {PIPELINE_STAGES.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {formData.tags.map(tag => (
                                                    <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                                                        {tag}
                                                        <button onClick={() => removeTag(tag)} className="hover:text-blue-900">×</button>
                                                    </span>
                                                ))}
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.tagInput}
                                                onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                                                onKeyDown={addTag}
                                                placeholder="Type tag and press Enter"
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Notes */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">Notes</h3>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="General notes about this contact..."
                                    />
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CrmLayout>
    );
}
