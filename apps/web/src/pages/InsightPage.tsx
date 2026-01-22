import { useEffect } from 'react';
import { ModernSidebar } from '@/components/layout/ModernSidebar';
import { VisualBuilder } from '@/components/insight/VisualBuilder';
import { useJobTrackerStore } from '@/stores/job-tracker.store';
import { Activity } from 'lucide-react';

export function InsightPage() {
    const { fetchDashboard } = useJobTrackerStore();
    // We can add other store fetches here (Finance, etc) when ready

    useEffect(() => {
        // Pre-fetch data for widgets
        fetchDashboard().catch(console.error);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans text-slate-900">
            <ModernSidebar />

            <main className="ml-20 p-8 min-h-screen">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600">
                                Insight Command Center
                            </h1>
                            <p className="text-slate-500 font-medium">
                                Visualize your life matrix. Finance, Career, and Outreach in one place.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Dashboard Canvas */}
                <VisualBuilder />
            </main>
        </div>
    );
}
