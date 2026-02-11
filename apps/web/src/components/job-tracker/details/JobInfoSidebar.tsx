import { useState } from 'react';
import {
    Banknote,
    Briefcase,
    Calendar,
    Clock,
    ExternalLink,
    MapPin,
    Plus,
    UserPlus,
    X,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { JobApplication, EMPLOYMENT_TYPES, JOB_STATUSES } from '@/lib/plugins-api';

interface JobInfoSidebarProps {
    application: JobApplication;
    onUpdate: (data: Partial<JobApplication>) => void;
    onAddReferral: () => void;
    onDeleteReferral: (id: string) => void;
}

export function JobInfoSidebar({
    application,
    onUpdate,
    onAddReferral,
}: JobInfoSidebarProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<JobApplication>>({});

    const handleStartEdit = () => {
        setEditForm({
            location: application.location,
            salaryMin: application.salaryMin,
            salaryMax: application.salaryMax,
            salaryCurrency: application.salaryCurrency,
            salaryPeriod: application.salaryPeriod,
            employmentType: application.employmentType,
            appliedDate: application.appliedDate,
            sourceUrl: application.sourceUrl,
            status: application.status,
        });
        setIsEditing(true);
    };

    const handleSave = () => {
        onUpdate(editForm);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditForm({});
    };

    const formatSalary = () => {
        if (!application.salaryMin && !application.salaryMax) return 'Not specified';
        const currency = application.salaryCurrency || '$';
        if (application.salaryMin && application.salaryMax) {
            return `${currency}${application.salaryMin.toLocaleString()} - ${application.salaryMax.toLocaleString()}`;
        }
        return `${currency}${(application.salaryMin || application.salaryMax)?.toLocaleString()}`;
    };

    return (
        <div className="space-y-6">
            {/* Job Details Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-sky-600" />
                        Job Details
                    </h3>
                    {!isEditing ? (
                        <Button variant="ghost" size="sm" onClick={handleStartEdit} className="h-6 text-xs text-sky-600 hover:text-sky-700">
                            Edit
                        </Button>
                    ) : (
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={handleCancel} className="h-6 w-6 text-gray-400 hover:text-red-500">
                                <X className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleSave} className="h-6 w-6 text-sky-600 hover:text-sky-700 bg-sky-50">
                                <Check className="w-3 h-3" />
                            </Button>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {/* Status Field (Edit Mode Only) */}
                    {isEditing && (
                        <div className="flex items-start gap-3">
                            <Check className="w-4 h-4 text-gray-400 mt-1" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-700">Status</p>
                                <select
                                    value={editForm.status || 'wishlist'}
                                    onChange={e => setEditForm({ ...editForm, status: e.target.value as any })}
                                    className="w-full mt-1 h-8 rounded-md border border-gray-200 text-sm bg-white px-2"
                                >
                                    {JOB_STATUSES.map(status => (
                                        <option key={status.value} value={status.value}>{status.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">Location</p>
                            {isEditing ? (
                                <Input
                                    value={editForm.location || ''}
                                    onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                                    className="h-8 mt-1"
                                    placeholder="e.g. Remote, NY"
                                />
                            ) : (
                                <p className="text-sm text-gray-500">{application.location || 'Remote / Unspecified'}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Banknote className="w-4 h-4 text-gray-400 mt-1" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">Salary</p>
                            {isEditing ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <Input
                                        type="number"
                                        placeholder="Min"
                                        value={editForm.salaryMin || ''}
                                        onChange={e => setEditForm({ ...editForm, salaryMin: Number(e.target.value) })}
                                        className="h-8 w-20"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <Input
                                        type="number"
                                        placeholder="Max"
                                        value={editForm.salaryMax || ''}
                                        onChange={e => setEditForm({ ...editForm, salaryMax: Number(e.target.value) })}
                                        className="h-8 w-20"
                                    />
                                    <select
                                        value={editForm.salaryCurrency || '$'}
                                        onChange={e => setEditForm({ ...editForm, salaryCurrency: e.target.value })}
                                        className="h-8 rounded-md border border-gray-200 text-sm bg-transparent"
                                    >
                                        <option value="$">$</option>
                                        <option value="€">€</option>
                                        <option value="£">£</option>
                                    </select>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    {formatSalary()}
                                    {application.salaryPeriod && <span className="text-xs text-gray-400"> / {application.salaryPeriod}</span>}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Clock className="w-4 h-4 text-gray-400 mt-1" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">Employment Type</p>
                            {isEditing ? (
                                <select
                                    value={editForm.employmentType || 'full-time'}
                                    onChange={e => setEditForm({ ...editForm, employmentType: e.target.value as any })}
                                    className="w-full mt-1 h-8 rounded-md border border-gray-200 text-sm bg-white px-2"
                                >
                                    {EMPLOYMENT_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    {EMPLOYMENT_TYPES.find(t => t.value === application.employmentType)?.label || application.employmentType}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">Applied Date</p>
                            {isEditing ? (
                                <Input
                                    type="date"
                                    value={editForm.appliedDate ? new Date(editForm.appliedDate).toISOString().split('T')[0] : ''}
                                    onChange={e => setEditForm({ ...editForm, appliedDate: new Date(e.target.value).toISOString() })}
                                    className="h-8 mt-1"
                                />
                            ) : (
                                <p className="text-sm text-gray-500">
                                    {application.appliedDate ? new Date(application.appliedDate).toLocaleDateString() : 'Not set'}
                                </p>
                            )}
                        </div>
                    </div>

                    {(application.sourceUrl || isEditing) && (
                        <div className="pt-4 mt-4 border-t border-gray-100">
                            {isEditing ? (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-700">Source URL</label>
                                    <Input
                                        value={editForm.sourceUrl || ''}
                                        onChange={e => setEditForm({ ...editForm, sourceUrl: e.target.value })}
                                        placeholder="https://..."
                                        className="h-8"
                                    />
                                </div>
                            ) : (
                                <a
                                    href={application.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-2 bg-gray-50 text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    View Original Post
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Referrals & Contacts */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-sky-600" />
                        Contacts
                    </h3>
                    <Button variant="ghost" size="sm" onClick={onAddReferral} className="h-6 w-6 p-0 rounded-full">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                {!application.referrals?.length ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <p className="text-sm text-gray-500 mb-2">No contacts yet</p>
                        <Button variant="link" size="sm" onClick={onAddReferral} className="text-sky-600 h-auto p-0">
                            Add a referral
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {application.referrals.map(referral => (
                            <div key={referral.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                                        {referral.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{referral.name}</p>
                                        <p className="text-xs text-gray-500 truncate max-w-[120px]">
                                            {referral.position || referral.email}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
