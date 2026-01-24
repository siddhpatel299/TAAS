import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Mail,
    Phone,
    Linkedin,
    Twitter,
    Star,
    Edit2,
    Plus,
    MessageSquare,
    Clock,
    Globe
} from 'lucide-react';
import { format } from 'date-fns';
import { CrmLayout } from '@/components/crm/CrmLayout';
import { crmApi, CrmContact, CrmInteraction, INTERACTION_TYPES } from '@/lib/crm-api';
import { cn } from '@/lib/utils';

export function CrmContactDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [contact, setContact] = useState<CrmContact | null>(null);
    const [interactions, setInteractions] = useState<CrmInteraction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Interaction form
    const [showInteractionForm, setShowInteractionForm] = useState(false);
    const [newInteraction, setNewInteraction] = useState({
        type: 'note',
        summary: '',
        details: '',
    });

    useEffect(() => {
        if (id) {
            fetchContact();
            fetchInteractions();
        }
    }, [id]);

    const fetchContact = async () => {
        try {
            if (!id) return;
            const response = await crmApi.getContact(id);
            setContact(response.data.data);
        } catch (error) {
            console.error('Failed to fetch contact details:', error);
            navigate('/plugins/contacts'); // Redirect if not found
        } finally {
            setIsLoading(false);
        }
    };

    const fetchInteractions = async () => {
        try {
            if (!id) return;
            const response = await crmApi.getInteractions(id);
            setInteractions(response.data.data);
        } catch (error) {
            console.error('Failed to fetch interactions:', error);
        }
    };

    const submitInteraction = async () => {
        if (!id || !newInteraction.summary) return;
        try {
            await crmApi.addInteraction(id, {
                ...newInteraction,
                userId: contact?.userId || '', // Should come from auth store ideally
                date: new Date().toISOString(),
            });
            setNewInteraction({ type: 'note', summary: '', details: '' });
            setShowInteractionForm(false);
            fetchInteractions(); // Refresh list
        } catch (error) {
            console.error('Failed to add interaction:', error);
        }
    };

    if (isLoading || !contact) {
        return (
            <CrmLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </CrmLayout>
        );
    }

    const getInitials = (firstName: string, lastName?: string) => {
        return (firstName[0] + (lastName?.[0] || '')).toUpperCase();
    };

    return (
        <CrmLayout>
            <div className="flex h-full bg-slate-50 overflow-hidden">
                {/* Main Content - Flex Column */}
                <div className="flex-1 flex flex-col min-w-0 overflow-auto">
                    {/* Header Bar */}
                    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 w-full">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/plugins/contacts')}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-gray-900">
                                        {contact.firstName} {contact.lastName}
                                    </h1>
                                    {contact.isFavorite && <Star className="w-4 h-4 text-yellow-400 fill-current" />}
                                </div>
                                <p className="text-sm text-gray-500">{contact.position} at {contact.company}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { }}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                            >
                                Edit Profile
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                            >
                                Send Email
                            </button>
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
                        {/* Left Column - Contact Info */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Profile Card */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                <div className="flex flex-col items-center text-center mb-6">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold text-3xl mb-4 shadow-inner">
                                        {getInitials(contact.firstName, contact.lastName)}
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">{contact.firstName} {contact.lastName}</h2>
                                    <p className="text-gray-500">{contact.position}</p>
                                    <p className="text-blue-600 font-medium text-sm mt-1">{contact.company}</p>

                                    <div className="flex gap-2 mt-4">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide",
                                            contact.status === 'customer' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                        )}>
                                            {contact.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-gray-100">
                                    {contact.email && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <a href={`mailto:${contact.email}`} className="text-gray-900 hover:text-blue-600 truncate">{contact.email}</a>
                                        </div>
                                    )}
                                    {contact.phone && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                                <Phone className="w-4 h-4" />
                                            </div>
                                            <a href={`tel:${contact.phone}`} className="text-gray-900 hover:text-blue-600">{contact.phone}</a>
                                        </div>
                                    )}

                                    {contact.website && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                                <Globe className="w-4 h-4" />
                                            </div>
                                            <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:text-blue-600 truncate">{contact.website}</a>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 mt-6 pt-6 border-t border-gray-100 justify-center">
                                    {contact.linkedinUrl && (
                                        <a href={contact.linkedinUrl} target="_blank" className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                                            <Linkedin className="w-5 h-5" />
                                        </a>
                                    )}
                                    {contact.twitterHandle && (
                                        <a href={`https://twitter.com/${contact.twitterHandle}`} target="_blank" className="p-2 bg-sky-50 text-sky-500 rounded-lg hover:bg-sky-100 transition-colors">
                                            <Twitter className="w-5 h-5" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900">Tags</h3>
                                    <button className="text-xs text-blue-600 hover:underline">Manage</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {contact.tags && contact.tags.length > 0 ? (
                                        contact.tags.map(tag => (
                                            <span key={tag.id} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                                #{tag.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-gray-400 italic">No tags assigned</span>
                                    )}
                                    <button className="px-2 py-1 border border-dashed border-gray-300 rounded text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600">
                                        + Add Tag
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Timeline */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Interaction Input */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900">Activity Timeline</h3>
                                    <button
                                        onClick={() => setShowInteractionForm(!showInteractionForm)}
                                        className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Log Activity
                                    </button>
                                </div>

                                {showInteractionForm && (
                                    <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2">
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                                                <select
                                                    value={newInteraction.type}
                                                    onChange={(e) => setNewInteraction({ ...newInteraction, type: e.target.value })}
                                                    className="w-full text-sm rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    {INTERACTION_TYPES.map(t => (
                                                        <option key={t.value} value={t.value}>{t.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Summary</label>
                                                <input
                                                    type="text"
                                                    value={newInteraction.summary}
                                                    onChange={(e) => setNewInteraction({ ...newInteraction, summary: e.target.value })}
                                                    placeholder="Brief summary..."
                                                    className="w-full text-sm rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-4">
                                            <textarea
                                                value={newInteraction.details}
                                                onChange={(e) => setNewInteraction({ ...newInteraction, details: e.target.value })}
                                                placeholder="Add details..."
                                                rows={3}
                                                className="w-full text-sm rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setShowInteractionForm(false)}
                                                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={submitInteraction}
                                                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            >
                                                Save Activity
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-100">
                                    {interactions.length > 0 ? (
                                        interactions.map((interaction) => (
                                            <div key={interaction.id} className="relative pl-10">
                                                <div className="absolute left-0 top-0 w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center z-10">
                                                    {interaction.type === 'call' && <Phone className="w-3.5 h-3.5 text-blue-600" />}
                                                    {interaction.type === 'email' && <Mail className="w-3.5 h-3.5 text-purple-600" />}
                                                    {interaction.type === 'meeting' && <MessageSquare className="w-3.5 h-3.5 text-green-600" />}
                                                    {interaction.type === 'note' && <Edit2 className="w-3.5 h-3.5 text-gray-600" />}
                                                </div>
                                                <div className="bg-white p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                                                    <div className="flex items-start justify-between mb-1">
                                                        <h4 className="font-medium text-gray-900">{interaction.summary}</h4>
                                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {format(new Date(interaction.date), 'MMM d, h:mm a')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{interaction.details}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 relative pl-10">
                                            <p className="text-gray-400 italic text-sm">No interactions logged yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CrmLayout>
    );
}
