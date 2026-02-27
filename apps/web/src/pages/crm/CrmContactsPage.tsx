import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    Mail,
    Phone,
    Star,
    Briefcase,
    Linkedin,
    Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CrmLayout } from '@/components/crm/CrmLayout';
import { crmApi, CrmContact, CRM_STATUS_OPTIONS } from '@/lib/crm-api';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { useOSStore } from '@/stores/os.store';
import { HUDAppLayout, HUDCard, HUDDataTable } from '@/components/hud';

export function CrmContactsPage() {
    const [contacts, setContacts] = useState<CrmContact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [statusFilter, setStatusFilter] = useState<string>('');



    useEffect(() => {
        fetchContacts();
    }, [debouncedSearch, statusFilter]);

    const fetchContacts = async () => {
        setIsLoading(true);
        try {
            const response = await crmApi.getContacts({
                search: debouncedSearch,
                status: statusFilter || undefined,
                sort: 'createdAt',
                order: 'desc'
            });
            setContacts(response.data.data);
        } catch (error) {
            console.error('Failed to fetch contacts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFavorite = async (e: React.MouseEvent, contact: CrmContact) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await crmApi.updateContact(contact.id, { isFavorite: !contact.isFavorite });
            setContacts(contacts.map(c =>
                c.id === contact.id ? { ...c, isFavorite: !c.isFavorite } : c
            ));
        } catch (error) {
            console.error('Failed to update favorite:', error);
        }
    };

    const getStatusColor = (status: string) => {
        const option = CRM_STATUS_OPTIONS.find(o => o.value === status);
        return option ? `bg-${option.color}-100 text-${option.color}-800` : 'bg-gray-100 text-gray-800';
    };

    const getInitials = (firstName: string, lastName?: string) => {
        return (firstName[0] + (lastName?.[0] || '')).toUpperCase();
    };

    const osStyle = useOSStore((s) => s.osStyle);
    const isHUD = osStyle === 'hud';
    const navigate = useNavigate();

    if (isHUD) {
        return (
            <div className="h-full min-h-0 flex flex-col">
                <HUDAppLayout
                    title="CONTACTS"
                    searchPlaceholder="Search by name, email, company..."
                    searchValue={search}
                    onSearchChange={(v) => setSearch(v)}
                    actions={
                        <button
                            type="button"
                            onClick={() => navigate('/plugins/contacts/new')}
                            className="hud-btn hud-btn-primary px-3 py-1.5 text-xs"
                        >
                            ADD CONTACT
                        </button>
                    }
                >
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'rgba(0,255,255,0.6)' }}>STATUS:</span>
                            <button
                                onClick={() => setStatusFilter('')}
                                className={cn('hud-badge px-2 py-1 text-xs', !statusFilter && 'ring-1 ring-cyan-400')}
                            >
                                ALL
                            </button>
                            {CRM_STATUS_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setStatusFilter(opt.value)}
                                    className={cn('hud-badge px-2 py-1 text-xs', statusFilter === opt.value && 'ring-1 ring-cyan-400')}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <HUDCard accent>
                            <div className="p-4">
                                <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3" style={{ color: 'rgba(0,255,255,0.9)' }}>
                                    CONTACTS
                                </h3>
                                {isLoading ? (
                                    <div className="py-12 text-center text-xs tracking-widest" style={{ color: 'rgba(0,255,255,0.5)' }}>
                                        LOADING...
                                    </div>
                                ) : contacts.length === 0 ? (
                                    <div className="py-12 text-center border border-dashed" style={{ borderColor: 'rgba(0,255,255,0.2)' }}>
                                        <Users className="w-12 h-12 mx-auto mb-3 opacity-40" style={{ color: '#22d3ee' }} />
                                        <p className="text-xs tracking-widest mb-4" style={{ color: 'rgba(0,255,255,0.5)' }}>NO CONTACTS</p>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/plugins/contacts/new')}
                                            className="hud-btn hud-btn-primary px-4 py-2 text-xs"
                                        >
                                            ADD CONTACT
                                        </button>
                                    </div>
                                ) : (
                                    <HUDDataTable
                                        columns={[
                                            {
                                                key: 'name',
                                                header: 'NAME',
                                                render: (c) => (
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/plugins/contacts/${c.id}`)}
                                                        className="hover:underline text-left flex items-center gap-2"
                                                    >
                                                        <span className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px] font-bold" style={{ color: '#67e8f9' }}>
                                                            {getInitials(c.firstName, c.lastName)}
                                                        </span>
                                                        {c.firstName} {c.lastName}
                                                    </button>
                                                ),
                                            },
                                            { key: 'company', header: 'COMPANY', render: (c) => c.company || '-' },
                                            { key: 'status', header: 'STATUS', render: (c) => c.status },
                                            {
                                                key: 'fav',
                                                header: '',
                                                render: (c) => (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => toggleFavorite(e, c)}
                                                        className="p-1"
                                                    >
                                                        <Star className={cn('w-3 h-3', c.isFavorite && 'fill-current')} style={{ color: c.isFavorite ? '#fbbf24' : '#22d3ee' }} />
                                                    </button>
                                                ),
                                            },
                                        ]}
                                        data={contacts}
                                        keyExtractor={(c) => c.id}
                                        emptyMessage="NO CONTACTS"
                                    />
                                )}
                            </div>
                        </HUDCard>
                    </div>
                </HUDAppLayout>
            </div>
        );
    }

    return (
        <CrmLayout>
            <div className="flex flex-col h-full bg-slate-50">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
                            <p className="text-sm text-gray-500">Manage your professional relationships</p>
                        </div>
                        <Link
                            to="/plugins/contacts/new"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Contact
                        </Link>
                    </div>

                    {/* Filters & Search */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[240px] max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, company..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                            <button
                                onClick={() => setStatusFilter('')}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                                    !statusFilter
                                        ? "bg-gray-900 text-white"
                                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                                )}
                            >
                                All Contacts
                            </button>
                            {CRM_STATUS_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setStatusFilter(option.value)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                                        statusFilter === option.value
                                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96 text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                                <Users className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No contacts found</h3>
                            <p className="text-gray-500 max-w-sm mb-6">
                                Start building your network by adding your first contact manually.
                            </p>
                            <Link
                                to="/plugins/contacts/new"
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Contact
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {contacts.map((contact) => (
                                <Link
                                    key={contact.id}
                                    to={`/plugins/contacts/${contact.id}`}
                                    className="group bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-blue-200 transition-all relative"
                                >
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                                                {contact.avatar ? (
                                                    <img src={contact.avatar} alt={contact.firstName} className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    getInitials(contact.firstName, contact.lastName)
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                    {contact.firstName} {contact.lastName}
                                                </h3>
                                                <p className="text-sm text-gray-500 truncate max-w-[140px]">
                                                    {contact.position || 'No Title'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => toggleFavorite(e, contact)}
                                            className={cn(
                                                "p-1.5 rounded-lg transition-colors",
                                                contact.isFavorite
                                                    ? "text-yellow-400 hover:bg-yellow-50"
                                                    : "text-gray-300 hover:bg-gray-100 hover:text-gray-500"
                                            )}
                                        >
                                            <Star className={cn("w-4 h-4", contact.isFavorite && "fill-current")} />
                                        </button>
                                    </div>

                                    {/* Badges */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className={cn("px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide", getStatusColor(contact.status))}>
                                            {contact.status}
                                        </span>
                                        {contact.company && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                                <Briefcase className="w-3 h-3" />
                                                {contact.company}
                                            </span>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-sm text-gray-500">
                                        <div className="flex gap-3">
                                            {contact.email && <Mail className="w-4 h-4 text-gray-400" />}
                                            {contact.phone && <Phone className="w-4 h-4 text-gray-400" />}
                                            {contact.linkedinUrl && <Linkedin className="w-4 h-4 text-blue-400" />}
                                        </div>
                                        <span className="text-xs">
                                            {contact.lastContactedAt ? formatDistanceToNow(new Date(contact.lastContactedAt), { addSuffix: true }) : 'Never contacted'}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </CrmLayout>
    );
}
