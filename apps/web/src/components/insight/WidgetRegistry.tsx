import { useJobTrackerStore } from '@/stores/job-tracker.store';
import { useInsightStore, WidgetConfig } from '@/stores/insight.store';
import {
    Briefcase,
    Mail,
    Target,
    BarChart2,
    DollarSign,
    PieChart,
} from 'lucide-react';

// --- Widget Components ---

const FinanceWidget = ({ widget: _widget }: { widget: WidgetConfig }) => {
    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4 text-emerald-600">
                <DollarSign className="w-5 h-5" />
                <span className="font-semibold">Finance Overview</span>
            </div>
            <div className="flex-1 bg-emerald-50 rounded-xl p-4 flex items-center justify-center border border-emerald-100">
                <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-700">$2,450</p>
                    <p className="text-sm text-emerald-600">Monthly Spending</p>
                </div>
            </div>
        </div>
    );
};

const JobWidget = ({ widget: _widget }: { widget: WidgetConfig }) => {
    const { dashboardStats } = useJobTrackerStore();

    const activeApps = dashboardStats ?
        (dashboardStats.statusCounts['applied'] || 0) +
        (dashboardStats.statusCounts['interview'] || 0) +
        (dashboardStats.statusCounts['offer'] || 0) : 0;

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4 text-blue-600">
                <Briefcase className="w-5 h-5" />
                <span className="font-semibold">Job Pipeline</span>
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
                <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <p className="text-xl font-bold text-blue-700">{activeApps}</p>
                    <p className="text-xs text-blue-600">Active</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                    <p className="text-xl font-bold text-indigo-700">{dashboardStats?.interviews || 0}</p>
                    <p className="text-xs text-indigo-600">Interviews</p>
                </div>
            </div>
        </div>
    );
};

const OutreachWidget = ({ widget: _widget }: { widget: WidgetConfig }) => {
    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4 text-purple-600">
                <Mail className="w-5 h-5" />
                <span className="font-semibold">Outreach Stats</span>
            </div>
            <div className="flex-1 bg-purple-50 rounded-xl p-4 border border-purple-100">
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-purple-700">Emails Sent</span>
                        <span className="font-bold text-purple-800">142</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-purple-700">Response Rate</span>
                        <span className="font-bold text-purple-800">12%</span>
                    </div>
                    <div className="w-full bg-purple-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full w-[12%]"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GoalWidget = ({ widget: _widget }: { widget: WidgetConfig }) => {
    const { goals } = useInsightStore();
    // Filter goals based on widget settings if needed, or show summary

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4 text-amber-600">
                <Target className="w-5 h-5" />
                <span className="font-semibold">Active Goals</span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto">
                {goals.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-amber-400">
                        <Target className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-xs">No active goals</p>
                    </div>
                ) : (
                    goals.map(goal => (
                        <div key={goal.id} className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-amber-900">{goal.title}</span>
                                <span className="text-amber-700">{goal.current} / {goal.target} {goal.unit}</span>
                            </div>
                            <div className="w-full bg-amber-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-amber-500 h-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const CrossDomainWidget = ({ widget: _widget }: { widget: WidgetConfig }) => {
    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4 text-slate-600">
                <BarChart2 className="w-5 h-5" />
                <span className="font-semibold">Insights</span>
            </div>
            <div className="flex-1 bg-slate-50 rounded-xl p-4 flex items-center justify-center border border-slate-100 text-center">
                <p className="text-sm text-slate-500 italic">
                    "You apply to 20% more jobs on weeks where you spend less than $100."
                </p>
            </div>
        </div>
    );
};

// --- Registry Definition ---

export const WIDGET_REGISTRY = {
    finance: {
        component: FinanceWidget,
        label: 'Finance',
        icon: DollarSign,
        defaultSize: 'medium',
        description: 'Track spending and subscriptions',
    },
    job: {
        component: JobWidget,
        label: 'Job Tracker',
        icon: Briefcase,
        defaultSize: 'medium',
        description: 'Monitor your application pipeline',
    },
    outreach: {
        component: OutreachWidget,
        label: 'Outreach',
        icon: Mail,
        defaultSize: 'medium',
        description: 'Email campaigns and networking',
    },
    goal: {
        component: GoalWidget,
        label: 'Goals',
        icon: Target,
        defaultSize: 'large',
        description: 'Track progress towards your targets',
    },
    'cross-domain': {
        component: CrossDomainWidget,
        label: 'Cross-Domain',
        icon: PieChart,
        defaultSize: 'large',
        description: 'Discover hidden patterns in your data',
    },
};

export const getWidgetComponent = (type: string) => {
    const entry = WIDGET_REGISTRY[type as keyof typeof WIDGET_REGISTRY];
    return entry ? entry.component : () => <div>Unknown Widget</div>;
};
