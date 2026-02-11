import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    Circle,
    ExternalLink,
    MapPin,
    MoreHorizontal,
    Trash2,
    Share2,
    Archive
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { JobApplication, JOB_STATUSES } from '@/lib/plugins-api';

interface JobDetailsHeaderProps {
    application: JobApplication;
    onStatusChange: (status: string) => void;
    onDelete: () => void;
}

const STEPS = [
    { id: 'saved', label: 'Saved', status: 'saved' },
    { id: 'applied', label: 'Applied', status: 'applied' },
    { id: 'screen', label: 'Screen', status: 'interview' }, // Interview stage 1
    { id: 'interview', label: 'Interview', status: 'interview' }, // Interview stage 2
    { id: 'offer', label: 'Offer', status: 'offer' },
];

export function JobDetailsHeader({
    application,
    onStatusChange,
    onDelete
}: JobDetailsHeaderProps) {

    const getStepStatus = (stepId: string) => {
        const statusOrder = ['wishlist', 'saved', 'applied', 'interview', 'offer', 'accepted', 'rejected', 'withdrawn'];
        const currentStatus = application.status === 'wishlist' ? 'saved' : application.status;

        // Virtual 'Screen' step mapping
        if (stepId === 'screen') {
            if (currentStatus === 'interview') return 'current';
            if (['offer', 'accepted'].includes(currentStatus)) return 'completed';
            if (['applied', 'saved', 'wishlist'].includes(currentStatus)) return 'upcoming';
        }

        const currentIndex = statusOrder.indexOf(currentStatus);
        const stepIndex = statusOrder.indexOf(stepId === 'screen' ? 'interview' : stepId);

        if (currentIndex > stepIndex) return 'completed';
        if (currentIndex === stepIndex) return 'current';
        return 'upcoming';
    };

    return (
        <div className="bg-white border-b border-gray-200">
            {/* Top Bar */}
            <div className="px-8 py-4 flex items-center justify-between border-b border-gray-100">
                <Link
                    to="/plugins/job-tracker/applications"
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Jobs</span>
                </Link>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-gray-500">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Application
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Archive className="w-4 h-4 mr-2" />
                                Archive
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Hero Content */}
            <div className="px-8 py-8">
                <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center shadow-inner">
                            <span className="text-3xl font-bold text-sky-700">
                                {application.company.charAt(0)}
                            </span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {application.jobTitle}
                            </h1>
                            <div className="flex items-center gap-4 text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4" />
                                    <span className="font-medium text-gray-700">{application.company}</span>
                                </div>
                                {application.location && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4" />
                                        <span>{application.location}</span>
                                    </div>
                                )}
                                {application.sourceUrl && (
                                    <a
                                        href={application.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-sky-600 hover:underline"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                        Source
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className={cn(
                            "px-3 py-1 rounded-full text-sm font-medium border",
                            application.status === 'offer' ? "bg-green-50 border-green-200 text-green-700" :
                                application.status === 'rejected' ? "bg-red-50 border-red-200 text-red-700" :
                                    "bg-sky-50 border-sky-200 text-sky-700"
                        )}>
                            {JOB_STATUSES.find(s => s.value === application.status)?.label || application.status}
                        </div>
                        {application.appliedDate && (
                            <div className="text-sm text-gray-500 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                Applied on {new Date(application.appliedDate).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Timeline */}
                <div className="relative mt-8 px-4">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2" />
                    <div className="relative z-10 flex justify-between">
                        {STEPS.map((step, idx) => {
                            const status = getStepStatus(step.id);
                            const isActive = status === 'current';
                            const isCompleted = status === 'completed';

                            return (
                                <button
                                    key={step.id}
                                    onClick={() => onStatusChange(step.status)}
                                    className="group flex flex-col items-center gap-3 relative"
                                >
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            scale: isActive ? 1.1 : 1,
                                            backgroundColor: isCompleted || isActive ? '#0284c7' : '#ffffff',
                                            borderColor: isCompleted || isActive ? '#0284c7' : '#e5e7eb',
                                        }}
                                        className={cn(
                                            "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm",
                                            (isCompleted || isActive) ? "border-sky-600 bg-sky-600 text-white" : "bg-white border-gray-200 text-gray-300"
                                        )}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle2 className="w-5 h-5" />
                                        ) : (
                                            <Circle className={cn("w-5 h-5", isActive && "fill-current")} />
                                        )}
                                    </motion.div>
                                    <span className={cn(
                                        "text-sm font-medium transition-colors absolute top-10 w-32 text-center",
                                        isActive ? "text-sky-700" :
                                            isCompleted ? "text-gray-900" : "text-gray-400"
                                    )}>
                                        {step.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
