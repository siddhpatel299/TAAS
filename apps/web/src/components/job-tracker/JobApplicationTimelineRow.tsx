
import { motion } from 'framer-motion';
import {
    MapPin,
    MoreHorizontal,
    Edit,
    Trash2,
    ExternalLink,
    CheckCircle2,
    Circle,
    Users
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { JobApplication } from '@/lib/plugins-api';
import { CompanyLogo } from '@/components/job-tracker/CompanyLogo';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface JobApplicationTimelineRowProps {
    application: JobApplication;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onFindContacts: (job: JobApplication) => void;
}

const STEPS = [
    { id: 'saved', label: 'Saved' },
    { id: 'applied', label: 'Applied' },
    { id: 'screen', label: 'Screen' }, // Virtual step
    { id: 'interview', label: 'Interview' },
    { id: 'offer', label: 'Offer' },
];

export function JobApplicationTimelineRow({
    application,
    onEdit,
    onDelete,
    onFindContacts
}: JobApplicationTimelineRowProps) {

    // Helper to determine step status
    const getStepStatus = (stepId: string) => {
        const currentStatus = application.status;

        // Map application status to step index
        // We map 'wishlist' to 'saved'
        const normalizedCurrent = currentStatus === 'wishlist' ? 'saved' : currentStatus;

        const currentIndex = STEPS.findIndex(s => s.id === normalizedCurrent) ?? -1;
        const stepIndex = STEPS.findIndex(s => s.id === stepId);

        // Handle rejection/withdrawn specially? 
        // For now, let's just show progress up to the current state if it maps to one of our steps.
        // If it's 'rejected' or 'withdrawn', we might want to show that too, but the UI requests specific steps.

        if (normalizedCurrent === 'rejected' || normalizedCurrent === 'withdrawn') {
            // changing the logic: if rejected, maybe all steps are gray or red?
            // For this design, let's just highlight up to 'Applied' or wherever they got.
            // But we don't have that history easily without `activities`.
            // Let's assume 'rejected' matches 'Applied' visually for now, or just handle it as a separate state.
            return 'inactive';
        }

        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'current';
        return 'inactive';
    };

    // Helper to get date for a step
    const getStepDate = (stepId: string) => {
        // In a real app, we'd use `application.activities` to find when status changed to this step.
        // For now, if it's 'saved' or 'applied', we might use `appliedDate` or `createdAt`.
        if (stepId === 'saved') return application.createdAt ? format(new Date(application.createdAt), 'M/d/yy') : '-';
        if (stepId === 'applied' && application.appliedDate) return format(new Date(application.appliedDate), 'M/d/yy');

        // For current step, show 'Today' or updated date?
        const currentStatus = application.status === 'wishlist' ? 'saved' : application.status;
        if (stepId === currentStatus) return format(new Date(application.updatedAt), 'M/d/yy');

        return '';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-all relative"
        >
            <div className="flex items-start gap-6">
                {/* Logo Section */}
                <CompanyLogo
                    company={application.company}
                    companyLogo={application.companyLogo}
                    size="lg"
                />

                {/* Main Content */}
                <div className="flex-1 min-w-0 grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Job Details */}
                    <div className="lg:col-span-4 space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-slate-900 truncate" title={application.jobTitle}>
                                {application.jobTitle}
                            </h3>
                            {application.jobUrl && (
                                <a href={application.jobUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600">
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 font-medium">
                            <span className="truncate">{application.company}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 pt-1">
                            {application.location && (
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="truncate">{application.location}</span>
                                </div>
                            )}
                            {application.priority && (
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                                    application.priority === 'high' ? "bg-red-50 text-red-600" :
                                        application.priority === 'medium' ? "bg-amber-50 text-amber-600" :
                                            "bg-slate-100 text-slate-600"
                                )}>
                                    {application.priority}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="lg:col-span-7 flex items-center justify-between relative px-2">
                        {/* Connecting Line - Background */}
                        <div className="absolute left-0 right-0 top-[15px] h-0.5 bg-slate-100 -z-10 mx-8" />

                        {/* Connecting Line - Progress (Simulated based on status index) */}
                        <div
                            className="absolute left-0 top-[15px] h-0.5 bg-sky-400 -z-10 mx-8 transition-all duration-500"
                            style={{
                                width: `${Math.max(0, (STEPS.findIndex(s => s.id === (application.status === 'wishlist' ? 'saved' : application.status)) / (STEPS.length - 1)) * 100 - 5)}%`,
                                display: ['rejected', 'withdrawn'].includes(application.status) ? 'none' : 'block'
                            }}
                        />

                        {STEPS.map((step) => {
                            const status = getStepStatus(step.id);
                            const isActive = status === 'current';
                            const isCompleted = status === 'completed';

                            return (
                                <div key={step.id} className="flex flex-col items-center gap-2 group/step relative">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10 bg-white",
                                        isActive ? "border-sky-500 text-sky-500 scale-110 shadow-lg shadow-sky-100" :
                                            isCompleted ? "border-sky-400 bg-sky-400 text-white" :
                                                "border-slate-200 text-slate-300"
                                    )}>
                                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> :
                                            isActive ? <Circle className="w-4 h-4 fill-current" /> :
                                                <Circle className="w-4 h-4" />}
                                    </div>
                                    <div className="text-center space-y-0.5">
                                        <span className={cn(
                                            "text-xs font-semibold block transition-colors",
                                            isActive ? "text-sky-600" :
                                                isCompleted ? "text-slate-700" :
                                                    "text-slate-400"
                                        )}>
                                            {step.label}
                                        </span>
                                        <span className="text-[10px] text-slate-400 block h-3">
                                            {getStepDate(step.id)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Actions */}
                    <div className="lg:col-span-1 flex items-center justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onFindContacts(application)}>
                                    <Users className="w-4 h-4 mr-2" />
                                    Find Contacts
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onEdit(application.id)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => onDelete(application.id)}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                </div>
            </div>
        </motion.div>
    );
}
